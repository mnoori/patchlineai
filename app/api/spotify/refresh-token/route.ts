import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Get current Spotify connection
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

    const connection = result.Items[0]
    const refreshToken = connection.refreshToken

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 400 })
    }

    // Exchange refresh token for new access token
    const clientId = CONFIG.SPOTIFY_CLIENT_ID
    const clientSecret = CONFIG.SPOTIFY_CLIENT_SECRET
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error("Failed to refresh Spotify token:", error)
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 })
    }

    const tokens = await tokenResponse.json()
    
    // Calculate new expiry time (tokens expire in 1 hour)
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()

    // Update the connection with new access token
    await docClient.send(
      new UpdateCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        Key: {
          userId: userId,
          provider: "spotify",
        },
        UpdateExpression: "SET accessToken = :token, expiresAt = :expires, updatedAt = :updated",
        ExpressionAttributeValues: {
          ":token": tokens.access_token,
          ":expires": expiresAt,
          ":updated": Date.now(),
        },
      })
    )

    console.log(`Refreshed Spotify token for user ${userId}, expires at ${expiresAt}`)

    return NextResponse.json({ 
      success: true,
      accessToken: tokens.access_token,
      expiresAt: expiresAt,
    })
  } catch (err) {
    console.error("Error refreshing Spotify token:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 