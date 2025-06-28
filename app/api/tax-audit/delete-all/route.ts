import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const deleteType = searchParams.get('type') // 'expenses', 'receipts', or null for all

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // First, create a backup before deleting
    try {
      const backupResponse = await fetch(`${request.url.split('/delete-all')[0]}/backup?userId=${userId}&type=${deleteType || 'all'}`, {
        method: 'POST'
      })
      
      if (backupResponse.ok) {
        const backupResult = await backupResponse.json()
        console.log(`Created backup: ${backupResult.backupId}`)
      } else {
        console.warn('Failed to create backup, proceeding with deletion anyway')
      }
    } catch (error) {
      console.error('Backup error:', error)
      // Continue with deletion even if backup fails
    }

    // Scan for all expenses for this user
    const scanCommand = new ScanCommand({
      TableName: EXPENSES_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })

    const scanResult = await docClient.send(scanCommand)
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      return NextResponse.json({ message: 'No expenses found to delete' })
    }

    // Filter based on type if specified
    let itemsToDelete = scanResult.Items
    
    if (deleteType === 'expenses') {
      // Delete only bank expenses (not receipts)
      itemsToDelete = scanResult.Items.filter(item => 
        item.documentType !== 'receipt' && !item.bankAccount?.includes('receipt')
      )
    } else if (deleteType === 'receipts') {
      // Delete only receipts
      itemsToDelete = scanResult.Items.filter(item => 
        item.documentType === 'receipt' || item.bankAccount?.includes('receipt')
      )
    }

    console.log(`Deleting ${itemsToDelete.length} ${deleteType || 'all'} items for user ${userId}`)

    // Delete each expense using only expenseId as the key
    const deletePromises = itemsToDelete.map(item => {
      const deleteCommand = new DeleteCommand({
        TableName: EXPENSES_TABLE,
        Key: {
          expenseId: item.expenseId,
        },
      })
      return docClient.send(deleteCommand)
    })

    // Execute deletions in batches to avoid throttling
    const batchSize = 25
    const results = []
    
    for (let i = 0; i < deletePromises.length; i += batchSize) {
      const batch = deletePromises.slice(i, i + batchSize)
      try {
        await Promise.all(batch)
        results.push(...batch.map(() => ({ success: true })))
      } catch (error) {
        console.error(`Error in batch ${i / batchSize}:`, error)
        results.push(...batch.map(() => ({ success: false, error })))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({ 
      message: `Successfully deleted ${successCount} ${deleteType || 'expense'} items`,
      deletedCount: successCount,
      failedCount: failureCount,
      totalProcessed: itemsToDelete.length
    })
  } catch (error) {
    console.error('Error deleting expenses:', error)
    return NextResponse.json(
      { error: 'Failed to delete expenses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 