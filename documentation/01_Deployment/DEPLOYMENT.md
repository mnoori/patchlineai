# Patchline Deployment Guide

## 🚀 Quick Start

Run the complete deployment script:

```powershell
# Windows PowerShell
./scripts/deploy-all.ps1

# Or manually run each step
npx tsx scripts/create-supervisor-table.ts
npx tsx scripts/create-scout-table.ts
./scripts/deploy-gmail-lambda.ps1
./scripts/deploy-scout-lambda.ps1
```

## 📋 What Was Fixed

### 1. Supervisor Agent Routing ✅
- **Problem**: Hardcoded to always analyze contracts regardless of user query
- **Solution**: Implemented intelligent intent-based routing
- **Result**: "Did Ael send an email?" now only queries Gmail agent

### 2. Gmail Token Refresh ✅
- **Problem**: `invalid_grant: Token has been expired or revoked` errors
- **Solution**: Added proper error handling and 401 responses with `GMAIL_AUTH_REQUIRED` code
- **Result**: Frontend can detect expired tokens and prompt re-authentication

### 3. Scout Agent Integration ✅
- **Problem**: No Scout agent existed
- **Solution**: Created complete Scout agent with Soundcharts API integration
- **Features**:
  - Real artist search and metadata
  - Hybrid approach with enhanced mock data for stats
  - Watchlist functionality
  - Report generation

### 4. Real-time Logs ✅
- **Problem**: Logs only showed after request completed
- **Solution**: Implemented Server-Sent Events (SSE) for live streaming
- **Result**: See agent coordination in real-time in the Supervisor UI

### 5. Email Metadata Display ✅
- **Problem**: Email preview showed "undefined" for missing subjects/senders
- **Solution**: Added proper fallbacks and improved metadata extraction
- **Result**: Email previews now show "(No subject)" or "Unknown sender" when fields are missing

### 6. Streaming Visualization ✅
- **Problem**: Agent activity indicators disappeared too quickly
- **Solution**: Enhanced state management to keep bubbles visible for all trace types
- **Result**: Live status "Agent is working..." now stays visible until task completion

## 🛠️ Manual Steps Required

### 1. Create Scout Agent in AWS Bedrock

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to Agents > Create Agent
3. Configure:
   ```
   Name: PatchlineScoutAgent
   Model: Claude 3 Sonnet
   Instructions: [Copy from prompts/scout-agent.md]
   ```
4. Add Action Group:
   ```
   Name: ScoutActions
   Lambda: scout-action-handler
   API Schema: [Upload backend/lambda/scout-actions-openapi.json]
   ```
5. Create alias and note the IDs

### 2. Update Configuration

Update `agents.yaml` with Scout agent IDs:
```yaml
scout:
  environment:
    agent_id: YOUR_AGENT_ID
    agent_alias_id: YOUR_ALIAS_ID
```

### 3. Environment Variables

Ensure `.env.local` has:
```env
# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Soundcharts
SOUNDCHARTS_APP_ID=PATCHLINE_A2F4F819
SOUNDCHARTS_API_KEY=d8e39c775adc8797
```

## 🧪 Testing

### Test Supervisor Agent
```
http://localhost:3000/dashboard/agents/supervisor

Try these queries:
- "Did Ael send me any emails?"
- "Check if I have any contracts in my inbox"
- "What emails did I receive last week?"
```

### Test Scout Agent
```
http://localhost:3000/dashboard/agents/scout

Try searching for:
- Taylor Swift
- Ice Spice
- Sabrina Carpenter
```

### Test Gmail Agent
```
http://localhost:3000/dashboard/agents/gmail

If you see authentication errors:
1. Click "Connect Gmail"
2. Re-authenticate with Google
3. Try again
```

## 📊 API Quotas

- **Soundcharts**: 188/200 calls remaining (resets monthly)
- **AWS Bedrock**: Pay-per-use
- **Gmail API**: 250 quota units per user per second

## 👥 User Personas

Patchline agents are designed to adapt their tone and recommendations based on three key music industry personas:

### Creator
- **Who**: Independent artists and producers managing their own careers
- **Needs**: DIY advice, cost-effective solutions, simple explanations
- **Example**: Solo artist looking to understand a distribution deal

### Roster
- **Who**: Labels, managers, and publishers handling multiple artists
- **Needs**: Portfolio optimization, comparative analysis, prioritization
- **Example**: A&R manager seeking emerging talent or analyzing multiple contracts

### Enterprise
- **Who**: Larger companies needing scalable insights and compliance
- **Needs**: KPIs, compliance checks, systematic workflows
- **Example**: Major label executive reviewing deal terms across territories

The Supervisor agent and specialist agents (Gmail, Legal, Scout) adapt their responses to match the user's persona context.

## 🐛 Troubleshooting

### Gmail Authentication Issues
If you see `GMAIL_AUTH_REQUIRED`:
1. Go to Gmail agent page
2. Click "Connect Gmail" 
3. Complete OAuth flow
4. Tokens will be refreshed automatically

### Scout Agent Not Found
If Scout agent isn't working:
1. Check Lambda deployment: `aws lambda get-function --function-name scout-action-handler`
2. Verify environment variables are set in Lambda
3. Check CloudWatch logs for errors

### Real-time Logs Not Showing
If logs aren't streaming:
1. Check browser console for SSE errors
2. Verify `/api/chat/supervisor/stream` endpoint is accessible
3. Try refreshing the page

## 🎉 Success Checklist

- [ ] All DynamoDB tables created
- [ ] Gmail Lambda deployed and updated
- [ ] Scout Lambda created and deployed
- [ ] Scout agent created in Bedrock
- [ ] Configuration files updated
- [ ] Frontend showing real-time logs
- [ ] All test queries working

## 🍕 You're Done!

Everything is deployed and ready for testing. Go eat! The system is now:
- Intelligently routing queries to the right agents
- Handling Gmail token refresh gracefully
- Discovering artists with real Soundcharts data
- Showing real-time agent coordination logs

Enjoy your meal! 🎊 