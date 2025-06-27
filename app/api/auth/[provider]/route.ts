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

// Helper function to get client credentials for each provider
function getProviderCredentials(provider: string) {
  switch (provider) {
    case 'google':
      return {
        clientId: CONFIG.GMAIL_CLIENT_ID,
        clientSecret: CONFIG.GMAIL_CLIENT_SECRET,
        redirectUri: `${CONFIG.APP_BASE_URL}/api/auth/gmail/callback`
      }
    case 'spotify':
      return {
        clientId: CONFIG.SPOTIFY_CLIENT_ID,
        clientSecret: CONFIG.SPOTIFY_CLIENT_SECRET,
        redirectUri: CONFIG.SPOTIFY_REDIRECT_URI
      }
    case 'soundcloud':
      return {
        clientId: CONFIG.SOUNDCLOUD_CLIENT_ID,
        clientSecret: CONFIG.SOUNDCLOUD_CLIENT_SECRET,
        redirectUri: CONFIG.SOUNDCLOUD_REDIRECT_URI
      }
    case 'instagram':
      return {
        clientId: CONFIG.INSTAGRAM_CLIENT_ID,
        clientSecret: CONFIG.INSTAGRAM_CLIENT_SECRET,
        redirectUri: CONFIG.INSTAGRAM_REDIRECT_URI
      }
    default:
      return {
        clientId: '',
        clientSecret: '',
        redirectUri: ''
      }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerParam } = await params
    const provider = providerParam.toLowerCase()
    
    console.log(`[OAuth ${provider} Init] Starting OAuth flow for provider: ${provider}`)
    console.log(`[OAuth ${provider} Init] Request URL: ${request.url}`)
    console.log(`[OAuth ${provider} Init] Environment: ${process.env.NODE_ENV}`)
    console.log(`[OAuth ${provider} Init] Available env vars:`, {
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REDIRECT_URI: !!process.env.SPOTIFY_REDIRECT_URI,
      SPOTIFY_LOCAL_REDIRECT_URI: !!process.env.SPOTIFY_LOCAL_REDIRECT_URI,
      GMAIL_CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET: !!process.env.GMAIL_CLIENT_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    })
    
    // Validate provider
    if (!OAUTH_ENDPOINTS[provider as keyof typeof OAUTH_ENDPOINTS]) {
      console.error(`[OAuth ${provider} Init] Invalid provider: ${provider}`)
      return NextResponse.redirect(`${CONFIG.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_provider`)
    }
    
    // Get provider config
    const providerConfig = OAUTH_ENDPOINTS[provider as keyof typeof OAUTH_ENDPOINTS]
    const { clientId, clientSecret, redirectUri } = getProviderCredentials(provider)
    
    console.log(`[OAuth ${provider} Init] Client ID: ${clientId ? 'SET' : 'NOT SET'}`)
    console.log(`[OAuth ${provider} Init] Client Secret: ${clientSecret ? 'SET' : 'NOT SET'}`)
    console.log(`[OAuth ${provider} Init] Redirect URI: ${redirectUri}`)
    console.log(`[OAuth ${provider} Init] Config values:`, {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'missing',
      hasClientSecret: !!clientSecret,
      redirectUri
    })
    
    if (!clientId || !redirectUri) {
      console.error(`[OAuth ${provider} Init] Missing configuration - Client ID: ${!!clientId}, Redirect URI: ${!!redirectUri}`)
      return NextResponse.redirect(`${CONFIG.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=configuration_missing`)
    }
    
    // For Spotify, we need the client secret for the callback, but not for the initial auth
    // However, we should warn if it's missing
    if (provider === 'spotify' && !clientSecret) {
      console.warn(`[OAuth ${provider} Init] WARNING: Spotify client secret not set - OAuth callback will fail`)
      return NextResponse.redirect(`${CONFIG.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=spotify_secret_missing`)
    }
    
    // Get the user ID from query params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('uid')
    
    if (!userId) {
      console.error(`[OAuth ${provider} Init] No user ID provided in query params`)
      return NextResponse.redirect(`${CONFIG.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_user_id`)
    }
    
    // Generate state for CSRF protection and include user ID
    const stateData = {
      csrf: crypto.randomBytes(16).toString('hex'),
      userId: userId,
      timestamp: Date.now()
    }
    
    // Encode state as base64 to keep it URL-safe
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url')
    console.log(`[OAuth ${provider} Init] Generated state with user ID: ${userId}`)
    
    // Build auth URL
    const authUrl = buildAuthUrl(provider, providerConfig, clientId as string, redirectUri as string, state)
    console.log(`[OAuth ${provider} Init] Auth URL: ${authUrl}`)
    
    // Store state in cookie for validation later
    const response = NextResponse.redirect(authUrl)
    
    response.cookies.set(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })
    
    console.log(`[OAuth ${provider} Init] State cookie set, redirecting to: ${authUrl}`)
    return response
    
  } catch (error) {
    console.error(`[OAuth Init] Unexpected error:`, error)
    return NextResponse.redirect(`${CONFIG.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=connection_failed`)
  }
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

export const dynamic = 'force-dynamic'
