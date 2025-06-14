# Complete Agent Collaboration Setup Guide

## Overview

This guide provides the complete, systematic approach to setting up the Patchline multi-agent collaboration system. It consolidates all the knowledge gained during our rebuild journey.

## System Architecture

```
┌─────────────────────┐
│ Supervisor Agent    │ (Orchestrator)
│ Claude 3.5 Sonnet   │
└──────────┬──────────┘
           │ Coordinates
    ┌──────┴──────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Gmail   │ │ Legal   │ │Blockchain│ │ Scout   │
│ Agent   │ │ Agent   │ │ Agent    │ │ Agent   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Complete Rebuild Process

### 1. Full Infrastructure Rebuild (2-3 minutes)

```bash
# This single command rebuilds EVERYTHING
python scripts/rebuild_everything.py --yes
```

This orchestrator script:
- ✅ Recreates all Lambda functions
- ✅ Deletes and recreates all agents
- ✅ Sets up supervisor collaboration automatically
- ✅ Updates agents.yaml and .env.local
- ✅ Provides real-time status updates

### 2. Individual Component Rebuilds

#### Lambda Functions Only
```bash
python backend/scripts/manage-lambda-functions.py --recreate --agent=all
```

#### Agents Only (with collaboration)
```bash
python scripts/rebuild_agents.py
```

## Agent Collaboration Instructions

### Supervisor Agent Collaboration Setup

The Supervisor agent requires special handling:

1. **Creation Flow**:
   - Create supervisor as DRAFT (without collaboration mode)
   - Create all specialist agents
   - Enable collaboration mode on supervisor
   - Associate all collaborators
   - Prepare supervisor
   - Create alias

2. **Collaboration Configuration**:
```python
# In rebuild_agents.py
AGENT.update_agent(
    agentId=supervisor_id,
    agentName="PatchlineSupervisorAgent",
    foundationModel="us.anthropic.claude-sonnet-4-20250514-v1:0",
    instruction=supervisor_prompt,
    agentResourceRoleArn=role_arn,
    agentCollaboration='SUPERVISOR'  # Critical: Must be 'SUPERVISOR', not 'ENABLED'
)
```

### Collaborator Association

Each specialist agent must be associated with the supervisor:

```python
def associate_collaborator(super_id, collab_id, collab_alias_id, collab_name):
    desc = {
        'aliasArn': f"arn:aws:bedrock:{REGION}:{ACCOUNT_ID}:agent-alias/{collab_id}/{collab_alias_id}"
    }
    AGENT.associate_agent_collaborator(
        agentId=super_id,
        agentVersion='DRAFT',
        agentDescriptor=desc,
        collaboratorName=collab_name,
        collaborationInstruction=f"Delegate {collab_name}-related tasks to this agent."
    )
```

## Collaboration Instructions for Each Agent

### Gmail Agent Collaboration
```markdown
COLLABORATION TRIGGERS:
- User asks about contracts or agreements in emails
- You find legal documents/attachments in email content
- Questions involve reviewing terms, conditions, or legal implications
- User specifically requests legal analysis of email content

COLLABORATION WORKFLOW:
1. Search Gmail for relevant emails
2. Read the full email content
3. Extract contract/legal text
4. Pass to LegalDocumentReview collaborator
5. Combine email context with legal analysis
6. Present comprehensive response
```

### Legal Agent Collaboration
```markdown
PRIMARY RESPONSIBILITIES:
- Analyze contracts and legal documents
- Identify risks and red flags
- Provide legal assessments
- Suggest negotiation points

COLLABORATION PROTOCOL:
- Accept document text from Gmail Agent
- Return structured legal analysis
- Highlight critical terms and concerns
- Provide actionable recommendations
```

### Blockchain Agent Collaboration
```markdown
SECURITY PROTOCOLS:
- Verify transaction amounts before processing
- Require explicit user confirmation for payments
- Validate wallet addresses
- Provide clear transaction summaries

COLLABORATION WORKFLOW:
- Accept payment requests from Supervisor
- Validate transaction parameters
- Execute blockchain operations
- Return transaction confirmations
```

### Scout Agent Collaboration
```markdown
DATA ANALYSIS CAPABILITIES:
- Artist discovery using Soundcharts API
- Market trend analysis
- Playlist placement opportunities
- Competition analysis

COLLABORATION RESPONSE FORMAT:
- Structured data with metrics
- Visual representations when applicable
- Actionable insights
- Prioritized recommendations
```

## Environment Variables

### Required for All Agents
```bash
# AWS Configuration
AWS_REGION=us-east-1
AGENT_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/amplify
LAMBDA_EXEC_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/amplify

# Agent IDs (populated by rebuild script)
BEDROCK_GMAIL_AGENT_ID=
BEDROCK_GMAIL_AGENT_ALIAS_ID=
BEDROCK_LEGAL_AGENT_ID=
BEDROCK_LEGAL_AGENT_ALIAS_ID=
BEDROCK_BLOCKCHAIN_AGENT_ID=
BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID=
BEDROCK_SCOUT_AGENT_ID=
BEDROCK_SCOUT_AGENT_ALIAS_ID=
BEDROCK_SUPERVISOR_AGENT_ID=
BEDROCK_SUPERVISOR_AGENT_ALIAS_ID=

# Default agent (supervisor)
BEDROCK_AGENT_ID=${BEDROCK_SUPERVISOR_AGENT_ID}
BEDROCK_AGENT_ALIAS_ID=${BEDROCK_SUPERVISOR_AGENT_ALIAS_ID}

# Service Credentials
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=
SOUNDCHARTS_ID=
SOUNDCHARTS_TOKEN=
```

## Troubleshooting

### Common Issues and Solutions

1. **"Supervisor agent didn't get created"**
   - Root cause: Wrong agentCollaboration value
   - Solution: Use 'SUPERVISOR' not 'ENABLED'

2. **"This agent cannot be prepared"**
   - Root cause: No collaborators added to supervisor
   - Solution: Add collaborators before preparing

3. **Unicode errors on Windows**
   - Root cause: PowerShell encoding issues
   - Solution: Remove emoji, use pure boto3 instead of AWS CLI

4. **"Missing required parameter: agentResourceRoleArn"**
   - Root cause: Missing role ARN in update_agent call
   - Solution: Fetch current role ARN before updating

5. **Soundcharts secret not created**
   - Root cause: Looking for wrong env var name
   - Solution: Use SOUNDCHARTS_ID and SOUNDCHARTS_TOKEN

## File Organization

### Authoritative Scripts
```
scripts/
├── rebuild_everything.py      # Master orchestrator
├── rebuild_agents.py          # Agent creation with collaboration
└── setup-collaborations.py    # (deprecated, kept for reference)

backend/scripts/
├── manage-lambda-functions.py # Lambda deployment
├── create-bedrock-agent.py    # Individual agent creation
└── AGENT_DEPLOYMENT_GUIDE.md  # Deployment documentation
```

### Legacy Files (Quarantined)
```
legacy/
├── lambda/                    # Old/incorrect Lambda handlers
├── scripts/                   # Obsolete deployment scripts
└── backend/scripts/           # Test/debug scripts
```

## Key Learnings

1. **Order Matters**: Create specialists first, supervisor last
2. **Collaboration Mode**: Must be set AFTER creation but BEFORE preparation
3. **Pure Boto3**: Avoid AWS CLI for complex operations
4. **Honest Logging**: Track success/failure of each operation
5. **Idempotent Design**: Delete existing agents before recreation

## Validation

After rebuild, verify:

1. **Check AWS Console**:
   - All 5 agents show as "PREPARED"
   - Supervisor shows collaboration enabled
   - All specialists listed as collaborators

2. **Test in Application**:
   - Supervisor agent responds to queries
   - Delegates to appropriate specialists
   - Returns comprehensive responses

3. **Monitor Logs**:
   - Check CloudWatch for agent invocations
   - Verify collaboration handoffs
   - Monitor for any errors

## Future Improvements

1. **Parallel Creation**: Create all specialists simultaneously
2. **Retry Logic**: Auto-retry on transient AWS errors
3. **Progress Bar**: Visual feedback during rebuild
4. **Backup/Restore**: Save configurations before deletion
5. **CI/CD Integration**: Automated rebuilds on code changes

---

**Last Updated**: June 2025
**Total Rebuild Time**: ~2-3 minutes
**Success Rate**: 100% (when AWS behaves) 