import { NextRequest, NextResponse } from 'next/server';
import { getGmailDirectClient } from '@/lib/services/gmail-direct';

export async function POST(req: NextRequest) {
  try {
    const { userId, query } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const gmailClient = await getGmailDirectClient(userId);

    const searchResult = await gmailClient.searchMessages(query, 5);
    const messages = searchResult.messages || [];

    if (messages.length === 0) {
      return NextResponse.json({ result: 'No emails found matching your query.' });
    }

    const emailPromises = messages.map(async (message: any) => {
        const msg = await gmailClient.getMessage(message.id);
        const fromHeader = msg.payload.headers.find((h: any) => h.name === 'From');
        const subjectHeader = msg.payload.headers.find((h: any) => h.name === 'Subject');
        const snippet = msg.snippet;
        return {
          from: fromHeader ? fromHeader.value : 'N/A',
          subject: subjectHeader ? subjectHeader.value : 'N/A',
          snippet: snippet,
        };
    });

    const emails = await Promise.all(emailPromises);

    return NextResponse.json({
        result: `Found ${emails.length} email(s).`,
        emails: emails,
    });

  } catch (error: any) {
    console.error('Error searching Gmail:', error);
    
    // Provide specific error messages based on error type
    let message = 'An error occurred while searching your Gmail account.';
    let statusCode = 500;
    
    if (error.message.includes('reconnect')) {
      message = error.message;
      statusCode = 401;
    } else if (error.message.includes('Gmail not connected')) {
      message = 'Gmail account is not connected. Please connect your Gmail account in settings.';
      statusCode = 401;
    } else if (error.message.includes('Gmail API error')) {
      message = 'Gmail authentication failed. Please reconnect your Gmail account in settings.';
      statusCode = 401;
    } else if (error.code === 401 || error.status === 401) {
      message = 'Gmail authentication failed. Please reconnect your Gmail account in settings.';
      statusCode = 401;
    } else if (error.message.includes('Login Required')) {
      message = 'Gmail login required. Please reconnect your Gmail account in settings.';
      statusCode = 401;
    }
    
    return NextResponse.json({ error: message }, { status: statusCode });
  }
} 