#!/usr/bin/env python3
"""
Test Bedrock Agent with correctly structured session attributes
"""

import boto3
import json
import os
import uuid
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

def test_agent_with_correct_session():
    """Test agent with correctly structured session attributes"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    # Force production alias - this is the one configured in the Lambda environment
    agent_alias_id = 'HSMSCJ23TU'
    
    if not agent_id:
        print("❌ Missing BEDROCK_AGENT_ID in environment")
        return False
    
    print(f"🤖 Testing Bedrock Agent: {agent_id}")
    print(f"🔗 Using alias: {agent_alias_id} (Production alias)")
    
    # Initialize Bedrock runtime client
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=region)
    
    # Test with session attributes
    print("\n📝 Testing with correct session attributes structure...")
    
    # Use a real user ID from your system
    user_id = "14287408-6011-70b3-5ac6-089f0cafdc10"  # This is your actual user ID
    session_id = f"test-session-{uuid.uuid4()}"
    
    print(f"👤 Using user ID: {user_id}")
    print(f"🆔 Session ID: {session_id}")
    
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
                    'timestamp': '2025-05-28T18:00:00Z'
                }
            }
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
                trace = event['trace']
                traces.append(trace)
                
                # Look for specific trace information about the Lambda event
                if 'trace' in trace:
                    trace_data = trace['trace']
                    # Look for Lambda invocations to see session attributes
                    if 'orchestrationTrace' in trace_data:
                        orch_trace = trace_data['orchestrationTrace']
                        if 'invocationOutput' in orch_trace:
                            inv_output = orch_trace['invocationOutput']
                            if 'actionGroupInvocationOutput' in inv_output:
                                action_output = inv_output['actionGroupInvocationOutput']
                                print(f"\n🔍 Action Output: {json.dumps(action_output, indent=2)}")
                                
                        if 'invocationInput' in orch_trace:
                            inv_input = orch_trace['invocationInput']
                            if 'actionGroupInvocationInput' in inv_input:
                                action_input = inv_input['actionGroupInvocationInput']
                                print(f"\n🔍 Action Input: {json.dumps(action_input, indent=2)}")
        
        print(f"\n✅ Agent Response: {full_response}")
        print(f"🔍 Collected {len(traces)} trace events")
        
        # Check if we received any email-related response
        if "email" in full_response.lower() or "gmail" in full_response.lower():
            print("✅ Agent appears to have successfully accessed email data")
        else:
            print("❌ Agent response does not mention email data")
            
        return True
    
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Bedrock Agent with Correct Session Structure")
    print("="*50)
    
    success = test_agent_with_correct_session()
    
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n❌ Test failed!") 