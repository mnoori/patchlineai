import { NextResponse } from "next/server"

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/instagram/callback"

export async function GET() {
  if (!INSTAGRAM_CLIENT_ID) {
    return NextResponse.json(
      { error: "Instagram client ID not configured" },
      { status: 500 }
    )
  }

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`

  return NextResponse.json({ url: authUrl })
}

export const dynamic = 'force-dynamic'
