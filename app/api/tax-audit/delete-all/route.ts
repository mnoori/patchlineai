import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"

const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default-user'
    
    console.log(`Deleting all expenses for user: ${userId}`)
    
    // Scan for all expenses for this user
    const scanCommand = new ScanCommand({
      TableName: EXPENSES_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: marshall({
        ":userId": userId
      })
    })
    
    const scanResult = await dynamodbClient.send(scanCommand)
    const items = scanResult.Items || []
    
    console.log(`Found ${items.length} expenses to delete`)
    
    // Delete each item
    let deletedCount = 0
    for (const item of items) {
      const deleteCommand = new DeleteItemCommand({
        TableName: EXPENSES_TABLE,
        Key: {
          expenseId: item.expenseId
        }
      })
      
      await dynamodbClient.send(deleteCommand)
      deletedCount++
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} expenses`,
      deletedCount
    })
    
  } catch (error) {
    console.error("Error deleting expenses:", error)
    return NextResponse.json(
      { error: "Failed to delete expenses" },
      { status: 500 }
    )
  }
} 