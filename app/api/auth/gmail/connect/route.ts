import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth-server';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', // View your email messages and settings
  'https://www.googleapis.com/auth/gmail.compose', // Manage drafts and send emails
  'https://www.googleapis.com/auth/gmail.send', // Send email on your behalf
  'https://www.googleapis.com/auth/gmail.modify', // Manage mailbox labels, settings, and messages
  'https://www.googleapis.com/auth/userinfo.email', // Get user's email address
  'https://www.googleapis.com/auth/userinfo.profile' // Get basic profile info
];

export async function GET(request: NextRequest) {
  try {
    const oauth2Client = getGoogleOAuth2Client();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important to get a refresh token
      scope: GMAIL_SCOPES,
      prompt: 'consent', // Ensures the user is prompted for consent every time
      state: Buffer.from(JSON.stringify({ userId })).toString('base64'), // Pass userId to the callback
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);
    return NextResponse.json({ error: 'Failed to initiate Gmail connection' }, { status: 500 });
  }
} 