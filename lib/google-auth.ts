/**
 * Google OAuth Authentication Module
 * 
 * Handles Google Drive authentication flow for the social media workflow
 */

import { getPlatformConfig } from './platform-config'

export interface GoogleAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
}

// Get Google Drive configuration from platform config
const googleDriveConfig = getPlatformConfig('googledrive')

export function getGoogleAuthUrl(state?: string): string {
  const config = googleDriveConfig?.oauthConfig
  if (!config) {
    throw new Error('Google Drive OAuth configuration not found')
  }

  // Use the Gmail client ID which is already configured
  const clientId = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  
  if (!clientId) {
    console.error('Google OAuth client ID not found. Please set NEXT_PUBLIC_GMAIL_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID')
    throw new Error('Google OAuth client ID not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: config.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state })
  })

  return `${config.authUrl}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
  const config = googleDriveConfig?.oauthConfig
  if (!config) {
    throw new Error('Google Drive OAuth configuration not found')
  }

  // Server-side uses different env vars
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for token: ${error}`)
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const config = googleDriveConfig?.oauthConfig
  if (!config) {
    throw new Error('Google Drive OAuth configuration not found')
  }

  // Server-side uses different env vars
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}

// Google Drive API functions
export async function listDriveFiles(accessToken: string, query?: string) {
  const params = new URLSearchParams({
    q: query || "mimeType contains 'image/'",
    fields: 'files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink)',
    pageSize: '50',
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to list files')
  }

  return response.json()
}

export async function getDriveFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get file')
  }

  return response.blob()
}

// Helper to check if user has Google Drive connected
export function isGoogleDriveConnected(): boolean {
  // This would check localStorage or your state management for stored tokens
  if (typeof window === 'undefined') return false
  
  const storedAuth = localStorage.getItem('google_drive_auth')
  if (!storedAuth) return false
  
  try {
    const auth = JSON.parse(storedAuth)
    // Check if token exists and hasn't expired
    return auth.access_token && auth.expires_at > Date.now()
  } catch {
    return false
  }
}

// Store authentication data
export function storeGoogleAuth(tokenResponse: GoogleTokenResponse) {
  if (typeof window === 'undefined') return
  
  const expiresAt = Date.now() + (tokenResponse.expires_in * 1000)
  localStorage.setItem('google_drive_auth', JSON.stringify({
    ...tokenResponse,
    expires_at: expiresAt
  }))
}

// Clear authentication data
export function clearGoogleAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('google_drive_auth')
}

// Get stored authentication
export function getStoredGoogleAuth(): (GoogleTokenResponse & { expires_at: number }) | null {
  if (typeof window === 'undefined') return null
  
  const storedAuth = localStorage.getItem('google_drive_auth')
  if (!storedAuth) return null
  
  try {
    return JSON.parse(storedAuth)
  } catch {
    return null
  }
}

 