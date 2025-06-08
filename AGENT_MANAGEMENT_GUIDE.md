# Bedrock Agent Management Guide

## Problem Summary

We discovered that Bedrock agents were getting the wrong instructions during deployment. Specifically:
- The Blockchain Agent had Supervisor Agent instructions
- This caused routing issues where blockchain commands went to Gmail agent
- Manual updates in AWS console were not persistent

## Root Cause

When deploying agents through AWS console or CLI without proper automation:
1. Instructions can be copy-pasted incorrectly
2. No validation that the right prompt matches the right agent
3. No version control or audit trail
4. Collaborations need manual setup
5. **The create-bedrock-agent.py script uses PATCHLINE_AGENT_TYPE environment variable**
6. **If this env var isn't set correctly, all agents get created with the same instructions**
7. **Bug in create-bedrock-agent.py**: The script only checked for 'GmailActions' and 'ContractAnalysis'
8. **Blockchain ('BlockchainActions') and Scout ('ScoutActions') fell through to supervisor instructions**
9. **Lambda function mapping was also incomplete, only handling Gmail and Legal agents**

## Immediate Fix - Recreate All Agents

### Windows (PowerShell):
```powershell
# Run from project root
.\scripts\fix-agents.ps1
```

### Mac/Linux:
```bash
# Run from project root
chmod +x scripts/fix-agents.sh
./scripts/fix-agents.sh
```

This will:
1. Delete existing agents (with confirmation)
2. Recreate each agent with correct PATCHLINE_AGENT_TYPE set
3. Output new agent IDs to update in .env.local

### Manual Steps After Script:
1. Update .env.local with new agent IDs
2. In AWS Console, add collaborators to Supervisor agent:
   - Gmail Agent
   - Legal Agent
   - Scout Agent
   - Blockchain Agent

## Solution: Programmatic Agent Management

### 1. Install Dependencies

```bash
pnpm add @aws-sdk/client-bedrock-agent
```

### 2. Set Environment Variables

Add to `.env.local`:
```env
# Agent Role ARN (required for all agents)
BEDROCK_AGENT_ROLE_ARN=arn:aws:iam::366218382497:role/amplify

# AWS Account ID (for collaborations)
AWS_ACCOUNT_ID=366218382497

# Agent IDs (will be populated after creation)
BEDROCK_GMAIL_AGENT_ID=C7VZ0QWDSG
BEDROCK_GMAIL_AGENT_ALIAS_ID=WDGFWL1YCB

BEDROCK_LEGAL_AGENT_ID=XL4F5TPHXB
BEDROCK_LEGAL_AGENT_ALIAS_ID=EC7EVTWEUQ

BEDROCK_BLOCKCHAIN_AGENT_ID=TEH8TAXFHN
BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID=WUWJSMHQ8G

BEDROCK_SUPERVISOR_AGENT_ID=TYQSQNB2GI
BEDROCK_SUPERVISOR_AGENT_ALIAS_ID=BXHO9QQ40S

# Scout agent (TBD)
BEDROCK_SCOUT_AGENT_ID=TBD
BEDROCK_SCOUT_AGENT_ALIAS_ID=TBD
```

### 3. Use the Management Script

#### Validate Current Agents
Check if agents have correct instructions:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts validate TEH8TAXFHN
```

#### Fix All Agents
Sync all agents with their correct prompt files:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts sync
```

#### Update Single Agent
Update just the blockchain agent:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts update BLOCKCHAIN_AGENT TEH8TAXFHN
```

#### Create New Agent
Create the Scout agent:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts create SCOUT_AGENT
```

#### Setup Collaborations
After all agents are created, setup supervisor collaborations:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts setup-collaborations TYQSQNB2GI
```

## Workflow for Agent Updates

### 1. Update Prompt File
Edit the prompt in `prompts/<agent-name>.md`

### 2. Sync to AWS
```bash
pnpm tsx scripts/manage-bedrock-agents.ts sync
```

### 3. Test
Test the agent through the chat interface

## Best Practices

1. **Never manually edit agents in AWS Console** - Always use the script
2. **Version control prompts** - All prompts are in `prompts/` directory
3. **Test after updates** - Use the validate command to verify
4. **Document changes** - Update this guide with any new procedures

## Troubleshooting

### Agent has wrong instructions
1. Run `validate` to confirm
2. Run `update` to fix
3. Wait 1-2 minutes for AWS to propagate changes

### Agent not responding correctly
1. Check agent status in AWS console
2. Ensure agent is "PREPARED" not "DRAFT"
3. Check Lambda function logs for errors

### Collaboration not working
1. Ensure all agents have aliases created
2. Run `setup-collaborations` command
3. Check supervisor agent configuration in AWS

## Emergency Recovery

If everything is broken:

1. List all agents:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts list
```

2. Delete corrupted agents:
```bash
pnpm tsx scripts/manage-bedrock-agents.ts delete <agent-id>
```

3. Recreate from scratch:
```bash
# Create all agents
pnpm tsx scripts/manage-bedrock-agents.ts create GMAIL_AGENT
pnpm tsx scripts/manage-bedrock-agents.ts create LEGAL_AGENT
pnpm tsx scripts/manage-bedrock-agents.ts create BLOCKCHAIN_AGENT
pnpm tsx scripts/manage-bedrock-agents.ts create SCOUT_AGENT
pnpm tsx scripts/manage-bedrock-agents.ts create SUPERVISOR_AGENT

# Update .env.local with new IDs
# Then setup collaborations
pnpm tsx scripts/manage-bedrock-agents.ts setup-collaborations <supervisor-id>
```

## Next Steps

1. Run `sync` command to fix current agents
2. Test blockchain agent with payment command
3. Verify Phantom wallet integration works
4. Document any additional issues 