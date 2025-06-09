#!/usr/bin/env python3

import boto3
import json
import time
from datetime import datetime

def test_legal_agent():
    """Test Legal Agent via Bedrock Agent Runtime"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Legal Agent IDs
    AGENT_ID = "SOZZFV6SYD"
    ALIAS_ID = "ARI2XUDNUA"
    
    print("🧪 Testing Legal Agent")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Alias ID: {ALIAS_ID}")
    print("-" * 50)
    
    # Test cases for Legal Agent
    test_cases = [
        {
            'query': 'What are the key legal considerations for a music streaming platform?',
            'description': 'Music industry legal expertise'
        },
        {
            'query': 'Draft a basic contract template for artist collaborations',
            'description': 'Legal document generation'
        },
        {
            'query': 'What copyright laws apply to AI-generated music content?',
            'description': 'AI and copyright law analysis'
        },
        {
            'query': 'Analyze the legal risks of blockchain-based royalty payments',
            'description': 'Blockchain legal compliance'
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 Test Case {i}: {test_case['description']}")
        print(f"Query: {test_case['query']}")
        
        try:
            # Generate unique session ID
            session_id = f"test-user-{int(time.time())}"
            
            response = bedrock_agent.invoke_agent(
                agentId=AGENT_ID,
                agentAliasId=ALIAS_ID,
                sessionId=session_id,
                inputText=test_case['query']
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
            
            # Check for common error patterns
            if "I apologize" in full_response or "I don't have access" in full_response:
                print("⚠️  Generic response detected - may indicate API integration issues")
            elif "error" in full_response.lower():
                print("❌ Error detected in response")
            else:
                print("✅ Response looks good!")
                
        except Exception as e:
            print(f"❌ Error invoking Legal agent: {str(e)}")
            
        print("-" * 30)
        time.sleep(2)  # Brief pause between tests

if __name__ == "__main__":
    print("🚀 Starting Legal Agent Test")
    print(f"Timestamp: {datetime.now().isoformat()}")
    test_legal_agent()
    print("\n✅ Legal Agent testing complete!") 