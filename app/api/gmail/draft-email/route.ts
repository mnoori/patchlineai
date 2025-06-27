import { NextRequest, NextResponse } from 'next/server';
import { getGmailApiClient } from '@/lib/gmail-service';

// Helper to create a MIME-encoded email
function createMimeMessage(to: string, from: string, subject: string, body: string, isHtml: boolean = true): string {
  const emailLines = [];
  emailLines.push(`From: ${from}`);
  emailLines.push(`To: ${to}`);
  emailLines.push(`Content-type: ${isHtml ? 'text/html' : 'text/plain'};charset=utf-8`);
  emailLines.push(`MIME-Version: 1.0`);
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('');
  emailLines.push(body);
  return Buffer.from(emailLines.join('\r\n')).toString('base64url');
}

export async function POST(request: NextRequest) {
  try {
    const { userId, to, subject, body, isHtml = true } = await request.json();

    if (!userId || !to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields (userId, to, subject, body)' }, { status: 400 });
    }

    const gmail = await getGmailApiClient(userId);
    if (!gmail) {
      return NextResponse.json({ error: 'Gmail not connected or token refresh failed' }, { status: 401 });
    }

    // Get user's email address for the 'From' field
    const profileRes = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profileRes.data.emailAddress;

    if (!userEmail) {
        return NextResponse.json({ error: 'Could not retrieve user email for drafting.' }, { status: 500 });
    }

    const rawMessage = createMimeMessage(to, userEmail, subject, body, isHtml);

    const draftResponse = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: rawMessage,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      draftId: draftResponse.data.id, 
      message: 'Draft created successfully',
      messageId: draftResponse.data.message?.id
    });
  } catch (error: any) {
    console.error('Error creating Gmail draft:', error.message, error.response?.data);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'
