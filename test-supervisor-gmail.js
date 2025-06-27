const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10';

async function testSupervisorGmail() {
  console.log('🔍 Testing Supervisor Gmail Integration...\n');

  try {
    const response = await fetch(`${API_URL}/api/chat/supervisor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'did I get an email from Tom?',
        userId: USER_ID,
        sessionId: 'test-session-' + Date.now()
      })
    });

    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('\nResponse:', JSON.stringify(data, null, 2));

    if (data.response) {
      console.log('\n✅ Got response from supervisor!');
      console.log('Message:', data.response);
    } else {
      console.log('\n❌ No response from supervisor');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupervisorGmail(); 