#!/usr/bin/env node

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Configuration from environment
const config = {
  AWS_REGION: process.env.REGION_AWS || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
  SUPERVISOR_AGENT_ID: 'TYQSQNB2GI',
  SUPERVISOR_AGENT_ALIAS_ID: 'BXHO9QQ40S'
};

// Initialize client
const agentRuntime = new BedrockAgentRuntimeClient({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  }
});

async function testSupervisorWithCollaboration() {
  console.log('🧪 Testing Native AWS Supervisor Agent with Collaboration Parameters');
  console.log('=' .repeat(60));
  console.log(`📍 Region: ${config.AWS_REGION}`);
  console.log(`🤖 Supervisor Agent ID: ${config.SUPERVISOR_AGENT_ID}`);
  console.log(`📋 Supervisor Alias ID: ${config.SUPERVISOR_AGENT_ALIAS_ID}`);
  
  const testQuery = "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?";
  const sessionId = `test-collab-${Date.now()}`;
  
  console.log(`\n📝 Test Query: ${testQuery}`);
  console.log(`🔑 Session ID: ${sessionId}`);
  
  try {
    console.log('\n🚀 Invoking Supervisor Agent with collaboration parameters...\n');
    
    const command = new InvokeAgentCommand({
      agentId: config.SUPERVISOR_AGENT_ID,
      agentAliasId: config.SUPERVISOR_AGENT_ALIAS_ID,
      sessionId: sessionId,
      inputText: testQuery,
      enableTrace: true,
      sessionState: {
        sessionAttributes: {
          'mode': 'collaboration',
          'enableCollaboration': 'true',
          'userId': 'test-user-123'
        }
      }
    });
    
    const response = await agentRuntime.send(command);
    
    let fullResponse = '';
    let traces = [];
    let collaborationsDetected = [];
    
    // Process streaming response
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes);
          fullResponse += text;
        }
        
        if (event.trace) {
          traces.push(event.trace);
          
          // Look for collaboration traces
          if (event.trace.trace?.orchestrationTrace) {
            const orchTrace = event.trace.trace.orchestrationTrace;
            
            // Check for agent collaborator invocation
            if (orchTrace.invocationInput?.agentCollaboratorInvocationInput) {
              const collab = orchTrace.invocationInput.agentCollaboratorInvocationInput;
              collaborationsDetected.push({
                agentName: collab.agentCollaboratorName,
                input: collab.input?.text
              });
              console.log(`🤝 Collaboration detected: ${collab.agentCollaboratorName}`);
            }
            
            // Check for rationale
            if (orchTrace.rationale?.text) {
              console.log(`💭 Rationale: ${orchTrace.rationale.text}`);
            }
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));
    console.log(`\n📋 Full Response:\n${fullResponse}`);
    console.log(`\n🔍 Traces captured: ${traces.length}`);
    console.log(`🤝 Collaborations detected: ${collaborationsDetected.length}`);
    
    if (collaborationsDetected.length > 0) {
      console.log('\n✅ SUCCESS: Agent collaboration is working!');
      collaborationsDetected.forEach((collab, i) => {
        console.log(`   ${i + 1}. ${collab.agentName}: "${collab.input?.substring(0, 50)}..."`);
      });
    } else {
      console.log('\n❌ No agent collaborations detected');
      console.log('   The supervisor is not delegating to other agents');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.$metadata) {
      console.error('   Request ID:', error.$metadata.requestId);
    }
  }
}

// Run the test
testSupervisorWithCollaboration().catch(console.error); 