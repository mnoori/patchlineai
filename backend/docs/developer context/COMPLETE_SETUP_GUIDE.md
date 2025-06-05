# PatchlineAI - Complete Setup & Transfer Guide

**Last Updated:** January 2025  
**Project:** PatchlineAI Music Platform  
**Repository:** https://github.com/your-repo/patchlinerepo  

---

## 🎯 Overview

This guide provides everything needed to transfer the PatchlineAI working directory to a new location and connect the backend with the v0 frontend. The project is a comprehensive music platform with AI-powered content generation, release management, and analytics.

---

## 📁 Project Structure

```
patchlinerepo/
├── app/                          # Next.js 15 App Router frontend
│   ├── dashboard/               # Main dashboard pages
│   │   ├── releases/           # Release management
│   │   ├── content/            # AI content generation
│   │   ├── insights/           # Analytics & insights
│   │   └── settings/           # User settings
│   └── api/                    # Next.js API routes
│       ├── user/               # User management
│       ├── embed/              # Platform embeds
│       ├── blog/               # Blog posts
│       ├── content/            # Content generation
│       └── health/             # Health checks
├── backend/                     # Backend services
│   ├── app/                    # Fastify API server
│   │   └── src/server.ts       # Main server file
│   └── infra/                  # AWS CDK infrastructure
├── amplify/                    # AWS Amplify configuration
├── components/                 # Reusable UI components
├── lib/                        # Shared utilities
├── hooks/                      # React hooks
└── docs/                       # Documentation
```

---

## 🔧 Environment Variables

### Required Environment Variables

Create a `.env.local` file in the project root with these variables:

```bash
# ===== AWS CONFIGURATION =====
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
# Optional: Only needed for temporary credentials
# AWS_SESSION_TOKEN=your_session_token_here

# ===== DYNAMODB TABLES =====
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging

# Alternative table name format (for Amplify environments)
DYNAMODB_USERS_TABLE=Users-staging
DYNAMODB_EMBEDS_TABLE=Embeds-staging
DYNAMODB_CONTENT_TABLE=ContentDrafts-staging

# ===== AWS BEDROCK (AI CONTENT GENERATION) =====
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
# Alternative models:
# BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
# BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# ===== APPLICATION CONFIGURATION =====
NODE_ENV=development
NEXT_PUBLIC_DEVELOPMENT_MODE=true

# ===== BACKEND API =====
API_BASE_URL=http://localhost:3001
JWT_SECRET=your_jwt_secret_for_development
PORT=3001

# ===== FEATURE FLAGS =====
AUTH_ENABLED=false
ENABLE_ANALYTICS=false
ENABLE_MOCK_SERVICES=true

# ===== AMPLIFY CONFIGURATION =====
# These are set automatically by Amplify, but can be overridden
AWS_APP_ID=d40rmftf5h7p7
AWS_BRANCH=staging
```

### Environment Variable Hierarchy

The application uses this priority order for environment variables:

1. **Primary AWS variables**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
2. **Alternative AWS variables**: `REGION_AWS`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`
3. **Amplify-specific variables**: Variables prefixed with `AWS_` (auto-set by Amplify)
4. **Development defaults**: Hardcoded fallbacks for local development

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Node.js**: v18+ (recommended v20+)
- **pnpm**: Latest version (`npm install -g pnpm`)
- **AWS CLI**: Configured with appropriate permissions
- **AWS Account**: With DynamoDB and Bedrock access

### 2. Clone & Setup

```bash
# Clone the repository
git clone <your-repo-url> patchlinerepo
cd patchlinerepo

# Install dependencies
pnpm install

# Install backend dependencies
cd backend/app
pnpm install
cd ../infra
pnpm install
cd ../..
```

### 3. Environment Configuration

```bash
# Create environment file
cp .env.example .env.local  # If example exists, or create manually

# Edit .env.local with your AWS credentials and configuration
# See "Environment Variables" section above
```

### 4. AWS Setup

```bash
# Pull Amplify configuration (if using existing Amplify app)
amplify pull --appId d40rmftf5h7p7 --envName staging

# Or initialize new Amplify project
amplify init

# Deploy DynamoDB tables
amplify push
```

### 5. Verify Setup

```bash
# Check AWS credentials and connectivity
node check-aws-credentials.mjs

# Start development servers
pnpm dev                    # Frontend (port 3000)
cd backend/app && pnpm dev  # Backend API (port 3001)
```

---

## 🗄️ Database Schema

### DynamoDB Tables

#### Users Table
```typescript
interface User {
  userId: string;           // Primary Key
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  profile?: {
    bio?: string;
    website?: string;
    socialLinks?: Record<string, string>;
  };
}
```

#### Embeds Table
```typescript
interface Embed {
  userId: string;           // Partition Key
  embedId: string;          // Sort Key
  platform: string;        // 'soundcloud', 'spotify', etc.
  url: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
```

#### BlogPosts Table
```typescript
interface BlogPost {
  id: string;               // Primary Key
  userId: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

#### ContentDrafts Table
```typescript
interface ContentDraft {
  id: string;               // Primary Key
  userId: string;
  title: string;
  content: string;
  type: 'blog' | 'social' | 'email';
  status: 'generating' | 'ready' | 'published';
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔌 API Endpoints

### Frontend API Routes (Next.js)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and AWS connectivity |
| `/api/user` | GET, POST, PUT | User management |
| `/api/embed` | GET, POST | Platform embeds management |
| `/api/blog` | GET, POST | Blog posts management |
| `/api/content` | GET, POST | AI content generation |

### Backend API (Fastify)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Backend health check |
| `/dashboard/overview` | GET | Dashboard metrics |

### API Authentication

- **Development**: JWT with `JWT_SECRET` environment variable
- **Production**: AWS Cognito integration (configured in `aws-exports.ts`)

---

## 🤖 AI Integration (AWS Bedrock)

### Setup Requirements

1. **AWS Bedrock Access**: Enable model access in AWS Console
2. **IAM Permissions**: 
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "bedrock:GetFoundationModelAvailability"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### Available Models

| Model ID | Provider | Use Case | Cost |
|----------|----------|----------|------|
| `amazon.nova-micro-v1:0` | Amazon | Fast, simple content | Lowest |
| `anthropic.claude-3-haiku-20240307-v1:0` | Anthropic | Better quality | Medium |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Anthropic | Highest quality | Highest |

### Content Generation Flow

1. User submits content request via `/api/content`
2. System creates draft record in DynamoDB
3. Prompt sent to AWS Bedrock
4. Generated content stored and returned
5. Fallback to mock generation if Bedrock fails

---

## 🔐 Authentication & Security

### AWS Cognito Configuration

```typescript
// aws-exports.ts
const awsConfig = {
  aws_project_region: "us-east-1",
  aws_cognito_region: "us-east-1",
  aws_user_pools_id: "us-east-1_GR9FnEy6A",
  aws_user_pools_web_client_id: "3fvlab6j9ioag5ce7r90fkjm78",
  oauth: undefined,
}
```

### Development Authentication

- Set `AUTH_ENABLED=false` in `.env.local` for development
- Mock user automatically created for testing
- JWT authentication available for API testing

---

## 🎨 Frontend Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React hooks + Context
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

### Key Components

- **Dashboard Layout**: `app/dashboard/layout.tsx`
- **Release Management**: `app/dashboard/releases/page.tsx`
- **Content Creator**: `app/dashboard/content/page.tsx`
- **Analytics**: `app/dashboard/insights/page.tsx`

### Design System

```css
/* Custom CSS Variables (tailwind.config.ts) */
:root {
  --cosmic-midnight: #0a0a0f;
  --cosmic-teal: #00f0ff;
  --cosmic-purple: #8b5cf6;
  --cosmic-pink: #ec4899;
}
```

---

## 🏗️ Infrastructure (AWS CDK)

### CDK Stack Location

```
backend/infra/
├── bin/patchline-infra.ts    # CDK app entry point
├── lib/patchline-stack.ts    # Main stack definition
├── cdk.json                  # CDK configuration
└── package.json              # CDK dependencies
```

### Deployment Commands

```bash
cd backend/infra

# Install dependencies
pnpm install

# Deploy infrastructure
cdk deploy

# Destroy infrastructure
cdk destroy
```

---

## 🧪 Testing & Debugging

### Health Checks

```bash
# Check AWS credentials and connectivity
node check-aws-credentials.mjs

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001/health
```

### Common Issues & Solutions

#### 1. AWS Credentials Error
```
CredentialsProviderError: Could not load credentials from any providers
```
**Solution**: Ensure `.env.local` exists with valid AWS credentials and restart dev server.

#### 2. DynamoDB Table Not Found
```
ResourceNotFoundException: Requested resource not found
```
**Solution**: Run `amplify push` to create tables or verify table names in environment variables.

#### 3. Bedrock Access Denied
```
AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel
```
**Solution**: Enable model access in AWS Bedrock console and verify IAM permissions.

---

## 📦 Dependencies

### Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "15.2.4",
    "react": "^19",
    "react-dom": "^19",
    "@aws-sdk/client-bedrock-runtime": "^3.816.0",
    "@aws-sdk/client-dynamodb": "^3.812.0",
    "@aws-sdk/lib-dynamodb": "^3.814.0",
    "aws-amplify": "^6.14.4",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.17",
    "lucide-react": "^0.454.0"
  }
}
```

### Backend Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.25.1",
    "@fastify/cors": "^8.4.1",
    "@fastify/jwt": "^7.0.2"
  }
}
```

---

## 🚀 Deployment

### Amplify Deployment

1. **Connect Repository**: Link GitHub repo to Amplify
2. **Environment Variables**: Set all required env vars in Amplify Console
3. **Build Settings**: Use provided `amplify.yml`
4. **Deploy**: Automatic deployment on git push

### Manual Deployment

```bash
# Build frontend
pnpm build

# Build backend
cd backend/app
pnpm build

# Deploy infrastructure
cd ../infra
cdk deploy
```

---

## 📚 Additional Resources

### Documentation Files

- `DEVELOPMENT.md` - Development setup and troubleshooting
- `BEDROCK-SETUP.md` - AWS Bedrock configuration guide
- `aws-credentials-setup.md` - AWS credentials troubleshooting
- `backend/DEVELOPER_CONTEXT.md` - Backend development context

### Useful Commands

```bash
# Amplify commands
amplify status
amplify pull
amplify push
amplify env list

# AWS CLI commands
aws dynamodb list-tables
aws bedrock list-foundation-models

# Development commands
pnpm dev          # Start frontend
pnpm build        # Build frontend
pnpm lint         # Run linting
```

---

## 🆘 Support & Troubleshooting

### Getting Help

1. **Check Documentation**: Review all `.md` files in the project
2. **Run Health Checks**: Use `check-aws-credentials.mjs`
3. **Check Logs**: Review console output for detailed error messages
4. **Verify Environment**: Ensure all environment variables are set correctly

### Contact Information

- **Project Repository**: [GitHub Link]
- **AWS Account ID**: 366218382497
- **Amplify App ID**: d40rmftf5h7p7

---

*This guide should provide everything needed to successfully transfer and set up the PatchlineAI project in a new environment. Keep this documentation updated as the project evolves.* 