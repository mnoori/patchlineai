import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"
import { cache } from "@/lib/cache"

// API to search for user's artist profile on Spotify
const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging"

const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
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
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  const cacheKey = `spotify-artist-search:${userId}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] Serving from cache: ${cacheKey}`);
    return NextResponse.json(cachedData);
  }
  console.log(`[CACHE MISS] No cache for: ${cacheKey}`);
  
  try {
    // In parallel, check for a stored artist profile and the user's Spotify connection
    const [artistProfileResult, spotifyConnectionResult] = await Promise.all([
      docClient.send(
        new QueryCommand({
          TableName: PLATFORM_CONNECTIONS_TABLE,
          KeyConditionExpression: "userId = :uid AND provider = :prov",
          ExpressionAttributeValues: {
            ":uid": userId,
            ":prov": "spotify-artist-profile",
          },
        })
      ),
      docClient.send(
        new QueryCommand({
          TableName: PLATFORM_CONNECTIONS_TABLE,
          KeyConditionExpression: "userId = :uid AND provider = :prov",
          ExpressionAttributeValues: {
            ":uid": userId,
            ":prov": "spotify",
          },
        })
      )
    ]);

    // If we have a stored artist profile, return it immediately
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

    // Retrieve Spotify token for user from the parallel query result
    if (!spotifyConnectionResult.Items || spotifyConnectionResult.Items.length === 0) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 400 })
    }

    const item = spotifyConnectionResult.Items[0]
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

    const finalResponseData = { 
      userProfile: {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email
      },
      searchResults: artists,
      matchedArtist: matchedArtist,
      knownArtistId: knownArtistId
    };

    // Cache the final result for 1 hour
    cache.set(cacheKey, finalResponseData, 3600);
    console.log(`[CACHE SET] Caching result for: ${cacheKey}`);

    return NextResponse.json(finalResponseData);
  } catch (err) {
    console.error("Error searching for artist:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 