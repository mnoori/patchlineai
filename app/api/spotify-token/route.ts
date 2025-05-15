import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Use environment variables with fallbacks for local development
    const clientId = process.env.SPOTIFY_CLIENT_ID || "1c3ef44bdb494a4c90c591f56fd4bc37"
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "776872529edd4a79b615ac4c32eca36e"
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    console.log(`Requesting Spotify token with client ID: ${clientId.substring(0, 5)}...`)

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store", // Don't cache the token request
      next: { revalidate: 0 }, // Ensure the route is never cached in Next.js
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Failed to fetch Spotify token: ${res.status} ${res.statusText}`, errorText)
      return NextResponse.json(
        { error: "Failed to fetch token", status: res.status, details: errorText },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(
      { access_token: data.access_token, expires_in: data.expires_in },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error in Spotify token API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
