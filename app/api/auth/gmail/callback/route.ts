import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '@/lib/config';
import { google } from 'googleapis';

const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging";

const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error('Gmail OAuth Error:', error);
    // Redirect to an error page or display an error message
    return NextResponse.redirect(`${CONFIG.APP_BASE_URL}/dashboard/settings?error=gmail_oauth_failed`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 });
  }
  
  let userIdFromState: string | null = null;
  try {
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
    userIdFromState = decodedState.userId;
  } catch (e) {
    console.error('Invalid state parameter:', e);
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  if (!userIdFromState) {
    return NextResponse.json({ error: 'UserId not found in state' }, { status: 400 });
  }
  const userId = userIdFromState;

  try {
    const oauth2Client = getGoogleOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);

    // Get user's email (optional, but good for identification)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const gmailUserEmail = userInfo.data.email;

    if (!tokens.access_token || !tokens.refresh_token) {
        console.error('Missing access_token or refresh_token from Google');
        return NextResponse.json({ error: 'Failed to retrieve complete tokens from Google' }, { status: 500 });
    }

    const item = {
      userId: userId,
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date, // Unix timestamp in milliseconds
      gmailUserEmail: gmailUserEmail || '',
      scopes: tokens.scope, // Store the granted scopes
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docClient.send(
      new PutCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        Item: item,
      })
    );
    
    console.log(`Gmail connected successfully for user ${userId}, email: ${gmailUserEmail}`);
    // Redirect to a success page, e.g., back to settings
    return NextResponse.redirect(`${CONFIG.APP_BASE_URL}/dashboard/settings?success=gmail_connected`);
  } catch (err: any) {
    console.error('Error exchanging Gmail code or storing tokens:', err.message, err.stack, err.response?.data);
    // Redirect to an error page
    return NextResponse.redirect(`${CONFIG.APP_BASE_URL}/dashboard/settings?error=gmail_token_exchange_failed`);
  }
} 