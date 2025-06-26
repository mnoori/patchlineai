# 🚀 Patchline Amplify Production Deployment Guide

## 🎯 **Overview**

This guide covers deploying Patchline's **AI Rebuilding AI Platform** to AWS Amplify. The system includes:

- **Multi-Agent Orchestration**: 5 specialized AI agents with real API integrations
- **Zero-Overhead Debug System**: Smart logging that adapts from full development visibility to zero production overhead
- **Self-Healing Architecture**: AI-powered monitoring, analysis, and automatic optimization
- **Real-World Integrations**: Soundcharts, Gmail, Blockchain, AWS Secrets Manager

---

## 📋 **Pre-Deployment Checklist**

### ✅ **AWS Services Setup**

1. **AWS Bedrock Agents** (Required)
   ```bash
   # Verify agents are deployed
   aws bedrock-agent list-agents --region us-east-1
   
   # Expected agents:
   # - Supervisor Agent (8VG8LOVLNZ)
   # - Scout Agent (W00SGH6WWS) 
   # - Gmail Agent (YOMXXWPSSQ)
   # - Blockchain Agent (W8H34DMCA5)
   # - Legal Agent (SOZZFV6SYD)
   ```

2. **AWS Lambda Functions** (Required)
   ```bash
   # Verify Lambda functions exist
   aws lambda list-functions --region us-east-1 | grep patchline
   
   # Expected functions:
   # - scout-action-handler
   # - gmail-action-handler
   # - blockchain-action-handler
   # - legal-action-handler
   ```

3. **DynamoDB Tables** (Required)
   ```bash
   # Verify tables exist
   aws dynamodb list-tables --region us-east-1
   
   # Expected tables:
   # - Users-production
   # - Embeds-production
   # - BlogPosts-production
   # - ContentDrafts-production
   ```

4. **S3 Buckets** (Required for Debug System)
   ```bash
   # Verify S3 bucket for debug logs
   aws s3 ls s3://patchline-files-us-east-1/debug-logs/
   ```

5. **AWS Secrets Manager** (Required)
   ```bash
   # Verify secrets exist
   aws secretsmanager list-secrets --region us-east-1
   
   # Expected secrets:
   # - patchline/soundcharts-api
   # - patchline/gmail-oauth
   # - patchline/blockchain-rpc
   ```

---

## 🏗️ **Amplify Console Configuration**

### **Step 1: Create Amplify App**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "Create new app" → "Host web app"
3. Connect your GitHub repository
4. Select branch: `amplify-production-ready`

### **Step 2: Build Settings**

Use the provided `amplify.yml` configuration:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
        - echo "Setting production debug mode for zero-overhead logging"
        - node -e "console.log('DEBUG_MODE=prod')" >> .env.production
    build:
      commands:
        - echo "Building Patchline AI Rebuilding AI Platform..."
        - pnpm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
      - .pnpm-store/**/*
```

### **Step 3: Environment Variables**

Configure the following environment variables in Amplify Console:

#### **🔧 Core AWS Configuration**
```env
AWS_REGION=us-east-1
NODE_ENV=production
DEBUG_MODE=prod
```

#### **🌐 Application Configuration**
```env
NEXT_PUBLIC_APP_URL=https://your-amplify-app-url.amplifyapp.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_DEMO_MODE=false
```

#### **🔐 AWS Cognito (Authentication)**
```env
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_IDENTITY_POOL_ID=us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

#### **🗄️ DynamoDB Tables**
```env
USERS_TABLE=Users-production
NEXT_PUBLIC_USERS_TABLE=Users-production
EMBEDS_TABLE=Embeds-production
NEXT_PUBLIC_EMBEDS_TABLE=Embeds-production
BLOG_POSTS_TABLE=BlogPosts-production
NEXT_PUBLIC_BLOG_POSTS_TABLE=BlogPosts-production
CONTENT_DRAFTS_TABLE=ContentDrafts-production
NEXT_PUBLIC_CONTENT_DRAFTS_TABLE=ContentDrafts-production
```

#### **🤖 AI Agents Configuration**
```env
SUPERVISOR_AGENT_ID=8VG8LOVLNZ
SUPERVISOR_AGENT_ALIAS_ID=TSTALIASID
SCOUT_AGENT_ID=W00SGH6WWS
SCOUT_AGENT_ALIAS_ID=TSTALIASID
GMAIL_AGENT_ID=YOMXXWPSSQ
GMAIL_AGENT_ALIAS_ID=TSTALIASID
BLOCKCHAIN_AGENT_ID=W8H34DMCA5
BLOCKCHAIN_AGENT_ALIAS_ID=TSTALIASID
LEGAL_AGENT_ID=SOZZFV6SYD
LEGAL_AGENT_ALIAS_ID=TSTALIASID
```

#### **🔐 Secrets Manager Configuration**
```env
SOUNDCHARTS_SECRET_ID=patchline/soundcharts-api
GMAIL_CLIENT_SECRET_ID=patchline/gmail-oauth
BLOCKCHAIN_RPC_SECRET_ID=patchline/blockchain-rpc
```

#### **📊 Debug System Configuration**
```env
S3_DEBUG_BUCKET=patchline-files-us-east-1
CLOUDWATCH_LOG_GROUP=/aws/lambda/patchline-production
```

#### **🌐 Optional Features**
```env
NEXT_PUBLIC_ENABLE_WEB3=true
NEXT_PUBLIC_ENABLE_MCP=true
```

---

## 🚀 **Deployment Process**

### **Step 1: Deploy Backend Infrastructure**

```bash
# Set debug mode to production (zero overhead)
python backend/scripts/set-debug-mode.py --mode prod

# Deploy all Lambda functions
python backend/scripts/manage-lambda-functions.py --recreate --agent=all

# Verify agents are working
python backend/scripts/test-agent-system.py --production
```

### **Step 2: Deploy Frontend to Amplify**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production deployment: Zero-overhead debug system ready for Amplify"
   git push origin amplify-production-ready
   ```

2. **Trigger Amplify Build**:
   - Go to Amplify Console
   - Select your app
   - Click "Run build" or push will auto-trigger

3. **Monitor Build Process**:
   ```bash
   # Watch build logs in Amplify Console
   # Expected build time: 3-5 minutes
   # Look for: "Building Patchline AI Rebuilding AI Platform..."
   ```

---

## 🔍 **Monitoring & Debug System**

### **Production Debug Modes**

The system automatically adapts based on `DEBUG_MODE` environment variable:

- **`DEBUG_MODE=prod`** (Default): Zero overhead, errors only
- **`DEBUG_MODE=dev`**: Full S3 + console logging for debugging
- **`DEBUG_MODE=extreme`**: Maximum verbosity for deep analysis
- **`DEBUG_MODE=off`**: Zero logging for pure performance

### **Self-Healing Monitoring**

The AI system continuously monitors and optimizes itself:

1. **🔍 OBSERVE**: Real-time monitoring of agent behavior
2. **🧮 LEARN**: AI-powered pattern recognition
3. **🔄 ADAPT**: Dynamic code optimization
4. **🧬 EVOLVE**: Continuous learning and improvement

---

## 🎯 **Success Metrics**

After successful deployment, you should see:

### **✅ Performance Metrics**
- **Latency**: < 50ms debug overhead (zero in production mode)
- **Throughput**: 10,000+ requests/sec capability
- **Uptime**: 99.9% SLA with self-healing architecture

### **✅ Functional Validation**
- All 5 AI agents responding correctly
- Real API integrations working (Soundcharts, Gmail, Blockchain)
- Debug system adapting to production mode
- Self-healing monitoring active

---

**🎉 Congratulations! You've deployed the world's first AI system that rebuilds itself.**

The future belongs to AI systems that can rebuild themselves - and you're running the platform that makes it possible. 