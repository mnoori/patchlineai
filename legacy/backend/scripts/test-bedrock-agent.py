#!/usr/bin/env python3
"""
Test script for Patchline Bedrock Agent with Gmail integration
"""

import boto3
import json
import os
import time
from pathlib import Path

def load_env_file():
    """Load environment variables from .env.local file in project root"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"📁 Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print("✅ Environment variables loaded from .env.local")
    
    # Normalize variable names
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']

def test_agent_basic():
    """Test basic agent invocation"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    agent_alias_id = os.environ.get('BEDROCK_AGENT_ALIAS_ID')
    
    if not agent_id or not agent_alias_id:
        print("❌ Missing BEDROCK_AGENT_ID or BEDROCK_AGENT_ALIAS_ID in environment")
        return False
    
    print(f"🤖 Testing Bedrock Agent: {agent_id}")
    print(f"🔗 Using alias: {agent_alias_id}")
    
    # Initialize Bedrock runtime client
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=region)
    
    # Test 1: Simple greeting
    print("\n📝 Test 1: Simple greeting")
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId='test-session-1',
            inputText="Hello! Can you help me with my emails?"
        )
        
        # Process streaming response
        event_stream = response['completion']
        full_response = ""
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    full_response += chunk['bytes'].decode('utf-8')
        
        print(f"✅ Agent Response: {full_response}")
        
    except Exception as e:
        print(f"❌ Test 1 failed: {str(e)}")
        return False
    
    # Test 2: Ask about Gmail capabilities
    print("\n📝 Test 2: Ask about Gmail capabilities")
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId='test-session-2',
            inputText="What can you do with my Gmail account? What actions are available?"
        )
        
        # Process streaming response
        event_stream = response['completion']
        full_response = ""
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    full_response += chunk['bytes'].decode('utf-8')
        
        print(f"✅ Agent Response: {full_response}")
        
    except Exception as e:
        print(f"❌ Test 2 failed: {str(e)}")
        return False
    
    print("\n🎉 Basic agent tests completed successfully!")
    return True

def test_agent_with_trace():
    """Test agent with trace enabled to see action group invocations"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    agent_alias_id = os.environ.get('BEDROCK_AGENT_ALIAS_ID')
    
    print(f"\n🔍 Testing with trace enabled...")
    
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=region)
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId='test-session-trace',
            inputText="Can you search for emails about contracts?",
            enableTrace=True
        )
        
        # Process streaming response with trace
        event_stream = response['completion']
        full_response = ""
        traces = []
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    full_response += chunk['bytes'].decode('utf-8')
            elif 'trace' in event:
                traces.append(event['trace'])
        
        print(f"✅ Agent Response: {full_response}")
        print(f"🔍 Trace Events: {len(traces)} events captured")
        
        # Print trace details
        for i, trace in enumerate(traces):
            print(f"   Trace {i+1}: {json.dumps(trace, indent=2, default=str)}")
        
    except Exception as e:
        print(f"❌ Trace test failed: {str(e)}")
        return False
    
    return True

def main():
    """Main test function"""
    print("🧪 Patchline Bedrock Agent Test Suite")
    print("=" * 50)
    
    # Run basic tests
    if not test_agent_basic():
        print("❌ Basic tests failed")
        return
    
    # Run trace test
    if not test_agent_with_trace():
        print("❌ Trace test failed")
        return
    
    print("\n" + "=" * 50)
    print("🎉 ALL TESTS PASSED!")
    print("Your Bedrock Agent is working correctly!")
    print("\nNext steps:")
    print("1. Test Gmail OAuth flow: http://localhost:3000/api/auth/gmail")
    print("2. Try asking the agent to search your emails")
    print("3. Test email drafting and sending capabilities")

if __name__ == '__main__':
    main() 