import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import crypto from 'crypto'

// OAuth endpoints for each provider
const OAUTH_ENDPOINTS = {
  spotify: {
    authorize: 'https://accounts.spotify.com/authorize',
    scopes: 'user-read-email user-read-private playlist-read-private playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read',
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
  },
  soundcloud: {
    authorize: 'https://soundcloud.com/connect',
    scopes: 'non-expiring',
  },
  instagram: {
    authorize: 'https://api.instagram.com/oauth/authorize',
    scopes: 'user_profile,user_media',
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params
  const provider = providerParam.toLowerCase()
  
  // Validate provider
  if (!OAUTH_ENDPOINTS[provider as keyof typeof OAUTH_ENDPOINTS]) {
    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    )
  }
  
  // Get provider config
  const providerConfig = OAUTH_ENDPOINTS[provider as keyof typeof OAUTH_ENDPOINTS]
  const clientId = CONFIG[`${provider.toUpperCase()}_CLIENT_ID` as keyof typeof CONFIG]
  const redirectUri = CONFIG[`${provider.toUpperCase()}_REDIRECT_URI` as keyof typeof CONFIG]
  
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: `${provider} not configured` },
      { status: 500 }
    )
  }
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex')
  console.log(`[OAuth ${provider} Auth] Generated state:`, state.substring(0, 8) + '...')
  
  // Build auth URL
  const authUrl = buildAuthUrl(provider, providerConfig, clientId as string, redirectUri as string, state)
  console.log(`[OAuth ${provider} Auth] Redirecting to:`, authUrl)
  
  // Store state in cookie for validation later
  const response = NextResponse.redirect(authUrl)
  
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  
  console.log(`[OAuth ${provider} Auth] State cookie set with maxAge: 600s`)
  return response
}

function buildAuthUrl(
  provider: string,
  config: any,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state,
    scope: config.scopes,
  })
  
  // Provider-specific parameters
  if (provider === 'google') {
    params.append('access_type', 'offline')
    params.append('prompt', 'consent')
  }
  
  if (provider === 'instagram') {
    // Instagram uses different parameter names
    params.delete('client_id')
    params.append('app_id', clientId)
  }
  
  return `${config.authorize}?${params.toString()}`
} 