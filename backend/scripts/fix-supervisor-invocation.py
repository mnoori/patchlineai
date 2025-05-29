#!/usr/bin/env python3
"""
Fix Supervisor Agent invocation to enable collaboration.
Based on the energy agent multi-agent collaboration example.
"""
import os
import json
import time
from pathlib import Path
import boto3
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(env_path)

# Configuration
REGION = os.environ.get('REGION_AWS') or os.environ.get('AWS_REGION', 'us-east-1')
SUPERVISOR_AGENT_ID = os.environ.get('BEDROCK_SUPERVISOR_AGENT_ID', 'TYQSQNB2GI')
SUPERVISOR_AGENT_ALIAS_ID = os.environ.get('BEDROCK_SUPERVISOR_AGENT_ALIAS_ID', 'BXHO9QQ40S')

# Initialize clients
bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)

def check_and_update_supervisor():
    """Check and update supervisor agent to ensure collaboration is enabled"""
    
    print("🔍 Checking Supervisor Agent Configuration...")
    
    try:
        # Get current agent configuration
        agent_response = bedrock_agent.get_agent(agentId=SUPERVISOR_AGENT_ID)
        agent = agent_response['agent']
        
        print(f"\n📊 Current Configuration:")
        print(f"   Name: {agent['agentName']}")
        print(f"   Status: {agent['agentStatus']}")
        print(f"   Collaboration Mode: {agent.get('agentCollaboration', 'DISABLED')}")
        
        # Check if collaboration needs to be enabled
        if agent.get('agentCollaboration') != 'SUPERVISOR':
            print("\n⚠️  Collaboration not properly set! Updating agent...")
            
            # Update agent to enable collaboration
            update_response = bedrock_agent.update_agent(
                agentId=SUPERVISOR_AGENT_ID,
                agentName=agent['agentName'],
                agentResourceRoleArn=agent['agentResourceRoleArn'],
                foundationModel=agent['foundationModel'],
                instruction=agent['instruction'],
                agentCollaboration='SUPERVISOR',  # Enable supervisor mode
                idleSessionTTLInSeconds=agent.get('idleSessionTTLInSeconds', 900)
            )
            
            print("✅ Updated agent to SUPERVISOR mode")
            
            # Prepare agent after update
            print("\n⏳ Preparing agent...")
            bedrock_agent.prepare_agent(agentId=SUPERVISOR_AGENT_ID)
            
            # Wait for preparation
            for i in range(30):
                agent_check = bedrock_agent.get_agent(agentId=SUPERVISOR_AGENT_ID)
                if agent_check['agent']['agentStatus'] == 'PREPARED':
                    print("✅ Agent prepared successfully")
                    break
                time.sleep(2)
                print(".", end="", flush=True)
        else:
            print("✅ Collaboration already enabled")
            
        # List collaborators
        print("\n👥 Checking Collaborators:")
        try:
            collaborators = bedrock_agent.list_agent_collaborators(
                agentId=SUPERVISOR_AGENT_ID,
                agentVersion='DRAFT'
            )
            for collab in collaborators.get('agentCollaboratorSummaries', []):
                print(f"   - {collab['collaboratorName']}")
        except Exception as e:
            print(f"   Could not list via API: {str(e)}")
            print("   (Check AWS Console for collaborators)")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_collaboration_with_proper_invocation():
    """Test supervisor with proper invocation for collaboration"""
    
    print("\n\n🧪 Testing Supervisor Collaboration with Proper Invocation")
    print("="*60)
    
    test_query = "Can you search through the emails, find the most recent email about Mehdi about a contract, then feed the contract to Legal agent, and bring me back its assessment?"
    
    session_id = f"collab-test-{int(time.time())}"
    
    try:
        print(f"\n📝 Query: {test_query}")
        print(f"📍 Session: {session_id}")
        print("\n🚀 Invoking Supervisor Agent with collaboration enabled...")
        
        # Invoke with proper parameters for collaboration
        response = bedrock_runtime.invoke_agent(
            agentId=SUPERVISOR_AGENT_ID,
            agentAliasId=SUPERVISOR_AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=test_query,
            enableTrace=True
        )
        
        # Process response
        full_response = ""
        collaboration_events = []
        
        for event in response.get('completion', []):
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    full_response += text
                    
            if 'trace' in event:
                trace = event['trace'].get('trace', {})
                
                # Look for collaboration events
                if 'orchestrationTrace' in trace:
                    orch = trace['orchestrationTrace']
                    if 'invocationInput' in orch:
                        inv = orch['invocationInput']
                        if 'collaboratorInvocationInput' in inv:
                            collab = inv['collaboratorInvocationInput']
                            collaboration_events.append({
                                'collaborator': collab.get('collaboratorName', 'Unknown'),
                                'input': collab.get('input', {}).get('text', '')[:100] + '...'
                            })
                            print(f"\n🔄 Delegating to: {collab.get('collaboratorName')}")
        
        print(f"\n📋 Response Summary:")
        print("-"*50)
        print(full_response[:300] + "..." if len(full_response) > 300 else full_response)
        print("-"*50)
        
        if collaboration_events:
            print(f"\n✅ Detected {len(collaboration_events)} collaboration events:")
            for event in collaboration_events:
                print(f"   - {event['collaborator']}: {event['input']}")
        else:
            print("\n❌ No collaboration events detected")
            print("\n💡 Possible issues:")
            print("   1. Collaborators not properly associated in AWS Console")
            print("   2. Agent needs to be re-prepared after adding collaborators")
            print("   3. Invocation parameters may need adjustment")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    # First check and update supervisor configuration
    check_and_update_supervisor()
    
    # Then test collaboration
    test_collaboration_with_proper_invocation()
    
    print("\n\n📚 Next Steps:")
    print("1. If collaboration still not working, check AWS Console:")
    print("   - Verify collaborators are listed under Multi-agent collaboration")
    print("   - Ensure both PatchlineEmailAgent and PatchlineLegalAgent are added")
    print("   - Check that conversation history sharing is enabled")
    print("\n2. Try invoking through AWS Console to compare behavior")
    print("\n3. Update the app/api/chat/route.ts to match working invocation pattern")

if __name__ == "__main__":
    main() 