#!/usr/bin/env tsx
/**
 * Bedrock Agent Management Script
 * 
 * This script provides a modular way to manage Bedrock agents programmatically.
 * It ensures agents are created/updated with the correct instructions and configurations.
 * 
 * Usage:
 *   pnpm tsx scripts/manage-bedrock-agents.ts <command> [options]
 * 
 * Commands:
 *   sync     - Sync all agents with their prompt files
 *   create   - Create a new agent
 *   update   - Update an existing agent
 *   delete   - Delete an agent
 *   list     - List all agents
 *   validate - Validate agent configurations
 */

import { 
  BedrockAgentClient,
  CreateAgentCommand,
  UpdateAgentCommand,
  DeleteAgentCommand,
  ListAgentsCommand,
  GetAgentCommand,
  PrepareAgentCommand,
  CreateAgentAliasCommand,
  UpdateAgentCollaboratorCommand,
  AssociateAgentCollaboratorCommand,
  type Agent,
  type AgentCollaborator
} from '@aws-sdk/client-bedrock-agent'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { CONFIG, GMAIL_AGENT, LEGAL_AGENT, BLOCKCHAIN_AGENT, SCOUT_AGENT, SUPERVISOR_AGENT } from '../lib/config'

// Agent definitions with their configurations
const AGENT_DEFINITIONS = {
  GMAIL_AGENT: {
    name: 'PatchlineGmailAgent',
    description: 'Email management and communication',
    promptFile: 'prompts/gmail-agent.md',
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboration: 'DISABLED' as const,
    actionGroups: ['GmailActions']
  },
  LEGAL_AGENT: {
    name: 'PatchlineLegalAgent', 
    description: 'Legal document analysis for music industry',
    promptFile: 'prompts/legal-agent.md',
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboration: 'DISABLED' as const,
    actionGroups: ['ContractAnalysis']
  },
  BLOCKCHAIN_AGENT: {
    name: 'PatchlineBlockchainAgent',
    description: 'Web3 AI assistant for Solana blockchain transactions and crypto payments',
    promptFile: 'prompts/blockchain-agent.md',
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboration: 'DISABLED' as const,
    actionGroups: ['BlockchainActions']
  },
  SCOUT_AGENT: {
    name: 'PatchlineScoutAgent',
    description: 'AI talent scout for discovering and analyzing promising artists',
    promptFile: 'prompts/scout-agent.md',
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboration: 'DISABLED' as const,
    actionGroups: ['ScoutActions']
  },
  SUPERVISOR_AGENT: {
    name: 'PatchlineSupervisorAgent',
    description: 'Multi-agent coordinator that orchestrates specialized agents',
    promptFile: 'prompts/supervisor-agent.md',
    foundationModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    collaboration: 'SUPERVISOR' as const,
    actionGroups: []
  }
}

// Initialize Bedrock client
const client = new BedrockAgentClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
    ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN })
  }
})

// Helper function to read prompt from file
function readPromptFile(filename: string): string {
  const filepath = join(process.cwd(), filename)
  if (!existsSync(filepath)) {
    throw new Error(`Prompt file not found: ${filepath}`)
  }
  return readFileSync(filepath, 'utf-8').trim()
}

// Helper function to get agent role ARN
function getAgentRoleArn(): string {
  const roleArn = process.env.BEDROCK_AGENT_ROLE_ARN
  if (!roleArn) {
    throw new Error('BEDROCK_AGENT_ROLE_ARN environment variable not set')
  }
  return roleArn
}

// Create a new agent
async function createAgent(agentKey: keyof typeof AGENT_DEFINITIONS) {
  const definition = AGENT_DEFINITIONS[agentKey]
  const instruction = readPromptFile(definition.promptFile)
  
  console.log(`Creating agent: ${definition.name}...`)
  
  try {
    const command = new CreateAgentCommand({
      agentName: definition.name,
      description: definition.description,
      instruction,
      foundationModel: definition.foundationModel,
      agentResourceRoleArn: getAgentRoleArn(),
      agentCollaboration: definition.collaboration,
      idleSessionTTLInSeconds: 1800, // 30 minutes
    })
    
    const response = await client.send(command)
    console.log(`✅ Created agent: ${response.agent?.agentId}`)
    
    // Store the agent ID in config
    console.log(`📝 Update your .env with:`)
    console.log(`BEDROCK_${agentKey}_ID=${response.agent?.agentId}`)
    
    return response.agent
  } catch (error) {
    console.error(`❌ Failed to create agent ${definition.name}:`, error)
    throw error
  }
}

// Update an existing agent
async function updateAgent(agentKey: keyof typeof AGENT_DEFINITIONS, agentId: string) {
  const definition = AGENT_DEFINITIONS[agentKey]
  const instruction = readPromptFile(definition.promptFile)
  
  console.log(`Updating agent: ${definition.name} (${agentId})...`)
  
  try {
    const command = new UpdateAgentCommand({
      agentId,
      agentName: definition.name,
      description: definition.description,
      instruction,
      foundationModel: definition.foundationModel,
      agentResourceRoleArn: getAgentRoleArn(),
      agentCollaboration: definition.collaboration,
      idleSessionTTLInSeconds: 1800,
    })
    
    const response = await client.send(command)
    console.log(`✅ Updated agent: ${agentId}`)
    
    // Prepare the agent after update
    await prepareAgent(agentId)
    
    return response.agent
  } catch (error) {
    console.error(`❌ Failed to update agent ${definition.name}:`, error)
    throw error
  }
}

// Prepare agent (required after create/update)
async function prepareAgent(agentId: string) {
  console.log(`Preparing agent: ${agentId}...`)
  
  try {
    const command = new PrepareAgentCommand({ agentId })
    await client.send(command)
    console.log(`✅ Agent prepared: ${agentId}`)
  } catch (error) {
    console.error(`❌ Failed to prepare agent:`, error)
    throw error
  }
}

// Create agent alias
async function createAgentAlias(agentId: string, aliasName: string = 'latest') {
  console.log(`Creating alias for agent: ${agentId}...`)
  
  try {
    const command = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: `Latest version of agent ${agentId}`
    })
    
    const response = await client.send(command)
    console.log(`✅ Created alias: ${response.agentAlias?.agentAliasId}`)
    console.log(`📝 Update your .env with the alias ID`)
    
    return response.agentAlias
  } catch (error) {
    console.error(`❌ Failed to create alias:`, error)
    throw error
  }
}

// Delete an agent
async function deleteAgent(agentId: string) {
  console.log(`Deleting agent: ${agentId}...`)
  
  try {
    const command = new DeleteAgentCommand({
      agentId,
      skipResourceInUseCheck: true
    })
    
    await client.send(command)
    console.log(`✅ Deleted agent: ${agentId}`)
  } catch (error) {
    console.error(`❌ Failed to delete agent:`, error)
    throw error
  }
}

// List all agents
async function listAgents() {
  console.log('Listing all agents...')
  
  try {
    const command = new ListAgentsCommand({})
    const response = await client.send(command)
    
    if (!response.agentSummaries || response.agentSummaries.length === 0) {
      console.log('No agents found')
      return
    }
    
    console.log('\nAgents:')
    for (const agent of response.agentSummaries) {
      console.log(`- ${agent.agentName} (${agent.agentId}) - ${agent.agentStatus}`)
      console.log(`  Description: ${agent.description}`)
      console.log(`  Updated: ${agent.updatedAt}`)
      console.log('')
    }
  } catch (error) {
    console.error('❌ Failed to list agents:', error)
    throw error
  }
}

// Validate agent configuration
async function validateAgent(agentId: string) {
  console.log(`Validating agent: ${agentId}...`)
  
  try {
    const command = new GetAgentCommand({ agentId })
    const response = await client.send(command)
    
    if (!response.agent) {
      console.log('❌ Agent not found')
      return
    }
    
    const agent = response.agent
    console.log('\nAgent Details:')
    console.log(`- Name: ${agent.agentName}`)
    console.log(`- ID: ${agent.agentId}`)
    console.log(`- Status: ${agent.agentStatus}`)
    console.log(`- Collaboration: ${agent.agentCollaboration}`)
    console.log(`- Model: ${agent.foundationModel}`)
    console.log(`- Instruction Length: ${agent.instruction?.length || 0} chars`)
    
    // Check if instruction matches any known agent
    let matchedAgent: string | null = null
    for (const [key, def] of Object.entries(AGENT_DEFINITIONS)) {
      try {
        const expectedInstruction = readPromptFile(def.promptFile)
        if (agent.instruction?.includes(expectedInstruction.substring(0, 100))) {
          matchedAgent = key
          break
        }
      } catch (error) {
        // Ignore file read errors
      }
    }
    
    if (matchedAgent) {
      console.log(`✅ Instructions match: ${matchedAgent}`)
    } else {
      console.log(`⚠️  Instructions don't match any known agent prompt`)
      console.log(`   First 200 chars: ${agent.instruction?.substring(0, 200)}...`)
    }
    
  } catch (error) {
    console.error('❌ Failed to validate agent:', error)
    throw error
  }
}

// Sync all agents with their prompt files
async function syncAllAgents() {
  console.log('Syncing all agents with their prompt files...\n')
  
  // Get current agent IDs from environment/config
  const agentMappings = {
    GMAIL_AGENT: GMAIL_AGENT.agentId,
    LEGAL_AGENT: LEGAL_AGENT.agentId,
    BLOCKCHAIN_AGENT: BLOCKCHAIN_AGENT.agentId,
    SCOUT_AGENT: SCOUT_AGENT.agentId,
    SUPERVISOR_AGENT: SUPERVISOR_AGENT.agentId,
  }
  
  for (const [agentKey, agentId] of Object.entries(agentMappings)) {
    if (!agentId || agentId === 'TBD') {
      console.log(`⏭️  Skipping ${agentKey} (no ID configured)`)
      continue
    }
    
    console.log(`\n📋 Processing ${agentKey}...`)
    
    // Validate current state
    await validateAgent(agentId)
    
    // Update with correct instructions
    try {
      await updateAgent(agentKey as keyof typeof AGENT_DEFINITIONS, agentId)
    } catch (error) {
      console.error(`Failed to update ${agentKey}`)
    }
  }
  
  console.log('\n✅ Sync complete!')
}

// Setup supervisor collaborations
async function setupSupervisorCollaborations(supervisorId: string) {
  console.log('Setting up supervisor collaborations...\n')
  
  const collaborators = [
    { key: 'GMAIL_AGENT', name: 'Gmail Agent' },
    { key: 'LEGAL_AGENT', name: 'Legal Agent' },
    { key: 'BLOCKCHAIN_AGENT', name: 'Blockchain Agent' },
    { key: 'SCOUT_AGENT', name: 'Scout Agent' },
  ]
  
  for (const collaborator of collaborators) {
    const agentConfig = collaborator.key === 'GMAIL_AGENT' ? GMAIL_AGENT :
                        collaborator.key === 'LEGAL_AGENT' ? LEGAL_AGENT :
                        collaborator.key === 'BLOCKCHAIN_AGENT' ? BLOCKCHAIN_AGENT :
                        collaborator.key === 'SCOUT_AGENT' ? SCOUT_AGENT : null
    const agentId = agentConfig?.agentId
    if (!agentId || agentId === 'TBD') {
      console.log(`⏭️  Skipping ${collaborator.name} (no ID)`)
      continue
    }
    
    try {
      // Associate collaborator
      const command = new AssociateAgentCollaboratorCommand({
        agentId: supervisorId,
        agentVersion: 'DRAFT',
        agentDescriptor: {
          aliasArn: `arn:aws:bedrock:${CONFIG.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:agent-alias/${agentId}/latest`
        },
        collaboratorName: collaborator.name,
        collaborationInstruction: `Use this agent for ${AGENT_DEFINITIONS[collaborator.key as keyof typeof AGENT_DEFINITIONS].description}`,
        relayConversationHistory: 'TO_COLLABORATOR'
      })
      
      await client.send(command)
      console.log(`✅ Added collaborator: ${collaborator.name}`)
    } catch (error) {
      console.error(`❌ Failed to add collaborator ${collaborator.name}:`, error)
    }
  }
}

// Main CLI handler
async function main() {
  const command = process.argv[2]
  const args = process.argv.slice(3)
  
  switch (command) {
    case 'sync':
      await syncAllAgents()
      break
      
    case 'create':
      if (!args[0]) {
        console.error('Usage: create <agent-key>')
        console.error('Available keys:', Object.keys(AGENT_DEFINITIONS).join(', '))
        process.exit(1)
      }
      await createAgent(args[0] as keyof typeof AGENT_DEFINITIONS)
      break
      
    case 'update':
      if (!args[0] || !args[1]) {
        console.error('Usage: update <agent-key> <agent-id>')
        process.exit(1)
      }
      await updateAgent(args[0] as keyof typeof AGENT_DEFINITIONS, args[1])
      break
      
    case 'delete':
      if (!args[0]) {
        console.error('Usage: delete <agent-id>')
        process.exit(1)
      }
      await deleteAgent(args[0])
      break
      
    case 'list':
      await listAgents()
      break
      
    case 'validate':
      if (!args[0]) {
        console.error('Usage: validate <agent-id>')
        process.exit(1)
      }
      await validateAgent(args[0])
      break
      
    case 'setup-collaborations':
      if (!args[0]) {
        console.error('Usage: setup-collaborations <supervisor-agent-id>')
        process.exit(1)
      }
      await setupSupervisorCollaborations(args[0])
      break
      
    default:
      console.log('Bedrock Agent Management Script')
      console.log('\nCommands:')
      console.log('  sync                    - Sync all agents with their prompt files')
      console.log('  create <key>            - Create a new agent')
      console.log('  update <key> <id>       - Update an existing agent')
      console.log('  delete <id>             - Delete an agent')
      console.log('  list                    - List all agents')
      console.log('  validate <id>           - Validate agent configuration')
      console.log('  setup-collaborations <id> - Setup supervisor collaborations')
      console.log('\nAgent Keys:', Object.keys(AGENT_DEFINITIONS).join(', '))
  }
}

// Run the script
main().catch(console.error) 