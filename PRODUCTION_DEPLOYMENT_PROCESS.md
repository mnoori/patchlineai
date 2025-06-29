# Production Deployment Process - Complete Guide

## Overview
This document provides step-by-step instructions for deploying Patchline to production, including all Windows-specific considerations and temporary fixes.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] Set `IS_DEVELOPMENT_MODE = false` in `lib/config.ts`
- [ ] Verify all TypeScript errors are fixed
- [ ] Test local build with `npm run build`
- [ ] Check git status and commit all changes

### 2. Environment Variables
Ensure these are set in Amplify Console:
- `NODE_ENV=production`
- `NEXTAUTH_URL=https://www.patchline.ai`
- All AWS credentials and API keys
- Database table names (production versions)

## Step-by-Step Deployment Process

### Step 1: Switch to Production Mode
```bash
# Edit lib/config.ts
export const IS_DEVELOPMENT_MODE = false
```

### Step 2: Fix Windows-Specific Issues
**Note**: Document any Windows-specific temporary changes made during development:

1. **PowerShell vs Bash Commands**:
   - Use `Remove-Item -Recurse -Force .next` instead of `rm -rf .next`
   - Use `; ` instead of `&&` for command chaining in PowerShell

2. **File Path Issues**:
   - Check for any hardcoded Unix paths
   - Verify import paths use forward slashes

3. **Build Cache Issues**:
   - Clear `.next` directory before production builds
   - May need to clear `node_modules/.cache` if issues persist

### Step 3: Test Local Build
```bash
# Clear cache first
Remove-Item -Recurse -Force .next

# Run production build
npm run build
```

**Common Build Issues & Solutions**:

1. **TypeScript Errors**:
   - S3UploadResult vs string[] type mismatches
   - Fix: Extract URLs from S3UploadResult objects

2. **Webpack Bundle Errors**:
   - "Cannot read properties of undefined (reading 'length')"
   - May be related to environment variable changes
   - Try: Clear all caches, restart terminal

3. **Environment Variable Issues**:
   - Production mode changes how env vars are loaded
   - Verify `.env.local` is being read correctly

### Step 4: Commit and Push
```bash
git add -A
git commit -m "Production deployment: Switch to production mode and fix build issues"
git push origin amplify-production-ready:master --force
```

### Step 5: Monitor Amplify Deployment
1. Go to AWS Amplify Console
2. Watch build logs for errors
3. Verify deployment completes successfully

## Current Issues & Solutions

### Issue 1: Webpack Bundle Error (Windows-Specific)
**Error**: `Cannot read properties of undefined (reading 'length')`
**Status**: Windows compatibility issue - build works on Amplify (Linux)
**Root Cause**: Windows-specific webpack bundling issue in production mode
**Potential Causes**:
- File path differences between Windows and Linux
- Webpack WASM hash processing differences on Windows
- Environment variable handling differences

**Solutions**:
1. **Recommended**: Push to Amplify and let Linux environment handle the build
2. **Alternative**: Use WSL (Windows Subsystem for Linux) for local builds
3. **Workaround**: Build in development mode locally, deploy in production mode

**Current Status**: TypeScript errors fixed, ready for Amplify deployment

### Issue 2: S3 Upload Type Mismatches
**Error**: `Type 'S3UploadResult[]' is not assignable to type 'string[]'`
**Status**: Fixed
**Solution**: Extract URLs from upload results:
```typescript
const uploadResults = await s3Uploader.uploadMultipleImages(...)
const urls = uploadResults.map(result => result.url)
```

## Rollback Process

If deployment fails:
1. Revert in Amplify Console to previous successful build
2. Switch back to development mode: `IS_DEVELOPMENT_MODE = true`
3. Fix issues locally
4. Test thoroughly before re-deploying

## Post-Deployment Verification

### Critical Features to Test:
- [ ] User authentication works
- [ ] Demo request form saves to DynamoDB
- [ ] Platform integrations (Spotify, Gmail) work
- [ ] Agent pages load correctly
- [ ] Dashboard displays properly

### Performance Checks:
- [ ] Page load times are acceptable
- [ ] No console errors in browser
- [ ] All API endpoints respond correctly

## Windows Development Notes

### PowerShell Commands:
```powershell
# Clear build cache
Remove-Item -Recurse -Force .next

# Check git status
git status

# Build project
npm run build

# Push to master
git push origin amplify-production-ready:master --force
```

### Common Windows Issues:
1. **Path separators**: Use `/` in code, `\` in Windows paths
2. **Command syntax**: PowerShell vs Bash differences
3. **File permissions**: May need admin rights for some operations

## Lessons Learned

### What to Document Next Time:
1. Every temporary fix made for Windows compatibility
2. All environment variable changes
3. Build configuration modifications
4. Any workarounds for development vs production differences

### Process Improvements:
1. Create automated scripts for mode switching
2. Add build validation steps
3. Document all platform-specific considerations
4. Create rollback automation

## Next Steps After Successful Deployment

1. Update OAuth redirect URIs in provider consoles
2. Test all integrations with production URLs
3. Monitor error logs for first 24 hours
4. Update DNS if needed
5. Set up monitoring and alerting

---

**Last Updated**: December 2024
**Status**: In Progress - Resolving webpack build issues 