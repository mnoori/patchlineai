const fetch = require('node-fetch')
require('dotenv').config({ path: '.env.local' })

// Test preferences from onboarding
const TEST_PREFERENCES = {
  genres: ['Pop', 'Hip-Hop', 'Electronic'],
  markets: ['US', 'UK'],
  careerStages: ['emerging', 'mid_level'],
  sortBy: 'monthly_listeners'
}

// Genre mapping from what users select to what Soundcharts expects
const GENRE_MAPPING = {
  'Pop': 'pop',
  'Hip-Hop': 'hip hop',
  'Electronic': 'electronic',
  'Rock': 'rock',
  'R&B': 'rnb',
  'Country': 'country',
  'Latin': 'latin',
  'Alternative': 'alternative',
  'Indie': 'indie',
  'Jazz': 'jazz',
  'Classical': 'classical',
  'Metal': 'metal',
  'Reggae': 'reggae',
  'Blues': 'blues',
  'Folk': 'folk',
  'Soul': 'soul',
  'Funk': 'funk',
  'Punk': 'punk',
  'World': 'world',
  'Gospel': 'gospel'
}

async function testSoundchartsAPI() {
  console.log('🎵 Testing Soundcharts API with user preferences...\n')
  
  const apiKey = process.env.SOUNDCHARTS_TOKEN
  const appId = process.env.SOUNDCHARTS_ID
  
  if (!apiKey || !appId) {
    console.error('❌ Missing Soundcharts credentials in environment')
    console.error('   SOUNDCHARTS_ID:', appId ? '✓' : '✗')
    console.error('   SOUNDCHARTS_TOKEN:', apiKey ? '✓' : '✗')
    return
  }

  console.log('✅ Found Soundcharts credentials')
  console.log('   App ID:', appId)
  console.log('   Token:', apiKey.substring(0, 10) + '...')
  console.log('\n📋 Test Preferences:', JSON.stringify(TEST_PREFERENCES, null, 2))
  console.log('\n')

  // Test 1: Search by genre directly
  console.log('Test 1: Direct genre search')
  console.log('==========================')
  
  for (const genre of TEST_PREFERENCES.genres) {
    try {
      const searchQuery = GENRE_MAPPING[genre] || genre.toLowerCase()
      console.log(`\n🔍 Searching for "${searchQuery}" artists...`)
      
      const response = await fetch(`https://customer.api.soundcharts.com/api/v2/artist/search/${encodeURIComponent(searchQuery)}?limit=3`, {
        headers: {
          'x-app-id': appId,
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`❌ Search failed (${response.status}): ${response.statusText}`)
        const errorText = await response.text()
        console.error('   Error details:', errorText)
        continue
      }

      const data = await response.json()
      if (data.items && data.items.length > 0) {
        console.log(`✅ Found ${data.items.length} artists:`)
        data.items.forEach((artist, idx) => {
          console.log(`   ${idx + 1}. ${artist.name} (${artist.countryCode || 'Unknown'}) - Career: ${artist.careerStage || 'Unknown'}`)
          if (artist.genres && artist.genres.length > 0) {
            console.log(`      Genres: ${artist.genres.map(g => g.root).join(', ')}`)
          }
        })
      } else {
        console.log('❌ No artists found')
      }
    } catch (error) {
      console.error(`❌ Error searching for ${genre}:`, error.message)
    }
  }

  // Test 2: Get trending artists with filters
  console.log('\n\nTest 2: Trending artists with filters')
  console.log('=====================================')

  try {
    const filters = []
    
    // Add genre filter
    if (TEST_PREFERENCES.genres.length > 0) {
      filters.push({
        type: 'genre',
        data: {
          values: TEST_PREFERENCES.genres.map(g => GENRE_MAPPING[g] || g.toLowerCase()),
          operator: 'in'
        }
      })
    }

    // Add career stage filter
    if (TEST_PREFERENCES.careerStages && TEST_PREFERENCES.careerStages.length > 0) {
      filters.push({
        type: 'careerStage',
        data: {
          values: TEST_PREFERENCES.careerStages,
          operator: 'in'
        }
      })
    }

    // Add country filter
    if (TEST_PREFERENCES.markets && TEST_PREFERENCES.markets.length > 0) {
      filters.push({
        type: 'country',
        data: {
          values: TEST_PREFERENCES.markets,
          operator: 'in'
        }
      })
    }

    const requestBody = {
      sort: {
        platform: 'spotify',
        metricType: 'monthly_listeners',
        sortBy: 'total',
        order: 'desc'
      },
      filters
    }

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://customer.api.soundcharts.com/api/v2/top/artists', {
      method: 'POST',
      headers: {
        'x-app-id': appId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Trending artists request failed (${response.status}): ${errorText}`)
    } else {
      const data = await response.json()
      console.log(`\n✅ Response received:`)
      
      if (data.items && data.items.length > 0) {
        console.log(`Found ${data.items.length} trending artists:`)
        data.items.slice(0, 5).forEach((item, idx) => {
          const artist = item.artist
          console.log(`\n${idx + 1}. ${artist.name}`)
          console.log(`   Country: ${artist.countryCode || 'Unknown'}`)
          console.log(`   Career Stage: ${artist.careerStage || 'Unknown'}`)
          if (artist.genres && artist.genres.length > 0) {
            console.log(`   Genres: ${artist.genres.map(g => g.root).join(', ')}`)
          }
          if (item.stats && item.stats.length > 0) {
            const spotifyStats = item.stats.find(s => s.platform === 'spotify')
            if (spotifyStats) {
              console.log(`   Monthly Listeners: ${spotifyStats.value?.toLocaleString() || 'N/A'}`)
            }
          }
        })
      } else {
        console.log('❌ No trending artists found with these filters')
      }
    }
  } catch (error) {
    console.error('❌ Error getting trending artists:', error.message)
  }

  // Test 3: Preferences to API call mapping
  console.log('\n\nTest 3: Preference Translation Test')
  console.log('===================================')
  
  console.log('\n🔄 Mapping user preferences to API filters:')
  console.log(`   Genres: ${TEST_PREFERENCES.genres.join(', ')} → ${TEST_PREFERENCES.genres.map(g => GENRE_MAPPING[g] || g.toLowerCase()).join(', ')}`)
  console.log(`   Markets: ${TEST_PREFERENCES.markets.join(', ')} → API country codes`)
  console.log(`   Career Stages: ${TEST_PREFERENCES.careerStages.join(', ')} → API career stage values`)
  console.log(`   Sort By: ${TEST_PREFERENCES.sortBy} → API metric type`)

  // Test 4: Fallback strategy
  console.log('\n\nTest 4: Fallback Strategy')
  console.log('========================')
  console.log('\nIf trending API fails, the app should:')
  console.log('1. Try searching for each genre individually')
  console.log('2. Combine results and remove duplicates')
  console.log('3. Show at least some artists to the user')
  
  console.log('\n🎯 Recommendations:')
  console.log('- Cache successful results for 24 hours')
  console.log('- Store user preferences in DynamoDB')
  console.log('- Track which API calls work/fail for debugging')
  console.log('- Use mock data only as last resort')
}

// Run the test
testSoundchartsAPI().catch(console.error) 