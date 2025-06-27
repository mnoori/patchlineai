import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { CONFIG } from '@/lib/config'

const dynamoDB = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Check Gmail connection in PlatformConnections table
    const getCommand = new GetItemCommand({
      TableName: 'PlatformConnections-staging',
      Key: {
        userId: { S: userId },
        provider: { S: 'gmail' }
      }
    })

    const result = await dynamoDB.send(getCommand)
    
    if (!result.Item) {
      return NextResponse.json({ 
        connected: false,
        status: 'not_connected' 
      })
    }

    // Check if token is expired
    const expiresAt = result.Item.expiresAt?.S
    if (expiresAt && new Date(parseInt(expiresAt)) < new Date()) {
      return NextResponse.json({ 
        connected: true,
        status: 'expired',
        message: 'Gmail authentication has expired. Please reconnect.'
      })
    }

    return NextResponse.json({ 
      connected: true,
      status: 'active',
      email: result.Item.gmailUserEmail?.S
    })

  } catch (error) {
    console.error('Error checking Gmail status:', error)
    return NextResponse.json({ 
      error: 'Failed to check Gmail status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic' 