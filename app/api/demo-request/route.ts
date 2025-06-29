import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, role, message, newsletter } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Create demo request record
    const demoRequest = {
      id: uuidv4(),
      type: 'DEMO_REQUEST',
      name,
      email,
      company: company || 'Not provided',
      role: role || 'Not specified',
      message,
      newsletter: newsletter || false,
      createdAt: new Date().toISOString(),
      status: 'NEW',
      source: 'website',
    }

    // Store in DynamoDB
    const tableName = process.env.DEMO_REQUESTS_TABLE || 'DemoRequests-production'
    
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: demoRequest,
      })
    )

    // TODO: Add email notification via SES or another service
    console.log('New demo request:', demoRequest)

    return NextResponse.json({
      success: true,
      message: 'Demo request submitted successfully',
      requestId: demoRequest.id,
    })
  } catch (error) {
    console.error('Error processing demo request:', error)
    return NextResponse.json(
      { error: 'Failed to process demo request' },
      { status: 500 }
    )
  }
} 