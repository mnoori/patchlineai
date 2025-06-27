const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10';

async function testGmailDirect() {
  console.log('🔍 Testing Gmail API Directly...\n');

  try {
    // First get the token
    const debugResponse = await fetch(`${API_URL}/api/gmail/debug-token?userId=${USER_ID}`);
    const debugData = await debugResponse.json();

    if (!debugData.success) {
      console.error('❌ Failed to get token:', debugData);
      return;
    }

    console.log('✅ Got valid token');
    console.log('Token preview:', debugData.debug.tokenPreview);

    // Extract the actual token from the preview (this is just for testing)
    // In real implementation, we'd get this from OAuth2Client
    const accessToken = debugData.debug.tokenPreview.replace('...', '');

    // Now test the Gmail search directly
    console.log('\n🔍 Testing Gmail search with query: "from:Tom"');
    
    const searchResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:Tom&maxResults=5',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    const searchData = await searchResponse.json();

    console.log('\nSearch Response Status:', searchResponse.status);
    console.log('Search Results:', JSON.stringify(searchData, null, 2));

    if (searchResponse.ok) {
      console.log('\n✅ Gmail search successful!');
      if (searchData.messages && searchData.messages.length > 0) {
        console.log(`Found ${searchData.messages.length} messages from Tom`);
      } else {
        console.log('No messages from Tom found');
      }
    } else {
      console.log('\n❌ Gmail search failed');
    }

    // Now test through our API
    console.log('\n🔍 Testing through our search API...');
    
    const apiResponse = await fetch(`${API_URL}/api/gmail/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: USER_ID,
        query: 'from:Tom'
      })
    });

    const apiData = await apiResponse.json();
    
    console.log('\nAPI Response Status:', apiResponse.status);
    console.log('API Response:', JSON.stringify(apiData, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGmailDirect(); 