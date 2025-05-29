import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
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
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Determine environment
    const env = process.env.NODE_ENV === 'production' ? 'prod' : 'staging'
    const tableName = `Embeds-${env}`

    console.log(`[API /embeds] Fetching embeds for userId: ${userId} from table: ${tableName}`)

    // Query embeds for the user
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
    })

    const response = await dynamoDB.send(command)
    
    // Convert DynamoDB items to regular objects
    const embeds = response.Items?.map(item => ({
      embedId: item.embedId?.S || '',
      platform: item.platform?.S || '',
      url: item.url?.S || '',
      embedHtml: item.embedHtml?.S || '',
      username: item.username?.S || '',
      displayName: item.displayName?.S || '',
      createdAt: item.createdAt?.S || '',
      updatedAt: item.updatedAt?.S || '',
      isActive: item.isActive?.BOOL || false,
    })) || []

    console.log(`[API /embeds] Found ${embeds.length} embeds for user ${userId}`)

    return NextResponse.json({ embeds })
  } catch (error) {
    console.error('[API /embeds] Error fetching embeds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch embeds' },
      { status: 500 }
    )
  }
} 