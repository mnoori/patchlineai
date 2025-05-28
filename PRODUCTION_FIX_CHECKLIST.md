# Production Fix Checklist

## Issues Identified

1. **Gmail Lambda showing empty query** - Lambda running old code
2. **Agent using TSTALIASID** - Frontend sending wrong alias ID
3. **Spotify not showing in Catalog** - Frontend needs deployment

## Immediate Actions Required

### 1. Update .env.local with Bedrock Variables
Add these to your `.env.local` file:
```
BEDROCK_AGENT_ID=TG2C910JGY
BEDROCK_AGENT_ALIAS_ID=HSMSCJ23TU
```

### 2. Redeploy Lambda Functions with New Code
```bash
cd backend/scripts
python deploy-lambda-functions.py
```

This will:
- Deploy the updated Gmail handler with proper query parsing
- Add environment variables for Bedrock Agent
- Include detailed debug logging

### 3. Force Push to Master (Already Done)
```bash
git push origin v2-production-ready:master --force
```

### 4. Trigger Amplify Redeploy
Go to AWS Amplify console and:
- Click "Redeploy this version" on the latest commit
- Or make a small commit to trigger auto-deploy

## Verification Steps

1. **Check Lambda Logs**
   - Look for `[DEBUG]` entries showing query parsing
   - Verify `BEDROCK_AGENT_ALIAS_ID` is set correctly

2. **Check Frontend**
   - Spotify should appear in Catalog
   - Platform connections should show correct status
   - Chat should use correct Bedrock alias

## Root Cause Analysis

1. **Lambda Issue**: The Lambda was deployed before our fixes. The deployment script wasn't updating environment variables.

2. **Frontend Issue**: Amplify hasn't redeployed yet after our push to master.

3. **Alias Issue**: The frontend may still be using hardcoded TSTALIASID.

## Long-term Fixes Implemented

1. **Single Source of Truth**: Platform connections now properly map `spotify-artist-profile` to `spotify`
2. **Environment Variables**: Deployment script now includes Bedrock config
3. **Better Logging**: Added detailed debug logs to Lambda for troubleshooting
4. **No Hardcoded Values**: Removed TSTALIASID fallback in chat route 