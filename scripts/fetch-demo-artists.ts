import fs from "fs"
import path from "path"
import { getSpotifyAccessToken } from "../lib/spotify-auth"

const ARTIST_IDS = [
  "7wU1naftD3lNq7rNsiDvOR",
  "2S9EJm8U2xlkwphPqUkDW4",
  "6MzHMxgYcbj6ue5w9pbNp9",
  "4xf4u86Lsh1D8rIJxeuV7b",
  "4nuR5cGAyxV1jlRROlerJt",
  "3kI19T2Y7mzINNIOGHTg5P",
]

async function fetchArtistData(id: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch artist ${id}: ${response.statusText}`)
  }

  return response.json()
}

async function main() {
  try {
    const accessToken = await getSpotifyAccessToken()
    const artists = await Promise.all(ARTIST_IDS.map((id) => fetchArtistData(id, accessToken)))

    const demoData = {
      artists,
    }

    const outputPath = path.join(process.cwd(), "data", "demo-artists.json")
    fs.writeFileSync(outputPath, JSON.stringify(demoData, null, 2))

    console.log("Successfully fetched and saved demo artist data!")
  } catch (error) {
    console.error("Error fetching demo artist data:", error)
    process.exit(1)
  }
}

main()
