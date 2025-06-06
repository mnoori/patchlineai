// Simple test script to verify Soundcharts API connection
// Run with: node test-soundcharts.js

const https = require('https');

// Your production credentials
const APP_ID = 'PATCHLINE_A2F4F819';
const API_KEY = 'd8e39c775adc8797';
const BASE_URL = 'customer.api.soundcharts.com';

// Test function
async function testSoundchartsAPI() {
  console.log('🎵 Testing Soundcharts API Connection...\n');
  
  // Test 1: Simple artist search
  console.log('Test 1: Artist Search');
  try {
    const searchResult = await makeRequest('/api/v2/artist/search/taylor%20swift?limit=1');
    console.log('✅ Artist search successful');
    console.log('Response:', JSON.stringify(searchResult, null, 2));
    
    if (searchResult.items && searchResult.items.length > 0) {
      const artist = searchResult.items[0];
      console.log(`Found artist: ${artist.name} (UUID: ${artist.uuid})`);
      
      // Test 2: Get artist metadata
      console.log('\nTest 2: Artist Metadata');
      try {
        const artistData = await makeRequest(`/api/v2.9/artist/${artist.uuid}`);
        console.log('✅ Artist metadata successful');
        console.log('Artist details:', JSON.stringify(artistData.object, null, 2));
        
        // Test 3: Get artist stats (this might fail with 403 if not in plan)
        console.log('\nTest 3: Artist Stats');
        try {
          const statsData = await makeRequest(`/api/v2/artist/${artist.uuid}/current/stats`);
          console.log('✅ Artist stats successful');
          console.log('Stats:', JSON.stringify(statsData, null, 2));
        } catch (error) {
          console.log('⚠️  Artist stats failed (might not be in plan):', error.message);
        }
        
      } catch (error) {
        console.log('❌ Artist metadata failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Artist search failed:', error.message);
  }
  
  console.log('\n🏁 Test completed');
}

// Helper function to make API requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'x-app-id': APP_ID,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Patchline-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      // Log quota remaining
      const quotaRemaining = res.headers['x-quota-remaining'];
      if (quotaRemaining) {
        console.log(`📊 Quota remaining: ${quotaRemaining}`);
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(jsonData)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}, Data: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.end();
  });
}

// Run the test
testSoundchartsAPI().catch(console.error); 