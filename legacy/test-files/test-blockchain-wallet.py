#!/usr/bin/env python3
"""Test Blockchain Agent with wallet address"""

import boto3
import json
import time
from datetime import datetime

def test_blockchain_with_wallet():
    """Test Blockchain agent operations with wallet"""
    
    # Bedrock Agent Runtime client
    bedrock_agent = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    # Blockchain Agent IDs from the conversation
    AGENT_ID = "W8H34DMCA5"
    ALIAS_ID = "V1S221Y9GO"
    WALLET = "3Pe8uEGq2gbgYHXG9DnQ5RL45DNDvf7dnjKcGTj2eVuJ"
    
    print("⛓️ Testing Blockchain Agent WITH WALLET")
    print(f"Wallet: {WALLET}")
    print("=" * 50)
    
    # Test balance check with wallet
    query = f"What's the balance of {WALLET}?"
    print(f"\n📍 Query: {query}")
    
    try:
        session_id = f"test-wallet-{int(time.time())}"
        
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
        
        response_text = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    response_text += chunk['bytes'].decode('utf-8')
                    
        print(f"✅ Response: {response_text}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_blockchain_with_wallet() 