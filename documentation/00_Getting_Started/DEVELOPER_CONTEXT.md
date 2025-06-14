# 🚨 DEVELOPER CONTEXT - MUST READ EVERY TIME

## ⚠️ **CRITICAL DEVELOPMENT PRINCIPLES**

This document contains **ESSENTIAL KNOWLEDGE** that every developer working on Patchline must understand. **READ THIS BEFORE TOUCHING ANY CODE.**

---

## 🎯 **Core Philosophy: Agents Must Figure Things Out**

### ❌ **NEVER DO THIS:**
- Hardcode artist data like "Anyma" in mock responses
- Create fake API responses when real APIs exist
- Build dummy endpoints that return static data
- Skip real API integration for "quick testing"

### ✅ **ALWAYS DO THIS:**
- Use **REAL APIs** (Soundcharts, Gmail, Blockchain RPC)
- Let agents **discover and adapt** to real data
- Build **robust error handling** for API failures
- Create **graceful fallbacks** only when APIs are unavailable

**Example:** When asked "What was the latest song for Anyma?", the system should:
1. Query **real Soundcharts API** for Anyma
2. Return **actual track data** from their database
3. Handle gracefully if artist not found
4. **NEVER** return hardcoded "Running (ft. Meg Myers)"

---

## 🔧 **Smart Debug Logging System**

### **Overview**
We use a **zero-overhead** debug system that adapts based on environment:

```
DEBUG_MODE=dev     → Full S3 + console logging (development)
DEBUG_MODE=prod    → Only critical errors (production)  
DEBUG_MODE=extreme → Maximum verbosity (deep debugging)
DEBUG_MODE=off     → Zero logging (performance testing)
```

### **Key Benefits**
- **Zero performance impact** in production
- **Real-time debugging** via S3 storage
- **Detailed execution traces** for complex flows
- **Easy mode switching** without code changes

---

## 🚀 **Essential Commands**

### **Switch Debug Modes** (Use These Daily)
```bash
# Turn ON debugging for development
python backend/scripts/set-debug-mode.py --mode dev

# Deploy to production with minimal logging
python backend/scripts/set-debug-mode.py --mode prod

# Turn OFF all logging for performance testing
python backend/scripts/set-debug-mode.py --mode off

# Debug specific agents only
python backend/scripts/set-debug-mode.py --mode dev --functions scout-action-handler gmail-action-handler
```

### **Deploy Agents** (After Code Changes)
```bash
# Redeploy all agents with latest code
python backend/scripts/manage-lambda-functions.py --recreate --agent=all

# Deploy specific agent
python backend/scripts/manage-lambda-functions.py --recreate --agent=scout
```

### **Debug Real-Time** (When Things Break)
```bash
# View recent S3 debug logs
aws s3 ls s3://patchline-files-us-east-1/debug-logs/ --recursive

# Download specific error log
aws s3 cp s3://patchline-files-us-east-1/debug-logs/scout-agent/2025/06/09/[timestamp]-ERROR.json error.json

# Check CloudWatch logs
aws logs filter-log-events --log-group-name "/aws/lambda/scout-action-handler" --start-time [timestamp]
```

---

## 🔍 **Debug Logging Architecture**

### **S3 Log Structure**
```
s3://patchline-files-us-east-1/debug-logs/
├── scout-agent/
│   └── 2025/06/09/
│       ├── 2025-06-09T14:30:15.123456-DEBUG.json
│       ├── 2025-06-09T14:30:15.456789-INFO.json
│       └── 2025-06-09T14:30:15.789012-ERROR.json
├── gmail-agent/
├── blockchain-agent/
└── legal-agent/
```

### **Log Entry Format**
```json
{
  "timestamp": "2025-06-09T14:30:15.123456",
  "agent": "scout-agent",
  "level": "DEBUG",
  "message": "Making Soundcharts API request",
  "data": {
    "artist_name": "Anyma",
    "api_url": "https://customer.soundcharts.com/api/v2/search/artist",
    "headers_keys": ["x-app-id", "x-api-key"],
    "response_status": 200
  }
}
```

### **How to Read Logs**
1. **Start with ERROR logs** - Shows what went wrong
2. **Follow DEBUG trace** - Shows execution flow
3. **Check API calls** - Verify real API integration
4. **Validate data flow** - Ensure real data, not mocks

---

## 📊 **Real API Integration Standards**

### **Soundcharts API (Scout Agent)**
```python
# ✅ CORRECT: Real API with credentials from Secrets Manager
def get_soundcharts_credentials():
    secret_id = os.environ.get('SOUNDCHARTS_SECRET_ID')
    secrets_client = boto3.client('secretsmanager')
    response = secrets_client.get_secret_value(SecretId=secret_id)
    return json.loads(response['SecretString'])

# ✅ CORRECT: Real API call with proper error handling
def search_artist_soundcharts(artist_name: str):
    headers = {
        'x-app-id': SOUNDCHARTS_ID,
        'x-api-key': SOUNDCHARTS_TOKEN
    }
    response = requests.get(
        f'{SOUNDCHARTS_API_BASE}/api/v2/search/artist',
        headers=headers,
        params={'query': artist_name}
    )
    # Return REAL data from Soundcharts
```

### **Gmail API (Gmail Agent)**
```python
# ✅ CORRECT: OAuth flow with real Gmail API
def build_gmail_service(user_id: str):
    # Get real OAuth tokens from DynamoDB
    # Build authenticated Gmail service
    # Return real Gmail API client
```

### **Blockchain API (Blockchain Agent)**
```python
# ✅ CORRECT: Real Solana RPC calls
def get_sol_price():
    # Call real CoinGecko API
    # Return actual SOL price
    # Handle rate limits gracefully
```

---

## 🛠 **Development Workflow**

### **1. Start Development Session**
```bash
# Always start with debug mode ON
python backend/scripts/set-debug-mode.py --mode dev

# Verify current mode
aws lambda get-function-configuration --function-name scout-action-handler | grep DEBUG_MODE
```

### **2. Make Code Changes**
```python
# Add debug logging to trace execution
debug_logger.debug("Processing user request", {
    'user_id': user_id,
    'action': action_name,
    'params': request_params
})

# Call REAL APIs, not mocks
real_data = call_external_api(params)
debug_logger.debug("Got real API response", {'data': real_data})
```

### **3. Deploy & Test**
```bash
# Deploy with debug logs included
python backend/scripts/manage-lambda-functions.py --recreate --agent=scout

# Test via UI or direct invocation
# Agent will generate detailed S3 logs
```

### **4. Debug Issues**
```bash
# Check S3 logs for real-time debugging
aws s3 ls s3://patchline-files-us-east-1/debug-logs/scout-agent/ --recursive

# Download and analyze error logs
aws s3 cp s3://patchline-files-us-east-1/debug-logs/scout-agent/[path] error.json
cat error.json | jq .
```

### **5. Deploy to Production**
```bash
# Switch to production mode (zero overhead)
python backend/scripts/set-debug-mode.py --mode prod

# Redeploy with production settings
python backend/scripts/manage-lambda-functions.py --recreate --agent=all
```

---

## 🚨 **Common Anti-Patterns (AVOID)**

### ❌ **Hardcoded Mock Data**
```python
# NEVER DO THIS
MOCK_ARTIST_DATA = {
    "Anyma": {"latest_song": "Running (ft. Meg Myers)"}
}
return MOCK_ARTIST_DATA[artist_name]
```

### ❌ **Fake API Responses**
```python
# NEVER DO THIS
def get_artist_tracks(artist_name):
    return {"tracks": ["fake_track_1", "fake_track_2"]}
```

### ❌ **Disabled Real APIs**
```python
# NEVER DO THIS
# if ENABLE_REAL_API:  # Always use real APIs
#     return call_soundcharts_api(artist)
# else:
#     return mock_data
```

### ❌ **No Error Handling**
```python
# NEVER DO THIS
response = requests.get(api_url)  # No error handling
return response.json()  # Will crash if API fails
```

---

## ✅ **Best Practices**

### **1. Real API First**
```python
# Always try real API first
try:
    real_data = call_external_api(params)
    debug_logger.debug("Real API success", {'data': real_data})
    return real_data
except APIError as e:
    debug_logger.error("Real API failed", {'error': str(e)})
    # Only then consider fallback
    return graceful_fallback_response()
```

### **2. Comprehensive Logging**
```python
debug_logger.debug("Function entry", {'params': params})
debug_logger.debug("Calling external API", {'url': api_url})
debug_logger.debug("API response received", {'status': response.status_code})
debug_logger.error("Unexpected error", {'error': str(e), 'context': context})
```

### **3. Environment-Aware Code**
```python
# Code adapts to environment automatically
debug_logger = get_logger('agent-name')  # Smart factory

# Zero overhead in production
debug_logger.debug("Detailed info")  # No-op in prod mode
debug_logger.error("Critical issue")  # Always logged
```

### **4. Credential Management**
```python
# Always use Secrets Manager in Lambda
def get_api_credentials():
    secrets_client = boto3.client('secretsmanager')
    response = secrets_client.get_secret_value(SecretId=secret_id)
    return json.loads(response['SecretString'])

# Fallback to env vars for local development
api_key = get_from_secrets() or os.environ.get('API_KEY')
```

---

## 🔧 **Troubleshooting Guide**

### **Issue: Agent Returns Generic Responses**
```bash
# Check if real APIs are being called
aws s3 ls s3://patchline-files-us-east-1/debug-logs/[agent]/ --recursive

# Look for API call logs
grep -l "API request" debug-logs/*.json

# Verify credentials are available
aws lambda get-function-configuration --function-name [agent] | grep SECRET
```

### **Issue: Performance Problems**
```bash
# Switch to production mode
python backend/scripts/set-debug-mode.py --mode prod

# Or turn off all logging
python backend/scripts/set-debug-mode.py --mode off
```

### **Issue: Missing Debug Logs**
```bash
# Verify debug mode is enabled
aws lambda get-function-configuration --function-name [agent] | grep DEBUG_MODE

# Check S3 bucket permissions
aws s3 ls s3://patchline-files-us-east-1/debug-logs/
```

### **Issue: API Integration Failures**
```bash
# Check secrets are accessible
aws secretsmanager get-secret-value --secret-id patchline/soundcharts-api

# Verify Lambda has proper permissions
aws lambda get-policy --function-name [agent]

# Check recent error logs
aws s3 cp s3://patchline-files-us-east-1/debug-logs/[agent]/[date]/[timestamp]-ERROR.json -
```

---

## 📚 **Additional Resources**

### **Debug System Files**
- `backend/lambda/debug_logger.py` - Smart logging implementation
- `backend/scripts/set-debug-mode.py` - Mode switching utility  
- `backend/lambda/DEBUG_SYSTEM.md` - Technical documentation

### **API Integration Examples**
- `backend/lambda/scout-action-handler.py` - Soundcharts API integration
- `backend/lambda/gmail-action-handler.py` - Gmail API integration
- `backend/lambda/blockchain-action-handler.py` - Blockchain RPC integration

### **Testing Scripts**
- `test-debug-system.py` - End-to-end testing
- `test-anyma.py` - Specific artist search testing

---

## 🎯 **REMEMBER: The Goal**

**We're building AI agents that work with REAL data from REAL APIs in the REAL world.**

- **Soundcharts** gives us real music industry data
- **Gmail** gives us real email functionality  
- **Blockchain** gives us real crypto operations

**Our job is to make these agents smart enough to navigate real-world complexity, not to create a sandbox of fake data.**

---

### 🚨 **TL;DR - Essential Checklist**

**Before ANY development session:**
```bash
✅ python backend/scripts/set-debug-mode.py --mode dev
✅ Check agents use REAL APIs, not mocks
✅ Add debug logging to trace execution
✅ Test with real data (Anyma, real emails, real transactions)
✅ Monitor S3 logs: s3://patchline-files-us-east-1/debug-logs/
✅ Before production: python backend/scripts/set-debug-mode.py --mode prod
```

**Golden Rule:** *If an agent says "I don't have access to real-time data" - that's a BUG, not a feature.*
