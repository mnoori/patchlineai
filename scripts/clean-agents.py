#!/usr/bin/env python3
"""
Clean all Bedrock agents and collaborations to prepare for a fresh rebuild.
This script properly disassociates all collaborators before deleting agents.
"""

import boto3
import time
import os
from pathlib import Path

# --- Configuration ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
REGION = os.environ.get('AWS_REGION', os.environ.get('REGION_AWS', 'us-east-1'))

# --- Setup AWS Clients ---
aws = boto3.Session(region_name=REGION)
AGENT = aws.client('bedrock-agent')

def load_env_file():
    """Load environment variables from .env.local file in project root"""
    env_file = PROJECT_ROOT / '.env.local'
    
    if env_file.exists():
        print(f"[LOAD] Loading environment variables from {env_file}...")
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print("[OK] Environment variables loaded.")

    # Map REGION_AWS -> AWS_REGION for Amplify compatibility
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']
        print("[INFO] REGION_AWS mapped to AWS_REGION for compatibility")

def find_all_agents():
    """Find all Patchline agents in the account"""
    try:
        agents = []
        paginator = AGENT.get_paginator('list_agents')
        for page in paginator.paginate(maxResults=100):
            for agent in page['agentSummaries']:
                if agent['agentName'].startswith('Patchline'):
                    agents.append(agent)
        return agents
    except Exception as e:
        print(f"[ERROR] Failed to list agents: {str(e)}")
        return []

def find_supervisor_agents():
    """Find all supervisor agents"""
    all_agents = find_all_agents()
    supervisors = []
    
    for agent in all_agents:
        try:
            # Get agent details to check if it has collaborators
            agent_detail = AGENT.get_agent(agentId=agent['agentId'])
            agent_collab = agent_detail['agent'].get('agentCollaboration', 'NONE')
            
            if agent_collab == 'SUPERVISOR':
                supervisors.append(agent)
        except Exception as e:
            print(f"[ERROR] Failed to check agent {agent['agentName']}: {str(e)}")
    
    return supervisors

def disassociate_all_collaborators():
    """Disassociate all collaborators from supervisor agents"""
    print("\n=== Disassociating all collaborators ===")
    
    supervisor_agents = find_supervisor_agents()
    if not supervisor_agents:
        print("  No supervisor agents found.")
        return
    
    for supervisor in supervisor_agents:
        sup_id = supervisor['agentId']
        sup_name = supervisor['agentName']
        
        try:
            # List all collaborators
            collaborators = AGENT.list_agent_collaborators(
                agentId=sup_id,
                agentVersion='DRAFT'
            ).get('agentCollaboratorSummaries', [])
            
            if not collaborators:
                print(f"  No collaborators found for {sup_name}.")
                continue
            
            print(f"  Disassociating {len(collaborators)} collaborators from {sup_name}...")
            
            for collab in collaborators:
                collab_id = collab['collaboratorId']
                collab_name = collab['collaboratorName']
                
                try:
                    AGENT.disassociate_agent_collaborator(
                        agentId=sup_id,
                        agentVersion='DRAFT',
                        collaboratorId=collab_id
                    )
                    print(f"    Disassociated {collab_name} ({collab_id})")
                except Exception as e:
                    print(f"    [ERROR] Failed to disassociate {collab_name}: {str(e)}")
            
            # Update the agent to be a normal agent instead of SUPERVISOR
            agent_details = AGENT.get_agent(agentId=sup_id)
            role_arn = agent_details['agent']['agentResourceRoleArn']
            
            AGENT.update_agent(
                agentId=sup_id,
                agentName=sup_name,
                agentResourceRoleArn=role_arn,
                agentCollaboration='NONE'
            )
            print(f"  [OK] Updated {sup_name} to remove supervisor status")
            
        except Exception as e:
            print(f"  [ERROR] Failed to process {sup_name}: {str(e)}")

def delete_all_agents():
    """Delete all Patchline agents"""
    print("\n=== Deleting all Patchline agents ===")
    
    agents = find_all_agents()
    if not agents:
        print("  No Patchline agents found.")
        return
    
    for agent in agents:
        agent_id = agent['agentId']
        agent_name = agent['agentName']
        
        try:
            # First delete all aliases
            aliases = AGENT.list_agent_aliases(agentId=agent_id).get('agentAliasSummaries', [])
            
            for alias in aliases:
                if alias['agentAliasId'] == 'TSTALIASID':
                    continue  # Skip system test alias
                    
                alias_id = alias['agentAliasId']
                print(f"  Deleting alias {alias_id} for {agent_name}...")
                
                try:
                    AGENT.delete_agent_alias(
                        agentId=agent_id,
                        agentAliasId=alias_id
                    )
                except Exception as e:
                    print(f"    [ERROR] Failed to delete alias {alias_id}: {str(e)}")
            
            # Then delete the agent
            print(f"  Deleting agent {agent_name} ({agent_id})...")
            AGENT.delete_agent(
                agentId=agent_id,
                skipResourceInUseCheck=True
            )
            print(f"  [OK] Deleted {agent_name}")
            
        except Exception as e:
            print(f"  [ERROR] Failed to delete {agent_name}: {str(e)}")

def main():
    """Main function"""
    print("=" * 60)
    print("PATCHLINE AGENT CLEANUP UTILITY")
    print("=" * 60)
    print("This utility will:")
    print("1. Disassociate all collaborators from supervisor agents")
    print("2. Delete all Patchline agents and their aliases")
    
    # Load environment
    load_env_file()
    
    # First disassociate all collaborators
    disassociate_all_collaborators()
    
    # Small delay to allow AWS to process the updates
    print("\nWaiting for collaborator changes to process...")
    time.sleep(10)
    
    # Then delete all agents
    delete_all_agents()
    
    print("\n[COMPLETE] All Patchline agents have been cleaned up.")
    print("You can now run the rebuild script to create fresh agents.")

if __name__ == "__main__":
    main() 