import { google } from 'googleapis';
import { CONFIG } from '@/lib/config';

export function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    CONFIG.GMAIL_CLIENT_ID,
    CONFIG.GMAIL_CLIENT_SECRET,
    `${CONFIG.APP_BASE_URL}/api/auth/gmail/callback`
  );
} 