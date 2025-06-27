const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10';

async function testGmailDebug() {
  console.log('🔍 Testing Gmail Token Debug...\n');

  try {
    const response = await fetch(`${API_URL}/api/gmail/debug-token?userId=${USER_ID}`);
    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('\nResponse Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Gmail token is valid!');
      console.log('Profile:', data.profile);
    } else {
      console.log('\n❌ Gmail token test failed');
      if (data.error) {
        console.log('Error:', data.error);
      }
      if (data.debug) {
        console.log('\nDebug Info:', data.debug);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGmailDebug(); 