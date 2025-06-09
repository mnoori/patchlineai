// Test script specifically for Ice Spice to see real data
const https = require('https');

const APP_ID = 'PATCHLINE_A2F4F819';
const API_KEY = 'd8e39c775adc8797';
const BASE_URL = 'customer.api.soundcharts.com';

async function testIceSpice() {
  console.log('🧊 Testing Ice Spice data...\n');
  
  try {
    // Search for Ice Spice
    const searchResult = await makeRequest('/api/v2/artist/search/ice%20spice?limit=1');
    console.log('✅ Search successful');
    console.log('📊 Quota remaining:', searchResult.quotaRemaining);
    
    if (searchResult.items && searchResult.items.length > 0) {
      const artist = searchResult.items[0];
      console.log('\n🎤 Artist Data:');
      console.log(JSON.stringify(artist, null, 2));
      
      // Try to get more details
      try {
        const artistDetails = await makeRequest(`/api/v2.9/artist/${artist.uuid}`);
        console.log('\n📋 Detailed Artist Data:');
        console.log(JSON.stringify(artistDetails.object, null, 2));
      } catch (error) {
        console.log('\n❌ Detailed artist data failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Search failed:', error.message);
  }
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: path,
      method: 'GET',
      headers: {
        'x-app-id': APP_ID,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Add quota info to response
            jsonData.quotaRemaining = res.headers['x-quota-remaining'];
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(jsonData)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.end();
  });
}

testIceSpice().catch(console.error); 