# Development and Production Mode Switching Guide

## Overview
This guide explains how to switch between development and production modes in the Patchline AI platform, including all necessary steps and considerations.

## Quick Reference

### Switch to Production Mode
```bash
# 1. Edit lib/config.ts
export const IS_DEVELOPMENT_MODE = false

# 2. Clear caches
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force tsconfig.tsbuildinfo

# 3. Test build locally (optional)
pnpm build

# 4. Commit and push
git add -A
git commit -m "Switch to production mode"
git push origin your-branch:master --force
```

### Switch to Development Mode
```bash
# 1. Edit lib/config.ts
export const IS_DEVELOPMENT_MODE = true

# 2. Start development server
pnpm dev
```

## Detailed Steps

### 1. Configuration File Changes

#### lib/config.ts
The main toggle for development/production mode:

```typescript
// For PRODUCTION deployment
export const IS_DEVELOPMENT_MODE = false

// For LOCAL development
export const IS_DEVELOPMENT_MODE = true
```

**What this affects:**
- AWS SDK initialization (disabled in dev mode)
- Mock data usage
- Authentication bypass options
- API endpoint selection
- Error handling verbosity

### 2. Environment Variables

#### Development (.env.local)
```bash
# Can use either AWS_ prefix or without
ACCESS_KEY_ID=your_access_key
SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Local development URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Production (Amplify Console)
Set these in AWS Amplify Console > App Settings > Environment Variables:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.patchline.ai
AWS_REGION=us-east-1
# AWS credentials are injected by Amplify IAM role
```

### 3. Build Configuration

#### Development Build
```bash
# Standard development build
pnpm dev

# Build with type checking
pnpm build:with-types

# Analyze bundle sizes
pnpm analyze
```

#### Production Build (amplify.yml)
The production build uses a special configuration to handle memory constraints:

1. Creates a minimal tsconfig for production
2. Skips heavy type checking
3. Uses 14GB memory allocation (for 16GB instance)

### 4. Common Issues and Solutions

#### Issue: Webpack SIGKILL during TypeScript checking
**Cause**: Memory exhaustion during type checking
**Solution**: Production build automatically uses minimal tsconfig

#### Issue: "Cannot read properties of undefined"
**Cause**: Windows-specific webpack issue
**Solution**: Build runs fine on Linux (Amplify environment)

#### Issue: Environment variables not loading
**Cause**: Different naming conventions (AWS_ prefix)
**Solution**: Code checks both `AWS_ACCESS_KEY_ID` and `ACCESS_KEY_ID`

### 5. Performance Optimizations Active in Production

When `IS_DEVELOPMENT_MODE = false`:
- Next.js image optimization enabled (AVIF/WebP)
- Aggressive caching headers applied
- Bundle splitting optimized
- Tree shaking active
- Optional dependencies excluded

### 6. Testing Production Mode Locally

```bash
# 1. Set production mode
# Edit lib/config.ts: IS_DEVELOPMENT_MODE = false

# 2. Build locally
pnpm build

# 3. Start production server
pnpm start

# 4. Test at http://localhost:3000
```

**Note**: Some features may not work locally in production mode due to:
- Missing AWS credentials
- Different domain expectations
- CORS restrictions

### 7. Deployment Checklist

Before deploying to production:
- [ ] Set `IS_DEVELOPMENT_MODE = false`
- [ ] Run `pnpm install` to update lockfile
- [ ] Clear build caches
- [ ] Test critical features locally
- [ ] Verify environment variables in Amplify Console
- [ ] Check OAuth redirect URIs are updated

### 8. Rollback Procedure

If issues occur after deployment:
1. In Amplify Console: "Redeploy this version" on previous successful build
2. Locally: `git revert HEAD` and push
3. Set `IS_DEVELOPMENT_MODE = true` for debugging

### 9. Monitoring After Deployment

Check these metrics post-deployment:
- Build logs in Amplify Console
- CloudWatch logs for runtime errors
- Page load times in browser DevTools
- Memory usage in Amplify metrics

## Quick Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm analyze               # Analyze bundle sizes

# Production
pnpm build                 # Production build
pnpm start                 # Start production server

# Utilities
pnpm clean                 # Clear all caches
git push origin branch:master --force  # Deploy to Amplify
```

## Notes

1. **Always test locally first** when switching modes
2. **Update pnpm-lock.yaml** after package.json changes
3. **Monitor first deployment** after major changes
4. **Keep development mode** for local work to avoid AWS costs 