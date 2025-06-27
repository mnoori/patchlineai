import { NextRequest, NextResponse } from 'next/server';
import { getGmailClient } from '@/lib/services/gmail-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    console.log('Testing Gmail connection for user:', userId);

    try {
      const gmail = await getGmailClient(userId);
      
      // Try to get the user's profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      return NextResponse.json({
        success: true,
        profile: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal
        }
      });
    } catch (error: any) {
      console.error('Gmail test connection error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to connect to Gmail',
        details: error.response?.data || error
      }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Test connection route error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 