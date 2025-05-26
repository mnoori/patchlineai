import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { getCurrentUser } from 'aws-amplify/auth'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Token endpoints for each provider
const TOKEN_ENDPOINTS = {
  spotify: 'https://accounts.spotify.com/api/token',
  google: 'https://oauth2.googleapis.com/token',
  soundcloud: 'https://api.soundcloud.com/oauth2/token',
  instagram: 'https://api.instagram.com/oauth/access_token',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider.toLowerCase()
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Handle errors from provider
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=${error}`
    )
  }
  
  // Validate state for CSRF protection
  const storedState = request.cookies.get(`oauth_state_${provider}`)?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=invalid_state`
    )
  }
  
  // Validate provider and code
  if (!TOKEN_ENDPOINTS[provider as keyof typeof TOKEN_ENDPOINTS] || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=invalid_request`
    )
  }
  
  try {
    // Get current user
    const user = await getCurrentUser()
    const userId = user.userId
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(provider, code)
    
    // Store tokens in DynamoDB
    await storeTokens(userId, provider, tokens)
    
    // Clear state cookie and redirect to success
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?connected=${provider}`
    )
    response.cookies.delete(`oauth_state_${provider}`)
    
    return response
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=connection_failed`
    )
  }
}

async function exchangeCodeForTokens(provider: string, code: string) {
  const clientId = CONFIG[`${provider.toUpperCase()}_CLIENT_ID` as keyof typeof CONFIG] as string
  const clientSecret = CONFIG[`${provider.toUpperCase()}_CLIENT_SECRET` as keyof typeof CONFIG] as string
  const redirectUri = CONFIG[`${provider.toUpperCase()}_REDIRECT_URI` as keyof typeof CONFIG] as string
  
  const tokenEndpoint = TOKEN_ENDPOINTS[provider as keyof typeof TOKEN_ENDPOINTS]
  
  // Build token request based on provider
  let requestBody: any
  let headers: any = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  
  if (provider === 'spotify') {
    // Spotify uses Basic auth
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${auth}`
    requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    })
  } else if (provider === 'instagram') {
    // Instagram uses form data
    requestBody = new URLSearchParams({
      app_id: clientId,
      app_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    })
  } else {
    // Google and SoundCloud use standard format
    requestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    })
  }
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers,
    body: requestBody.toString(),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }
  
  return response.json()
}

async function storeTokens(userId: string, provider: string, tokens: any) {
  const now = Date.now()
  
  const item = {
    userId,
    provider,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresIn: tokens.expires_in || null,
    tokenType: tokens.token_type || 'Bearer',
    scope: tokens.scope || null,
    connectedAt: now,
    updatedAt: now,
    // Provider-specific data
    ...(provider === 'instagram' && { userId: tokens.user_id }),
    ...(provider === 'spotify' && { scope: tokens.scope }),
  }
  
  await docClient.send(new PutCommand({
    TableName: 'PlatformConnections-staging',
    Item: item,
  }))
} 