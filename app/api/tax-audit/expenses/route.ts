import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { TAX_CATEGORIES } from "@/lib/tax-categories"

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(client)

const TAX_EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default-user"
    const businessType = searchParams.get("businessType")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Query expenses for the user
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

    // Apply filters
    if (businessType) {
      expenses = expenses.filter(exp => exp.businessType === businessType)
    }

    if (category) {
      expenses = expenses.filter(exp => exp.category === category)
    }

    if (status) {
      expenses = expenses.filter(exp => exp.classificationStatus === status)
    }

    if (startDate) {
      expenses = expenses.filter(exp => exp.transactionDate >= startDate)
    }

    if (endDate) {
      expenses = expenses.filter(exp => exp.transactionDate <= endDate)
    }

    // Calculate totals by category and business type
    const categoryTotals: Record<string, Record<string, number>> = {
      media: {},
      consulting: {},
      unknown: {}
    }

    const scheduleCLineTotals: Record<string, number> = {}

    expenses.forEach(expense => {
      const bType: string = expense.businessType && ['media','consulting'].includes(expense.businessType) ? expense.businessType : 'unknown'
      const cat = expense.category || 'other_expenses'
      
      if (!categoryTotals[bType]) {
        categoryTotals[bType] = {}
      }
      if (!categoryTotals[bType][cat]) {
        categoryTotals[bType][cat] = 0
      }
      categoryTotals[bType][cat] += expense.amount

      // Track by Schedule C line
      const line = expense.scheduleCLine || 'Unknown'
      if (!scheduleCLineTotals[line]) {
        scheduleCLineTotals[line] = 0
      }
      scheduleCLineTotals[line] += expense.amount
    })

    // Sort expenses by date (newest first)
    expenses.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )

    // Build response with summary
    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      pendingReview: expenses.filter(exp => exp.classificationStatus === 'pending').length,
      approved: expenses.filter(exp => exp.classificationStatus === 'approved').length,
      rejected: expenses.filter(exp => exp.classificationStatus === 'rejected').length,
      categoryTotals,
      scheduleCLineTotals,
      businessTypeTotals: {
        media: expenses.filter(exp => exp.businessType === 'media')
          .reduce((sum, exp) => sum + exp.amount, 0),
        consulting: expenses.filter(exp => exp.businessType === 'consulting')
          .reduce((sum, exp) => sum + exp.amount, 0),
        unknown: expenses.filter(exp => !['media','consulting'].includes(exp.businessType))
          .reduce((sum, exp) => sum + exp.amount, 0)
      }
    }

    return NextResponse.json({
      expenses,
      summary,
      taxCategories: TAX_CATEGORIES
    })

  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      expenseId, 
      updates 
    } = body

    if (!expenseId) {
      return NextResponse.json(
        { error: "expenseId is required" },
        { status: 400 }
      )
    }

    // Build update expression
    const updateExpressions: string[] = []
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, any> = {}

    // Allowed update fields
    const allowedUpdates = [
      'category',
      'businessType',
      'scheduleCLine',
      'classificationStatus',
      'confidenceScore',
      'manualNotes',
      'vendor'
    ]

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedUpdates.includes(key)) {
        updateExpressions.push(`#${key} = :${key}`)
        expressionAttributeNames[`#${key}`] = key
        expressionAttributeValues[`:${key}`] = value
      }
    })

    // Always update the timestamp
    updateExpressions.push("#updatedAt = :updatedAt")
    expressionAttributeNames["#updatedAt"] = "updatedAt"
    expressionAttributeValues[":updatedAt"] = new Date().toISOString()

    const updateCommand = new UpdateCommand({
      TableName: TAX_EXPENSES_TABLE,
      Key: { expenseId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    })

    const result = await docClient.send(updateCommand)

    return NextResponse.json({
      success: true,
      expense: result.Attributes
    })

  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const expenseId = searchParams.get("expenseId")

    if (!expenseId) {
      return NextResponse.json(
        { error: "expenseId is required" },
        { status: 400 }
      )
    }

    const deleteCommand = new DeleteCommand({
      TableName: TAX_EXPENSES_TABLE,
      Key: { expenseId }
    })

    await docClient.send(deleteCommand)

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}

// Bulk update endpoint
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { expenseIds, updates } = body

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json(
        { error: "expenseIds array is required" },
        { status: 400 }
      )
    }

    const results = []

    // Update each expense
    for (const expenseId of expenseIds) {
      try {
        // Build update expression
        const updateExpressions: string[] = []
        const expressionAttributeNames: Record<string, string> = {}
        const expressionAttributeValues: Record<string, any> = {}

        Object.entries(updates).forEach(([key, value]) => {
          updateExpressions.push(`#${key} = :${key}`)
          expressionAttributeNames[`#${key}`] = key
          expressionAttributeValues[`:${key}`] = value
        })

        // Always update the timestamp
        updateExpressions.push("#updatedAt = :updatedAt")
        expressionAttributeNames["#updatedAt"] = "updatedAt"
        expressionAttributeValues[":updatedAt"] = new Date().toISOString()

        const updateCommand = new UpdateCommand({
          TableName: TAX_EXPENSES_TABLE,
          Key: { expenseId },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW"
        })

        const result = await docClient.send(updateCommand)
        results.push({ expenseId, success: true, expense: result.Attributes })
      } catch (error) {
        results.push({ expenseId, success: false, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      updated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    })

  } catch (error) {
    console.error("Error in bulk update:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk update" },
      { status: 500 }
    )
  }
} 