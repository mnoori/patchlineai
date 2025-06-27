import { OAuth2Client } from 'google-auth-library';
import { getDocumentClient } from '@/lib/aws/shared-dynamodb-client';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const USERS_TABLE = process.env.USERS_TABLE || 'Users-staging';
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

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

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Retrieves the user's platform connection data from DynamoDB.
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
 * Direct Gmail API client that uses fetch instead of googleapis
 */
export class GmailDirectClient {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  /**
   * Search for messages
   */
  async searchMessages(query: string, maxResults: number = 5) {
    const url = `${GMAIL_API_BASE}/users/me/messages?${new URLSearchParams({
      q: query,
      maxResults: maxResults.toString()
    })}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific message
   */
  async getMessage(messageId: string) {
    const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Get a direct Gmail client with valid access token
 */
export async function getGmailDirectClient(userId: string): Promise<GmailDirectClient> {
  const tokens = await getUserPlatformTokens(userId);

  if (!tokens || !tokens.accessToken) {
    throw new Error('Gmail not connected for this user.');
  }

  // Create OAuth2Client to handle token refresh
  const oauth2Client = createOAuth2Client();
  
  // Convert expiresAt to timestamp
  let expiryDate: number;
  if (typeof tokens.expiresAt === 'string') {
    expiryDate = new Date(tokens.expiresAt).getTime();
  } else {
    expiryDate = tokens.expiresAt || 0;
  }

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: expiryDate,
  });

  // Get current access token (will automatically refresh if needed)
  let currentToken: string;
  try {
    const tokenResponse = await oauth2Client.getAccessToken();
    currentToken = tokenResponse.token || '';
    
    if (!currentToken) {
      throw new Error('No access token received from OAuth2Client');
    }

    console.log('Got access token for direct client:', {
      hasToken: !!currentToken,
      tokenPreview: currentToken.substring(0, 20) + '...'
    });

    // If token was refreshed, update our stored tokens
    const updatedCredentials = oauth2Client.credentials;
    if (updatedCredentials.access_token !== tokens.accessToken) {
      console.log('Token was refreshed, updating stored tokens...');
      await updateUserTokens(userId, {
        access_token: updatedCredentials.access_token,
        refresh_token: updatedCredentials.refresh_token || tokens.refreshToken,
        expiry_date: updatedCredentials.expiry_date
      });
    }

  } catch (error: any) {
    console.error('Error getting access token:', error);
    
    if (error.message?.includes('invalid_grant') || error.response?.data?.error === 'invalid_grant') {
      throw new Error('Gmail refresh token is invalid. Please reconnect your Gmail account.');
    }
    throw new Error('Failed to get Gmail access token. Please reconnect your account.');
  }

  return new GmailDirectClient(currentToken, userId);
} 