const CLIENT_ID = "1c3ef44bdb494a4c90c591f56fd4bc37"
const CLIENT_SECRET = "776872529edd4a79b615ac4c32eca36e"

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

async function testArtistsFetch(token) {
  // Using multiple popular artists
  const artistIds = [
    "06HL4z0CvFAxyc27GXpf02", // Taylor Swift
    "1uNFoZAHBGtllmzznpCI3s", // Justin Bieber
    "3HqSLMAZ3g3d5poNaI7GOU", // Adele
  ].join(",")

  const response = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  console.log("Response status:", response.status)
  console.log("Response headers:", Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    throw new Error(`Failed to fetch artists: ${response.status}`)
  }

  const data = await response.json()
  console.log("Artists data:", JSON.stringify(data, null, 2))
}

async function main() {
  try {
    console.log("Getting access token...")
    const token = await getAccessToken()
    console.log("Token received successfully")

    console.log("\nTesting artists fetch...")
    await testArtistsFetch(token)
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
