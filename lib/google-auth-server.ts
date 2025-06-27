/**
 * Server-side Google OAuth Authentication Module
 * 
 * This file contains server-only Google OAuth functions that use the google-auth-library
 * Only import this file in server-side code (API routes, server components)
 */

import { OAuth2Client } from 'google-auth-library'

/**
 * Get Google OAuth2 Client for server-side use only
 * @returns OAuth2Client instance
 */
export function getGoogleOAuth2Client(): OAuth2Client {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
  const redirectUri = process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/gmail/callback`

  console.log('Gmail OAuth Config:', {
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
    clientSecret: clientSecret ? 'SET' : 'MISSING',
    redirectUri
  });

  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables.');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri)
} 