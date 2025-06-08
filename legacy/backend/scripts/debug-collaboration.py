#!/usr/bin/env python3
"""
Debug script to check agent collaboration issues
"""
import boto3
import json
import os
from pathlib import Path

# Load environment variables
def load_env_file():
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

load_env_file()

# Agent IDs
SUPERVISOR_AGENT_ID = 'TYQSQNB2GI'
GMAIL_AGENT_ID = 'C7VZ0QWDSG'
LEGAL_AGENT_ID = 'XL4F5TPHXB'

# Initialize clients
bedrock_agent = boto3.client('bedrock-agent', region_name='us-east-1')

def check_agent(agent_id, name):
    """Check agent configuration"""
    print(f"\n=== {name} Agent ({agent_id}) ===")
    try:
        agent = bedrock_agent.get_agent(agentId=agent_id)
        agent_info = agent['agent']
        
        print(f"Name: {agent_info['agentName']}")
        print(f"Status: {agent_info['agentStatus']}")
        print(f"Foundation Model: {agent_info['foundationModel']}")
        print(f"Instructions (first 200 chars): {agent_info['instruction'][:200]}...")
        
        # Check action groups
        try:
            action_groups = bedrock_agent.list_agent_action_groups(
                agentId=agent_id,
                agentVersion='DRAFT'
            )
            if action_groups['actionGroupSummaries']:
                print("Action Groups:")
                for ag in action_groups['actionGroupSummaries']:
                    print(f"  - {ag['actionGroupName']} ({ag['actionGroupState']})")
            else:
                print("No action groups found")
        except Exception as e:
            print(f"Error checking action groups: {e}")
            
    except Exception as e:
        print(f"Error getting agent {agent_id}: {e}")

def check_supervisor_collaborators():
    """Check supervisor agent collaborators"""
    print(f"\n=== Supervisor Collaborators ===")
    try:
        # Try to list collaborators (this might not work with current SDK)
        collaborators = bedrock_agent.list_agent_collaborators(agentId=SUPERVISOR_AGENT_ID)
        print("Collaborators found:")
        for collab in collaborators.get('agentCollaboratorSummaries', []):
            print(f"  - {collab['collaboratorName']}")
    except Exception as e:
        print(f"Could not list collaborators (expected if API not available): {e}")

def test_individual_agents():
    """Test individual agents"""
    print(f"\n=== Testing Individual Agents ===")
    
    # Test Gmail agent
    print("\nTesting Gmail Agent...")
    try:
        bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
        response = bedrock_runtime.invoke_agent(
            agentId=GMAIL_AGENT_ID,
            agentAliasId='WDGFWL1YCB',
            sessionId='debug-gmail-test',
            inputText='Search for recent emails from Mehdi'
        )
        
        print("Gmail Agent Response:")
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    print(f"  {text}")
                    
    except Exception as e:
        print(f"Error testing Gmail agent: {e}")
    
    # Test Legal agent
    print("\nTesting Legal Agent...")
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=LEGAL_AGENT_ID,
            agentAliasId='EC7EVTWEUQ',
            sessionId='debug-legal-test',
            inputText='Analyze this simple contract: "Artist agrees to provide exclusive rights to Label for 2 years."'
        )
        
        print("Legal Agent Response:")
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    print(f"  {text}")
                    
    except Exception as e:
        print(f"Error testing Legal agent: {e}")

def main():
    print("Debug: Multi-Agent Collaboration Issues")
    print("=" * 50)
    
    # Check all agents
    check_agent(SUPERVISOR_AGENT_ID, "Supervisor")
    check_agent(GMAIL_AGENT_ID, "Gmail")
    check_agent(LEGAL_AGENT_ID, "Legal")
    
    # Check collaborators
    check_supervisor_collaborators()
    
    # Test individual agents
    test_individual_agents()

if __name__ == '__main__':
    main() 