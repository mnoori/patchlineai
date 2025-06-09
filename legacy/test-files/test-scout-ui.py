#!/usr/bin/env python3
"""Test Scout Agent through the UI flow"""

import boto3
import json
import time

def test_scout_ui():
    """Test Scout from UI perspective"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Scout Agent IDs
    AGENT_ID = "W00SGH6WWS"
    ALIAS_ID = "IYUGGGCHR3"
    
    print("🎵 Testing Scout Agent - UI Flow")
    print("=" * 50)
    
    # Test queries
    queries = [
        "Tell me about James Hype",
        "What's the latest song for Anyma?", 
        "Find information about Fred Again"
    ]
    
    for query in queries:
        print(f"\n📍 Query: {query}")
        print("-" * 40)
        
        try:
            # Generate unique session ID
            session_id = f"ui-test-{int(time.time())}"
            
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
                        'timestamp': str(time.time())
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
                        
            print(f"✅ Response: {response_text[:200]}...")
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        time.sleep(2)  # Rate limiting
    
    print("\n✅ Scout UI test complete!")

if __name__ == "__main__":
    test_scout_ui() 