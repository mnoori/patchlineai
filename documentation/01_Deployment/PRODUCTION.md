# Production Deployment Guide

## Overview

This guide explains how to prepare Patchline for production deployment. We use a single branch strategy with environment-based configuration.

## Pre-Production Checklist

### 1. Environment Configuration

Update `.env.production` with production values:
```bash
# Copy from .env.local and update with production values
cp .env.local .env.production

# Required production variables
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-strong-secret>
DATABASE_URL=<production-database-url>

# AWS Production Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<production-key>
AWS_SECRET_ACCESS_KEY=<production-secret>

# Bedrock Production Config
BEDROCK_AGENT_ID=<production-agent-id>
BEDROCK_AGENT_ALIAS_ID=<production-alias>
```

### 2. Disable Development Features

In `lib/config.ts`, ensure DEMO_MODE is false:
```typescript
export const DEMO_MODE = process.env.NODE_ENV === 'development' ? false : false;
```

### 3. Security Updates

1. **Update CORS settings** in `app/api/[...]/route.ts`:
   ```typescript
   const allowedOrigins = process.env.NODE_ENV === 'production' 
     ? ['https://your-domain.com'] 
     : ['http://localhost:3000'];
   ```

2. **Enable rate limiting** for API routes

3. **Set secure headers** in `next.config.js`

### 4. Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Verify database schema
npx prisma db pull
```

### 5. AWS Resources

1. **Lambda Functions**:
   ```bash
   # Deploy production lambdas
   cd backend/scripts
   python deploy-lambda.py --env production
   ```

2. **Bedrock Agent**:
   - Create production agent in AWS Console
   - Update agent ID in environment
   - Ensure production alias is active

3. **DynamoDB**:
   - Create production table: `PlatformConnections-production`
   - Set up backups and point-in-time recovery

### 6. Build Optimization

```bash
# Build for production
npm run build

# Analyze bundle size
npm run analyze

# Run production tests
npm run test:prod
```

### 7. Monitoring Setup

1. **CloudWatch Logs**:
   - Lambda function logs
   - API Gateway logs
   - Application logs

2. **Error Tracking**:
   - Sentry integration
   - Custom error boundaries

3. **Performance Monitoring**:
   - Web Vitals tracking
   - API response times

## Deployment Process

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VARIABLE_NAME production
```

### Option 2: AWS Amplify

```bash
# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 3: Custom EC2/ECS

See `deployment/aws-setup.md` for detailed instructions.

## Post-Deployment

1. **Verify all integrations**:
   - Gmail OAuth flow
   - Bedrock Agent responses
   - Database connections

2. **Run smoke tests**:
   ```bash
   npm run test:e2e:prod
   ```

3. **Monitor metrics**:
   - Response times
   - Error rates
   - User activity

4. **Set up alerts**:
   - High error rate
   - Lambda failures
   - Database issues

## Rollback Strategy

1. **Vercel**: Use automatic rollback or `vercel rollback`
2. **Database**: Restore from backup
3. **Lambda**: Deploy previous version
4. **Agent**: Switch to previous alias

## Maintenance Mode

To enable maintenance mode:
```typescript
// In middleware.ts
export const config = {
  matcher: ['/((?!maintenance).*)'],
};
```

## Security Considerations

1. **API Keys**: Rotate all keys quarterly
2. **OAuth**: Implement token refresh
3. **Data**: Enable encryption at rest
4. **Backup**: Daily automated backups
5. **Access**: Implement IP whitelisting for admin routes

## Performance Optimization

1. **Enable caching**:
   - CloudFront for static assets
   - Redis for session data
   - API response caching

2. **Optimize images**:
   - Use Next.js Image component
   - Enable WebP format
   - Lazy loading

3. **Code splitting**:
   - Dynamic imports for large components
   - Route-based splitting

## Cost Optimization

1. **Lambda**: Use provisioned concurrency wisely
2. **Bedrock**: Monitor token usage
3. **DynamoDB**: Use on-demand pricing initially
4. **S3**: Set lifecycle policies

## Notes

- Always test in staging environment first
- Keep development and production configs separate
- Document any production-specific changes
- Regular security audits recommended 