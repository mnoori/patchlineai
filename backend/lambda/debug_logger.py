import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any

class NoOpLogger:
    """No-operation logger for production - zero overhead"""
    def debug(self, message: str, data: Dict[Any, Any] = None): pass
    def info(self, message: str, data: Dict[Any, Any] = None): pass
    def error(self, message: str, data: Dict[Any, Any] = None): pass
    def trace_event(self, event_name: str, event_data: Dict[Any, Any]): pass

class DevDebugLogger:
    """Full debug logger for development with S3 storage"""
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.s3_client = boto3.client('s3')
        self.bucket_name = 'patchline-files-us-east-1'
        
    def log(self, level: str, message: str, data: Dict[Any, Any] = None):
        """Enhanced logging with S3 storage for debugging"""
        timestamp = datetime.utcnow().isoformat()
        
        # Console log (always in dev)
        console_msg = f"[{level.upper()}] {timestamp} {self.agent_name} {message}"
        print(console_msg)
        
        # S3 log for debugging (always in dev)
        log_entry = {
            'timestamp': timestamp,
            'agent': self.agent_name,
            'level': level,
            'message': message,
            'data': data or {}
        }
        
        try:
            # Write to S3 for real-time debugging
            s3_key = f"debug-logs/{self.agent_name}/{datetime.utcnow().strftime('%Y/%m/%d')}/{timestamp}-{level}.json"
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=json.dumps(log_entry, indent=2, default=str),
                ContentType='application/json'
            )
        except Exception as e:
            print(f"[ERROR] Failed to write debug log to S3: {str(e)}")
    
    def debug(self, message: str, data: Dict[Any, Any] = None):
        self.log('DEBUG', message, data)
    
    def info(self, message: str, data: Dict[Any, Any] = None):
        self.log('INFO', message, data)
    
    def error(self, message: str, data: Dict[Any, Any] = None):
        self.log('ERROR', message, data)
    
    def trace_event(self, event_name: str, event_data: Dict[Any, Any]):
        """Log detailed event traces"""
        self.debug(f"TRACE: {event_name}", event_data)

class ProdLogger:
    """Production logger - only critical errors, no S3"""
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        
    def debug(self, message: str, data: Dict[Any, Any] = None): 
        pass  # No debug logs in prod
    
    def info(self, message: str, data: Dict[Any, Any] = None): 
        pass  # No info logs in prod
    
    def error(self, message: str, data: Dict[Any, Any] = None):
        # Only errors in prod
        timestamp = datetime.utcnow().isoformat()
        print(f"[ERROR] {timestamp} {self.agent_name} {message}")
    
    def trace_event(self, event_name: str, event_data: Dict[Any, Any]): 
        pass  # No traces in prod

def get_logger(agent_name: str):
    """Factory function to get the right logger based on environment"""
    debug_mode = os.environ.get('DEBUG_MODE', 'prod').lower()
    
    if debug_mode == 'dev':
        print(f"[INIT] Using DEV debug logger for {agent_name}")
        return DevDebugLogger(agent_name)
    elif debug_mode == 'extreme':
        print(f"[INIT] Using EXTREME debug logger for {agent_name}")
        return DevDebugLogger(agent_name)  # Could be even more verbose
    elif debug_mode == 'off':
        return NoOpLogger()
    else:  # 'prod' or any other value
        return ProdLogger(agent_name)

# Environment variable guide:
# DEBUG_MODE=dev     -> Full S3 logging + console
# DEBUG_MODE=extreme -> Same as dev (could extend for more detail)  
# DEBUG_MODE=prod    -> Only error console logs
# DEBUG_MODE=off     -> Zero logging (no-op) 