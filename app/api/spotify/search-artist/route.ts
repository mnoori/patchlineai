import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"

// API to search for user's artist profile on Spotify
const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging"

const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // First, check if we have stored artist profile data
    const artistProfileResult = await docClient.send(
      new QueryCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        KeyConditionExpression: "userId = :uid AND provider = :prov",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":prov": "spotify-artist-profile",
        },
      })
    )

    // If we have stored artist profile, return it immediately
    if (artistProfileResult.Items && artistProfileResult.Items.length > 0) {
      const storedProfile = artistProfileResult.Items[0]
      console.log("Found stored artist profile:", storedProfile.artistName, storedProfile.artistId)
      
      return NextResponse.json({ 
        userProfile: { id: userId },
        searchResults: [],
        matchedArtist: {
          id: storedProfile.artistId,
          name: storedProfile.artistName,
          external_urls: {
            spotify: storedProfile.spotifyUrl
          }
        },
        knownArtistId: storedProfile.artistId,
        source: "stored_profile"
      })
    }

    // Retrieve Spotify token for user
    const result = await docClient.send(
      new QueryCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        KeyConditionExpression: "userId = :uid AND provider = :prov",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":prov": "spotify",
        },
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 400 })
    }

    const item = result.Items[0]
    const accessToken = item.accessToken
    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 })
    }

    // Get user profile first
    const profileRes = await fetch(
      "https://api.spotify.com/v1/me",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    
    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
    
    const profile = await profileRes.json()
    const userDisplayName = profile.display_name || profile.id
    
    console.log("Searching for artist profile for user:", userDisplayName)
    
    // Search for artist with the user's name
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(userDisplayName)}&type=artist&limit=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    
    if (!searchRes.ok) {
      return NextResponse.json({ error: "Failed to search artists" }, { status: 500 })
    }
    
    const searchData = await searchRes.json()
    const artists = searchData.artists.items
    
    // Try to find exact match or close match
    let matchedArtist = null
    
    // First try exact match
    matchedArtist = artists.find((artist: any) => 
      artist.name.toLowerCase() === userDisplayName.toLowerCase()
    )
    
    // If no exact match, try partial match
    if (!matchedArtist && artists.length > 0) {
      matchedArtist = artists.find((artist: any) => 
        artist.name.toLowerCase().includes(userDisplayName.toLowerCase()) ||
        userDisplayName.toLowerCase().includes(artist.name.toLowerCase())
      )
    }
    
    // Known artist IDs mapping (can be extended)
    const knownArtistIds: Record<string, string> = {}
    
    // Check if we have a known mapping
    const knownArtistId = knownArtistIds[profile.id] || knownArtistIds[profile.email]
    
    if (knownArtistId && !matchedArtist) {
      // Fetch the known artist directly
      const artistRes = await fetch(
        `https://api.spotify.com/v1/artists/${knownArtistId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      
      if (artistRes.ok) {
        matchedArtist = await artistRes.json()
      }
    }

    // DO NOT automatically store matched artists - this should only be done explicitly by the user
    // through the artist profile configuration in settings

    return NextResponse.json({ 
      userProfile: {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email
      },
      searchResults: artists,
      matchedArtist: matchedArtist,
      knownArtistId: knownArtistId
    })
  } catch (err) {
    console.error("Error searching for artist:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 