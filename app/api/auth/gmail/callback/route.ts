import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth-server';
import { getDocumentClient } from '@/lib/aws/shared-dynamodb-client';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=gmail_connection_cancelled`);
    }

    // Decode the state to get userId
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state || '', 'base64').toString());
      userId = stateData.userId;
    } catch {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=invalid_state`);
    }

    const oauth2Client = getGoogleOAuth2Client();
    
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Tokens received from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      // Log first few chars for debugging
      accessTokenPreview: tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'MISSING'
    });

    // Store the tokens securely in DynamoDB
    try {
      const docClient = await getDocumentClient();
      if (!docClient) {
        console.error('DynamoDB client not available');
        return NextResponse.redirect('/dashboard/settings?error=gmail_storage_failed');
      }
      
      const tableName = process.env.USERS_TABLE || 'Users-staging';
      
      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { userId },
        UpdateExpression: 'SET platforms.gmail = :gmailData',
        ExpressionAttributeValues: {
          ':gmailData': {
            connected: true,
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            connectedAt: Date.now(),
            scope: tokens.scope || 'gmail',
            displayName: 'gmail'
          }
        }
      }));

      console.log('Gmail tokens stored successfully for user:', userId);
    } catch (error) {
      console.error('Error storing Gmail tokens:', error);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=gmail_storage_failed`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?success=gmail_connected`);
  } catch (error) {
    console.error('Gmail callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=gmail_connection_failed`);
  }
}

export const dynamic = 'force-dynamic'
