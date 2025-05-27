import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { CONFIG } from "@/lib/config"

export async function getValidSpotifyToken(
  docClient: DynamoDBDocumentClient,
  userId: string,
  tableName: string
): Promise<{ accessToken: string; needsRefresh: boolean } | null> {
  try {
    // Get current Spotify connection
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "userId = :uid AND provider = :prov",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":prov": "spotify",
        },
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return null
    }

    const connection = result.Items[0]
    const accessToken = connection.accessToken
    const refreshToken = connection.refreshToken
    const expiresAt = connection.expiresAt

    if (!accessToken) {
      return null
    }

    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date()
    const expiry = new Date(expiresAt)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiry > fiveMinutesFromNow) {
      // Token is still valid
      return { accessToken, needsRefresh: false }
    }

    // Token is expired or about to expire, refresh it
    if (!refreshToken) {
      console.error("No refresh token available for user:", userId)
      return null
    }

    console.log("Refreshing expired Spotify token for user:", userId)

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
      return null
    }

    const tokens = await tokenResponse.json()
    
    // Calculate new expiry time (tokens expire in 1 hour)
    const newExpiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()

    // Update the connection with new access token
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          userId: userId,
          provider: "spotify",
        },
        UpdateExpression: "SET accessToken = :token, expiresAt = :expires, updatedAt = :updated",
        ExpressionAttributeValues: {
          ":token": tokens.access_token,
          ":expires": newExpiresAt,
          ":updated": Date.now(),
        },
      })
    )

    console.log(`Refreshed Spotify token for user ${userId}, expires at ${newExpiresAt}`)

    return { accessToken: tokens.access_token, needsRefresh: true }
  } catch (err) {
    console.error("Error getting valid Spotify token:", err)
    return null
  }
} 