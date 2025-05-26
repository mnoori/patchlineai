import { NextResponse } from "next/server"

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/instagram/callback"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json(
      { error: "No code provided" },
      { status: 400 }
    )
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID!,
        client_secret: INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to get access token")
    }

    const tokenData = await tokenResponse.json()

    // Get user profile data
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokenData.access_token}`
    )

    if (!profileResponse.ok) {
      throw new Error("Failed to get user profile")
    }

    const profileData = await profileResponse.json()

    // TODO: Store the access token and user data in your database
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      user: profileData,
    })
  } catch (error) {
    console.error("Instagram OAuth error:", error)
    return NextResponse.json(
      { error: "Failed to authenticate with Instagram" },
      { status: 500 }
    )
  }
}
