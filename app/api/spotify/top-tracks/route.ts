import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"
import { getAuthenticatedUser } from "@/utils/amplifyServerUtils"
import { getValidSpotifyToken } from "@/lib/spotify-helpers"

// Minimal API to fetch user top tracks from Spotify
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
    // Get user ID from query params (passed from frontend)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
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

    // Fetch top tracks from Spotify API
    const topTracksRes = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=10",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    
    if (!topTracksRes.ok) {
      const err = await topTracksRes.text()
      console.error("Spotify API error for top tracks:", err)
      // If top tracks fails, try to at least get user's saved tracks
      const savedTracksRes = await fetch(
        "https://api.spotify.com/v1/me/tracks?limit=10",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      
      if (!savedTracksRes.ok) {
        return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
      }
      
      const savedData = await savedTracksRes.json()
      const tracks = (savedData.items || []).map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((a: any) => a.name).join(', '),
        album: item.track.album.name,
        embedUrl: `https://open.spotify.com/embed/track/${item.track.id}?utm_source=generator&theme=0`
      }))
      
      return NextResponse.json({ tracks, source: 'saved' })
    }
    
    const topTracksData = await topTracksRes.json()
    const tracks = (topTracksData.items || []).map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      embedUrl: `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`
    }))
    
    // Also try to get user profile to check if they're an artist
    try {
      const profileRes = await fetch(
        "https://api.spotify.com/v1/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      
      if (profileRes.ok) {
        const profile = await profileRes.json()
        console.log("Spotify user profile:", profile.display_name, profile.id)
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }

    return NextResponse.json({ tracks, source: 'top' })
  } catch (err) {
    console.error("Error fetching Spotify tracks", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 