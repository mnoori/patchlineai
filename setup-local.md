# PatchlineAI - Local Setup Guide

This guide will help you set up and run PatchlineAI locally with all backend connections properly configured.

## Prerequisites

- Node.js v18+ (recommended v20+)
- pnpm package manager (`npm install -g pnpm`)
- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)

## Step 1: Environment Configuration

1. Create a `.env.local` file in the project root:

```bash
# Copy this content to .env.local and replace with your actual values

# ===== AWS CONFIGURATION =====
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here

# ===== DYNAMODB TABLES =====
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging

# ===== AWS BEDROCK =====
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0

# ===== APPLICATION =====
NODE_ENV=development
NEXT_PUBLIC_DEVELOPMENT_MODE=true

# ===== BACKEND API =====
API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
JWT_SECRET=dev_jwt_secret_change_this_in_production
PORT=3001

# ===== FEATURE FLAGS =====
AUTH_ENABLED=false
ENABLE_ANALYTICS=false
ENABLE_MOCK_SERVICES=false

# ===== AMPLIFY =====
AWS_APP_ID=d40rmftf5h7p7
AWS_BRANCH=staging
```

## Step 2: Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend/app
pnpm install
cd ../..
```

## Step 3: AWS Setup

### Option A: Using Existing Amplify Environment

```bash
# Pull existing Amplify configuration
amplify pull --appId d40rmftf5h7p7 --envName staging
```

### Option B: Manual AWS Setup

1. **Enable AWS Bedrock Models**:
   - Go to AWS Console → Bedrock
   - Navigate to Model access
   - Enable "Amazon Nova Micro" model (or your preferred model)

2. **Verify DynamoDB Tables**:
   - Ensure the following tables exist in your AWS account:
     - Users-staging
     - Embeds-staging
     - BlogPosts-staging
     - ContentDrafts-staging

3. **IAM Permissions**:
   Your AWS user/role needs these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:*",
           "bedrock:InvokeModel",
           "bedrock:GetFoundationModelAvailability"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

## Step 4: Verify Setup

Run the AWS credentials check:

```bash
node check-aws-credentials.mjs
```

You should see:
- ✅ AWS credentials found
- ✅ DynamoDB connection successful
- ✅ Tables accessible

## Step 5: Start the Application

### Terminal 1: Frontend (Next.js)

```bash
pnpm dev
```

This starts the frontend on http://localhost:3000

### Terminal 2: Backend API (Fastify)

```bash
cd backend/app
pnpm dev
```

This starts the backend API on http://localhost:3001

## Step 6: Test the Application

1. **Open the app**: http://localhost:3000
2. **Check health endpoint**: http://localhost:3000/api/health
3. **Navigate to dashboard**: http://localhost:3000/dashboard

## What's Connected

✅ **Dashboard Page**:
- Real-time metrics from backend API
- Platform connections status
- Dynamic data loading with loading states

✅ **Settings Page**:
- User profile management via DynamoDB
- Platform connections management
- Preferences saved to database

✅ **Insights Page**:
- Real embeds data from DynamoDB
- Dashboard metrics from backend
- Dynamic KPI cards

✅ **Content Generation**:
- AWS Bedrock integration for AI content
- Fallback to mock data if Bedrock fails
- Content drafts saved to DynamoDB

## Troubleshooting

### Issue: AWS Credentials Error
```
CredentialsProviderError: Could not load credentials from any providers
```
**Solution**: Ensure `.env.local` exists with valid AWS credentials

### Issue: DynamoDB Table Not Found
```
ResourceNotFoundException: Requested resource not found
```
**Solution**: Run `amplify push` or create tables manually in AWS Console

### Issue: Bedrock Access Denied
```
AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel
```
**Solution**: Enable model access in AWS Bedrock console

### Issue: Backend API Not Responding
**Solution**: Ensure backend is running on port 3001 (Terminal 2)

## Next Steps

1. **Test Content Generation**:
   - Go to Dashboard → Content
   - Create a new blog post
   - Watch it generate using AWS Bedrock

2. **Connect Platforms**:
   - Go to Settings → Platforms
   - Connect your music platforms

3. **View Analytics**:
   - Go to Insights
   - See real-time data from your connected platforms

## Development Tips

- Keep both terminals running (frontend + backend)
- Check browser console for errors
- Use `check-aws-credentials.mjs` to debug AWS issues
- Mock services can be re-enabled by setting `ENABLE_MOCK_SERVICES=true`

## Support

If you encounter issues:
1. Check the health endpoint: http://localhost:3000/api/health
2. Review backend logs in Terminal 2
3. Verify AWS credentials with `node check-aws-credentials.mjs`
4. Check the documentation in `/backend` folder 