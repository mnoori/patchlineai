import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(client)

const TAX_EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"

interface ExpenseRecord {
  expenseId: string
  documentType: string
  transactionDate: string
  amount: number
  description: string
  vendor: string
  category: string
  classificationStatus?: string
}

interface ReconciliationMatch {
  bankExpenseId: string
  receiptExpenseId: string
  confidence: number
  matchReason: string
  amountDifference: number
  dateDifference: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = "default-user",
      toleranceDays = 3,
      amountTolerance = 0.01,
      autoMatch = true 
    } = body

    console.log('Starting reconciliation process for user:', userId)

    // Fetch all expenses for the user
    const queryCommand = new QueryCommand({
      TableName: TAX_EXPENSES_TABLE,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    })

    const result = await docClient.send(queryCommand)
    const allExpenses = (result.Items || []) as ExpenseRecord[]

    // Separate bank statements from receipts
    const bankExpenses = allExpenses.filter(exp => 
      exp.documentType === 'bank-statement' && 
      exp.classificationStatus !== 'rejected'
    )
    
    const receiptExpenses = allExpenses.filter(exp => 
      exp.documentType === 'receipt' && 
      exp.classificationStatus !== 'rejected'
    )

    console.log(`Found ${bankExpenses.length} bank expenses and ${receiptExpenses.length} receipt expenses`)

    const matches: ReconciliationMatch[] = []
    const unmatched = {
      bankExpenses: [...bankExpenses],
      receiptExpenses: [...receiptExpenses]
    }

    // Match algorithm
    for (const bankExp of bankExpenses) {
      let bestMatch: { expense: ExpenseRecord; score: number; reason: string } | null = null

      for (const receiptExp of receiptExpenses) {
        const score = calculateMatchScore(bankExp, receiptExp, toleranceDays, amountTolerance)
        
        if (score.total > 0.7 && (!bestMatch || score.total > bestMatch.score)) {
          bestMatch = {
            expense: receiptExp,
            score: score.total,
            reason: score.reason
          }
        }
      }

      if (bestMatch) {
        matches.push({
          bankExpenseId: bankExp.expenseId,
          receiptExpenseId: bestMatch.expense.expenseId,
          confidence: bestMatch.score,
          matchReason: bestMatch.reason,
          amountDifference: Math.abs(bankExp.amount - bestMatch.expense.amount),
          dateDifference: Math.abs(
            new Date(bankExp.transactionDate).getTime() - 
            new Date(bestMatch.expense.transactionDate).getTime()
          ) / (1000 * 60 * 60 * 24) // days
        })

        // Remove from unmatched
        const bankIndex = unmatched.bankExpenses.findIndex(e => e.expenseId === bankExp.expenseId)
        if (bankIndex > -1) unmatched.bankExpenses.splice(bankIndex, 1)

        const receiptIndex = unmatched.receiptExpenses.findIndex(e => e.expenseId === bestMatch!.expense.expenseId)
        if (receiptIndex > -1) unmatched.receiptExpenses.splice(receiptIndex, 1)
      }
    }

    // Auto-update high-confidence matches
    let autoUpdated = 0
    if (autoMatch) {
      const highConfidenceMatches = matches.filter(m => m.confidence > 0.9)
      
      for (const match of highConfidenceMatches) {
        try {
          // Update bank expense with reconciliation info
          await docClient.send(new UpdateCommand({
            TableName: TAX_EXPENSES_TABLE,
            Key: { expenseId: match.bankExpenseId },
            UpdateExpression: "SET reconciledWith = :receiptId, reconciliationStatus = :status, reconciliationConfidence = :confidence, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":receiptId": match.receiptExpenseId,
              ":status": "matched",
              ":confidence": match.confidence,
              ":updatedAt": new Date().toISOString()
            }
          }))

          // Update receipt with reconciliation info
          await docClient.send(new UpdateCommand({
            TableName: TAX_EXPENSES_TABLE,
            Key: { expenseId: match.receiptExpenseId },
            UpdateExpression: "SET reconciledWith = :bankId, reconciliationStatus = :status, reconciliationConfidence = :confidence, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":bankId": match.bankExpenseId,
              ":status": "matched",
              ":confidence": match.confidence,
              ":updatedAt": new Date().toISOString()
            }
          }))

          autoUpdated++
        } catch (error) {
          console.error('Error updating reconciliation:', error)
        }
      }
    }

    // Calculate summary statistics
    const summary = {
      totalBankExpenses: bankExpenses.length,
      totalReceiptExpenses: receiptExpenses.length,
      totalMatches: matches.length,
      highConfidenceMatches: matches.filter(m => m.confidence > 0.9).length,
      mediumConfidenceMatches: matches.filter(m => m.confidence > 0.7 && m.confidence <= 0.9).length,
      lowConfidenceMatches: matches.filter(m => m.confidence <= 0.7).length,
      unmatchedBankExpenses: unmatched.bankExpenses.length,
      unmatchedReceiptExpenses: unmatched.receiptExpenses.length,
      autoUpdated,
      matchRate: (matches.length / Math.max(bankExpenses.length, receiptExpenses.length)) * 100
    }

    return NextResponse.json({
      success: true,
      summary,
      matches,
      unmatched,
      message: `Reconciliation complete: ${matches.length} matches found, ${autoUpdated} auto-updated`
    })

  } catch (error) {
    console.error("Error in reconciliation:", error)
    return NextResponse.json(
      { error: "Failed to perform reconciliation" },
      { status: 500 }
    )
  }
}

function calculateMatchScore(
  bankExp: ExpenseRecord, 
  receiptExp: ExpenseRecord, 
  toleranceDays: number, 
  amountTolerance: number
): { total: number; reason: string } {
  let score = 0
  const reasons: string[] = []

  // Amount matching (40% weight)
  const amountDiff = Math.abs(bankExp.amount - receiptExp.amount)
  if (amountDiff <= amountTolerance) {
    score += 0.4
    reasons.push("exact amount match")
  } else if (amountDiff <= Math.max(bankExp.amount * 0.02, 1)) { // 2% tolerance or $1
    score += 0.3
    reasons.push("close amount match")
  }

  // Date matching (30% weight)
  const dateDiff = Math.abs(
    new Date(bankExp.transactionDate).getTime() - 
    new Date(receiptExp.transactionDate).getTime()
  ) / (1000 * 60 * 60 * 24)

  if (dateDiff === 0) {
    score += 0.3
    reasons.push("same date")
  } else if (dateDiff <= toleranceDays) {
    score += 0.25 - (dateDiff * 0.05) // Reduce score based on days apart
    reasons.push(`${Math.round(dateDiff)} days apart`)
  }

  // Vendor matching (30% weight)
  const bankVendor = normalizeVendor(bankExp.vendor || bankExp.description)
  const receiptVendor = normalizeVendor(receiptExp.vendor || receiptExp.description)
  
  if (bankVendor === receiptVendor) {
    score += 0.3
    reasons.push("vendor match")
  } else if (bankVendor.includes(receiptVendor) || receiptVendor.includes(bankVendor)) {
    score += 0.2
    reasons.push("partial vendor match")
  } else if (calculateStringSimilarity(bankVendor, receiptVendor) > 0.7) {
    score += 0.15
    reasons.push("similar vendor")
  }

  return {
    total: Math.min(score, 1),
    reason: reasons.join(", ")
  }
}

function normalizeVendor(vendor: string): string {
  return vendor
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/inc|llc|corp|company|co|ltd/g, '')
    .trim()
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// GET endpoint to retrieve reconciliation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default-user"

    const queryCommand = new QueryCommand({
      TableName: TAX_EXPENSES_TABLE,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    })

    const result = await docClient.send(queryCommand)
    const expenses = result.Items || []

    const reconciled = expenses.filter(exp => exp.reconciliationStatus === 'matched')
    const unreconciled = expenses.filter(exp => !exp.reconciliationStatus)

    return NextResponse.json({
      success: true,
      summary: {
        totalExpenses: expenses.length,
        reconciledExpenses: reconciled.length,
        unreconciledExpenses: unreconciled.length,
        reconciliationRate: (reconciled.length / expenses.length) * 100
      },
      reconciled,
      unreconciled
    })

  } catch (error) {
    console.error("Error fetching reconciliation status:", error)
    return NextResponse.json(
      { error: "Failed to fetch reconciliation status" },
      { status: 500 }
    )
  }
} 