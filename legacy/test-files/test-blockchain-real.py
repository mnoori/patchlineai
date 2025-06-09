#!/usr/bin/env python3
"""Test Blockchain Agent functionality"""

import boto3
import json
import time
from datetime import datetime

def test_blockchain():
    """Test Blockchain agent operations"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Blockchain Agent IDs from the conversation
    AGENT_ID = "W8H34DMCA5"
    ALIAS_ID = "V1S221Y9GO"
    
    print("⛓️ Testing Blockchain Agent")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Alias ID: {ALIAS_ID}")
    print("=" * 50)
    
    # Test queries
    queries = [
        "What's my SOL balance?",
        "Send 0.01 SOL to my coinbase address",
        "Show my recent transactions"
    ]
    
    for query in queries:
        print(f"\n📍 Query: {query}")
        print("-" * 40)
        
        try:
            # Generate unique session ID
            session_id = f"test-blockchain-{int(time.time())}"
            
            # Invoke agent
            response = bedrock_agent.invoke_agent(
                agentId=AGENT_ID,
                agentAliasId=ALIAS_ID,
                sessionId=session_id,
                inputText=query,
                sessionState={
                    'sessionAttributes': {
                        'mode': 'agent',
                        'userId': '14287408-6011-70b3-5ac6-089f0cafdc10',
                        'timestamp': datetime.now().isoformat()
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
                        print(f"📝 Chunk: {chunk_text}")
                        
            print(f"\n✅ Full Response: {response_text}")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        time.sleep(2)  # Rate limiting
    
    print("\n✅ Blockchain test complete!")

if __name__ == "__main__":
    test_blockchain() 