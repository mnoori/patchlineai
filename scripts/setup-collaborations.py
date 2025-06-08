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

print("[DEBUG] Script started")

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    print("[DEBUG] Windows platform detected")
    # Don't use codecs.getwriter - it can cause issues
    # Just let Python handle encoding normally

# Determine AWS region
REGION = os.environ.get('AWS_REGION', 'us-east-1')

def run_aws_command(command):
    """Run AWS CLI command and return JSON result"""
    try:
        cmd_str = [str(c) for c in command]
        # Use cp1252 encoding for Windows to handle Unicode characters
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        result = subprocess.run(
            cmd_str, 
            capture_output=True, 
            text=True, 
            check=True, 
            encoding=encoding,
            errors='replace'  # Replace problematic characters instead of failing
        )
        return json.loads(result.stdout) if result.stdout else None
    except subprocess.CalledProcessError as e:
        print(f"Error running AWS command: {' '.join(command)}")
        if e.stderr:
            print(f"Error details: {e.stderr.strip()}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from AWS command: {' '.join(command)}")
        print(f"JSON decode error: {str(e)}")
        return None
    except UnicodeDecodeError as e:
        print(f"Unicode decode error in AWS command: {' '.join(command)}")
        print(f"Encoding error: {str(e)}")
        return None

def load_collaboration_instructions(agent_type):
    """Load collaboration instructions from MD file"""
    instruction_file = Path(f"prompts/{agent_type}-collaboration-instructions.md")
    if instruction_file.exists():
        with open(instruction_file, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            # Remove the markdown header and return just the instruction text
            lines = content.split('\n')
            # Skip the first line (# header) and any empty lines
            instruction_lines = [line for line in lines[1:] if line.strip()]
            return ' '.join(instruction_lines)
    else:
        return f"You can delegate tasks related to {agent_type} to this agent."

def associate_collaborator(supervisor_id, collaborator_id, collaborator_alias_id, collaborator_name, agent_type):
    """Associate a collaborator agent with the supervisor"""
    print(f"  Associating {collaborator_name} (ID: {collaborator_id}, Alias: {collaborator_alias_id})...")
    
    # Load specific collaboration instructions
    collaboration_instruction = load_collaboration_instructions(agent_type)
    print(f"    Using collaboration instructions from prompts/{agent_type}-collaboration-instructions.md")
    
    # Build the collaborator descriptor
    collaborator_descriptor = {
        "aliasArn": f"arn:aws:bedrock:{REGION}:{get_account_id()}:agent-alias/{collaborator_id}/{collaborator_alias_id}"
    }
    
    command = [
        "aws", "bedrock-agent", "associate-agent-collaborator",
        "--agent-id", supervisor_id,
        "--agent-version", "DRAFT",
        "--agent-descriptor", json.dumps(collaborator_descriptor),
        "--collaborator-name", collaborator_name,
        "--collaboration-instruction", collaboration_instruction,
        "--relay-conversation-history", "TO_COLLABORATOR"
    ]
    
    try:
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            check=True, 
            encoding=encoding,
            errors='replace'
        )
        print(f"    [SUCCESS] Successfully associated {collaborator_name}")
        
        # Prepare the agent after association (as shown in the example)
        print(f"    Preparing agent after association...")
        prepare_command = ["aws", "bedrock-agent", "prepare-agent", "--agent-id", supervisor_id]
        prepare_result = subprocess.run(
            prepare_command,
            capture_output=True,
            text=True,
            check=True,
            encoding=encoding,
            errors='replace'
        )
        print(f"    Agent preparation initiated, waiting 5 seconds...")
        time.sleep(5)  # Wait for preparation
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"    [FAILED] Failed to associate {collaborator_name}")
        print(f"    Error: {e.stderr.strip()}")
        return False

def get_account_id():
    """Get AWS account ID"""
    try:
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        result = subprocess.run(
            ["aws", "sts", "get-caller-identity", "--query", "Account", "--output", "text"],
            capture_output=True, 
            text=True, 
            check=True, 
            encoding=encoding,
            errors='replace'
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        print("Error getting AWS account ID")
        return None

def prepare_agent(agent_id):
    """Prepare the agent after making changes"""
    print(f"  Preparing agent {agent_id}...")
    try:
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        subprocess.run(
            ["aws", "bedrock-agent", "prepare-agent", "--agent-id", agent_id],
            capture_output=True, 
            text=True, 
            check=True, 
            encoding=encoding,
            errors='replace'
        )
        
        # Simple wait instead of checking status to avoid Unicode issues
        print("    Waiting 30 seconds for agent preparation...")
        time.sleep(30)
        print("    [SUCCESS] Agent preparation completed")
        return True
        
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
        if associate_collaborator(supervisor_id, collab_id, collab_alias_id, collab_name, collaborator_type):
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