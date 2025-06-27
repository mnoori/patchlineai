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
    const { userId, to, subject, body, draftId, isHtml = true } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const gmail = await getGmailApiClient(userId);
    if (!gmail) {
      return NextResponse.json({ error: 'Gmail not connected or token refresh failed' }, { status: 401 });
    }

    if (draftId) {
        // Send an existing draft
        const sendResponse = await gmail.users.drafts.send({
            userId: 'me',
            requestBody: {
                id: draftId,
            }
        });
        return NextResponse.json({ 
          success: true, 
          messageId: sendResponse.data.id, 
          message: 'Draft sent successfully' 
        });
    } else if (to && subject && body) {
        // Send a new email directly
        const profileRes = await gmail.users.getProfile({ userId: 'me' });
        const userEmail = profileRes.data.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: 'Could not retrieve user email for sending.' }, { status: 500 });
        }
        
        const rawMessage = createMimeMessage(to, userEmail, subject, body, isHtml);
        const sendResponse = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawMessage,
            },
        });
        return NextResponse.json({ 
          success: true, 
          messageId: sendResponse.data.id, 
          message: 'Email sent successfully' 
        });
    } else {
        return NextResponse.json({ error: 'Missing fields: provide either (draftId) or (to, subject, body)' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error sending Gmail email:', error.message, error.response?.data);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'
