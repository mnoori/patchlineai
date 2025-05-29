#!/usr/bin/env python3
"""
Test script for multi-agent system
Tests both Gmail and Legal agents
"""

import boto3
import json
import os
from pathlib import Path

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file in project root"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Load env vars
load_env_file()

# Initialize AWS clients
REGION = os.environ.get('AWS_REGION', 'us-east-1')
bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)

# Agent configurations
AGENTS = {
    'GMAIL': {
        'ID': os.environ.get('BEDROCK_AGENT_ID', 'C7VZ0QWDSG'),
        'ALIAS_ID': os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'WDGFWL1YCB'),
        'NAME': 'Gmail Agent'
    },
    'LEGAL': {
        'ID': os.environ.get('BEDROCK_LEGAL_AGENT_ID', 'XL4F5TPHXB'),
        'ALIAS_ID': os.environ.get('BEDROCK_LEGAL_AGENT_ALIAS_ID', 'EC7EVTWEUQ'),
        'NAME': 'Legal Agent'
    }
}

def test_agent(agent_key, prompt):
    """Test an agent with a given prompt"""
    agent = AGENTS[agent_key]
    print(f"\n{'='*50}")
    print(f"Testing {agent['NAME']}")
    print(f"Agent ID: {agent['ID']}")
    print(f"Alias ID: {agent['ALIAS_ID']}")
    print(f"Prompt: {prompt}")
    print('='*50)
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent['ID'],
            agentAliasId=agent['ALIAS_ID'],
            sessionId='test-session-' + agent_key,
            inputText=prompt
        )
        
        print("\nResponse stream:")
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    print(text, end='', flush=True)
        print("\n")
        
    except Exception as e:
        print(f"Error testing {agent['NAME']}: {str(e)}")

def main():
    """Main test function"""
    print("Multi-Agent System Test")
    print("="*70)
    
    # Test Gmail Agent
    test_agent('GMAIL', "What are my recent emails about?")
    
    # Test Legal Agent
    test_agent('LEGAL', "Can you analyze this sample contract: 'Artist agrees to perform 3 shows for $10,000 total.'")
    
    print("\nAll tests completed!")

if __name__ == '__main__':
    main() 