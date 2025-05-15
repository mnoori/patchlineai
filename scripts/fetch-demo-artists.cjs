const fs = require('fs');
const path = require('path');

const ARTIST_IDS = [
  '7wU1naftD3lNq7rNsiDvOR',
  '2S9EJm8U2xlkwphPqUkDW4',
  '6MzHMxgYcbj6ue5w9pbNp9',
  '4xf4u86Lsh1D8rIJxeuV7b',
  '4nuR5cGAyxV1jlRROlerJt',
  '3kI19T2Y7mzINNIOGHTg5P'
];

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('Missing Spotify credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in environment.');
  process.exit(1);
}

async function getAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function fetchArtist(id, token) {
  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Artist fetch failed ${id}: ${res.status}`);
  }
  return res.json();
}

(async () => {
  try {
    const token = await getAccessToken();
    const artists = [];
    for (const id of ARTIST_IDS) {
      const data = await fetchArtist(id, token);
      artists.push(data);
    }
    const output = { artists };
    const outPath = path.join(__dirname, '..', 'data', 'demo-artists.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log('Demo artist data saved to', outPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
