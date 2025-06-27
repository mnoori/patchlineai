import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb'
import { CONFIG } from '@/lib/config'

const dynamoDB = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Delete Gmail tokens from PlatformConnections table
    const deleteCommand = new DeleteItemCommand({
      TableName: 'PlatformConnections-staging',
      Key: {
        userId: { S: userId },
        provider: { S: 'gmail' }
      }
    })

    await dynamoDB.send(deleteCommand)

    // Also update the Users table to mark Gmail as disconnected
    // This is handled by the platformsAPI.update in the hook

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Gmail:', error)
    return NextResponse.json({ 
      error: 'Failed to disconnect Gmail',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic' 