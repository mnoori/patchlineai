# Multi-Agent System Troubleshooting Guide

## 🚨 Known Issues & Solutions

### Issue: Supervisor Agent Not Delegating

**Symptoms:**
- Supervisor agent responds but doesn't actually call Gmail/Legal agents
- Response contains synthetic content instead of real email/contract data
- Works in AWS Console but not through web interface

**Diagnosis:**
```bash
# Check environment variables are set
echo $BEDROCK_SUPERVISOR_AGENT_ID
echo $BEDROCK_SUPERVISOR_AGENT_ALIAS_ID

# Should output:
# TYQSQNB2GI
# BXHO9QQ40S
```

**Solution:**
1. Add environment variables to Amplify:
   - `BEDROCK_SUPERVISOR_AGENT_ID=TYQSQNB2GI`
   - `BEDROCK_SUPERVISOR_AGENT_ALIAS_ID=BXHO9QQ40S`
2. Redeploy Amplify application
3. Test with: "Mehdi sent a contract today, can you run it through Legal?"

---

### Issue: Agent Returns "403 Forbidden"

**Symptoms:**
- Individual agents fail with 403 error
- "Access denied" in API response

**Causes:**
- Missing IAM permissions
- Incorrect agent ID/alias
- Lambda function not deployed

**Solution:**
1. Verify agent status in AWS Bedrock Console
2. Check IAM role has `bedrock:InvokeAgent` permission
3. Confirm Lambda functions are deployed and working
4. Test Lambda directly in AWS Console

---

### Issue: "Agent Not Found" Error

**Symptoms:**
- 404 error when calling agent
- ResourceNotFoundException

**Solution:**
1. Verify agent IDs are correct:
   ```bash
   # Gmail Agent
   C7VZ0QWDSG / WDGFWL1YCB
   
   # Legal Agent  
   XL4F5TPHXB / EC7EVTWEUQ
   
   # Supervisor Agent
   TYQSQNB2GI / BXHO9QQ40S
   ```
2. Check agent status is "PREPARED" in AWS Console
3. Ensure correct AWS region (us-east-1)

---

### Issue: Models Not Available

**Symptoms:**
- ValidationException during agent creation
- "Model not accessible" error

**Solution:**
1. Request model access in AWS Bedrock Console
2. Use alternative models:
   - Claude 3.7 Sonnet: `us.anthropic.claude-3-7-sonnet-20250219-v1:0`
   - Claude 4 Sonnet: `us.anthropic.claude-sonnet-4-20250514-v1:0`

---

## 🔧 Testing Commands

### Test Individual Agents
```bash
cd backend/scripts
python test-full-workflow.py
```

### Verify Environment
```bash
python production-verification.py
```

### Check Agent Status
```python
import boto3
client = boto3.client('bedrock-agent', region_name='us-east-1')
response = client.get_agent(agentId='TYQSQNB2GI')
print(response['agent']['agentStatus'])
```

---

## 📊 Expected vs Actual Behavior

### Working Supervisor (AWS Console)
```json
{
  "trace": {
    "orchestrationTrace": {
      "invocationInput": {
        "functionCalls": [
          {
            "name": "delegate_to_gmail_collaborator",
            "parameters": {
              "message": "Search for emails from Mehdi..."
            }
          }
        ]
      }
    }
  }
}
```

### Non-Working Supervisor (Web Interface)
```json
{
  "response": "I've reviewed the performance agreement...",
  "actionsInvoked": [],
  "hasEmailContext": false
}
```

---

## 🎯 Quick Fixes

### Reset Agent Configuration
1. Update environment variables in Amplify
2. Redeploy application
3. Clear browser cache
4. Test with fresh session

### Verify API Routing
Check logs for:
```
[DEBUG] Active Agent: Supervisor Agent (SUPERVISOR_AGENT)
[DEBUG] BEDROCK_AGENT_ID: TYQSQNB2GI  
[DEBUG] BEDROCK_AGENT_ALIAS_ID: BXHO9QQ40S
```

### Test Direct Agent Calls
Use AWS CLI to test agents directly:
```bash
aws bedrock-agent-runtime invoke-agent \
  --agent-id TYQSQNB2GI \
  --agent-alias-id BXHO9QQ40S \
  --session-id test-session \
  --input-text "Test message"
```

---

*Last Updated: May 29, 2025* 