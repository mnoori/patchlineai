#!/usr/bin/env node

const https = require('https');
const http = require('http');

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testSupervisorAgent() {
  console.log('🧪 Testing Supervisor Agent...\n');
  
  const payload = {
    message: "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?",
    userId: "test-user-123",
    mode: "agent",
    agentType: "SUPERVISOR_AGENT"
  };

  try {
    console.log('📤 Sending request to Supervisor Agent...');
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    const response = await makeRequest(payload);
    
    console.log(`\n📥 Response Status: ${response.status}`);
    console.log('\n📋 Response Body:');
    console.log(JSON.stringify(response.data, null, 2));

    // Analyze the response
    if (response.data && response.data.response) {
      console.log('\n🔍 Analysis:');
      const responseText = response.data.response;
      
      if (responseText.includes('search_emails') || responseText.includes('get_email_content') || responseText.includes('analyze_contract')) {
        console.log('✅ Supervisor appears to be delegating (mentions specific functions)');
      } else if (responseText.includes('I need to access your email system') || responseText.includes('Let me search for emails')) {
        console.log('❌ Supervisor is giving generic responses instead of delegating');
      } else if (responseText.includes('GmailCollaborator') || responseText.includes('LegalCollaborator')) {
        console.log('🤔 Mentions collaborators but unclear if actually delegating');
      } else {
        console.log('🤔 Response pattern unclear - check manually');
      }
      
      console.log('\n📝 Response preview:');
      console.log(responseText.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ Error testing Supervisor Agent:', error);
    console.log('\n💡 Make sure your dev server is running: npm run dev');
  }
}

testSupervisorAgent(); 