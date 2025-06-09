#!/usr/bin/env python3
"""
Test script to trigger agents and verify the enhanced debug logging system
"""

import boto3
import json
import time
from datetime import datetime

def test_scout_agent():
    """Test the scout agent with a simple artist search"""
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    agent_id = 'W00SGH6WWS'  # Scout agent ID
    alias_id = 'IYUGGGCHR3'  # Scout agent alias
    
    print("🎯 Testing Scout Agent...")
    print(f"Agent ID: {agent_id}")
    print(f"Alias ID: {alias_id}")
    
    # Test message
    test_message = "Search for hyperpop artists with growing follower counts"
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=f'test-session-{int(time.time())}',
            inputText=test_message,
            sessionState={
                'sessionAttributes': {
                    'userId': f'test-user-{int(time.time())}',
                    'mode': 'agent'
                }
            }
        )
        
        # Process response
        result = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        print("✅ Scout Agent Response:")
        print(result[:500] + "..." if len(result) > 500 else result)
        
        return True
        
    except Exception as e:
        print(f"❌ Scout Agent Error: {str(e)}")
        return False

def test_blockchain_agent():
    """Test the blockchain agent with SOL price check"""
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    agent_id = 'W8H34DMCA5'  # Blockchain agent ID  
    alias_id = 'V1S221Y9GO'  # Blockchain agent alias
    
    print("\n🎯 Testing Blockchain Agent...")
    print(f"Agent ID: {agent_id}")
    print(f"Alias ID: {alias_id}")
    
    # Test message
    test_message = "What's the current price of SOL?"
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=f'test-session-{int(time.time())}',
            inputText=test_message,
            sessionState={
                'sessionAttributes': {
                    'userId': f'test-user-{int(time.time())}',
                    'mode': 'agent'
                }
            }
        )
        
        # Process response
        result = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        print("✅ Blockchain Agent Response:")
        print(result[:500] + "..." if len(result) > 500 else result)
        
        return True
        
    except Exception as e:
        print(f"❌ Blockchain Agent Error: {str(e)}")
        return False

def check_s3_debug_logs():
    """Check if debug logs are being written to S3"""
    s3_client = boto3.client('s3')
    bucket_name = 'patchline-files-us-east-1'
    
    print("\n📊 Checking S3 Debug Logs...")
    
    try:
        # List debug logs from today
        today = datetime.utcnow().strftime('%Y/%m/%d')
        
        for agent in ['scout-agent', 'blockchain-agent']:
            prefix = f'debug-logs/{agent}/{today}/'
            
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix,
                MaxKeys=10
            )
            
            if 'Contents' in response:
                print(f"✅ Found {len(response['Contents'])} debug logs for {agent}")
                
                # Show the latest log
                latest_log = max(response['Contents'], key=lambda x: x['LastModified'])
                print(f"   Latest: {latest_log['Key']}")
                
                # Read the latest log content
                log_response = s3_client.get_object(
                    Bucket=bucket_name,
                    Key=latest_log['Key']
                )
                log_content = json.loads(log_response['Body'].read())
                print(f"   Content: {log_content['message'][:100]}...")
                
            else:
                print(f"❌ No debug logs found for {agent}")
                
    except Exception as e:
        print(f"❌ Error checking S3 logs: {str(e)}")

def main():
    print("🚀 Testing Enhanced Debug Logging System")
    print("=" * 50)
    
    # Test agents
    scout_success = test_scout_agent()
    blockchain_success = test_blockchain_agent()
    
    # Wait a moment for logs to be written
    print("\n⏳ Waiting 5 seconds for logs to be written...")
    time.sleep(5)
    
    # Check S3 logs
    check_s3_debug_logs()
    
    print("\n" + "=" * 50)
    if scout_success and blockchain_success:
        print("✅ All agents tested successfully!")
        print("\n🔍 To view more detailed logs:")
        print("1. CloudWatch: AWS Console → Lambda → Function → Logs")
        print("2. S3 Debug Logs: AWS Console → S3 → patchline-files-us-east-1 → debug-logs/")
    else:
        print("❌ Some agents had issues - check the debug logs for details")

if __name__ == "__main__":
    main() 