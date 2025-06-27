import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getUserInfo, storeGoogleAuth } from '@/lib/google-auth'
import { platformsAPI } from '@/lib/api-client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/content?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/content?error=no_code', request.url)
    )
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForToken(code)
    
    // Get user info
    const userInfo = await getUserInfo(tokenResponse.access_token)
    
    // Get user ID from state or session
    let userId = state
    if (!userId) {
      // Try to get from session storage via cookie
      const cookies = request.headers.get('cookie')
      if (cookies) {
        const userIdMatch = cookies.match(/oauth_user_id=([^;]+)/)
        userId = userIdMatch ? userIdMatch[1] : null
      }
    }

    // Store in database if we have a user ID
    if (userId) {
      try {
        await platformsAPI.update({
          userId,
          platform: 'googledrive',
          connected: true,
        })
      } catch (dbError) {
        console.error('Failed to store in database:', dbError)
        // Continue anyway - we'll store in localStorage
      }
    }

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL('/dashboard/content?google_connected=true', request.url)
    )

    // Set cookie with token info for client-side storage
    response.cookies.set('google_auth', JSON.stringify({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
      user_email: userInfo.email,
      user_name: userInfo.name,
    }), {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Failed to handle OAuth callback:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/content?error=${encodeURIComponent('authentication_failed')}`, request.url)
    )
  }
}

export const dynamic = 'force-dynamic'
