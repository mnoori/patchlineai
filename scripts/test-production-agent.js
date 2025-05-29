#!/usr/bin/env node

/**
 * Test script for production agent functionality
 * Usage: node scripts/test-production-agent.js
 */

const https = require('https');

const PRODUCTION_URL = 'https://www.patchline.ai';
const DEBUG_TOKEN = 'patchline-debug-2025';

// Test user ID (you'll need to replace this with a real user ID)
const TEST_USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10';

console.log('🧪 Testing Patchline Production Agent...\n');

// Step 1: Check environment variables
console.log('📋 Step 1: Checking environment variables...');
const checkEnv = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.patchline.ai',
      path: '/api/debug/env',
      method: 'GET',
      headers: {
        'x-debug-token': DEBUG_TOKEN
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Environment check response:');
          console.log(JSON.stringify(result, null, 2));
          
          // Check critical variables
          if (result.bedrock?.agent_id === 'missing' || result.bedrock?.agent_alias_id === 'missing') {
            console.error('❌ Critical error: Bedrock Agent variables are missing!');
            console.error('   - BEDROCK_AGENT_ID:', result.bedrock?.agent_id);
            console.error('   - BEDROCK_AGENT_ALIAS_ID:', result.bedrock?.agent_alias_id);
            reject(new Error('Missing Bedrock Agent configuration'));
          } else {
            console.log('✅ Bedrock Agent configured correctly');
            console.log('   - Agent ID:', result.debug_values?.agent_id);
            console.log('   - Alias ID:', result.debug_values?.agent_alias_id);
            resolve(result);
          }
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          console.error('Response:', data);
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// Step 2: Test agent chat
console.log('\n📋 Step 2: Testing agent chat functionality...');
const testAgentChat = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: 'Test message: Can you help me check my emails?',
      userId: TEST_USER_ID,
      mode: 'agent'
    });

    const options = {
      hostname: 'www.patchline.ai',
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Agent chat successful!');
            console.log('   - Response length:', result.response?.length || 0);
            console.log('   - Has email context:', result.hasEmailContext || false);
            console.log('   - Actions invoked:', result.actionsInvoked?.join(', ') || 'none');
            console.log('   - Session ID:', result.sessionId);
            resolve(result);
          } else {
            console.error('❌ Agent chat failed with status:', res.statusCode);
            console.error('   - Error:', result.error);
            console.error('   - Details:', result.details);
            reject(new Error(`Agent chat failed: ${result.error}`));
          }
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          console.error('Response:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    await checkEnv();
    await testAgentChat();
    
    console.log('\n✅ All tests passed! Agent is working in production.');
    
    console.log('\n📝 Next steps:');
    console.log('1. Check the logs in AWS CloudWatch for detailed agent activity');
    console.log('2. Test the agent in the actual web interface at', PRODUCTION_URL);
    console.log('3. Monitor the agent activity logs in the UI');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify environment variables in AWS Amplify console');
    console.log('2. Check that Lambda functions are deployed and accessible');
    console.log('3. Verify IAM permissions for the agent role');
    console.log('4. Check CloudWatch logs for more details');
  }
}

// Run the tests
runTests(); 