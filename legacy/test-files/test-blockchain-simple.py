#!/usr/bin/env python3
"""Simple test for Blockchain Agent to see raw responses"""

import boto3
import json
import time
from datetime import datetime

def test_blockchain_simple():
    """Test Blockchain agent with simple balance check"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Blockchain Agent IDs
    AGENT_ID = "W8H34DMCA5"
    ALIAS_ID = "V1S221Y9GO"
    
    print("⛓️ Testing Blockchain Agent - Simple Balance Check")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Alias ID: {ALIAS_ID}")
    print("=" * 50)
    
    # Simple query that should work
    query = "What's my SOL balance?"
    print(f"\n📍 Query: {query}")
    print("-" * 40)
    
    try:
        # Generate unique session ID
        session_id = f"test-blockchain-simple-{int(time.time())}"
        
        # Invoke agent with minimal parameters
        response = bedrock_agent.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=ALIAS_ID,
            sessionId=session_id,
            inputText=query,
            sessionState={
                'sessionAttributes': {
                    'mode': 'agent',
                    'userId': '14287408-6011-70b3-5ac6-089f0cafdc10'
                }
            }
        )
        
        # Process response
        response_text = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    chunk_text = chunk['bytes'].decode('utf-8')
                    response_text += chunk_text
                    
        print(f"\n✅ Response: {response_text}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_blockchain_simple() 