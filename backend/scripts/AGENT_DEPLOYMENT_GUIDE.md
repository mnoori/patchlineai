# Patchline Agent Deployment Guide

This guide provides a systematic approach to deploying and managing Bedrock agents for the Patchline platform.

## Overview

The Patchline multi-agent system consists of:
- **Supervisor Agent**: Coordinates between all specialist agents
- **Gmail Agent**: Handles email operations
- **Legal Agent**: Analyzes contracts and legal documents
- **Blockchain Agent**: Manages Web3 transactions and crypto payments
- **Scout Agent**: Discovers and analyzes artists using data analytics

## Deployment Process

### 1. Agent Creation

To create a new agent, use the centralized creation script:

```bash
# Set the agent type
$env:PATCHLINE_AGENT_TYPE="AGENT_NAME"

# Run the creation script
python create-bedrock-agent.py
```

**Available Agent Types:**
- `GMAIL` - Email management agent
- `LEGAL` - Legal document analysis agent
- `BLOCKCHAIN` - Web3 and crypto payment agent
- `SCOUT` - Artist discovery and analytics agent
- `SUPERVISOR` - Multi-agent coordinator

### 2. Environment Variable Management

After creating an agent, add the credentials to `.env.local`:

```bash
# Add all missing agent environment variables
python setup-all-agent-env.py
```

**Required Environment Variables:**
```
BEDROCK_GMAIL_AGENT_ID=C7VZ0QWDSG
BEDROCK_GMAIL_AGENT_ALIAS_ID=WDGFWL1YCB
BEDROCK_LEGAL_AGENT_ID=XL4F5TPHXB
BEDROCK_LEGAL_AGENT_ALIAS_ID=EC7EVTWEUQ
BEDROCK_BLOCKCHAIN_AGENT_ID=TEH8TAXFHN
BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID=WUWJSMHQ8G
BEDROCK_SCOUT_AGENT_ID=VP9OKU9YMR
BEDROCK_SCOUT_AGENT_ALIAS_ID=JVVLS2WOWF
BEDROCK_SUPERVISOR_AGENT_ID=O54YZIDANY
BEDROCK_SUPERVISOR_AGENT_ALIAS_ID=BXHO9QQ40S
```

### 3. Agent Collaboration Setup

Configure the Supervisor agent to work with all specialist agents:

```bash
# Setup all agent collaborations
python manage-agent-collaborations.py
```

This script:
- Validates all environment variables are set
- Creates collaboration relationships between Supervisor and specialist agents
- Configures detailed collaboration instructions for each agent
- Handles both new collaborations and updates to existing ones

### 4. Frontend Integration

Restart the Next.js development server to load new environment variables:

```bash
# Stop current server (Ctrl+C)
# Then restart
pnpm dev
```

## Agent Configuration Files

### Required Files for Each Agent

1. **Lambda Handler**: `backend/lambda/{agent-name}-action-handler.py`
2. **OpenAPI Schema**: `backend/lambda/{actiongroup}actions-openapi.json`
3. **Agent Prompt**: `prompts/{agent-name}-agent.md`
4. **Configuration**: Entry in `backend/scripts/config.py`

### File Naming Conventions

- Lambda handlers: `{agent-name}-action-handler.py`
- OpenAPI schemas: `{actiongroup}actions-openapi.json` (lowercase, no hyphens)
- Agent prompts: `{agent-name}-agent.md`

**Examples:**
- Scout Agent: `scout-action-handler.py`, `scoutactions-openapi.json`, `scout-agent.md`
- Blockchain Agent: `blockchain-action-handler.py`, `blockchainactions-openapi.json`, `blockchain-agent.md`

## Collaboration Instructions

Each agent has specific collaboration instructions that define:
- Primary responsibilities and capabilities
- How to handle delegated tasks
- Expected response format and quality
- Security and safety protocols (for sensitive operations)

### Current Collaborator Roles

1. **GmailCollaborator**: Email search, reading, drafting, and management
2. **LegalCollaborator**: Contract analysis, risk assessment, legal review
3. **BlockchainCollaborator**: SOL payments, wallet management, transaction security
4. **ScoutCollaborator**: Artist discovery, analytics, market insights

## Troubleshooting

### Common Issues

1. **Agent Creation Fails**
   - Check AWS credentials are properly configured
   - Verify the OpenAPI schema is valid JSON
   - Ensure Lambda function exists and is deployable

2. **Environment Variables Not Loading**
   - Restart Next.js dev server after adding variables
   - Check `.env.local` file exists in project root
   - Verify variable names match exactly (case-sensitive)

3. **Collaboration Setup Fails**
   - Ensure all agent IDs and alias IDs are correct
   - Check that agents are in "PREPARED" state
   - Verify AWS permissions for agent collaboration

### Validation Commands

```bash
# Check environment variables
python manage-agent-collaborations.py

# Validate agent configuration
python setup-all-agent-env.py

# Test agent creation (dry run)
$env:PATCHLINE_AGENT_TYPE="TEST"
python create-bedrock-agent.py
```

## Deployment Checklist

When deploying a new agent:

- [ ] Create agent configuration in `config.py`
- [ ] Write Lambda handler with proper error handling
- [ ] Create valid OpenAPI schema
- [ ] Write comprehensive agent prompt
- [ ] Deploy agent using creation script
- [ ] Add environment variables to `.env.local`
- [ ] Update collaboration configuration
- [ ] Run collaboration setup script
- [ ] Test agent functionality
- [ ] Update frontend routing (if needed)
- [ ] Document any new capabilities

## Security Considerations

- All agents validate input parameters
- Sensitive operations (payments, legal analysis) require explicit confirmation
- Transaction limits are enforced at the agent level
- All agent activities are logged for audit purposes
- Collaboration instructions include security protocols

## Monitoring and Maintenance

- Monitor agent performance through CloudWatch logs
- Regular review of collaboration instructions
- Update agent prompts based on user feedback
- Maintain environment variable documentation
- Test agent interactions after AWS updates

---

**Last Updated**: January 2025
**Version**: 1.0
**Maintainer**: Patchline Development Team 