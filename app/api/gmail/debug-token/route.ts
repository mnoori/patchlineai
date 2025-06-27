import { NextRequest, NextResponse } from 'next/server';
import { getDocumentClient } from '@/lib/aws/shared-dynamodb-client';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { OAuth2Client } from 'google-auth-library';

const USERS_TABLE = process.env.USERS_TABLE || 'Users-staging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Get tokens from database
    const docClient = await getDocumentClient();
    const command = new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    });

    const { Item } = await docClient.send(command);
    const gmailData = Item?.platforms?.gmail;

    if (!gmailData) {
      return NextResponse.json({ error: 'No Gmail connection found' }, { status: 404 });
    }

    // Create OAuth2Client
    const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`;

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Set credentials
    let expiryDate = typeof gmailData.expiresAt === 'string' 
      ? new Date(gmailData.expiresAt).getTime() 
      : gmailData.expiresAt;

    oauth2Client.setCredentials({
      access_token: gmailData.accessToken,
      refresh_token: gmailData.refreshToken,
      expiry_date: expiryDate,
    });

    // Try to get access token (will refresh if needed)
    let accessToken;
    try {
      const token = await oauth2Client.getAccessToken();
      accessToken = token.token;
    } catch (error: any) {
      return NextResponse.json({
        error: 'Failed to get access token',
        details: error.message,
        gmailData: {
          hasAccessToken: !!gmailData.accessToken,
          hasRefreshToken: !!gmailData.refreshToken,
          expiresAt: gmailData.expiresAt,
          isExpired: new Date().getTime() > expiryDate
        }
      }, { status: 500 });
    }

    // Test the token with a simple API call
    const testResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const testData = await testResponse.json();

    return NextResponse.json({
      success: testResponse.ok,
      status: testResponse.status,
      profile: testResponse.ok ? testData : null,
      error: !testResponse.ok ? testData : null,
      debug: {
        hasAccessToken: !!accessToken,
        tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : null,
        expiresAt: gmailData.expiresAt,
        isExpired: new Date().getTime() > expiryDate,
        clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
        hasClientSecret: !!clientSecret,
        redirectUri
      }
    });
  } catch (error: any) {
    console.error('Debug token error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 