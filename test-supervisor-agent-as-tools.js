#!/usr/bin/env node

const http = require('http');

function makeRequest(data, path = '/api/chat/supervisor') {
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

async function testSupervisorAgentAsTools() {
  console.log('🧪 Testing SupervisorAgent with Agent-as-Tools Pattern\n');
  console.log('This implements the Agent Squad pattern where Gmail and Legal');
  console.log('agents are exposed as tools to the supervisor.\n');
  
  const testQuery = "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?";
  
  const sessionId = `test-session-${Date.now()}`;
  const payload = {
    message: testQuery,
    userId: "test-user-123",
    sessionId: sessionId
  };

  try {
    console.log('📤 Sending request to SupervisorAgent...');
    console.log(`Query: ${testQuery}`);
    console.log(`Session: ${sessionId}\n`);
    
    const response = await makeRequest(payload);
    
    console.log(`📥 Response Status: ${response.status}`);
    
    if (response.data) {
      console.log(`\n🔍 Workflow: ${response.data.workflow || 'unknown'}`);
      console.log(`🤖 Agents Used: ${response.data.agentsUsed ? response.data.agentsUsed.join(', ') : 'none'}`);
      
      if (response.data.memorySnapshot) {
        console.log('\n📊 Memory Snapshot:');
        console.log(`   Total Interactions: ${response.data.memorySnapshot.totalInteractions}`);
        response.data.memorySnapshot.agentInteractions.forEach(interaction => {
          console.log(`   ${interaction.agent}: ${interaction.messageCount} messages`);
        });
      }
      
      if (response.data.response) {
        console.log('\n📋 Response:');
        console.log('='*60);
        console.log(response.data.response);
        console.log('='*60);
        
        // Check if actual delegation happened
        if (response.data.agentsUsed && response.data.agentsUsed.length > 0) {
          console.log('\n✅ SUCCESS: Agent-as-tools pattern working!');
          console.log('   Supervisor successfully delegated to:');
          response.data.agentsUsed.forEach(agent => {
            console.log(`   - ${agent}`);
          });
        } else {
          console.log('\n⚠️  No agent delegation detected');
        }
      }
      
      if (response.data.error) {
        console.log('\n❌ Error:', response.data.error);
        console.log('Details:', response.data.details);
      }
    }

    // Test session status
    console.log('\n🔍 Checking session status...');
    const statusResponse = await fetch(`http://localhost:3000/api/chat/supervisor?sessionId=${sessionId}`);
    const statusData = await statusResponse.json();
    console.log('Session Status:', JSON.stringify(statusData, null, 2));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. Your dev server is running (npm run dev)');
    console.log('   2. The SupervisorAgent is properly configured');
    console.log('   3. AWS credentials are set for both Gmail and Legal agents');
  }
}

// Run the test
console.log('🚀 SupervisorAgent Test (Agent-as-Tools Pattern)');
console.log('='*50);
console.log('Based on Agent Squad framework architecture');
console.log('Gmail and Legal agents are exposed as tools');
console.log('='*50 + '\n');

testSupervisorAgentAsTools(); 