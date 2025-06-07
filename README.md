# Patchline Multi-Agent System

A powerful multi-agent system for music industry professionals that combines specialized AI agents to handle email communication, legal document analysis, and artist discovery.

## Features

- **Email Management**: Search, read, draft, and send emails
- **Contract Analysis**: Analyze music industry contracts with structured legal assessment
- **Artist Discovery**: Scout for new artists with real-time data from Soundcharts API
- **Multi-Agent Coordination**: Seamless delegation between specialized agents
- **Real-Time Workflow Visualization**: Watch agents collaborate in real-time with streaming logs
- **Intelligent Routing**: User queries automatically sent to the right specialist agents
- **Persona-Aware Interactions**: Tailored for Creators, Roster managers, and Enterprise users

## System Architecture

- **Gmail Agent**: Handles all email operations
- **Legal Agent**: Specializes in music industry contract analysis
- **Scout Agent**: Discovers and analyzes promising artists using Soundcharts data
- **Supervisor Agent**: Coordinates workflows between agents using the agent-as-tools pattern
- **Real-Time Streaming**: Server-Sent Events for live agent activity monitoring

## Getting Started

1. Clone the repository
2. Set up environment variables in `.env.local`:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   SOUNDCHARTS_APP_ID=your-soundcharts-id
   SOUNDCHARTS_API_KEY=your-soundcharts-key
   ```
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
5. Deploy AWS resources: `./scripts/deploy-all.ps1` (Windows) or see DEPLOYMENT.md

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

scout:
  name: PatchlineScoutAgent
  description: AI talent scout for discovering promising artists
  # ... more configuration

supervisor:
  name: PatchlineSupervisorAgent
  collaborators: [gmail, legal, scout]
  # ... more configuration
```

## User Personas

Patchline is designed for three key music industry personas:

1. **Creator**: Independent artists and producers managing their own careers
2. **Roster**: Labels, managers, and publishers handling multiple artists
3. **Enterprise**: Larger companies needing scalable insights and compliance

Each agent adapts its tone and recommendations based on the user's persona.

## API Integrations

### Soundcharts API
The Scout agent uses Soundcharts API for real-time artist data:
- Artist discovery and search
- Artist metadata (genre, biography, country)
- Career stage analysis
- Intelligent fallbacks for metrics not in free tier

Configure in your `.env.local`:
```
SOUNDCHARTS_APP_ID=PATCHLINE_A2F4F819
SOUNDCHARTS_API_KEY=d8e39c775adc8797
```

## Documentation

See the `docs/` directory and project root for detailed documentation:

- `docs/agent-system.md`: Comprehensive system documentation
- `docs/development.md`: Development guide
- `DEPLOYMENT.md`: Deployment instructions and troubleshooting
- `docs/api-integrations.md`: API integration documentation

## Scripts

- `scripts/deploy-all.ps1`: Complete deployment of all components
- `scripts/generate-agents.ts`: Create/update agents from `agents.yaml` configuration
- `scripts/test-soundcharts.js`: Test Soundcharts API connectivity
- `scripts/create-supervisor-table.ts`: Create DynamoDB table for supervisor interactions
- `scripts/create-scout-table.ts`: Create DynamoDB table for scout watchlist

## Implementation Details

- AWS Bedrock Agents with Claude foundation models
- Custom AWS Lambda functions for agent actions
- TypeScript Next.js application with real-time UI
- Agent-as-tools pattern for agent coordination
- Third-party API integrations with caching and quota management
- Server-Sent Events for real-time agent activity streaming

## License

Copyright © 2023-2024 Patchline Inc. All rights reserved.

# Patchline Web3 Portal

This repository contains the implementation of the Patchline Web3 Portal, which allows users to connect their Phantom wallet and perform crypto transactions.

## Current Implementation

The current implementation includes:

- **Wallet Connection**: Users can connect their Phantom wallet to the application
- **Wallet Display**: Shows connected wallet address in the navbar with a dropdown
- **Send/Receive UI**: Modal interfaces for sending and receiving crypto
- **Balance Display**: UI components for displaying SOL and USDC balances

## Known Issues

1. **Solana RPC Connection**: Browser-side RPC connections are experiencing CORS issues with some providers:
   - Default Solana mainnet endpoint blocks browser requests with 403 errors
   - Attempted fallbacks to Ankr, ProjectSerum and Metaplex endpoints
   - May require server-side proxy implementation for production use

2. **Auth Configuration**: AWS Cognito integration requires proper configuration
   - Added Amplify configuration import to layout to ensure initialization

## Next Steps

1. **Balance Fetching**: Implement server-side RPC calls to fetch balances reliably
   - Create a dedicated API route (e.g., `/api/web3/balance?address=<wallet>`) 
   - Move Solana RPC calls to server-side to avoid CORS issues
   - Keep the API key secure on the server side

2. **Transaction Handling**: Complete the send functionality
   - Implement transaction signing and submission
   - Add transaction status tracking and history

3. **Testing**: Comprehensive testing across different environments
   - Test with actual wallets on testnet
   - Verify error handling scenarios

## Environment Variables

For local development, add these variables to your `.env.local` file:

```
# Web3 Configuration
NEXT_PUBLIC_SOLANA_RPC=https://rpc.ankr.com/solana 
SOLANA_RPC_KEY=your_private_key_for_server_only

# Auth Configuration
NEXT_PUBLIC_USER_POOL_ID=your_cognito_user_pool_id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your_cognito_client_id
NEXT_PUBLIC_AWS_REGION=your_aws_region
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Additional Resources

- [Phantom Wallet Documentation](https://docs.phantom.app/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [AWS Amplify Documentation](https://docs.amplify.aws/) 