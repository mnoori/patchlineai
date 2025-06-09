import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

// Initialize DynamoDB client with explicit credentials
const ddbClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
  } : undefined
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

// Using existing platform connections table for now, but with a different structure
const TABLE_NAME = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging"

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Query all artist entries for this user
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId AND begins_with(itemId, :prefix)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':prefix': 'ARTIST#'
      }
    }))

    const artists = (result.Items || []).map(item => ({
      artistId: item.artistId,
      artistName: item.artistName,
      platform: item.platform || 'spotify', // Default to Spotify for now
      platformArtistId: item.platformArtistId,
      imageUrl: item.imageUrl,
      genres: item.genres || [],
      addedAt: item.addedAt,
      metadata: item.metadata || {}
    }))

    return NextResponse.json({ artists })
  } catch (error) {
    console.error('Failed to fetch artist roster:', error)
    return NextResponse.json({ error: 'Failed to fetch artist roster' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, artistName, platform = 'spotify', platformArtistId, imageUrl, genres, metadata } = body

    if (!userId || !artistName) {
      return NextResponse.json({ error: 'userId and artistName are required' }, { status: 400 })
    }

    const artistId = randomUUID()
    const timestamp = new Date().toISOString()

    // Store artist in roster
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        itemId: `ARTIST#${artistId}`,
        artistId,
        artistName,
        platform,
        platformArtistId,
        imageUrl,
        genres,
        metadata,
        addedAt: timestamp,
        updatedAt: timestamp
      }
    }))

    return NextResponse.json({ 
      success: true,
      artist: {
        artistId,
        artistName,
        platform,
        platformArtistId,
        imageUrl,
        genres,
        addedAt: timestamp
      }
    })
  } catch (error) {
    console.error('Failed to add artist to roster:', error)
    return NextResponse.json({ error: 'Failed to add artist to roster' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, artistId, updates } = body

    if (!userId || !artistId) {
      return NextResponse.json({ error: 'userId and artistId are required' }, { status: 400 })
    }

    // Build update expression
    const updateExpression: string[] = []
    const expressionAttributeValues: any = {}
    const expressionAttributeNames: any = {}

    if (updates.artistName) {
      updateExpression.push('#name = :name')
      expressionAttributeNames['#name'] = 'artistName'
      expressionAttributeValues[':name'] = updates.artistName
    }

    if (updates.genres) {
      updateExpression.push('genres = :genres')
      expressionAttributeValues[':genres'] = updates.genres
    }

    if (updates.metadata) {
      updateExpression.push('metadata = :metadata')
      expressionAttributeValues[':metadata'] = updates.metadata
    }

    updateExpression.push('updatedAt = :updatedAt')
    expressionAttributeValues[':updatedAt'] = new Date().toISOString()

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        itemId: `ARTIST#${artistId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    }))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update artist:', error)
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams
  const userId = searchParams.get('userId')
  const artistId = searchParams.get('artistId')
  
  if (!userId || !artistId) {
    return NextResponse.json({ error: 'userId and artistId are required' }, { status: 400 })
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        itemId: `ARTIST#${artistId}`
      }
    }))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete artist:', error)
    return NextResponse.json({ error: 'Failed to delete artist' }, { status: 500 })
  }
} 