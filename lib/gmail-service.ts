import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CONFIG } from "@/lib/config";
import { getGoogleOAuth2Client } from '@/lib/google-auth-server';

const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging";

const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function getGmailApiClient(userId: string): Promise<ReturnType<typeof google.gmail> | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        KeyConditionExpression: "userId = :uid AND provider = :prov",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":prov": "gmail",
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.error(`No Gmail connection found for user ${userId}`);
      return null;
    }

    const connection = result.Items[0];
    const { accessToken, refreshToken, expiresAt } = connection;

    if (!accessToken || !refreshToken) {
      console.error(`Missing tokens for Gmail connection for user ${userId}`);
      return null;
    }

    const oauth2Client = getGoogleOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiresAt,
    });

    // Listen for token refresh events to update stored tokens
    oauth2Client.on('tokens', async (newTokens) => {
      let newAccessToken = newTokens.access_token;
      let newRefreshToken = newTokens.refresh_token || refreshToken; // Google might not always send a new refresh token
      let newExpiresAt = newTokens.expiry_date;

      console.log(`Gmail token refreshed for user ${userId}. New expiry: ${newExpiresAt}`);
      
      await docClient.send(
        new UpdateCommand({
          TableName: PLATFORM_CONNECTIONS_TABLE,
          Key: { userId, provider: "gmail" },
          UpdateExpression: "SET accessToken = :accToken, refreshToken = :refToken, expiresAt = :exp, updatedAt = :upd",
          ExpressionAttributeValues: {
            ":accToken": newAccessToken,
            ":refToken": newRefreshToken,
            ":exp": newExpiresAt,
            ":upd": Date.now(),
          },
        })
      );
    });
    
    // Check if token is expired and refresh if needed
    if (expiresAt && Date.now() >= expiresAt) {
        console.log(`Gmail token for user ${userId} is expired. Attempting refresh.`);
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials); // The 'tokens' event should handle storage
             console.log(`Gmail token for user ${userId} successfully refreshed.`);
        } catch (refreshError) {
            console.error(`Failed to refresh Gmail token for user ${userId}:`, refreshError);
            return null; // Cannot proceed if refresh fails
        }
    }

    return google.gmail({ version: 'v1', auth: oauth2Client as any });
  } catch (error) {
    console.error(`Error getting Gmail API client for user ${userId}:`, error);
    return null;
  }
} 