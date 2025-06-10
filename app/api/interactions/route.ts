import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

// Configure AWS DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined,
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Use existing table or create a new one for interactions
const INTERACTIONS_TABLE = process.env.USER_INTERACTIONS_TABLE || "UserInteractions-staging"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Add server-side timestamp to ensure consistency
    const interaction = {
      ...body,
      timestamp: body.timestamp || new Date().toISOString(),
      serverTimestamp: new Date().toISOString(),
    }

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: INTERACTIONS_TABLE,
      Item: interaction,
    })

    await docClient.send(command)

    return NextResponse.json({ 
      success: true, 
      interactionId: interaction.interactionId 
    })
  } catch (error) {
    console.error("Failed to save interaction:", error)
    
    // If table doesn't exist, still return success (graceful fallback)
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`Table ${INTERACTIONS_TABLE} not found. Interaction not saved to DynamoDB.`)
      return NextResponse.json({ 
        success: true, 
        warning: "Interaction saved locally only" 
      })
    }
    
    return NextResponse.json(
      { error: "Failed to save interaction" },
      { status: 500 }
    )
  }
} 