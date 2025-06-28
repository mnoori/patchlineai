import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import * as fs from 'fs/promises'
import * as path from 'path'

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"
const BACKUP_TABLE = process.env.TAX_EXPENSES_BACKUP_TABLE || "TaxExpenses-backup-dev"
const BACKUP_BUCKET = process.env.S3_BUCKET || "patchline-documents-dev"

// Create backup table if it doesn't exist
async function ensureBackupTable() {
  try {
    await dynamoClient.send(new CreateTableCommand({
      TableName: BACKUP_TABLE,
      KeySchema: [
        { AttributeName: 'backupId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'backupId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }],
      BillingMode: 'PAY_PER_REQUEST'
    }))
    console.log('Backup table created successfully')
  } catch (error: any) {
    if (error.name !== 'ResourceInUseException') {
      throw error
    }
    // Table already exists
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const backupType = searchParams.get('type') // 'all', 'expenses', 'receipts'
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Ensure backup table exists
    await ensureBackupTable()

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
      return NextResponse.json({ message: 'No expenses found to backup' })
    }

    // Filter based on type if specified
    let itemsToBackup = scanResult.Items
    
    if (backupType === 'expenses') {
      itemsToBackup = scanResult.Items.filter(item => 
        item.documentType !== 'receipt' && !item.bankAccount?.includes('receipt')
      )
    } else if (backupType === 'receipts') {
      itemsToBackup = scanResult.Items.filter(item => 
        item.documentType === 'receipt' || item.bankAccount?.includes('receipt')
      )
    }

    const timestamp = new Date().toISOString()
    const backupId = `backup_${userId}_${backupType || 'all'}_${Date.now()}`

    // Save backup to DynamoDB
    const backupRecord = {
      backupId,
      timestamp,
      userId,
      backupType: backupType || 'all',
      itemCount: itemsToBackup.length,
      totalAmount: itemsToBackup.reduce((sum, item) => sum + (item.amount || 0), 0),
      expenses: itemsToBackup
    }

    await docClient.send(new PutCommand({
      TableName: BACKUP_TABLE,
      Item: backupRecord
    }))

    // Save to S3 for long-term storage
    const s3Key = `backups/${userId}/${backupId}.json`
    await s3Client.send(new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(backupRecord, null, 2),
      ContentType: 'application/json'
    }))

    // Save to local file system for quick Python analytics
    const localBackupDir = path.join(process.cwd(), 'data', 'backups', userId)
    await fs.mkdir(localBackupDir, { recursive: true })
    
    const localFilePath = path.join(localBackupDir, `${backupId}.json`)
    await fs.writeFile(localFilePath, JSON.stringify(backupRecord, null, 2))

    // Also save a CSV version for easy Python pandas analysis
    const csvContent = convertToCSV(itemsToBackup)
    const csvFilePath = path.join(localBackupDir, `${backupId}.csv`)
    await fs.writeFile(csvFilePath, csvContent)

    return NextResponse.json({
      success: true,
      backupId,
      message: `Backed up ${itemsToBackup.length} items`,
      backupLocation: {
        dynamodb: BACKUP_TABLE,
        s3: s3Key,
        local: localFilePath,
        csv: csvFilePath
      },
      summary: {
        itemCount: itemsToBackup.length,
        totalAmount: backupRecord.totalAmount,
        categories: groupByCategory(itemsToBackup)
      }
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET - Retrieve backups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const backupId = searchParams.get('backupId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (backupId) {
      // Retrieve specific backup
      const backup = await docClient.send(new ScanCommand({
        TableName: BACKUP_TABLE,
        FilterExpression: 'backupId = :backupId AND userId = :userId',
        ExpressionAttributeValues: {
          ':backupId': backupId,
          ':userId': userId,
        },
        Limit: 1
      }))

      if (!backup.Items || backup.Items.length === 0) {
        return NextResponse.json(
          { error: 'Backup not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(backup.Items[0])
    } else {
      // List all backups for user
      const backups = await docClient.send(new ScanCommand({
        TableName: BACKUP_TABLE,
        IndexName: 'UserIdIndex',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        }
      }))

      return NextResponse.json({
        backups: backups.Items || [],
        count: backups.Items?.length || 0
      })
    }
  } catch (error) {
    console.error('Error retrieving backups:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve backups' },
      { status: 500 }
    )
  }
}

// Helper functions
function convertToCSV(items: any[]): string {
  if (items.length === 0) return ''
  
  const headers = [
    'Date', 'Description', 'Vendor', 'Amount', 'Category', 
    'Schedule C Line', 'Bank Account', 'Document Type', 
    'Status', 'Confidence Score', 'Document ID'
  ]
  
  const rows = items.map(item => [
    item.transactionDate || '',
    `"${(item.description || '').replace(/"/g, '""')}"`,
    `"${(item.vendor || '').replace(/"/g, '""')}"`,
    item.amount || 0,
    item.category || '',
    item.scheduleCLine || '',
    item.bankAccount || '',
    item.documentType || '',
    item.classificationStatus || '',
    item.confidenceScore || 0,
    item.documentId || ''
  ].join(','))
  
  return [headers.join(','), ...rows].join('\n')
}

function groupByCategory(items: any[]): Record<string, { count: number, amount: number }> {
  return items.reduce((acc, item) => {
    const category = item.category || 'uncategorized'
    if (!acc[category]) {
      acc[category] = { count: 0, amount: 0 }
    }
    acc[category].count++
    acc[category].amount += item.amount || 0
    return acc
  }, {} as Record<string, { count: number, amount: number }>)
} 