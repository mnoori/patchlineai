#!/usr/bin/env python3
import sys
import os
import subprocess
import yaml
import json
import time

# Add the scripts directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

def enable_supervisor_collaboration(agent_id, config):
    """
    Updates the supervisor agent to enable collaboration.
    This is a separate step after agent creation.
    """
    print(f"\n--- Enabling Collaboration for Supervisor Agent (ID: {agent_id}) ---")

    # We need the agent's current details to preserve them on update.
    try:
        result = subprocess.run(
            ["aws", "bedrock-agent", "get-agent", "--agent-id", agent_id],
            capture_output=True, text=True, check=True, encoding='utf-8'
        )
        agent_details = json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"  [ERROR] Could not retrieve details for agent {agent_id}. Cannot enable collaboration.")
        return False
    
    if "agent" not in agent_details:
        print(f"  [ERROR] Could not retrieve details for agent {agent_id}. Cannot enable collaboration.")
        return False
    
    agent_data = agent_details["agent"]

    # Construct the update command
    update_command = [
        "aws", "bedrock-agent", "update-agent",
        "--agent-id", agent_id,
        "--agent-name", agent_data["agentName"],
        "--foundation-model", agent_data["foundationModel"],
        "--instruction", agent_data["instruction"],
        "--agent-collaboration", "SUPERVISOR"  # The key change!
    ]
    if "description" in agent_data:
        update_command.extend(["--description", agent_data["description"]])
    if "agentResourceRoleArn" in agent_data:
        update_command.extend(["--agent-resource-role-arn", agent_data["agentResourceRoleArn"]])
    if "idleSessionTTLInSeconds" in agent_data:
        update_command.extend(["--idle-session-ttl-in-seconds", str(agent_data["idleSessionTTLInSeconds"])])

    try:
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        subprocess.run(
            update_command,
            capture_output=True,
            text=True,
            check=True,
            encoding=encoding,
            errors='replace'
        )
        print(f"  [SUCCESS] Collaboration enabled for supervisor {agent_id}.")
        # Wait a few seconds for the update to propagate through AWS
        time.sleep(5)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  [ERROR] Failed to enable collaboration for supervisor {agent_id}.")
        print(f"  Stderr: {e.stderr.strip()}")
        return False

# Load config
with open('agents.yaml', 'r') as f:
    config = yaml.safe_load(f)

# Enable collaboration for the supervisor
supervisor_config = config['supervisor']
agent_id = supervisor_config['environment']['agent_id']
print(f"Enabling collaboration for supervisor agent: {agent_id}")
result = enable_supervisor_collaboration(agent_id, supervisor_config)
print(f'Collaboration enabled: {result}') 