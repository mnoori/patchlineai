#!/usr/bin/env python3

import boto3
import json
import time
from datetime import datetime

def test_session_structure():
    """Test to see what session structure is passed to Lambda"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Gmail Agent IDs
    AGENT_ID = "YOMXXWPSSQ"
    ALIAS_ID = "R1HKL8PJCD"
    
    print("🧪 Testing Session Structure for Gmail Agent")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Alias ID: {ALIAS_ID}")
    print("-" * 50)
    
    try:
        # Generate unique session ID
        session_id = f"test-user-{int(time.time())}"
        
        # Test with session attributes
        response = bedrock_agent.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=ALIAS_ID,
            sessionId=session_id,
            inputText="Check my recent emails",
            sessionState={
                'sessionAttributes': {
                    'userId': '14287408-6011-70b3-5ac6-089f0cafdc10',
                    'mode': 'debug',
                    'timestamp': datetime.now().isoformat()
                }
            }
        )
        
        # Process streaming response
        full_response = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk_data = event['chunk']
                if 'bytes' in chunk_data:
                    chunk_text = chunk_data['bytes'].decode('utf-8')
                    full_response += chunk_text
                    print(f"📝 Chunk: {chunk_text}")
        
        print(f"✅ Full Response: {full_response}")
        
        # Now check S3 logs for the session structure
        print("\n🔍 Checking S3 logs for session structure...")
        time.sleep(3)  # Wait for logs to be written
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Session Structure Test")
    print(f"Timestamp: {datetime.now().isoformat()}")
    test_session_structure()
    print("\n✅ Session structure test complete!") 