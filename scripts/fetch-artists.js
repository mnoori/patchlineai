const fs = require("fs")
const path = require("path")

const ARTIST_IDS = [
  "7wU1naftD3lNq7rNsiDvOR",
  "2S9EJm8U2xlkwphPqUkDW4",
  "6MzHMxgYcbj6ue5w9pbNp9",
  "4xf4u86Lsh1D8rIJxeuV7b",
  "4nuR5cGAyxV1jlRROlerJt",
  "3kI19T2Y7mzINNIOGHTg5P",
]

const CLIENT_ID = "1c3ef44bdb494a4c90c591f56fd4bc37"
const CLIENT_SECRET = "776872529edd4a79b615ac4c32eca36e"

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

async function fetchArtist(id, token, attempt = 1) {
  const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 429) {
    const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "1", 10)
    console.warn(`Rate limited on artist ${id}. Waiting ${retryAfter} seconds before retrying (attempt ${attempt})...`)
    await sleep(retryAfter * 1000)
    return fetchArtist(id, token, attempt + 1)
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch artist ${id}: ${response.status}`)
  }

  return response.json()
}

async function main() {
  try {
    console.log("Getting access token...")
    const token = await getAccessToken()

    console.log("Fetching artist data...")
    const artists = []
    for (const id of ARTIST_IDS) {
      console.log(`Fetching artist ${id}...`)
      const data = await fetchArtist(id, token)
      artists.push(data)
      // Wait 1 second between requests to respect rate limits
      await sleep(1000)
    }

    const output = { artists }
    const outputPath = path.join(process.cwd(), "data", "demo-artists.json")
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))

    console.log("Successfully saved artist data to:", outputPath)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

main()
