import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

const TABLE_NAME = process.env.NODE_ENV === 'production' 
  ? 'UserPreferences-prod' 
  : 'UserPreferences-staging'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const agentId = searchParams.get('agentId') || 'scout' // Default to scout

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log(`[Preferences] Fetching preferences for user ${userId}, agent ${agentId}`)

    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          agentId,
        },
      })
    )

    if (!response.Item) {
      console.log(`[Preferences] No preferences found for user ${userId}, agent ${agentId}`)
      return NextResponse.json({ preferences: null })
    }

    console.log(`[Preferences] Found preferences for user ${userId}:`, response.Item.preferences)
    return NextResponse.json({ preferences: response.Item.preferences })
  } catch (error) {
    console.error('[Preferences] Error fetching preferences:', error)
    
    // If table doesn't exist, return null preferences (not an error)
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      console.log(`[Preferences] Table ${TABLE_NAME} not found, returning null preferences.`)
      return NextResponse.json({ preferences: null })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, agentId = 'scout', preferences } = body

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'userId and preferences are required' },
        { status: 400 }
      )
    }

    console.log(`[Preferences] Saving preferences for user ${userId}, agent ${agentId}:`, preferences)

    const item = {
      userId,
      agentId,
      preferences,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    )

    console.log(`[Preferences] Successfully saved preferences for user ${userId}`)
    return NextResponse.json({ 
      success: true, 
      message: 'Preferences saved successfully',
      preferences 
    })
  } catch (error) {
    console.error('[Preferences] Error saving preferences:', error)
    
    // If table doesn't exist, still return success (will use localStorage fallback)
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      console.warn(`[Preferences] Table ${TABLE_NAME} not found, preferences not persisted to DynamoDB`)
      return NextResponse.json({ 
        success: true, 
        message: 'Preferences saved locally only',
        warning: 'DynamoDB table not available'
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
