import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import * as XLSX from 'xlsx'
import { TAX_CATEGORIES, TaxCategory } from "@/lib/tax-categories"
import { format } from "date-fns"

// Initialize clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const TAX_EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = "default-user", 
      format: exportFormat = "excel",
      includeRejected = false 
    } = body

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
    let expenses = result.Items || []

    // Fetch document information to get filenames
    const documentsTable = process.env.DOCUMENTS_TABLE || "Documents-staging"
    const documentIds = [...new Set(expenses.map(exp => exp.documentId))]
    const documentMap: Record<string, any> = {}

    // Fetch document details for filenames
    for (const docId of documentIds) {
      try {
        const docQuery = new QueryCommand({
          TableName: documentsTable,
          KeyConditionExpression: "documentId = :docId",
          ExpressionAttributeValues: {
            ":docId": docId
          }
        })
        const docResult = await docClient.send(docQuery)
        if (docResult.Items && docResult.Items.length > 0) {
          documentMap[docId] = docResult.Items[0]
        }
      } catch (error) {
        console.log(`Could not fetch document ${docId}:`, error)
        documentMap[docId] = { filename: "Unknown" }
      }
    }

    // Add filename to expenses
    expenses = expenses.map(exp => ({
      ...exp,
      filename: documentMap[exp.documentId]?.filename || documentMap[exp.documentId]?.originalName || "Unknown"
    }))

    // Filter out rejected if requested
    if (!includeRejected) {
      expenses = expenses.filter(exp => exp.classificationStatus !== 'rejected')
    }

    // Sort by business type and category
    expenses.sort((a, b) => {
      if (a.businessType !== b.businessType) {
        return a.businessType.localeCompare(b.businessType)
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    })

    if (exportFormat === 'excel') {
      return generateExcelExport(expenses, userId)
    } else if (exportFormat === 'tax-package') {
      return generateTaxPackage(expenses, userId)
    } else {
      return NextResponse.json(
        { error: "Invalid export format" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error exporting expenses:", error)
    return NextResponse.json(
      { error: "Failed to export expenses" },
      { status: 500 }
    )
  }
}

async function generateExcelExport(expenses: any[], userId: string) {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // Summary sheet - IRS Schedule C Summary
  const summaryData = generateScheduleCSummary(expenses)
  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, "Schedule C Summary")

  // Group expenses by Schedule C line (not by business type)
  const scheduleCGroups: Record<string, any[]> = {}
  
  expenses.forEach(exp => {
    const category = exp.category || 'other_expenses'
    const taxCategory = TAX_CATEGORIES[category]
    const line = taxCategory?.line || 'Schedule C Line 27a'
    
    if (!scheduleCGroups[line]) {
      scheduleCGroups[line] = []
    }
    scheduleCGroups[line].push(exp)
  })

  // Create a sheet for each Schedule C line with expenses
  const lineOrder = [
    "Schedule C Line 8",   // Advertising
    "Schedule C Line 9",   // Car and Truck
    "Schedule C Line 11",  // Contract Labor
    "Schedule C Line 13",  // Depreciation
    "Schedule C Line 15",  // Insurance
    "Schedule C Line 16",  // Interest
    "Schedule C Line 17",  // Legal and Professional
    "Schedule C Line 18",  // Office Expenses
    "Schedule C Line 20b", // Rent or Lease
    "Schedule C Line 21",  // Repairs and Maintenance
    "Schedule C Line 22",  // Supplies
    "Schedule C Line 23",  // Taxes and Licenses
    "Schedule C Line 24a", // Travel
    "Schedule C Line 24b", // Meals
    "Schedule C Line 25",  // Utilities
    "Schedule C Line 26",  // Wages
    "Schedule C Line 27a", // Other Expenses
    "Schedule C Line 30"   // Home Office
  ]

  lineOrder.forEach(line => {
    if (scheduleCGroups[line] && scheduleCGroups[line].length > 0) {
      const lineExpenses = scheduleCGroups[line]
      const categoryKey = Object.keys(TAX_CATEGORIES).find(key => TAX_CATEGORIES[key].line === line)
      const categoryInfo = categoryKey ? TAX_CATEGORIES[categoryKey] : null
      
      // Create sheet with IRS-compliant formatting
      const lineWs = createScheduleCLineSheet(lineExpenses, line, categoryInfo)
      
      // Format tab name: "Line XX - Description" (max 31 chars for Excel)
      const lineNumber = line.replace('Schedule C Line ', '')
      const description = categoryInfo?.description.split('(')[0].trim() || 'Other'
      const tabName = `Line ${lineNumber} - ${description}`.substring(0, 31)
      
      XLSX.utils.book_append_sheet(wb, lineWs, tabName)
    }
  })

  // All Expenses sheet - Detailed Transaction Report
  const allExpensesWs = createDetailedTransactionReport(expenses)
  XLSX.utils.book_append_sheet(wb, allExpensesWs, "All Transactions")

  // Reconciliation sheet - Match receipts to bank transactions
  const reconciliationWs = createReconciliationSheet(expenses)
  XLSX.utils.book_append_sheet(wb, reconciliationWs, "Receipt Reconciliation")

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
  const filename = `ScheduleC-TaxReport-${timestamp}.xlsx`

  // Return the Excel file directly as download
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length.toString()
    }
  })
}

function generateScheduleCSummary(expenses: any[]) {
  const summary: any[] = []
  
  // IRS Schedule C Header
  summary.push({ 
    Line: "IRS SCHEDULE C - PROFIT OR LOSS FROM BUSINESS", 
    Description: "",
    Amount: "",
    Count: ""
  })
  
  summary.push({ 
    Line: "Tax Year " + new Date().getFullYear(), 
    Description: "",
    Amount: "",
    Count: ""
  })
  
  summary.push({ Line: "", Description: "", Amount: "", Count: "" })
  
  // Group by Schedule C line
  const lineTotals: Record<string, { amount: number, count: number, description: string }> = {}
  
  expenses.forEach(exp => {
    const category = exp.category || 'other_expenses'
    const taxCategory = TAX_CATEGORIES[category]
    const line = taxCategory?.line || 'Schedule C Line 27a'
    const description = taxCategory?.description || 'Other Business Expenses'
    
    if (!lineTotals[line]) {
      lineTotals[line] = { amount: 0, count: 0, description }
    }
    
    lineTotals[line].amount += exp.amount
    lineTotals[line].count += 1
  })
  
  // Add Schedule C lines in order
  const lineOrder = [
    "Schedule C Line 8",
    "Schedule C Line 9",
    "Schedule C Line 11",
    "Schedule C Line 13",
    "Schedule C Line 15",
    "Schedule C Line 16",
    "Schedule C Line 17",
    "Schedule C Line 18",
    "Schedule C Line 20b",
    "Schedule C Line 21",
    "Schedule C Line 22",
    "Schedule C Line 23",
    "Schedule C Line 24a",
    "Schedule C Line 24b",
    "Schedule C Line 25",
    "Schedule C Line 26",
    "Schedule C Line 27a",
    "Schedule C Line 30"
  ]
  
  lineOrder.forEach(line => {
    if (lineTotals[line]) {
      summary.push({
        Line: line,
        Description: lineTotals[line].description,
        Amount: lineTotals[line].amount.toFixed(2),
        Count: lineTotals[line].count
      })
    }
  })
  
  // Add total
  summary.push({ Line: "", Description: "", Amount: "", Count: "" })
  const grandTotal = Object.values(lineTotals).reduce((sum, item) => sum + item.amount, 0)
  const totalCount = Object.values(lineTotals).reduce((sum, item) => sum + item.count, 0)
  
  summary.push({
    Line: "TOTAL BUSINESS EXPENSES",
    Description: "Schedule C Line 28",
    Amount: grandTotal.toFixed(2),
    Count: totalCount
  })
  
  return summary
}

function createScheduleCLineSheet(expenses: any[], line: string, categoryInfo: TaxCategory | null) {
  // Create IRS-compliant header
  const sheetData: any[] = []
  
  // Add Schedule C line header
  sheetData.push({
    Date: line,
    Description: categoryInfo?.description || "Business Expenses",
    Vendor: "",
    Amount: "",
    "Document Reference": "",
    "Business Purpose": "",
    Status: ""
  })
  
  // Add column headers
  sheetData.push({
    Date: "Date",
    Description: "Description",
    Vendor: "Vendor/Payee",
    Amount: "Amount",
    "Document Reference": "Supporting Document",
    "Business Purpose": "Business Purpose",
    Status: "Review Status"
  })
  
  // Sort expenses by date
  const sortedExpenses = expenses.sort((a, b) => 
    new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  )
  
  // Add expense rows
  sortedExpenses.forEach(exp => {
    sheetData.push({
      Date: format(new Date(exp.transactionDate), 'MM/dd/yyyy'),
      Description: exp.description || "",
      Vendor: exp.vendor || "Unknown",
      Amount: exp.amount.toFixed(2),
      "Document Reference": exp.filename || exp.documentId || "See attached",
      "Business Purpose": exp.businessPurpose || categoryInfo?.description || "",
      Status: exp.classificationStatus || "Pending Review"
    })
  })
  
  // Add subtotal
  const lineTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  sheetData.push({
    Date: "",
    Description: "SUBTOTAL",
    Vendor: "",
    Amount: lineTotal.toFixed(2),
    "Document Reference": "",
    "Business Purpose": "",
    Status: ""
  })
  
  // Add proof requirements note
  if (categoryInfo?.proofRequired) {
    sheetData.push({
      Date: "",
      Description: "",
      Vendor: "",
      Amount: "",
      "Document Reference": "",
      "Business Purpose": "",
      Status: ""
    })
    
    sheetData.push({
      Date: "IRS Documentation Requirements:",
      Description: categoryInfo.proofRequired.join(", "),
      Vendor: "",
      Amount: "",
      "Document Reference": "",
      "Business Purpose": "",
      Status: ""
    })
  }
  
  return XLSX.utils.json_to_sheet(sheetData)
}

function createDetailedTransactionReport(expenses: any[]) {
  // Sort by date and then by Schedule C line
  const sortedExpenses = expenses.sort((a, b) => {
    const dateCompare = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    if (dateCompare !== 0) return dateCompare
    
    const lineA = TAX_CATEGORIES[a.category || 'other_expenses']?.line || 'Schedule C Line 27a'
    const lineB = TAX_CATEGORIES[b.category || 'other_expenses']?.line || 'Schedule C Line 27a'
    return lineA.localeCompare(lineB)
  })
  
  const sheetData = sortedExpenses.map(exp => {
    const taxCategory = TAX_CATEGORIES[exp.category || 'other_expenses']
    
    return {
      "Transaction Date": format(new Date(exp.transactionDate), 'MM/dd/yyyy'),
      "Description": exp.description || "",
      "Vendor/Payee": exp.vendor || "Unknown",
      "Amount": exp.amount.toFixed(2),
      "Schedule C Line": taxCategory?.line || "Schedule C Line 27a",
      "Category": taxCategory?.description || "Other Business Expenses",
      "Business": (exp.businessType || 'general').charAt(0).toUpperCase() + (exp.businessType || 'general').slice(1),
      "Document Reference": exp.filename || exp.documentId || "See attached",
      "Bank Account": exp.bankAccount || "Unknown",
      "Review Status": exp.classificationStatus || "Pending",
      "Notes": exp.manualNotes || "",
      "Document ID": exp.documentId
    }
  })
  
  return XLSX.utils.json_to_sheet(sheetData)
}

function createReconciliationSheet(expenses: any[]) {
  // Group expenses by date and vendor for easier reconciliation
  const reconciliationData: any[] = []
  
  // Header information
  reconciliationData.push({
    "Transaction Date": "RECEIPT TO BANK TRANSACTION RECONCILIATION",
    "Bank Source": "",
    "Receipt Source": "",
    "Vendor": "",
    "Bank Amount": "",
    "Receipt Amount": "",
    "Variance": "",
    "Status": "",
    "Notes": ""
  })
  
  reconciliationData.push({
    "Transaction Date": "Tax Year " + new Date().getFullYear(),
    "Bank Source": "",
    "Receipt Source": "",
    "Vendor": "",
    "Bank Amount": "",
    "Receipt Amount": "",
    "Variance": "",
    "Status": "",
    "Notes": ""
  })
  
  reconciliationData.push({
    "Transaction Date": "",
    "Bank Source": "",
    "Receipt Source": "",
    "Vendor": "",
    "Bank Amount": "",
    "Receipt Amount": "",
    "Variance": "",
    "Status": "",
    "Notes": ""
  })
  
  // Separate expenses by source
  const bankTransactions = expenses.filter(exp => 
    exp.bankAccount && !exp.bankAccount.includes('receipt')
  )
  
  const receipts = expenses.filter(exp => 
    exp.bankAccount?.includes('receipt') || exp.documentType?.includes('receipt')
  )
  
  // Create a map for matching
  const dateVendorMap: Record<string, any[]> = {}
  
  // Process all expenses
  expenses.forEach(exp => {
    const date = format(new Date(exp.transactionDate), 'yyyy-MM-dd')
    const vendor = exp.vendor?.replace(/Amazon\.com.*/, 'Amazon') || 'Unknown'
    const key = `${date}:${vendor}`
    
    if (!dateVendorMap[key]) {
      dateVendorMap[key] = []
    }
    dateVendorMap[key].push(exp)
  })
  
  // Create reconciliation rows
  Object.entries(dateVendorMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, transactions]) => {
      const [date, vendor] = key.split(':')
      
      // Find bank transactions and receipts for this date/vendor
      const bankTxns = transactions.filter(t => !t.bankAccount?.includes('receipt'))
      const receiptTxns = transactions.filter(t => t.bankAccount?.includes('receipt'))
      
      if (bankTxns.length > 0 || receiptTxns.length > 0) {
        // Calculate totals
        const bankTotal = bankTxns.reduce((sum, t) => sum + (t.amount || 0), 0)
        const receiptTotal = receiptTxns.reduce((sum, t) => sum + (t.amount || 0), 0)
        const variance = Math.abs(bankTotal - receiptTotal)
        
        reconciliationData.push({
          "Transaction Date": format(new Date(date), 'MM/dd/yyyy'),
          "Bank Source": bankTxns.map(t => t.bankAccount || 'Bank').join(', '),
          "Receipt Source": receiptTxns.length > 0 ? 'Amazon Receipt' : 'Missing Receipt',
          "Vendor": vendor,
          "Bank Amount": bankTotal > 0 ? bankTotal.toFixed(2) : '',
          "Receipt Amount": receiptTotal > 0 ? receiptTotal.toFixed(2) : '',
          "Variance": variance > 0.01 ? variance.toFixed(2) : 'Matched',
          "Status": variance <= 0.01 && receiptTotal > 0 ? '✓ Matched' : '⚠ Review',
          "Notes": bankTxns.concat(receiptTxns).map(t => t.description?.substring(0, 50)).join(' | ')
        })
      }
    })
  
  // Add summary at the bottom
  reconciliationData.push({
    "Transaction Date": "",
    "Bank Source": "",
    "Receipt Source": "",
    "Vendor": "",
    "Bank Amount": "",
    "Receipt Amount": "",
    "Variance": "",
    "Status": "",
    "Notes": ""
  })
  
  const totalBankAmount = bankTransactions.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalReceiptAmount = receipts.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const matchedCount = reconciliationData.filter(row => row.Status === '✓ Matched').length
  
  reconciliationData.push({
    "Transaction Date": "SUMMARY",
    "Bank Source": `${bankTransactions.length} transactions`,
    "Receipt Source": `${receipts.length} receipts`,
    "Vendor": "",
    "Bank Amount": totalBankAmount.toFixed(2),
    "Receipt Amount": totalReceiptAmount.toFixed(2),
    "Variance": Math.abs(totalBankAmount - totalReceiptAmount).toFixed(2),
    "Status": `${matchedCount} Matched`,
    "Notes": `${((matchedCount / Math.max(bankTransactions.length, 1)) * 100).toFixed(0)}% Match Rate`
  })
  
  return XLSX.utils.json_to_sheet(reconciliationData)
}

async function generateTaxPackage(expenses: any[], userId: string) {
  // This would generate a comprehensive tax package with:
  // 1. Cover sheet with instructions
  // 2. Summary by Schedule C lines
  // 3. Detailed expense lists by category
  // 4. Supporting documentation references
  
  // For now, return a simple response
  return NextResponse.json({
    success: true,
    message: "Tax package generation is under development",
    summary: {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      businessTypes: [...new Set(expenses.map(exp => exp.businessType))]
    }
  })
} 