import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"
import { unmarshall } from "@aws-sdk/util-dynamodb"

const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const TABLE_NAME = process.env.DOCUMENTS_TABLE || "Documents-staging"

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()
    
    console.log('Test processing document:', documentId)
    
    // Get document from DynamoDB to find textractJobId
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "documentId = :docId",
      ExpressionAttributeValues: {
        ":docId": { S: documentId }
      }
    })
    
    const result = await dynamodbClient.send(scanCommand)
    
    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    const document = unmarshall(result.Items[0])
    console.log('Found document:', {
      documentId: document.documentId,
      textractJobId: document.textractJobId,
      documentType: document.documentType,
      status: document.status
    })
    
    if (!document.textractJobId) {
      return NextResponse.json({ error: 'Document has no Textract job ID' }, { status: 400 })
    }
    
    // Call expense processing
    const { POST: processExpenses } = await import('@/app/api/tax-audit/process-expenses/route')
    
    const expenseRequest = new NextRequest('http://localhost/api/tax-audit/process-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: document.userId || 'default-user',
        documentId: document.documentId,
        jobId: document.textractJobId,
        bankType: document.documentType || 'bofa'
      })
    })
    
    const expenseResponse = await processExpenses(expenseRequest)
    const expenseData = await expenseResponse.json()
    
    return NextResponse.json({
      success: true,
      document: {
        documentId: document.documentId,
        textractJobId: document.textractJobId,
        documentType: document.documentType
      },
      expenseResult: expenseData
    })
    
  } catch (error) {
    console.error("Error in test process:", error)
    return NextResponse.json(
      { error: "Failed to test process", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 