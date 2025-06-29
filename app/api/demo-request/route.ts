import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

// Initialize AWS clients with proper error handling
let docClient: DynamoDBDocumentClient | null = null

try {
  // Check for both AWS_ prefixed and non-prefixed versions
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION || process.env.REGION_AWS || 'us-east-1'
  
  // Only initialize if we have credentials
  if (accessKeyId && secretAccessKey) {
    const dynamoClient = new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
    docClient = DynamoDBDocumentClient.from(dynamoClient)
  }
} catch (error) {
  console.error('Failed to initialize AWS client:', error)
}

// Simple email notification function
async function sendNotificationEmail(demoRequest: any) {
  try {
    // For now, we'll use a webhook or external service
    // You can replace this with your preferred email service
    
    // Option 1: Use a webhook service like Zapier or Make
    if (process.env.DEMO_REQUEST_WEBHOOK_URL) {
      const response = await fetch(process.env.DEMO_REQUEST_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'mehdi@patchline.ai',
          subject: `New Demo Request from ${demoRequest.name}`,
          data: demoRequest,
        }),
      })
      
      if (!response.ok) {
        console.error('Failed to send webhook notification')
      }
    }
    
    // Option 2: Log to console for manual monitoring
    console.log('📧 NEW DEMO REQUEST NOTIFICATION:')
    console.log('================================')
    console.log(`From: ${demoRequest.name} (${demoRequest.email})`)
    console.log(`Company: ${demoRequest.company}`)
    console.log(`Role: ${demoRequest.role}`)
    console.log(`Message: ${demoRequest.message}`)
    console.log(`Newsletter: ${demoRequest.newsletter ? 'Yes' : 'No'}`)
    console.log('================================')
    
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

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

    // Try to store in DynamoDB if available
    if (docClient) {
      // Use the dedicated DemoRequests table
      const tableName = process.env.DEMO_REQUESTS_TABLE || 'DemoRequests-production'
      
      try {
        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: demoRequest,
          })
        )
        console.log('Demo request stored in DynamoDB:', demoRequest.id)
      } catch (dbError) {
        console.error('Failed to store in DynamoDB:', dbError)
        // Continue anyway - we'll still log it
      }
    } else {
      console.log('DynamoDB not configured - logging demo request only')
    }

    // Send notification
    await sendNotificationEmail(demoRequest)

    // Always log the request for now
    console.log('New demo request:', JSON.stringify(demoRequest, null, 2))

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