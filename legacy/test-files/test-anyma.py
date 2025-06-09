#!/usr/bin/env python3
"""
Test script specifically for searching Anyma using the Scout agent with real Soundcharts API
"""

import boto3
import json
import time

def test_anyma_search():
    """Test searching for Anyma specifically"""
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    agent_id = 'W00SGH6WWS'  # Scout agent ID
    alias_id = 'IYUGGGCHR3'  # Scout agent alias
    
    print("🎯 Testing Scout Agent - Anyma Search")
    print(f"Agent ID: {agent_id}")
    print(f"Alias ID: {alias_id}")
    
    # Specific Anyma search query
    test_message = "What was the latest song for Anyma?"
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=f'anyma-test-{int(time.time())}',
            inputText=test_message,
            sessionState={
                'sessionAttributes': {
                    'userId': f'anyma-user-{int(time.time())}',
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
        print(result)
        
        return True
        
    except Exception as e:
        print(f"❌ Scout Agent Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Anyma Search with Real Soundcharts API")
    print("=" * 60)
    
    # Test Anyma search
    success = test_anyma_search()
    
    if success:
        print("✅ Anyma search completed!")
    else:
        print("❌ Anyma search failed") 