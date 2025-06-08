#!/usr/bin/env python3
"""
Automatically set up collaborations for the supervisor agent
"""

import os
import sys
import yaml
import json
import time
import subprocess
from pathlib import Path

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def run_aws_command(command):
    """Run AWS CLI command and return JSON result"""
    try:
        cmd_str = [str(c) for c in command]
        result = subprocess.run(cmd_str, capture_output=True, text=True, check=True, encoding='utf-8')
        return json.loads(result.stdout) if result.stdout else None
    except subprocess.CalledProcessError as e:
        print(f"Error running AWS command: {' '.join(command)}")
        if e.stderr:
            print(f"Error details: {e.stderr.strip()}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from AWS command: {' '.join(command)}")
        return None

def associate_collaborator(supervisor_id, collaborator_id, collaborator_alias_id, collaborator_name):
    """Associate a collaborator agent with the supervisor"""
    print(f"  Associating {collaborator_name} (ID: {collaborator_id}, Alias: {collaborator_alias_id})...")
    
    # Build the collaborator descriptor
    collaborator_descriptor = {
        "aliasArn": f"arn:aws:bedrock:us-east-1:{get_account_id()}:agent-alias/{collaborator_id}/{collaborator_alias_id}"
    }
    
    command = [
        "aws", "bedrock-agent", "associate-agent-collaborator",
        "--agent-id", supervisor_id,
        "--agent-version", "DRAFT",
        "--agent-descriptor", json.dumps(collaborator_descriptor),
        "--collaborator-name", collaborator_name,
        "--collaboration-instruction", f"You can delegate tasks related to {collaborator_name.lower()} to this agent."
    ]
    
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True, encoding='utf-8')
        print(f"    [SUCCESS] Successfully associated {collaborator_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"    [FAILED] Failed to associate {collaborator_name}")
        print(f"    Error: {e.stderr.strip()}")
        return False

def get_account_id():
    """Get AWS account ID"""
    try:
        result = subprocess.run(
            ["aws", "sts", "get-caller-identity", "--query", "Account", "--output", "text"],
            capture_output=True, text=True, check=True, encoding='utf-8'
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        print("Error getting AWS account ID")
        return None

def prepare_agent(agent_id):
    """Prepare the agent after making changes"""
    print(f"  Preparing agent {agent_id}...")
    try:
        subprocess.run(
            ["aws", "bedrock-agent", "prepare-agent", "--agent-id", agent_id],
            capture_output=True, text=True, check=True, encoding='utf-8'
        )
        
        # Wait for preparation to complete
        max_attempts = 30
        status = "UNKNOWN"
        for attempt in range(max_attempts):
            response = run_aws_command(["aws", "bedrock-agent", "get-agent", "--agent-id", agent_id])
            if response and "agent" in response:
                status = response["agent"]["agentStatus"]
                if status == "PREPARED":
                    print("    [SUCCESS] Agent prepared successfully")
                    return True
                elif status == "FAILED":
                    print("    [FAILED] Agent preparation failed")
                    return False
                print(f"    Status: {status} (attempt {attempt + 1}/{max_attempts})")
            else:
                print(f"    Waiting for agent status... (attempt {attempt + 1}/{max_attempts})")
            time.sleep(10)
        
        print("    [FAILED] Agent preparation timed out")
        return False
    except subprocess.CalledProcessError as e:
        print(f"    [FAILED] Error preparing agent: {e.stderr.strip()}")
        return False

def main():
    """Main function"""
    # Load agents configuration
    agents_config_path = Path('agents.yaml')
    if not agents_config_path.exists():
        print(f"ERROR: agents.yaml not found")
        sys.exit(1)
        
    with open(agents_config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    # Check if supervisor exists
    if 'supervisor' not in config:
        print("ERROR: No supervisor agent found in configuration")
        sys.exit(1)
    
    supervisor_config = config['supervisor']
    if 'environment' not in supervisor_config or 'agent_id' not in supervisor_config['environment']:
        print("ERROR: Supervisor agent ID not found. Please run clean-and-rebuild-agents.py first.")
        sys.exit(1)
    
    supervisor_id = supervisor_config['environment']['agent_id']
    print(f"\n=== Setting up collaborations for Supervisor Agent (ID: {supervisor_id}) ===")
    
    # Get collaborators from config
    collaborators = supervisor_config.get('collaborators', [])
    if not collaborators:
        print("No collaborators defined for supervisor agent")
        return
    
    print(f"Found {len(collaborators)} collaborators to associate: {', '.join(collaborators)}")
    
    # Associate each collaborator
    success_count = 0
    for collaborator_type in collaborators:
        if collaborator_type not in config:
            print(f"\n[ERROR] Collaborator '{collaborator_type}' not found in configuration")
            continue
        
        collab_config = config[collaborator_type]
        if 'environment' not in collab_config or 'agent_id' not in collab_config['environment']:
            print(f"\n[ERROR] Collaborator '{collaborator_type}' has no agent ID. Skipping.")
            continue
        
        collab_id = collab_config['environment']['agent_id']
        collab_alias_id = collab_config['environment']['agent_alias_id']
        collab_name = collab_config['name']
        
        print(f"\nAssociating {collaborator_type} agent...")
        if associate_collaborator(supervisor_id, collab_id, collab_alias_id, collab_name):
            success_count += 1
    
    print(f"\n[SUCCESS] Successfully associated {success_count}/{len(collaborators)} collaborators")
    
    # Prepare the supervisor agent to apply changes
    print(f"\nPreparing supervisor agent to apply collaboration changes...")
    if prepare_agent(supervisor_id):
        print("\n[COMPLETE] Collaboration setup complete!")
        print(f"\nYou can now test the supervisor agent with ID: {supervisor_id}")
        print(f"Alias ID: {supervisor_config['environment']['agent_alias_id']}")
    else:
        print("\n[ERROR] Failed to prepare supervisor agent. Please check AWS console.")

if __name__ == "__main__":
    main() 