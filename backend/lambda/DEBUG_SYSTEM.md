# Smart Debug Logging System

## Overview

This system provides **zero-overhead** debug logging that can be easily switched between development and production modes.

## 🎯 Debug Modes

| Mode | Performance | Logging | Use Case |
|------|-------------|---------|----------|
| `prod` | **Zero overhead** | Only critical errors to console | Production deployment |
| `dev` | Full logging | All debug info + S3 storage | Development & debugging |
| `extreme` | Full logging | Same as dev (extensible for more detail) | Deep debugging |
| `off` | **Zero overhead** | No logging at all | Performance testing |

## 🚀 Quick Usage

### Switch All Functions to Dev Mode
```bash
python backend/scripts/set-debug-mode.py --mode dev
```

### Switch to Production Mode
```bash
python backend/scripts/set-debug-mode.py --mode prod
```

### Turn Off All Logging
```bash
python backend/scripts/set-debug-mode.py --mode off
```

### Update Specific Functions Only
```bash
python backend/scripts/set-debug-mode.py --mode dev --functions gmail-action-handler scout-action-handler
```

## 🔧 How It Works

### In Your Lambda Code
```python
from debug_logger import get_logger

# Smart logger - automatically adapts based on DEBUG_MODE environment variable
debug_logger = get_logger('my-agent')

# These calls have ZERO overhead in prod mode
debug_logger.debug("Detailed debug info", {'data': some_object})
debug_logger.info("General info", {'status': 'processing'})
debug_logger.error("Critical error", {'error': str(e)})  # Always logged
```

### Performance Impact

| Mode | Function Calls | JSON Serialization | S3 Writes | Performance Impact |
|------|---------------|-------------------|-----------|-------------------|
| `prod` | ❌ Skipped | ❌ Skipped | ❌ Skipped | **Zero overhead** |
| `dev` | ✅ Yes | ✅ Yes | ✅ Yes | Full debugging |
| `off` | ❌ Skipped | ❌ Skipped | ❌ Skipped | **Zero overhead** |

## 📊 Real-time Debugging (Dev Mode Only)

When `DEBUG_MODE=dev`, logs are written to:
- **Console**: CloudWatch Logs (standard)  
- **S3**: `s3://patchline-files-us-east-1/debug-logs/{agent}/{date}/{timestamp}-{level}.json`

### S3 Log Structure
```json
{
  "timestamp": "2024-01-15T10:30:45.123456",
  "agent": "gmail-agent",
  "level": "DEBUG",
  "message": "Processing Gmail request",
  "data": {
    "user_id": "user123",
    "action": "send_email"
  }
}
```

## 🔄 Environment Variables

Each Lambda function can be configured independently:

```bash
# Set environment variable on Lambda function
DEBUG_MODE=dev     # Full S3 + console logging
DEBUG_MODE=prod    # Only errors to console  
DEBUG_MODE=off     # No logging (zero overhead)
DEBUG_MODE=extreme # Maximum verbosity (future use)
```

## 🛠 Implementation Details

### Logger Classes
- **`NoOpLogger`**: Zero-overhead no-op for production
- **`DevDebugLogger`**: Full S3 + console logging for development
- **`ProdLogger`**: Errors-only console logging for production

### Factory Function
```python
def get_logger(agent_name: str):
    debug_mode = os.environ.get('DEBUG_MODE', 'prod').lower()
    
    if debug_mode == 'dev':
        return DevDebugLogger(agent_name)
    elif debug_mode == 'off':
        return NoOpLogger()
    else:  # 'prod' or anything else
        return ProdLogger(agent_name)
```

## 💡 Best Practices

### 1. Use Appropriate Log Levels
```python
debug_logger.debug("Detailed flow info")     # Dev debugging only
debug_logger.info("General status updates")  # Important events
debug_logger.error("Critical failures")      # Always logged
```

### 2. Include Context Data
```python
debug_logger.debug("Processing request", {
    'user_id': user_id,
    'action': action_name,
    'params': params
})
```

### 3. Production Deployment
Always deploy with `DEBUG_MODE=prod` or unset (defaults to prod):
```bash
python backend/scripts/set-debug-mode.py --mode prod
```

### 4. Development Workflow
```bash
# Start debugging
python backend/scripts/set-debug-mode.py --mode dev

# Test your changes...

# Deploy to production
python backend/scripts/set-debug-mode.py --mode prod
```

## 🔍 Troubleshooting

### Check Current Debug Mode
```bash
aws lambda get-function-configuration --function-name gmail-action-handler | grep DEBUG_MODE
```

### View S3 Debug Logs
```bash
aws s3 ls s3://patchline-files-us-east-1/debug-logs/ --recursive
aws s3 cp s3://patchline-files-us-east-1/debug-logs/gmail-agent/2024/01/15/ . --recursive
```

### Performance Testing
Use `DEBUG_MODE=off` to ensure zero logging overhead during performance tests.

---

🎯 **Key Benefit**: This system gives you powerful debugging capabilities in development while maintaining zero performance overhead in production. 