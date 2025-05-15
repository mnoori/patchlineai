import { type NextRequest, NextResponse } from "next/server"
import demoArtists from "@/data/demo-artists.json"

export async function GET(req: NextRequest) {
  console.log("[API Route] process.env.NEXT_PUBLIC_DEMO_MODE:", process.env.NEXT_PUBLIC_DEMO_MODE)
  const isDemoModeForRoute = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  console.log("[API Route] isDemoModeForRoute evaluated as:", isDemoModeForRoute)
  try {
    // Get artist ID from query
    const { searchParams } = new URL(req.url)
    const artistId = searchParams.get("id") || "1vCWHaC5f2uS3yhpwWbIA6" // Avicii as demo

    // Check if we're in demo mode
    const isDemoMode = isDemoModeForRoute

    // If in demo mode, return data from our static JSON file instead of calling Spotify
    if (isDemoMode) {
      // Find the matching artist in our demo data
      const demoArtist = demoArtists.artists.find((artist) => artist.id === artistId)

      // If found, return it
      if (demoArtist) {
        return NextResponse.json(demoArtist)
      }

      // If the requested artist is not in our demo data, return 404
      return NextResponse.json({ error: `Artist not found in demo data: ${artistId}`, status: 404 }, { status: 404 })
    }

    // If not in demo mode, proceed with real Spotify API call
    // Get the base URL from the request to create an absolute URL that works in both environments
    const requestUrl = new URL(req.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`

    try {
      // Fetch access token from our own API using an absolute URL constructed from the request
      const tokenRes = await fetch(`${baseUrl}/api/spotify-token`, {
        cache: "no-store", // Don't cache the token request
      })

      if (!tokenRes.ok) {
        const tokenError = await tokenRes.text()
        console.error(`Failed to get Spotify token: ${tokenRes.status}`, tokenError)
        return NextResponse.json({ error: "Failed to get Spotify token", status: tokenRes.status }, { status: 500 })
      }

      const tokenData = await tokenRes.json()
      const accessToken = tokenData.access_token

      if (!accessToken) {
        console.error("No access token returned from Spotify")
        return NextResponse.json({ error: "No access token" }, { status: 500 })
      }

      // Fetch artist data from Spotify
      const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!artistRes.ok) {
        const artistError = await artistRes.text().catch(() => "")

        // Special handling for 404s - likely a deleted or invalid artist ID
        if (artistRes.status === 404) {
          console.error(`Artist ID not found (404): ${artistId}`)
          return NextResponse.json({ error: `Artist ID not found: ${artistId}`, status: 404 }, { status: 404 })
        }

        console.error(`Failed to fetch artist ${artistId}: ${artistRes.status}`, artistError)
        return NextResponse.json(
          { error: `Failed to fetch artist: ${artistRes.status}`, artistId, details: artistError },
          { status: artistRes.status },
        )
      }

      const artistData = await artistRes.json()
      return NextResponse.json(artistData)
    } catch (innerError) {
      console.error(`Error processing request for artist ${artistId}:`, innerError)
      return NextResponse.json(
        {
          error: "Error processing Spotify request",
          details: innerError instanceof Error ? innerError.message : String(innerError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Fatal error in Spotify artist API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
