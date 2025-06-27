const { BedrockAgentClient, ListAgentsCommand, ListAgentAliasesCommand } = require('@aws-sdk/client-bedrock-agent');

async function checkBedrockAgents() {
  console.log('🔍 Checking Bedrock Agents in AWS...\n');
  
  const client = new BedrockAgentClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
    }
  });

  try {
    // List all agents
    const listCommand = new ListAgentsCommand({});
    const response = await client.send(listCommand);
    
    if (!response.agentSummaries || response.agentSummaries.length === 0) {
      console.log('❌ No Bedrock agents found in this account/region');
      return;
    }
    
    console.log(`✅ Found ${response.agentSummaries.length} agents:\n`);
    
    // Check each agent and its aliases
    for (const agent of response.agentSummaries) {
      console.log(`📦 Agent: ${agent.agentName}`);
      console.log(`   ID: ${agent.agentId}`);
      console.log(`   Status: ${agent.agentStatus}`);
      console.log(`   Updated: ${agent.updatedAt}`);
      
      // Get aliases for this agent
      try {
        const aliasCommand = new ListAgentAliasesCommand({
          agentId: agent.agentId
        });
        const aliasResponse = await client.send(aliasCommand);
        
        if (aliasResponse.agentAliasSummaries && aliasResponse.agentAliasSummaries.length > 0) {
          console.log('   Aliases:');
          for (const alias of aliasResponse.agentAliasSummaries) {
            console.log(`   - ${alias.agentAliasName}: ${alias.agentAliasId} (${alias.agentAliasStatus})`);
          }
        } else {
          console.log('   Aliases: None');
        }
      } catch (aliasError) {
        console.log('   Aliases: Error fetching aliases');
      }
      
      console.log('');
    }
    
    // Check environment variables
    console.log('\n📋 Current Environment Variables:');
    console.log(`BEDROCK_AGENT_ID: ${process.env.BEDROCK_AGENT_ID || 'Not set'}`);
    console.log(`BEDROCK_AGENT_ALIAS_ID: ${process.env.BEDROCK_AGENT_ALIAS_ID || 'Not set'}`);
    console.log(`BEDROCK_GMAIL_AGENT_ID: ${process.env.BEDROCK_GMAIL_AGENT_ID || 'Not set'}`);
    console.log(`BEDROCK_GMAIL_AGENT_ALIAS_ID: ${process.env.BEDROCK_GMAIL_AGENT_ALIAS_ID || 'Not set'}`);
    console.log(`BEDROCK_LEGAL_AGENT_ID: ${process.env.BEDROCK_LEGAL_AGENT_ID || 'Not set'}`);
    console.log(`BEDROCK_LEGAL_AGENT_ALIAS_ID: ${process.env.BEDROCK_LEGAL_AGENT_ALIAS_ID || 'Not set'}`);
    console.log(`BEDROCK_SUPERVISOR_AGENT_ID: ${process.env.BEDROCK_SUPERVISOR_AGENT_ID || 'Not set'}`);
    console.log(`BEDROCK_SUPERVISOR_AGENT_ALIAS_ID: ${process.env.BEDROCK_SUPERVISOR_AGENT_ALIAS_ID || 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Error checking agents:', error.message);
    if (error.name === 'CredentialsProviderError') {
      console.error('   Please ensure AWS credentials are configured');
    }
  }
}

// Run the check
checkBedrockAgents(); 