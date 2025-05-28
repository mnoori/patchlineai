#!/usr/bin/env python3
"""
Test Bedrock Agent with session attributes
"""

import boto3
import json
import os
from pathlib import Path

def load_env_file():
    """Load environment variables from .env.local file"""
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

def test_agent_with_session():
    """Test agent with session attributes"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    # Use TSTALIASID which points to DRAFT version with Nova Micro
    agent_alias_id = 'TSTALIASID'  # Changed from ZXJXKIIXVO
    
    if not agent_id:
        print("❌ Missing BEDROCK_AGENT_ID in environment")
        return False
    
    print(f"🤖 Testing Bedrock Agent: {agent_id}")
    print(f"🔗 Using alias: {agent_alias_id} (Test alias pointing to DRAFT)")
    
    # Initialize Bedrock runtime client
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=region)
    
    # Test with session attributes
    print("\n📝 Testing with session attributes...")
    
    # Use a real user ID from your system
    user_id = "14287408-6011-70b3-5ac6-089f0cafdc10"  # Replace with actual user ID
    session_id = f"test-session-{user_id}"
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText="Search my emails for contracts",
            enableTrace=True,
            sessionState={
                'sessionAttributes': {
                    'userId': user_id,
                    'mode': 'agent',
                    'timestamp': '2025-01-27T12:00:00Z'
                }
            }
        )
        
        # Process streaming response with trace
        event_stream = response['completion']
        full_response = ""
        traces = []
        action_invocations = []
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    full_response += chunk['bytes'].decode('utf-8')
            elif 'trace' in event:
                trace = event['trace']
                traces.append(trace)
                
                # Look for action invocations
                if 'trace' in trace:
                    trace_data = trace['trace']
                    if 'orchestrationTrace' in trace_data:
                        orch_trace = trace_data['orchestrationTrace']
                        if 'invocationInput' in orch_trace:
                            inv_input = orch_trace['invocationInput']
                            if 'actionGroupInvocationInput' in inv_input:
                                action_input = inv_input['actionGroupInvocationInput']
                                action_invocations.append({
                                    'actionGroup': action_input.get('actionGroupName'),
                                    'apiPath': action_input.get('apiPath'),
                                    'httpMethod': action_input.get('httpMethod')
                                })
        
        print(f"\n✅ Agent Response: {full_response}")
        print(f"\n🔍 Trace Events: {len(traces)} events captured")
        print(f"\n🎯 Action Invocations: {len(action_invocations)}")
        
        for i, action in enumerate(action_invocations):
            print(f"   Action {i+1}: {action['actionGroup']} - {action['httpMethod']} {action['apiPath']}")
        
        # Print detailed trace for debugging
        if traces:
            print("\n📋 First few trace events:")
            for i, trace in enumerate(traces[:3]):
                print(f"\n   Trace {i+1}:")
                print(json.dumps(trace, indent=2, default=str))
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Bedrock Agent with Session Attributes")
    print("="*50)
    
    success = test_agent_with_session()
    
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n❌ Test failed!") 