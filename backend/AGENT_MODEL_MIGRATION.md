# Bedrock Agent Model Migration: Claude 3.7 to Claude 4 Sonnet

## Overview
This document details the migration from Claude 3.7 Sonnet to Claude 4 Sonnet for the Patchline Bedrock Agent, including issues encountered and resolutions.

## Migration Date
May 28, 2025

## Key Changes

### 1. Model Configuration Update
**File**: `backend/scripts/config.py`
- Changed default model from `claude-3-7-sonnet` to `claude-4-sonnet`
- Updated inference profile to use Claude 4 Sonnet: `us.anthropic.claude-sonnet-4-20250514-v1:0`

### 2. Lambda Query Parsing Fix
**File**: `backend/lambda/gmail-action-handler.py`
- Fixed parsing logic for Bedrock Agent request format
- Issue: Query parameters were wrapped in `properties` array but parsing was looking in wrong location
- Solution: Updated parsing to correctly extract from `content.application/json.properties`

### 3. Unicode Encoding Fix
**File**: `backend/scripts/create-bedrock-agent.py`
- Replaced unicode emojis with plain text to fix Windows encoding issues
- Changed emojis like 🤖, ✅, ❌ to [ROBOT], [OK], [ERROR] etc.

## Deployment Process

### Correct Order:
1. Delete existing agent (if any)
2. Create new Bedrock agent
3. Get agent ID and alias ID
4. Deploy Lambda functions with agent IDs as environment variables
5. Update .env.local with new IDs
6. Update Amplify environment variables

### Script Used:
```bash
python backend/scripts/deploy-all.py
```

This script automatically:
- Deletes existing agent
- Creates new agent with Claude 4 Sonnet
- Deploys Lambdas with correct agent IDs
- Updates local environment

## Current Configuration

- **Agent ID**: C7VZ0QWDSG
- **Alias ID**: WDGFWL1YCB
- **Model**: Claude 4 Sonnet (us.anthropic.claude-sonnet-4-20250514-v1:0)
- **Lambda Functions**: Deployed with correct agent IDs

## Issues Encountered

### 1. Query Parsing Failure
- **Symptom**: "Query is empty after parsing!"
- **Cause**: Lambda was looking for query in wrong location in request
- **Fix**: Updated parsing logic to handle Bedrock's `properties` array format

### 2. Model Mismatch
- **Symptom**: Agent using Claude 3.7 instead of Claude 4
- **Cause**: Config file had Claude 3.7 as default
- **Fix**: Updated config.py to use Claude 4 Sonnet

### 3. OAuth Token Refresh
- **Symptom**: 401 errors when Lambda tries to access Gmail
- **Possible Causes**:
  - Token expired and refresh failing
  - Secrets Manager credentials outdated
  - API quotas exceeded

## Testing

### Console Test (Working):
```
Query: "did I get an email from Mehdi?"
Result: Successfully returned 9 emails from Mehdi
Model: Claude 4 Sonnet correctly used
```

### Website Test (Issue):
- Lambda receives request correctly
- Query parsing works
- Gmail API returns 401 error
- Token refresh attempted but fails

## Next Steps

1. **Update Amplify Environment Variables**:
   - BEDROCK_AGENT_ID=C7VZ0QWDSG
   - BEDROCK_AGENT_ALIAS_ID=WDGFWL1YCB

2. **Check OAuth Token**:
   - Verify token in DynamoDB is valid
   - Check if refresh token is still valid
   - May need to re-authenticate Gmail

3. **Monitor Logs**:
   - Watch for 401 errors in Lambda logs
   - Check if token refresh is succeeding

## Key Learnings

1. **Central Configuration**: Having config.py as single source of truth made model switching easier
2. **Deployment Order Matters**: Agent must be created before Lambda deployment to pass correct IDs
3. **Query Format**: Bedrock Agent sends parameters in specific format that must be parsed correctly
4. **Unicode Issues**: Windows PowerShell has encoding issues with emojis in Python scripts 