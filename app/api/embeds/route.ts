import { NextRequest, NextResponse } from 'next/server'
import { getDynamoDBClient } from '@/lib/aws/shared-dynamodb-client'
import { QueryCommand } from '@aws-sdk/client-dynamodb'
import { cache } from '@/lib/cache'
import { CONFIG } from '@/lib/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Check cache first
    const cacheKey = `embeds:${userId}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      console.log(`[CACHE HIT] ${cacheKey}`)
      return NextResponse.json(cachedData)
    }

    // Get shared DynamoDB client
    const dynamoDB = await getDynamoDBClient()
    
    // If AWS is not available, return empty embeds
    if (!dynamoDB) {
      console.log(`[API /embeds] AWS not available, returning empty embeds for userId: ${userId}`)
      const emptyResponse = { embeds: [] }
      cache.set(cacheKey, emptyResponse, 300) // Cache for 5 minutes
      return NextResponse.json(emptyResponse)
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

    const responseData = { embeds }
    
    // Cache the result
    cache.set(cacheKey, responseData, 300) // Cache for 5 minutes
    console.log(`[CACHE SET] ${cacheKey}`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[API /embeds] Error fetching embeds:', error)
    
    // Cache empty response on error to prevent repeated failures
    const cacheKey = `embeds:${userId}`
    const errorResponse = { embeds: [] }
    cache.set(cacheKey, errorResponse, 60) // Cache error for 1 minute
    
    return NextResponse.json(
      { error: 'Failed to fetch embeds' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
