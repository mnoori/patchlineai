import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getDocumentClient } from '@/lib/aws/shared-dynamodb-client';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const USERS_TABLE = process.env.USERS_TABLE || 'Users-staging';

/**
 * Creates a properly configured OAuth2Client instance
 */
function createOAuth2Client(): OAuth2Client {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables.');
  }

  console.log('Creating OAuth2Client with:', {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
    clientSecret: clientSecret ? 'SET' : 'MISSING',
    redirectUri
  });

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Retrieves the user's platform connection data from DynamoDB.
 * @param userId - The user's ID.
 * @returns The platform connection data or null if not found.
 */
async function getUserPlatformTokens(userId: string) {
  const docClient = await getDocumentClient();
  if (!docClient) {
    throw new Error('DynamoDB client not available');
  }

  const command = new GetCommand({
    TableName: USERS_TABLE,
    Key: { userId },
  });

  const { Item } = await docClient.send(command);
  return Item?.platforms?.gmail || null;
}

async function updateUserTokens(userId: string, tokens: any) {
    const docClient = await getDocumentClient();
    if (!docClient) {
      console.error('DynamoDB client not available. Cannot update tokens.');
      return;
    }
  
    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET platforms.gmail.accessToken = :accessToken, platforms.gmail.expiresAt = :expiresAt',
      ExpressionAttributeValues: {
        ':accessToken': tokens.access_token,
        ':expiresAt': new Date(tokens.expiry_date).toISOString(),
      },
    });
  
    try {
      await docClient.send(command);
      console.log('Successfully updated Gmail tokens in DynamoDB.');
    } catch (error) {
      console.error('Error updating Gmail tokens in DynamoDB:', error);
    }
}

/**
 * Creates an authenticated Gmail API client for a user.
 * It handles token refreshing if necessary.
 * @param userId - The ID of the user.
 * @returns An authenticated Gmail API client instance.
 */
export async function getGmailClient(userId: string): Promise<any> {
  const tokens = await getUserPlatformTokens(userId);

  if (!tokens || !tokens.accessToken) {
    throw new Error('Gmail not connected for this user.');
  }

  console.log('Gmail tokens retrieved:', {
    hasAccessToken: !!tokens.accessToken,
    hasRefreshToken: !!tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    currentTime: new Date().toISOString()
  });

  // Create OAuth2Client with proper configuration
  const oauth2Client = createOAuth2Client();
  
  // Convert expiresAt to timestamp (handle both string and number formats)
  let expiryDate: number;
  if (typeof tokens.expiresAt === 'string') {
    expiryDate = new Date(tokens.expiresAt).getTime();
  } else {
    expiryDate = tokens.expiresAt || 0;
  }

  // Set credentials with proper format
  const credentials = {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: expiryDate,
  };

  console.log('Setting OAuth2Client credentials:', {
    hasAccessToken: !!credentials.access_token,
    hasRefreshToken: !!credentials.refresh_token,
    expiryDate: credentials.expiry_date,
    expiryDateFormatted: new Date(credentials.expiry_date).toISOString(),
    // Log first few chars of access token for debugging
    accessTokenPreview: credentials.access_token ? `${credentials.access_token.substring(0, 20)}...` : 'MISSING'
  });

  oauth2Client.setCredentials(credentials);

  // Check if token is expired (add 5 minute buffer)
  const now = new Date().getTime();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  const isTokenExpired = !tokens.expiresAt || (now + bufferTime) > expiryDate;

  console.log('Token expiration check:', {
    now,
    expiryDate,
    isTokenExpired,
    timeUntilExpiry: expiryDate - now
  });

  // Get current access token (will automatically refresh if needed)
  let currentToken: string;
  try {
    const tokenResponse = await oauth2Client.getAccessToken();
    currentToken = tokenResponse.token || '';
    
    if (!currentToken) {
      throw new Error('No access token received from OAuth2Client');
    }

    console.log('Got access token from OAuth2Client:', {
      hasToken: !!currentToken,
      tokenPreview: currentToken.substring(0, 20) + '...'
    });

    // IMPORTANT: After getAccessToken(), the oauth2Client.credentials are updated
    // We need to ensure these updated credentials are used
    const updatedCredentials = oauth2Client.credentials;
    console.log('Updated credentials after getAccessToken:', {
      hasAccessToken: !!updatedCredentials.access_token,
      hasRefreshToken: !!updatedCredentials.refresh_token,
      expiryDate: updatedCredentials.expiry_date,
      tokenMatches: updatedCredentials.access_token === currentToken
    });

    // If token was refreshed, update our stored tokens
    if (updatedCredentials.access_token !== tokens.accessToken) {
      console.log('Token was refreshed, updating stored tokens...');
      await updateUserTokens(userId, {
        access_token: updatedCredentials.access_token,
        refresh_token: updatedCredentials.refresh_token || tokens.refreshToken,
        expiry_date: updatedCredentials.expiry_date
      });
    }

    // CRITICAL: Create a new OAuth2Client instance with the fresh credentials
    // This ensures the googleapis library uses the updated token
    const freshOAuth2Client = createOAuth2Client();
    freshOAuth2Client.setCredentials({
      access_token: currentToken,
      refresh_token: updatedCredentials.refresh_token || tokens.refreshToken,
      expiry_date: updatedCredentials.expiry_date
    });

    // Return the authenticated Gmail client with the fresh OAuth2Client
    const gmail = google.gmail({ version: 'v1', auth: freshOAuth2Client });
    console.log('Gmail client created successfully with fresh OAuth2Client');
    
    return gmail;

  } catch (error: any) {
    console.error('Error getting access token:', error);
    
    // If refresh fails, it might be because the refresh token is invalid
    if (error.message?.includes('invalid_grant') || error.response?.data?.error === 'invalid_grant') {
      throw new Error('Gmail refresh token is invalid. Please reconnect your Gmail account.');
    }
    throw new Error('Failed to get Gmail access token. Please reconnect your account.');
  }
} 