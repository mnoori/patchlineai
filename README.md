# Patchline Multi-Agent System

A powerful multi-agent system for music industry professionals that combines specialized AI agents to handle email communication and legal document analysis.

## Features

- **Email Management**: Search, read, draft, and send emails
- **Contract Analysis**: Analyze music industry contracts with structured legal assessment
- **Multi-Agent Coordination**: Seamless delegation between specialized agents

## System Architecture

- **Gmail Agent**: Handles all email operations
- **Legal Agent**: Specializes in music industry contract analysis
- **Supervisor Agent**: Coordinates workflows between agents using the agent-as-tools pattern

## Getting Started

1. Clone the repository
2. Set up environment variables in `.env.local`:
   ```
   REGION_AWS=us-east-1
   ACCESS_KEY_ID=your-access-key
   SECRET_ACCESS_KEY=your-secret-key
   ```
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Configuration

Agents are configured in `agents.yaml` as the single source of truth:

```yaml
gmail:
  name: PatchlineEmailAgent
  description: AI assistant for managing emails and communications
  model: claude-3-7-sonnet
  prompt: prompts/gmail-agent.md
  # ... more configuration

legal:
  name: PatchlineLegalAgent
  description: Legal AI assistant specialising in music contracts
  # ... more configuration

supervisor:
  name: PatchlineSupervisorAgent
  collaborators: [gmail, legal]
  # ... more configuration
```

## Documentation

See the `docs/` directory for detailed documentation:

- `docs/agent-system.md`: Comprehensive system documentation
- `docs/development.md`: Development guide
- `docs/deployment.md`: Deployment instructions

## Scripts

- `scripts/generate-agents.ts`: Create/update agents from `agents.yaml` configuration

## Implementation Details

- AWS Bedrock Agents with Claude foundation models
- Custom AWS Lambda functions for agent actions
- TypeScript Next.js application
- Agent-as-tools pattern for agent coordination

## License

Copyright © 2023-2024 Patchline Inc. All rights reserved. 