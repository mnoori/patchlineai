# Patchline Backend Documentation

## Overview

Patchline is an AI-powered platform for music industry professionals that combines email management, catalog analysis, and intelligent automation. The backend consists of AWS Bedrock Agents, Lambda functions, and various AWS services.

## Architecture

### Core Components

1. **Bedrock Agent** (Claude 4 Sonnet)
   - Primary AI interface for email management
   - Configured with Gmail action group
   - Uses Claude 4 Sonnet model (configured via AWS Console)
   - Memory enabled for context retention
   - User input enabled for clarifying questions

2. **Lambda Functions**
   - `gmail-auth-handler`: OAuth2 authentication flow
   - `gmail-action-handler`: Gmail API operations (search, read, draft, send)
   
3. **Data Storage**
   - DynamoDB: `PlatformConnections-staging` (OAuth tokens)
   - S3: Email knowledge base storage
   - Secrets Manager: Gmail OAuth credentials

### Model Configuration

Models are centrally managed in `backend/scripts/config.py`:

- **Agent Mode**: Claude 4 Sonnet (fixed, configured in AWS Console)
- **Chat Mode**: Multiple models available via inference profiles
  - Claude 4 Sonnet/Opus
  - Claude 3.7 Sonnet
  - Nova Premier/Micro

To update models:
1. Edit `backend/scripts/config.py`
2. Run `python backend/scripts/sync-models-config.py`

### Gmail Integration

#### Authentication Flow
1. User initiates connection via `/api/auth/gmail`
2. Lambda function generates OAuth URL
3. User authorizes in Google
4. Callback stores tokens in DynamoDB

#### Action Flow
1. Agent receives user request
2. Invokes Gmail action via Lambda
3. Lambda uses stored OAuth tokens
4. Results returned to agent for response generation

### Key Files

- `backend/scripts/config.py` - Central configuration
- `backend/lambda/gmail-action-handler.py` - Gmail operations
- `backend/scripts/create-bedrock-agent.py` - Agent setup
- `backend/scripts/deploy-lambda.py` - Lambda deployment

## Deployment

### Prerequisites
- AWS CLI configured
- Python 3.9+
- Node.js 18+
- Gmail OAuth credentials in Secrets Manager

### Steps
1. Deploy Lambda functions: `python backend/scripts/deploy-lambda.py`
2. Create/update agent: `python backend/scripts/create-bedrock-agent.py`
3. Sync models: `python backend/scripts/sync-models-config.py`

## Environment Variables

Required in `.env.local`:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
BEDROCK_AGENT_ID=xxx
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
```

## Testing

- Agent test: `python backend/scripts/test-agent-with-session.py`
- Model access: `python backend/scripts/test-model-access.py`

## Troubleshooting

### Common Issues

1. **"invalid_scope" error**: DynamoDB storing scopes as string instead of list
   - Fixed in `gmail-action-handler.py` with `parse_scopes()` function

2. **Agent using wrong model**: 
   - Agent model is fixed in AWS Console
   - Cannot be changed dynamically via API

3. **Actions not visible in UI**:
   - Ensure client-side logging is enabled
   - Check sidebar console.log interception

# PatchlineAI Backend

**Complete backend setup and integration guide for PatchlineAI music platform**

---

## 📋 Quick Start

### For New Developers

1. **Run the setup script:**
   ```bash
   # Linux/Mac
   bash backend/setup-new-environment.sh
   
   # Windows PowerShell
   .\backend\setup-new-environment.ps1
   ```

2. **Edit environment variables:**
   ```bash
   # Copy template and edit with your AWS credentials
   cp backend/env-template.txt .env.local
   # Edit .env.local with your actual AWS credentials
   ```

3. **Start development:**
   ```bash
   pnpm dev                    # Frontend (port 3000)
   cd backend/app && pnpm dev  # Backend API (port 3001)
   ```

### For Experienced Developers

```bash
# Install dependencies
pnpm install && cd backend/app && pnpm install && cd ../infra && pnpm install && cd ../..

# Configure AWS
amplify pull --appId d40rmftf5h7p7 --envName staging

# Set up environment
cp backend/env-template.txt .env.local
# Edit .env.local with AWS credentials

# Verify setup
node check-aws-credentials.mjs

# Start development
pnpm dev
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** | 📖 **START HERE** - Complete transfer and setup guide |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | 🔌 API endpoints and integration guide |
| **[env-template.txt](./env-template.txt)** | 🔧 Environment variables template |
| **[DEVELOPER_CONTEXT.md](./DEVELOPER_CONTEXT.md)** | 🧠 Development context and history |
| **[aws-bedrock-integration-guide.md](./aws-bedrock-integration-guide.md)** | 🤖 AI integration setup |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PatchlineAI Platform                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15)          │  Backend (Fastify)        │
│  Port: 3000                     │  Port: 3001               │
│  ├── Dashboard UI               │  ├── Health Checks        │
│  ├── Release Management         │  ├── Dashboard APIs       │
│  ├── Content Creator            │  ├── Authentication       │
│  └── API Routes (/api/*)        │  └── Additional Services  │
├─────────────────────────────────────────────────────────────┤
│                      AWS Services                           │
│  ├── DynamoDB (Data Storage)                               │
│  ├── Bedrock (AI Content Generation)                       │
│  ├── Cognito (Authentication)                              │
│  └── Amplify (Hosting & CI/CD)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Environment Variables

### Required Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# DynamoDB Tables
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging

# AI Configuration
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0

# Backend API
API_BASE_URL=http://localhost:3001
JWT_SECRET=your_jwt_secret_for_development
```

### Optional Variables

```bash
# Feature Flags
AUTH_ENABLED=false
ENABLE_ANALYTICS=false
ENABLE_MOCK_SERVICES=true

# Amplify
AWS_APP_ID=d40rmftf5h7p7
AWS_BRANCH=staging
```

**📝 See [env-template.txt](./env-template.txt) for complete list with explanations**

---

## 🚀 Development Workflow

### Starting Development

```bash
# Terminal 1: Frontend + Next.js API Routes
pnpm dev

# Terminal 2: Backend Fastify Server
cd backend/app
pnpm dev
```

### Testing & Verification

```bash
# Check AWS connectivity
node check-aws-credentials.mjs

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001/health

# View application
open http://localhost:3000
```

### Common Commands

```bash
# Amplify commands
amplify status
amplify pull
amplify push

# AWS CLI commands
aws dynamodb list-tables
aws bedrock list-foundation-models

# Development commands
pnpm dev          # Start frontend
pnpm build        # Build frontend
pnpm lint         # Run linting
```

---

## 🗄️ Database Schema

### DynamoDB Tables

| Table | Primary Key | Sort Key | Purpose |
|-------|-------------|----------|---------|
| **Users** | `userId` | - | User profiles and settings |
| **Embeds** | `userId` | `embedId` | Platform embeds (SoundCloud, etc.) |
| **BlogPosts** | `id` | - | Blog posts and articles |
| **ContentDrafts** | `id` | - | AI-generated content drafts |

**📝 See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed schemas**

---

## 🔌 API Integration

### Frontend API Routes (Next.js)

```typescript
// Available at http://localhost:3000/api/*
GET  /api/health              // System health check
GET  /api/user?userId=...     // Get user data
POST /api/user                // Create user
GET  /api/embed?userId=...    // Get embeds
POST /api/embed               // Create embed
GET  /api/content?userId=...  // Get content drafts
POST /api/content             // Generate AI content
```

### Backend API Server (Fastify)

```typescript
// Available at http://localhost:3001/*
GET /health                   // Backend health
GET /dashboard/overview       // Dashboard metrics
```

### Connecting v0 Frontend

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'

export async function fetchDashboardData() {
  const response = await fetch(`${API_BASE_URL}/dashboard/overview`)
  return response.json()
}
```

**📝 See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference**

---

## 🤖 AI Integration (AWS Bedrock)

### Setup

1. **Enable Bedrock Models** in AWS Console
2. **Set Environment Variable**: `BEDROCK_MODEL_ID=amazon.nova-micro-v1:0`
3. **Verify IAM Permissions**: `bedrock:InvokeModel`

### Available Models

| Model | Provider | Use Case | Cost |
|-------|----------|----------|------|
| `amazon.nova-micro-v1:0` | Amazon | Fast, simple | Lowest |
| `anthropic.claude-3-haiku-20240307-v1:0` | Anthropic | Better quality | Medium |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Anthropic | Highest quality | Highest |

### Usage

```typescript
// Content generation via API
POST /api/content
{
  "userId": "user-id",
  "prompt": "Write about music production",
  "type": "blog"
}
```

**📝 See [aws-bedrock-integration-guide.md](./aws-bedrock-integration-guide.md) for detailed setup**

---

## 🏗️ Infrastructure

### AWS CDK (Infrastructure as Code)

```bash
cd backend/infra

# Deploy infrastructure
cdk deploy

# View stack
cdk ls

# Destroy infrastructure
cdk destroy
```

### Amplify Configuration

```bash
# Pull existing configuration
amplify pull --appId d40rmftf5h7p7 --envName staging

# Initialize new project
amplify init

# Deploy changes
amplify push
```

---

## 🧪 Testing & Debugging

### Health Checks

```bash
# Comprehensive AWS check
node check-aws-credentials.mjs

# Quick API tests
curl http://localhost:3000/api/health
curl http://localhost:3001/health
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **AWS Credentials Error** | Create `.env.local` with valid AWS credentials |
| **DynamoDB Table Not Found** | Run `amplify push` or verify table names |
| **Bedrock Access Denied** | Enable model access in AWS Bedrock console |
| **Port Already in Use** | Kill existing processes or change ports |

**📝 See [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) for detailed troubleshooting**

---

## 📦 Dependencies

### Frontend

- **Next.js 15** - React framework with App Router
- **AWS SDK v3** - DynamoDB and Bedrock integration
- **Radix UI** - Component library
- **Tailwind CSS** - Styling

### Backend

- **Fastify** - Fast web framework
- **AWS SDK** - AWS service integration
- **JWT** - Authentication

### Infrastructure

- **AWS CDK** - Infrastructure as code
- **TypeScript** - Type safety

---

## 🚀 Deployment

### Development

```bash
# Local development
pnpm dev                    # Frontend (port 3000)
cd backend/app && pnpm dev  # Backend (port 3001)
```

### Staging/Production

```bash
# Build and deploy frontend
pnpm build
amplify push

# Deploy backend infrastructure
cd backend/infra
cdk deploy

# Deploy backend application
cd ../app
pnpm build
# Deploy to ECS/Lambda
```

---

## 🆘 Getting Help

### Documentation Priority

1. **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)** - Start here for setup
2. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API integration
3. **Root documentation** - `DEVELOPMENT.md`, `BEDROCK-SETUP.md`
4. **Health checks** - `node check-aws-credentials.mjs`

### Quick Diagnostics

```bash
# Check environment
node check-aws-credentials.mjs

# Check services
curl http://localhost:3000/api/health
curl http://localhost:3001/health

# Check logs
pnpm dev  # Check console output for errors
```

---

## 📞 Project Information

- **AWS Account ID**: 366218382497
- **Amplify App ID**: d40rmftf5h7p7
- **Environment**: staging
- **Region**: us-east-1

---

**🎉 Ready to start? Run the setup script and follow the [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)!** 