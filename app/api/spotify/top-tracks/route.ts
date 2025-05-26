import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"

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
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    // Retrieve Spotify token for user
    const result = await docClient.send(
      new QueryCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        KeyConditionExpression: "userId = :uid and provider = :prov",
        ExpressionAttributeValues: {
          ":uid": { S: userId },
          ":prov": { S: "spotify" },
        },
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ error: "Spotify not connected" }, { status: 400 })
    }

    const item = result.Items[0]
    const accessToken = item.accessToken?.S || item.accessToken
    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 })
    }

    // Fetch top tracks from Spotify API
    const apiRes = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    if (!apiRes.ok) {
      const err = await apiRes.text()
      console.error("Spotify API error", err)
      return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
    }
    const data = await apiRes.json()
    const tracks = (data.items || []).map((t: any) => ({ id: t.id, name: t.name }))

    return NextResponse.json({ tracks })
  } catch (err) {
    console.error("Error fetching Spotify tracks", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 