import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"
import { getValidSpotifyToken } from "@/lib/spotify-helpers"

// API to fetch artist's tracks from Spotify
const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging"

const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  // Provide credentials only when explicitly available (local dev). Lambda will use its IAM role.
  credentials:
    CONFIG.AWS_ACCESS_KEY_ID && CONFIG.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
          secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
          ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN }),
        }
      : undefined,
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export async function GET(request: NextRequest) {
  try {
    // Get user ID and artist ID from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    let artistId = searchParams.get('artistId')
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // If no artistId provided, try to get it from stored profile
    if (!artistId) {
      try {
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

        if (artistProfileResult.Items && artistProfileResult.Items.length > 0) {
          artistId = artistProfileResult.Items[0].artistId
          console.log("Using stored artist ID:", artistId, "for artist:", artistProfileResult.Items[0].artistName)
        } else {
          console.log("No stored artist profile found")
          return NextResponse.json({ 
            error: "No artist profile configured. Please set up your artist profile in Settings.", 
            needsSetup: true 
          }, { status: 400 })
        }
      } catch (profileError) {
        console.error("Error fetching stored artist profile:", profileError)
        return NextResponse.json({ 
          error: "Error retrieving artist profile. Please check your configuration.", 
          needsSetup: true 
        }, { status: 500 })
      }
    }

    // Get valid Spotify token (will refresh if expired)
    const tokenResult = await getValidSpotifyToken(docClient, userId, PLATFORM_CONNECTIONS_TABLE)
    
    if (!tokenResult) {
      return NextResponse.json({ error: "Spotify not connected or token refresh failed" }, { status: 400 })
    }

    const { accessToken, needsRefresh } = tokenResult
    if (needsRefresh) {
      console.log("Token was refreshed for user:", userId)
    }

    // Fetch artist's top tracks
    const artistTracksRes = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    
    if (!artistTracksRes.ok) {
      const err = await artistTracksRes.text()
      console.error("Spotify API error for artist tracks:", err)
      return NextResponse.json({ error: "Failed to fetch artist tracks" }, { status: 500 })
    }
    
    const artistData = await artistTracksRes.json()
    
    // Also fetch artist info
    const artistInfoRes = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    
    let artistInfo = null
    if (artistInfoRes.ok) {
      artistInfo = await artistInfoRes.json()
    }
    
    const tracks = (artistData.tracks || []).map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      embedUrl: `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`,
      popularity: track.popularity,
      preview_url: track.preview_url
    }))

    return NextResponse.json({ 
      tracks, 
      artistInfo: artistInfo ? {
        name: artistInfo.name,
        followers: artistInfo.followers.total,
        genres: artistInfo.genres,
        images: artistInfo.images
      } : null
    })
  } catch (err) {
    console.error("Error fetching artist tracks", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
