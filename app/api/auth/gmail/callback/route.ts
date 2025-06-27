import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth-server';
// TODO: Add platform connection update logic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect('/dashboard/settings?error=gmail_connection_cancelled');
    }

    // Decode the state to get userId
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state || '', 'base64').toString());
      userId = stateData.userId;
    } catch {
      return NextResponse.redirect('/dashboard/settings?error=invalid_state');
    }

    const oauth2Client = getGoogleOAuth2Client();
    
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store the tokens securely
    // TODO: Implement platform connection storage
    // await updatePlatformConnection(userId, 'gmail', {
    //   accessToken: tokens.access_token!,
    //   refreshToken: tokens.refresh_token!,
    //   expiresAt: new Date(Date.now() + (tokens.expiry_date || 0)),
    // });

    return NextResponse.redirect('/dashboard/settings?success=gmail_connected');
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect('/dashboard/settings?error=gmail_connection_failed');
  }
}

export const dynamic = 'force-dynamic'
