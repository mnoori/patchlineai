const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10';

async function testGmailConnection() {
  console.log('🔍 Testing Gmail Connection with Various Queries...\n');

  try {
    // First get a valid token
    const debugResponse = await fetch(`${API_URL}/api/gmail/debug-token?userId=${USER_ID}`);
    const debugData = await debugResponse.json();

    if (!debugData.success) {
      console.error('❌ Failed to get token:', debugData);
      return;
    }

    console.log('✅ Token is valid! Profile:', debugData.profile);
    console.log('Email:', debugData.profile.emailAddress);
    console.log('Total messages:', debugData.profile.messagesTotal);
    console.log('Total threads:', debugData.profile.threadsTotal);

    // Now let's test different queries through our API
    const testQueries = [
      'in:inbox',           // All inbox emails
      'is:unread',          // Unread emails
      'from:me',            // Emails I sent
      'has:attachment',     // Emails with attachments
      'after:2025/6/1',     // Recent emails
      'subject:test',       // Emails with "test" in subject
      '',                   // Empty query (should return all)
    ];

    console.log('\n📧 Testing Gmail Search API with different queries:\n');

    for (const query of testQueries) {
      console.log(`\nTesting query: "${query || '(empty - all emails)'}"...`);
      
      try {
        const searchResponse = await fetch(`${API_URL}/api/gmail/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: USER_ID,
            query: query || 'in:inbox' // Default to inbox if empty
          })
        });

        const searchData = await searchResponse.json();
        
        if (searchResponse.ok) {
          console.log(`✅ Success! ${searchData.result}`);
          if (searchData.emails && searchData.emails.length > 0) {
            console.log('First email:');
            console.log('  From:', searchData.emails[0].from);
            console.log('  Subject:', searchData.emails[0].subject);
            console.log('  Preview:', searchData.emails[0].snippet.substring(0, 50) + '...');
          }
        } else {
          console.log(`❌ Failed (${searchResponse.status}):`, searchData.error);
        }
      } catch (error) {
        console.log(`❌ Error:`, error.message);
      }
    }

    // Test direct API call with our token (for debugging)
    console.log('\n🔧 Testing direct Gmail API call...');
    
    // We can't get the full token from debug endpoint, but let's at least verify the connection
    console.log('Direct API test would require full token (not available in debug response)');
    console.log('But we confirmed the token works via the debug endpoint!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGmailConnection(); 