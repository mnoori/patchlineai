#!/usr/bin/env python3
"""
Test Supervisor Agent collaboration based on Bedrock multi-agent examples.
This script properly invokes the supervisor to delegate to collaborators.
"""
import os
import sys
import json
import time
from pathlib import Path
import boto3
from botocore.exceptions import ClientError

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(env_path)

# Configuration
REGION = os.environ.get('REGION_AWS') or os.environ.get('AWS_REGION', 'us-east-1')
SUPERVISOR_AGENT_ID = os.environ.get('BEDROCK_SUPERVISOR_AGENT_ID', 'TYQSQNB2GI')
SUPERVISOR_AGENT_ALIAS_ID = os.environ.get('BEDROCK_SUPERVISOR_AGENT_ALIAS_ID', 'BXHO9QQ40S')

# Initialize Bedrock Agent Runtime client
bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)

def test_supervisor_with_collaboration():
    """Test supervisor agent with proper collaboration invocation"""
    
    print("🧪 Testing Supervisor Agent Collaboration\n")
    print(f"Supervisor Agent ID: {SUPERVISOR_AGENT_ID}")
    print(f"Supervisor Alias ID: {SUPERVISOR_AGENT_ALIAS_ID}")
    
    # Test query that requires both Gmail and Legal collaboration
    test_query = "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?"
    
    print(f"\n📝 Test Query: {test_query}")
    
    # Create session ID for conversation continuity
    session_id = f"test-session-{int(time.time())}"
    
    try:
        print("\n🚀 Invoking Supervisor Agent...")
        
        # Invoke the supervisor agent with collaboration parameters
        response = bedrock_runtime.invoke_agent(
            agentId=SUPERVISOR_AGENT_ID,
            agentAliasId=SUPERVISOR_AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=test_query,
            enableTrace=True,  # Enable trace to see collaboration details
            sessionState={
                'sessionAttributes': {
                    'userId': 'test-user-123',
                    'mode': 'collaboration',
                    'enableCollaboration': 'true'
                }
            }
        )
        
        # Process streaming response
        full_response = ""
        traces = []
        collaborations_detected = []
        
        print("\n📊 Processing response stream...")
        
        for event in response.get('completion', []):
            # Extract text chunks
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    full_response += text
            
            # Extract trace information
            if 'trace' in event:
                trace = event['trace'].get('trace', {})
                traces.append(trace)
                
                # Check for collaboration invocations
                if 'orchestrationTrace' in trace:
                    orch_trace = trace['orchestrationTrace']
                    
                    # Check for agent invocation
                    if 'invocationInput' in orch_trace:
                        inv_input = orch_trace['invocationInput']
                        
                        # Check for collaborator invocation
                        if 'collaboratorInvocationInput' in inv_input:
                            collab_input = inv_input['collaboratorInvocationInput']
                            collab_name = collab_input.get('collaboratorName', 'Unknown')
                            collab_instruction = collab_input.get('input', {}).get('text', '')
                            
                            collaborations_detected.append({
                                'name': collab_name,
                                'instruction': collab_instruction[:100] + '...'
                            })
                            
                            print(f"\n✅ Detected collaboration with: {collab_name}")
                            print(f"   Instruction: {collab_instruction[:100]}...")
        
        print(f"\n📋 Final Response ({len(full_response)} chars):")
        print("-" * 50)
        print(full_response[:500] + "..." if len(full_response) > 500 else full_response)
        print("-" * 50)
        
        # Analysis
        print("\n🔍 Analysis:")
        if collaborations_detected:
            print(f"✅ Successfully detected {len(collaborations_detected)} collaborations:")
            for collab in collaborations_detected:
                print(f"   - {collab['name']}")
        else:
            print("❌ No collaborations detected in trace")
            
        # Check response content
        if 'GmailCollaborator' in full_response and 'LegalCollaborator' in full_response:
            print("🤔 Response mentions collaborators but may not have actually delegated")
        
        # Save detailed trace for debugging
        trace_file = Path("supervisor_trace.json")
        with open(trace_file, 'w') as f:
            json.dump({
                'session_id': session_id,
                'query': test_query,
                'response': full_response,
                'traces': traces,
                'collaborations': collaborations_detected
            }, f, indent=2, default=str)
        print(f"\n💾 Detailed trace saved to: {trace_file}")
        
    except ClientError as e:
        print(f"\n❌ AWS Error: {e.response['Error']['Message']}")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

def check_supervisor_configuration():
    """Check supervisor agent configuration"""
    print("\n🔍 Checking Supervisor Configuration...")
    
    bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
    
    try:
        # Get agent details
        agent_response = bedrock_agent.get_agent(agentId=SUPERVISOR_AGENT_ID)
        agent = agent_response['agent']
        
        print(f"\n📊 Supervisor Agent Details:")
        print(f"   Name: {agent['agentName']}")
        print(f"   Status: {agent['agentStatus']}")
        print(f"   Model: {agent['foundationModel']}")
        print(f"   Collaboration: {agent.get('agentCollaboration', 'DISABLED')}")
        
        # Try to list collaborators (this might fail with current SDK)
        try:
            # Note: list_agent_collaborators might not be available in all SDK versions
            collaborators = bedrock_agent.list_agent_collaborators(
                agentId=SUPERVISOR_AGENT_ID,
                agentVersion='DRAFT'
            )
            print(f"\n👥 Collaborators:")
            for collab in collaborators.get('agentCollaboratorSummaries', []):
                print(f"   - {collab['collaboratorName']}")
        except Exception as e:
            print(f"\n⚠️  Could not list collaborators via API: {str(e)}")
            print("   (This is expected - collaborators are visible in console)")
            
    except Exception as e:
        print(f"\n❌ Error checking configuration: {str(e)}")

if __name__ == "__main__":
    # Check configuration first
    check_supervisor_configuration()
    
    # Run collaboration test
    print("\n" + "="*60)
    test_supervisor_with_collaboration()
    
    print("\n✅ Test complete!")
    print("\n💡 Next Steps:")
    print("1. Check supervisor_trace.json for detailed collaboration traces")
    print("2. If no collaborations detected, the issue is in the invocation method")
    print("3. Compare with AWS Console invocation parameters") 