import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"

// API to manage user's Spotify artist profile information
const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging"

const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

// GET: Retrieve stored artist profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // Check if we have stored artist profile data
    const result = await docClient.send(
      new GetCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        Key: {
          userId: userId,
          provider: "spotify-artist-profile"
        }
      })
    )

    if (result.Item) {
      return NextResponse.json({ 
        artistProfile: {
          artistId: result.Item.artistId,
          artistName: result.Item.artistName,
          spotifyUrl: result.Item.spotifyUrl,
          storedAt: result.Item.storedAt
        }
      })
    }

    return NextResponse.json({ artistProfile: null })
  } catch (err) {
    console.error("Error retrieving artist profile:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST: Store artist profile information
export async function POST(request: NextRequest) {
  try {
    const { userId, artistId, artistName, spotifyUrl } = await request.json()
    
    if (!userId || !artistId || !artistName) {
      return NextResponse.json({ 
        error: "Missing required fields: userId, artistId, artistName" 
      }, { status: 400 })
    }

    const now = Date.now()
    
    // Store artist profile data
    await docClient.send(
      new PutCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        Item: {
          userId,
          provider: "spotify-artist-profile",
          artistId,
          artistName,
          spotifyUrl: spotifyUrl || `https://open.spotify.com/artist/${artistId}`,
          storedAt: now,
          updatedAt: now
        }
      })
    )

    return NextResponse.json({ 
      success: true,
      artistProfile: {
        artistId,
        artistName,
        spotifyUrl: spotifyUrl || `https://open.spotify.com/artist/${artistId}`
      }
    })
  } catch (err) {
    console.error("Error storing artist profile:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 