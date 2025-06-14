# Bedrock Agent Configuration

## Overview

The Patchline platform uses a modular agent configuration system that allows easy switching between different Bedrock agents.

## Current Agents

### Gmail Agent (Active)
- **ID**: `C7VZ0QWDSG`
- **Alias ID**: `WDGFWL1YCB`
- **Description**: Handles email operations via Gmail API
- **Actions**: 
  - `/search-emails` - Search emails by query
  - `/read-email` - Read specific email content
  - `/draft-email` - Create email drafts
  - `/send-email` - Send emails
  - `/list-labels` - List email labels
  - `/get-email-stats` - Get email statistics

## Configuration

Agents are configured in `lib/config.ts`:

```typescript
BEDROCK_AGENTS: {
  GMAIL_AGENT: {
    ID: process.env.BEDROCK_GMAIL_AGENT_ID || "C7VZ0QWDSG",
    ALIAS_ID: process.env.BEDROCK_GMAIL_AGENT_ALIAS_ID || "WDGFWL1YCB",
    NAME: "Gmail Agent",
    DESCRIPTION: "Handles email operations via Gmail API"
  }
}
```

## Switching Agents

To switch to a different agent, simply change the `ACTIVE_AGENT` value in `lib/config.ts`:

```typescript
// Current active agent
ACTIVE_AGENT: "GMAIL_AGENT",
```

## Adding New Agents

To add a new agent (e.g., Calendar Agent):

1. **Create the agent in AWS Bedrock** and get its ID and Alias ID

2. **Add agent configuration** to `lib/config.ts`:
```typescript
CALENDAR_AGENT: {
  ID: process.env.BEDROCK_CALENDAR_AGENT_ID || "YOUR_AGENT_ID",
  ALIAS_ID: process.env.BEDROCK_CALENDAR_AGENT_ALIAS_ID || "YOUR_ALIAS_ID",
  NAME: "Calendar Agent",
  DESCRIPTION: "Manages calendar and scheduling"
}
```

3. **Update Lambda functions** to handle the new agent's actions

4. **Switch to the new agent** by updating `ACTIVE_AGENT`:
```typescript
ACTIVE_AGENT: "CALENDAR_AGENT",
```

## Environment Variables

For production deployment, you can override the hardcoded values with environment variables:

- `BEDROCK_GMAIL_AGENT_ID` - Override Gmail Agent ID
- `BEDROCK_GMAIL_AGENT_ALIAS_ID` - Override Gmail Agent Alias ID

## Benefits

1. **Easy Agent Switching**: Switch between agents by changing one config value
2. **Multiple Agents**: Support multiple specialized agents (Gmail, Calendar, etc.)
3. **Environment Overrides**: Use different agents in dev/staging/production
4. **Future-Proof**: Easy to add new agents without changing core logic
5. **Clear Documentation**: Each agent has a name and description

## Debugging

The chat API logs which agent is being used:

```
[DEBUG] === AGENT CONFIGURATION ===
[DEBUG] Active Agent: Gmail Agent (GMAIL_AGENT)
[DEBUG] Description: Handles email operations via Gmail API
[DEBUG] BEDROCK_AGENT_ID: C7VZ0QWDSG
[DEBUG] BEDROCK_AGENT_ALIAS_ID: WDGFWL1YCB
``` 