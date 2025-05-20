import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 })
  }

  try {
    const scRes = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`)
    if (!scRes.ok) {
      throw new Error("Failed to fetch oEmbed")
    }

    const data = await scRes.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error("SoundCloud oEmbed error", e)
    return NextResponse.json({ error: "Unable to fetch SoundCloud info" }, { status: 500 })
  }
} 