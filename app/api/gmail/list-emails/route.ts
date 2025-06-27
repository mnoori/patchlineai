import { NextRequest, NextResponse } from 'next/server';
import { getGmailApiClient } from '@/lib/gmail-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const maxResults = parseInt(searchParams.get('limit') || '10', 10);
  const query = searchParams.get('query') || 'is:unread'; // Default to unread messages

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    const gmail = await getGmailApiClient(userId);
    if (!gmail) {
      return NextResponse.json({ error: 'Gmail not connected or token refresh failed' }, { status: 401 });
    }

    const response = await gmail.users.messages.list({
      userId: 'me', // 'me' refers to the authenticated user
      maxResults: maxResults,
      q: query, // Gmail search query
    });

    const messages = response.data.messages || [];
    const emailDetails = [];

    for (const message of messages) {
      if (message.id) {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata', // 'full' or 'raw' for more details
          metadataHeaders: ['Subject', 'From', 'Date', 'To'],
        });
        
        const headers = msg.data.payload?.headers || [];
        emailDetails.push({
          id: msg.data.id,
          threadId: msg.data.threadId,
          snippet: msg.data.snippet,
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          from: headers.find(h => h.name === 'From')?.value || 'Unknown Sender',
          to: headers.find(h => h.name === 'To')?.value || 'Unknown Recipient',
          date: headers.find(h => h.name === 'Date')?.value || 'Unknown Date',
          labelIds: msg.data.labelIds || [],
          internalDate: msg.data.internalDate,
        });
      }
    }

    return NextResponse.json({ 
      emails: emailDetails, 
      total: response.data.resultSizeEstimate,
      nextPageToken: response.data.nextPageToken 
    });
  } catch (error: any) {
    console.error('Error listing Gmail emails:', error.message, error.response?.data);
    return NextResponse.json({ error: 'Failed to list emails' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'
