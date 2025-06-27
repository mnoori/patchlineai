import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "crypto"

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
  } : undefined
})
const docClient = DynamoDBDocumentClient.from(ddbClient)

// Use the correct table name for artist roster
const ARTIST_ROSTER_TABLE = process.env.ARTIST_ROSTER_TABLE || 'ArtistRoster-staging'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log(`[Artist Roster] Fetching roster for userId: ${userId}`)

    // Query all artists for this user
    const command = new QueryCommand({
      TableName: ARTIST_ROSTER_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })

    const result = await docClient.send(command)
    const artists = result.Items || []

    console.log(`[Artist Roster] Found ${artists.length} artists in roster`)

    return NextResponse.json({ artists })

  } catch (error) {
    console.error('[Artist Roster] Error fetching roster:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch artist roster',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, artistName, platform, platformArtistId, imageUrl, genres, metadata } = body

    if (!userId || !artistName || !platform) {
      return NextResponse.json({ 
        error: 'userId, artistName, and platform are required' 
      }, { status: 400 })
    }

    console.log(`[Artist Roster] Adding artist ${artistName} to roster for user ${userId}`)

    // Create unique artistId combining platform and platformArtistId
    const artistId = platformArtistId ? `${platform}:${platformArtistId}` : `${platform}:${randomUUID()}`
    const now = new Date().toISOString()

    const artistItem = {
      userId,
      artistId,
      artistName,
      platform,
      platformArtistId,
      imageUrl,
      genres: genres || [],
      metadata: metadata || {},
      addedAt: now,
      updatedAt: now
    }

    // Store in DynamoDB
    const command = new PutCommand({
      TableName: ARTIST_ROSTER_TABLE,
      Item: artistItem,
      ConditionExpression: 'attribute_not_exists(artistId)' // Prevent duplicates
    })

    await docClient.send(command)

    console.log(`[Artist Roster] Successfully added ${artistName} to roster`)

    // Track interaction
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'add_to_roster',
          agent: 'scout',
          metadata: {
            artistId,
            artistName,
            platform
          }
        })
      })
    } catch (trackingError) {
      console.warn('[Artist Roster] Failed to track interaction:', trackingError)
    }

    return NextResponse.json({ 
      success: true, 
      artist: artistItem,
      message: `${artistName} added to roster successfully!`
    })

  } catch (error) {
    console.error('[Artist Roster] Error adding artist:', error)
    
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ 
        error: 'Artist already in roster',
        message: 'This artist is already in your roster'
      }, { status: 409 })
    }

    return NextResponse.json({ 
      error: 'Failed to add artist to roster',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const artistId = searchParams.get('artistId')

    if (!userId || !artistId) {
      return NextResponse.json({ 
        error: 'userId and artistId are required' 
      }, { status: 400 })
    }

    console.log(`[Artist Roster] Removing artist ${artistId} from roster for user ${userId}`)

    const command = new DeleteCommand({
      TableName: ARTIST_ROSTER_TABLE,
      Key: {
        userId,
        artistId
      }
    })

    await docClient.send(command)

    console.log(`[Artist Roster] Successfully removed artist from roster`)

    return NextResponse.json({ 
      success: true,
      message: 'Artist removed from roster successfully!'
    })

  } catch (error) {
    console.error('[Artist Roster] Error removing artist:', error)
    return NextResponse.json({ 
      error: 'Failed to remove artist from roster',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
