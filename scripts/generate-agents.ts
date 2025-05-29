#!/usr/bin/env ts-node

/**
 * Agent Generator Script
 * 
 * This script is used to create/update Bedrock agents based on the configuration in agents.yaml.
 * It is designed to be idempotent, so it can be run multiple times without creating duplicate resources.
 * 
 * Usage:
 *   npm run generate-agents
 *   npm run generate-agents -- --agent gmail
 *   npm run generate-agents -- --prompt prompts/custom-gmail.md
 *   npm run generate-agents -- --check (verify configuration without making changes)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Command } from 'commander';
import chalk from 'chalk';

// Define interfaces for our YAML configuration
interface ActionGroup {
  name: string;
  lambda: string;
}

interface AgentConfig {
  name: string;
  description: string;
  model: string;
  prompt: string;
  action_group?: ActionGroup;
  knowledge_base?: string;
  collaborators?: string[];
  environment?: Record<string, string>;
}

interface AgentsConfig {
  gmail: AgentConfig;
  legal: AgentConfig;
  supervisor: AgentConfig;
  default_agent: string;
  aws_region: string;
  environment: string;
  idle_session_ttl: number;
}

// Set up command line arguments
const program = new Command();
program
  .option('-a, --agent <agent>', 'Specific agent to generate/update')
  .option('-p, --prompt <path>', 'Custom prompt file path')
  .option('-c, --check', 'Check configuration without making changes')
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

const options = program.opts();

// Main function
async function main() {
  console.log(chalk.blue('🚀 Patchline Agent Generator'));
  console.log(chalk.blue('=' .repeat(40)));

  // Step 1: Read agents.yaml
  try {
    const configPath = path.join(process.cwd(), 'agents.yaml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Parse YAML into a JavaScript object
    const config = yaml.load(configContent) as AgentsConfig;
    
    console.log(chalk.green('✅ Successfully loaded agents.yaml'));
    
    // If in check mode, just output the configuration
    if (options.check) {
      console.log(chalk.yellow('🔍 Check mode enabled - no changes will be made'));
      outputAgentSummary(config);
      return;
    }
    
    // Step 2: Determine which agent(s) to process
    const agentsToProcess = options.agent 
      ? [options.agent] 
      : Object.keys(config).filter(key => 
          ['gmail', 'legal', 'supervisor'].includes(key)
        );
    
    console.log(chalk.blue(`🤖 Processing agents: ${agentsToProcess.join(', ')}`));
    
    // Step 3: For each agent, load the prompt file
    for (const agentKey of agentsToProcess) {
      const agent = config[agentKey as keyof AgentsConfig] as AgentConfig;
      
      if (!agent) {
        console.log(chalk.red(`❌ Agent "${agentKey}" not found in configuration`));
        continue;
      }
      
      console.log(chalk.yellow(`\n📝 Processing ${agent.name}:`));
      
      // Load the prompt file
      const promptPath = options.prompt || agent.prompt;
      let promptContent = '';
      
      try {
        promptContent = fs.readFileSync(path.join(process.cwd(), promptPath), 'utf8');
        console.log(chalk.green(`✅ Loaded prompt from ${promptPath}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to load prompt from ${promptPath}`));
        console.log(chalk.red(`   Error: ${error}`));
        continue;
      }
      
      // TODO: Step 4: Create or update the agent in AWS Bedrock
      // This would use the AWS SDK to create/update the agent
      console.log(chalk.blue(`🔄 Would create/update agent "${agent.name}" in AWS Bedrock`));
      console.log(chalk.blue(`   Model: ${agent.model}`));
      console.log(chalk.blue(`   Description: ${agent.description}`));
      
      if (agent.action_group) {
        console.log(chalk.blue(`   Action Group: ${agent.action_group.name}`));
        console.log(chalk.blue(`   Lambda: ${agent.action_group.lambda}`));
      }
      
      if (agent.collaborators && agent.collaborators.length > 0) {
        console.log(chalk.blue(`   Collaborators: ${agent.collaborators.join(', ')}`));
      }
      
      // TODO: Step 5: Update local files with new agent IDs
      console.log(chalk.blue(`🔄 Would update local files with new agent IDs`));
    }
    
    console.log(chalk.green('\n✅ Agent generation complete!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error processing agents.yaml:'));
    console.error(error);
    process.exit(1);
  }
}

// Helper function to output a summary of the agent configuration
function outputAgentSummary(config: AgentsConfig) {
  console.log(chalk.yellow('\n📊 Agent Configuration Summary:'));
  
  for (const agentKey of ['gmail', 'legal', 'supervisor']) {
    const agent = config[agentKey as keyof AgentsConfig] as AgentConfig;
    if (agent) {
      console.log(chalk.blue(`\n${agent.name}:`));
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
  
  console.log(chalk.yellow('\n🌐 Global Configuration:'));
  console.log(`   AWS Region: ${config.aws_region}`);
  console.log(`   Environment: ${config.environment}`);
  console.log(`   Idle Session TTL: ${config.idle_session_ttl} seconds`);
}

// Run the main function
main().catch(error => {
  console.error(chalk.red('❌ Unhandled error:'));
  console.error(error);
  process.exit(1);
}); 