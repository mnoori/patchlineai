#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

console.log('🔍 SUPERVISOR AGENT LOCAL DEBUG')
console.log('===============================\n')

// Check environment variables
console.log('📋 Environment Variables:')
console.log(`BEDROCK_SUPERVISOR_AGENT_ID: ${process.env.BEDROCK_SUPERVISOR_AGENT_ID ? '✅ SET' : '❌ MISSING'}`)
console.log(`BEDROCK_SUPERVISOR_AGENT_ALIAS_ID: ${process.env.BEDROCK_SUPERVISOR_AGENT_ALIAS_ID ? '✅ SET' : '❌ MISSING'}`)
console.log(`AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`)
console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ MISSING'}`)
console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ MISSING'}`)

// Show actual values (first few chars only for security)
if (process.env.BEDROCK_SUPERVISOR_AGENT_ID) {
  console.log(`\nSupervisor Agent ID: ${process.env.BEDROCK_SUPERVISOR_AGENT_ID}`)
}
if (process.env.BEDROCK_SUPERVISOR_AGENT_ALIAS_ID) {
  console.log(`Supervisor Agent Alias: ${process.env.BEDROCK_SUPERVISOR_AGENT_ALIAS_ID}`)
}

console.log('\n🔧 Configuration Check:')
// Import your config
try {
  const { SUPERVISOR_AGENT, CONFIG } = require('./lib/config.ts')
  console.log(`Config SUPERVISOR_AGENT ID: ${SUPERVISOR_AGENT.agentId}`)
  console.log(`Config SUPERVISOR_AGENT Alias: ${SUPERVISOR_AGENT.agentAliasId}`)
} catch (error) {
  console.log('❌ Error loading config:', error.message)
}

console.log('\n🎯 Test API Call:')
console.log('Run this command to test the supervisor agent:')
console.log(`
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?",
    "userId": "test-user-123",
    "mode": "agent",
    "agentType": "SUPERVISOR_AGENT"
  }'
`)

console.log('\n📝 Next Steps:')
console.log('1. Run: node debug-supervisor-local.js')
console.log('2. Check if all environment variables are properly set')
console.log('3. Start your dev server: npm run dev')
console.log('4. Test the supervisor agent with the curl command above')
console.log('5. Check the server logs for delegation traces') 