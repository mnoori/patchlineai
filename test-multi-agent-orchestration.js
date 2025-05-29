#!/usr/bin/env node

const http = require('http');

function makeRequest(data, path = '/api/chat/multi-agent') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
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

async function testMultiAgentOrchestration() {
  console.log('🧪 Testing Multi-Agent Orchestration\n');
  console.log('This directly coordinates Gmail and Legal agents without the Supervisor\n');
  
  const testQuery = "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?";
  
  const payload = {
    message: testQuery,
    userId: "test-user-123"
  };

  try {
    console.log('📤 Sending multi-agent request...');
    console.log(`Query: ${testQuery}\n`);
    
    const response = await makeRequest(payload);
    
    console.log(`📥 Response Status: ${response.status}`);
    
    if (response.data) {
      console.log(`\n🔍 Workflow Used: ${response.data.workflow || 'unknown'}`);
      console.log(`🤖 Agents Used: ${response.data.agentsUsed ? response.data.agentsUsed.join(', ') : 'none'}`);
      
      if (response.data.response) {
        console.log('\n📋 Response:');
        console.log('='*60);
        console.log(response.data.response);
        console.log('='*60);
        
        // Check if actual delegation happened
        if (response.data.agentsUsed && response.data.agentsUsed.length > 1) {
          console.log('\n✅ SUCCESS: Multi-agent coordination worked!');
          console.log('   - Gmail Agent searched for emails');
          console.log('   - Legal Agent analyzed the contract');
        } else if (response.data.agentsUsed && response.data.agentsUsed.length === 1) {
          console.log('\n⚠️  Only one agent was used. Contract might not have been found.');
        }
      }
      
      if (response.data.error) {
        console.log('\n❌ Error:', response.data.error);
        console.log('Details:', response.data.details);
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. Your dev server is running (npm run dev)');
    console.log('   2. The new route is created at app/api/chat/multi-agent/route.ts');
    console.log('   3. AWS credentials are properly configured');
  }
}

// Run the test
console.log('🚀 Multi-Agent Orchestration Test');
console.log('='*50);
console.log('This bypasses the Supervisor Agent and directly');
console.log('orchestrates Gmail and Legal agents in sequence.');
console.log('='*50 + '\n');

testMultiAgentOrchestration(); 