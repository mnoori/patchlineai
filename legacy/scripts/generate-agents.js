#!/usr/bin/env node

/**
 * Agent Generator Script
 * 
 * This script is used to create/update Bedrock agents based on the configuration in agents.yaml.
 * It is designed to be idempotent, so it can be run multiple times without creating duplicate resources.
 * 
 * Usage:
 *   node scripts/generate-agents.js
 *   node scripts/generate-agents.js --agent gmail
 *   node scripts/generate-agents.js --prompt prompts/custom-gmail.md
 *   node scripts/generate-agents.js --check (verify configuration without making changes)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Set up command line arguments
const args = process.argv.slice(2);
const options = {
  agent: null,
  prompt: null,
  check: false,
  verbose: false
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--agent' || arg === '-a') {
    options.agent = args[++i];
  } else if (arg === '--prompt' || arg === '-p') {
    options.prompt = args[++i];
  } else if (arg === '--check' || arg === '-c') {
    options.check = true;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  }
}

// Main function
async function main() {
  console.log('🚀 Patchline Agent Generator');
  console.log('='.repeat(40));

  // Step 1: Read agents.yaml
  try {
    const configPath = path.join(process.cwd(), 'agents.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Parse YAML into a JavaScript object
    const config = yaml.load(configContent);
    
    console.log('✅ Successfully loaded agents.yaml');
    
    // If in check mode, just output the configuration
    if (options.check) {
      console.log('🔍 Check mode enabled - no changes will be made');
      outputAgentSummary(config);
      return;
    }
    
    // Step 2: Determine which agent(s) to process
    const agentsToProcess = options.agent 
      ? [options.agent] 
      : Object.keys(config).filter(key => 
          ['gmail', 'legal', 'supervisor'].includes(key)
        );
    
    console.log(`🤖 Processing agents: ${agentsToProcess.join(', ')}`);
    
    // Step 3: For each agent, load the prompt file
    for (const agentKey of agentsToProcess) {
      const agent = config[agentKey];
      
      if (!agent) {
        console.log(`❌ Agent "${agentKey}" not found in configuration`);
        continue;
      }
      
      console.log(`\n📝 Processing ${agent.name}:`);
      
      // Load the prompt file
      const promptPath = options.prompt || agent.prompt;
      let promptContent = '';
      
      try {
        promptContent = fs.readFileSync(path.join(process.cwd(), promptPath), 'utf8');
        console.log(`✅ Loaded prompt from ${promptPath}`);
      } catch (error) {
        console.log(`❌ Failed to load prompt from ${promptPath}`);
        console.log(`   Error: ${error}`);
        continue;
      }
      
      // TODO: Step 4: Create or update the agent in AWS Bedrock
      // This would use the AWS SDK to create/update the agent
      console.log(`🔄 Would create/update agent "${agent.name}" in AWS Bedrock`);
      console.log(`   Model: ${agent.model}`);
      console.log(`   Description: ${agent.description}`);
      
      if (agent.action_group) {
        console.log(`   Action Group: ${agent.action_group.name}`);
        console.log(`   Lambda: ${agent.action_group.lambda}`);
      }
      
      if (agent.collaborators && agent.collaborators.length > 0) {
        console.log(`   Collaborators: ${agent.collaborators.join(', ')}`);
      }
      
      // TODO: Step 5: Update local files with new agent IDs
      console.log(`🔄 Would update local files with new agent IDs`);
    }
    
    console.log('\n✅ Agent generation complete!');
    
  } catch (error) {
    console.error('❌ Error processing agents.yaml:');
    console.error(error);
    process.exit(1);
  }
}

// Helper function to output a summary of the agent configuration
function outputAgentSummary(config) {
  console.log('\n📊 Agent Configuration Summary:');
  
  for (const agentKey of ['gmail', 'legal', 'supervisor']) {
    const agent = config[agentKey];
    if (agent) {
      console.log(`\n${agent.name}:`);
      console.log(`   Description: ${agent.description}`);
      console.log(`   Model: ${agent.model}`);
      console.log(`   Prompt: ${agent.prompt}`);
      
      if (agent.action_group) {
        console.log(`   Action Group: ${agent.action_group.name}`);
        console.log(`   Lambda: ${agent.action_group.lambda}`);
      }
      
      if (agent.collaborators && agent.collaborators.length > 0) {
        console.log(`   Collaborators: ${agent.collaborators.join(', ')}`);
      }
      
      if (agent.environment) {
        console.log(`   Current Agent ID: ${agent.environment.agent_id || 'Not set'}`);
        console.log(`   Current Alias ID: ${agent.environment.agent_alias_id || 'Not set'}`);
      }
    }
  }
  
  console.log('\n🌐 Global Configuration:');
  console.log(`   AWS Region: ${config.aws_region}`);
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Idle Session TTL: ${config.idle_session_ttl} seconds`);
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:');
  console.error(error);
  process.exit(1);
}); 