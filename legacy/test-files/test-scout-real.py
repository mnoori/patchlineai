#!/usr/bin/env python3

import boto3
import json
import time
from datetime import datetime

def test_scout_search():
    """Test Scout search for artist information"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Scout Agent IDs
    AGENT_ID = "W00SGH6WWS"
    ALIAS_ID = "IYUGGGCHR3"
    
    print("🧪 Testing Scout Agent - Searching for James Hype")
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
            inputText="Tell me about James Hype",
            sessionState={
                'sessionAttributes': {
                    'userId': '14287408-6011-70b3-5ac6-089f0cafdc10',
                    'mode': 'agent',
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
        
        print(f"\n✅ Full Response: {full_response}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Scout Agent Test")
    print(f"Timestamp: {datetime.now().isoformat()}")
    test_scout_search()
    print("\n✅ Scout test complete!") 