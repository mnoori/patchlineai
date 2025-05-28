import { NextRequest, NextResponse } from 'next/server';
import { getGmailApiClient } from '@/lib/gmail-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const maxResults = parseInt(searchParams.get('limit') || '10', 10);

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    const gmail = await getGmailApiClient(userId);
    if (!gmail) {
      return NextResponse.json({ error: 'Gmail not connected or token refresh failed' }, { status: 401 });
    }

    const response = await gmail.users.drafts.list({
      userId: 'me',
      maxResults: maxResults,
    });

    const drafts = response.data.drafts || [];
    const draftDetails = [];

    for (const draft of drafts) {
      if (draft.id) {
        const draftData = await gmail.users.drafts.get({
          userId: 'me',
          id: draft.id,
        });
        
        const headers = draftData.data.message?.payload?.headers || [];
        draftDetails.push({
          id: draft.id,
          messageId: draftData.data.message?.id,
          snippet: draftData.data.message?.snippet,
          subject: headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
          to: headers.find((h: any) => h.name === 'To')?.value || 'No Recipient',
          date: headers.find((h: any) => h.name === 'Date')?.value || 'Unknown Date',
          internalDate: draftData.data.message?.internalDate,
        });
      }
    }

    return NextResponse.json({ 
      drafts: draftDetails, 
      total: drafts.length 
    });
  } catch (error: any) {
    console.error('Error listing Gmail drafts:', error.message, error.response?.data);
    return NextResponse.json({ error: 'Failed to list drafts' }, { status: 500 });
  }
} 