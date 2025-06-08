#!/usr/bin/env python3
"""
Agent cleanup and rebuild script - uses AWS CLI for better control
"""

import os
import sys
import yaml
import json
import time
import subprocess
from pathlib import Path
import argparse

def run_aws_command(command):
    """Run AWS CLI command and return JSON result"""
    try:
        # Ensure command list elements are all strings
        cmd_str = [str(c) for c in command]
        # Use cp1252 encoding on Windows to handle special characters
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        result = subprocess.run(cmd_str, capture_output=True, text=True, check=True, encoding=encoding, errors='replace')
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error running AWS command: {' '.join(command)}")
        if e.stderr:
            print(f"Error details: {e.stderr.strip()}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from AWS command: {' '.join(command)}")
        return None

def list_agents():
    """List all Bedrock agents"""
    return run_aws_command(["aws", "bedrock-agent", "list-agents"])

def get_agent_aliases(agent_id):
    """Get all aliases for an agent"""
    return run_aws_command(["aws", "bedrock-agent", "list-agent-aliases", 
                           "--agent-id", agent_id])

def get_agent_details(agent_id):
    """Get agent details including collaborators"""
    return run_aws_command(["aws", "bedrock-agent", "get-agent", 
                           "--agent-id", agent_id])

def disassociate_all_collaborators():
    """
    Finds any supervisor agents and updates them to remove all collaborator associations.
    This is necessary before collaborators can be deleted.
    """
    print("\n=== Disassociating all collaborators from supervisor agents ===")
    agents = list_agents()
    if not agents or "agentSummaries" not in agents:
        print("  No agents found to check for supervision.")
        return

    supervisor_agents = [
        agent for agent in agents["agentSummaries"]
        if "Supervisor" in agent["agentName"]
    ]

    if not supervisor_agents:
        print("  No supervisor agents found. Skipping disassociation.")
        return

    for supervisor in supervisor_agents:
        supervisor_id = supervisor["agentId"]
        supervisor_name = supervisor["agentName"]
        print(f"  Processing supervisor: {supervisor_name} ({supervisor_id})")

        # Step 1: Get the full current configuration of the supervisor agent
        agent_details_json = run_aws_command([
            "aws", "bedrock-agent", "get-agent",
            "--agent-id", supervisor_id
        ])

        if not agent_details_json or "agent" not in agent_details_json:
            print(f"    Could not get details for supervisor {supervisor_name}. Skipping.")
            continue

        agent_data = agent_details_json["agent"]

        # Step 2: Check if it even has collaborators to remove
        if "agentCollaboration" not in agent_data:
            print(f"    No collaboration configuration found on {supervisor_name}. Nothing to do.")
            continue

        print(f"    Found collaboration configuration. Proceeding to remove it.")

        # Step 3: Construct the update command, preserving all essential fields
        # but omitting the agentCollaboration member to remove it.
        update_command = [
            "aws", "bedrock-agent", "update-agent",
            "--agent-id", supervisor_id,
            "--agent-name", supervisor_name,
            "--foundation-model", agent_data["foundationModel"],
            "--instruction", agent_data["instruction"],
        ]
        if "description" in agent_data:
            update_command.extend(["--description", agent_data["description"]])
        if "agentResourceRoleArn" in agent_data:
            update_command.extend(["--agent-resource-role-arn", agent_data["agentResourceRoleArn"]])
        if "idleSessionTTLInSeconds" in agent_data:
             update_command.extend(["--idle-session-ttl-in-seconds", str(agent_data["idleSessionTTLInSeconds"])])

        # Step 4: Execute the update command
        try:
            print(f"    Updating {supervisor_name} to remove collaborators...")
            subprocess.run(update_command, capture_output=True, text=True, check=True, encoding='utf-8')
            print(f"    Successfully updated {supervisor_name} and removed collaborators.")
            # Give AWS a moment to process the update
            time.sleep(5)
        except subprocess.CalledProcessError as e:
            print(f"    ERROR: Failed to update supervisor agent {supervisor_name}.")
            print(f"    Stderr: {e.stderr.strip()}")
            print("    Please resolve this AWS error manually before re-running.")

def delete_agent_alias(agent_id, alias_id):
    """Delete an agent alias"""
    try:
        print(f"  Deleting alias {alias_id}...")
        subprocess.run(["aws", "bedrock-agent", "delete-agent-alias", 
                        "--agent-id", agent_id, 
                        "--agent-alias-id", alias_id], 
                       capture_output=True, text=True, check=True, encoding='utf-8')
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error deleting alias: {e.stderr.strip()}")
        return False

def delete_agent(agent_id):
    """Delete an agent"""
    try:
        print(f"  Deleting agent {agent_id}...")
        subprocess.run(["aws", "bedrock-agent", "delete-agent", 
                        "--agent-id", agent_id, 
                        "--skip-resource-in-use-check"], 
                       capture_output=True, text=True, check=True, encoding='utf-8')
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error deleting agent: {e.stderr.strip()}")
        return False

def disassociate_alias_from_supervisors(alias_arn: str):
    """Remove a specific collaborator alias from any supervisor agents that reference it"""
    print(f"  Checking supervisors for collaborator alias {alias_arn}...")
    supervisors = list_agents()
    if not supervisors or "agentSummaries" not in supervisors:
        return

    for sup in supervisors["agentSummaries"]:
        sup_id = sup["agentId"]
        # List collaborators on this supervisor (DRAFT version)
        collabs = run_aws_command([
            "aws", "bedrock-agent", "list-agent-collaborators",
            "--agent-id", sup_id,
            "--agent-version", "DRAFT"
        ])
        if not collabs or "agentCollaborators" not in collabs:
            continue

        for collaborator in collabs["agentCollaborators"]:
            collab_alias_arn = collaborator.get("agentDescriptor", {}).get("aliasArn")
            if collab_alias_arn == alias_arn:
                collab_id = collaborator["collaboratorId"]
                print(f"    Disassociating from supervisor {sup_id} (collaboratorId {collab_id})")
                try:
                    subprocess.run([
                        "aws", "bedrock-agent", "disassociate-agent-collaborator",
                        "--agent-id", sup_id,
                        "--agent-version", "DRAFT",
                        "--collaborator-id", collab_id
                    ], capture_output=True, check=True, encoding='utf-8')
                    print(f"    Successfully disassociated from {sup_id}")
                except subprocess.CalledProcessError as e:
                    print(f"    Error disassociating from {sup_id}: {e.stderr}")

def clean_agent(agent_name):
    """Find and clean up an agent by name"""
    print(f"\nCleaning up {agent_name}...")
    
    agents = list_agents()
    if not agents or "agentSummaries" not in agents:
        print("  No agents found or error listing agents")
        return
    
    agent_found = False
    for agent in agents["agentSummaries"]:
        if agent["agentName"] == agent_name:
            agent_found = True
            agent_id = agent["agentId"]
            print(f"  Found agent {agent_name} with ID {agent_id}")
            
            # Delete aliases first
            aliases = get_agent_aliases(agent_id)
            if aliases and "agentAliasSummaries" in aliases:
                for alias in aliases["agentAliasSummaries"]:
                    if alias["agentAliasId"] == "TSTALIASID":
                        print("  Skipping undeletable TSTALIASID alias.")
                        continue
                    
                    print(f"  Attempting to delete alias {alias['agentAliasId']}...")
                    delete_agent_alias(agent_id, alias["agentAliasId"])
                    time.sleep(2)
            
            # Now delete the agent
            if delete_agent(agent_id):
                print(f"  Successfully deleted agent {agent_name} (ID: {agent_id})")
            else:
                print(f"  Failed to delete agent {agent_name} (ID: {agent_id})")
            
            time.sleep(5)
            break
    
    if not agent_found:
        print(f"  Agent {agent_name} not found.")

def create_agent(agent_type):
    """Create an agent of the specified type"""
    print(f"\nCreating {agent_type.title()} Agent...")
    
    env = os.environ.copy()
    env["PATCHLINE_AGENT_TYPE"] = agent_type.upper()
    env["PYTHONIOENCODING"] = "utf-8"
    
    script_path = Path("backend/scripts/create-bedrock-agent.py")
    if not script_path.exists():
        print(f"  ERROR: Create script not found at {script_path}")
        return None

    try:
        result = subprocess.run(
            ["python", str(script_path)],
            env=env, 
            capture_output=True, 
            text=True, 
            check=True,
            encoding='utf-8'
        )
        
        print(result.stdout)
        
        agent_id, alias_id = None, None
        for line in result.stdout.splitlines():
            if 'Agent ID:' in line:
                agent_id = line.split('Agent ID:')[1].strip()
            elif 'Agent Alias ID:' in line:
                alias_id = line.split('Agent Alias ID:')[1].strip()
        
        if agent_id and alias_id:
            return {'agent_id': agent_id, 'alias_id': alias_id}
        else:
            print(f"  Could not parse Agent ID and Alias ID from creation script output for {agent_type}.")
            return None

    except subprocess.CalledProcessError as e:
        print(f"  Error creating {agent_type} agent: {e}")
        print(f"  Stderr: {e.stderr.strip()}")
        return None

def setup_collaborations():
    """Run the collaboration setup script"""
    print("\n--- Setting up Agent Collaborations ---")
    
    script_path = Path("scripts/setup-collaborations.py")
    if not script_path.exists():
        print(f"  ERROR: Collaboration setup script not found at {script_path}")
        return False
    
    try:
        result = subprocess.run(
            ["python", str(script_path)],
            capture_output=True,
            text=True,
            check=True,
            encoding='utf-8'
        )
        
        print(result.stdout)
        return "Collaboration setup complete!" in result.stdout
        
    except subprocess.CalledProcessError as e:
        print(f"  Error setting up collaborations: {e}")
        print(f"  Stderr: {e.stderr.strip()}")
        return False

def enable_supervisor_collaboration(agent_id, config):
    """
    Updates the supervisor agent to enable collaboration.
    This is a separate step after agent creation.
    """
    print(f"\n--- Enabling Collaboration for Supervisor Agent (ID: {agent_id}) ---")

    # We need the agent's current details to preserve them on update.
    agent_details = get_agent_details(agent_id)
    if not agent_details or "agent" not in agent_details:
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

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Clean and rebuild all Bedrock agents from agents.yaml.")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt and run non-interactively.")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    agents_config_path = Path('agents.yaml')
    if not agents_config_path.exists():
        print(f"ERROR: agents.yaml not found in {project_root}")
        sys.exit(1)
        
    with open(agents_config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    if not args.yes:
        print("[WARNING]  WARNING: This will DELETE and RECREATE all Bedrock agents defined in agents.yaml!")
        response = input("Are you sure you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Aborted.")
            return
    
    # Step 1: Disassociate all collaborators from any supervisor agents
    disassociate_all_collaborators()
    
    # Step 2: Clean up existing agents
    print("\n--- Starting Agent Cleanup ---")
    
    agent_names = {
        'gmail': 'PatchlineEmailAgent',
        'legal': 'PatchlineLegalAgent',
        'blockchain': 'PatchlineBlockchainAgent',
        'scout': 'PatchlineScoutAgent',
        'supervisor': 'PatchlineSupervisorAgent'
    }
    
    # Clean up specialized agents first, then the supervisor
    cleanup_order = ['gmail', 'legal', 'blockchain', 'scout', 'supervisor']
    for agent_type in cleanup_order:
        if agent_type in config:
            agent_name = agent_names.get(agent_type)
            if agent_name:
                clean_agent(agent_name)
    
    print("\n--- Agent Cleanup Finished. Waiting for AWS to process... ---")
    time.sleep(10)
    
    # Step 3: Create new agents - WITH PROPER ERROR TRACKING
    print("\n--- Starting Agent Creation ---")
    
    agent_ids = {}
    failed_agents = []
    creation_order = ['gmail', 'legal', 'blockchain', 'scout', 'supervisor']
    
    for agent_type in creation_order:
        if agent_type in config:
            agent_info = create_agent(agent_type)
            if agent_info and agent_info.get('agent_id'):
                agent_ids[agent_type] = agent_info
                
                if 'environment' not in config[agent_type]:
                    config[agent_type]['environment'] = {}
                config[agent_type]['environment']['agent_id'] = agent_info['agent_id']
                config[agent_type]['environment']['agent_alias_id'] = agent_info['alias_id']
                print(f"  [OK] {agent_type.title()} Agent created successfully: {agent_info['agent_id']}")
            else:
                failed_agents.append(agent_type)
                print(f"  [ERROR] {agent_type.title()} Agent creation FAILED")
    
    # Step 4: Save updated config (only for successful agents)
    if agent_ids:
        with open(agents_config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)
        print(f"\nUpdated {agents_config_path} with new agent IDs.")
    
    # Step 5: Run sync script to update .env.local AND lib/config.ts
    if agent_ids:
        print("\n--- Syncing agent IDs to .env.local and lib/config.ts ---")
        sync_script = Path("scripts/sync-env-from-yaml.py")
        if sync_script.exists():
            try:
                result = subprocess.run(
                    ["python", str(sync_script)],
                    capture_output=True,
                    text=True,
                    check=True,
                    encoding='cp1252' if sys.platform == 'win32' else 'utf-8',
                    errors='replace'
                )
                print(result.stdout)
            except subprocess.CalledProcessError as e:
                print(f"[ERROR] Failed to sync environment: {e}")
                print(f"Stderr: {e.stderr}")
        else:
            print(f"[ERROR] Sync script not found at {sync_script}")
    
    # Step 6: HONEST STATUS REPORTING
    print("\n" + "="*60)
    print("=== AGENT CREATION SUMMARY ===")
    print("="*60)
    
    if failed_agents:
        print(f"[ERROR] FAILED AGENTS ({len(failed_agents)}):")
        for agent_type in failed_agents:
            print(f"   - {agent_type.title()} Agent")
        print(f"\n[OK] SUCCESSFUL AGENTS ({len(agent_ids)}):")
        for agent_type in agent_ids:
            print(f"   - {agent_type.title()} Agent: {agent_ids[agent_type]['agent_id']}")
    else:
        print(f"[OK] ALL AGENTS CREATED SUCCESSFULLY ({len(agent_ids)}):")
        for agent_type in agent_ids:
            print(f"   - {agent_type.title()} Agent: {agent_ids[agent_type]['agent_id']}")
    
    # Step 7: Handle collaboration setup based on actual results
    collaboration_success = False
    if 'supervisor' in agent_ids and 'supervisor' not in failed_agents:
        supervisor_id = agent_ids['supervisor']['agent_id']
        supervisor_config = config['supervisor']

        # Supervisor already created with SUPERVISOR_ROUTER mode, just need to add collaborators
        if True:  # Always proceed since supervisor is created with collaboration enabled
            print("\n--- Waiting for agents to be fully ready before setting up collaborations ---")
            time.sleep(10)
            
            if setup_collaborations():
                collaboration_success = True
                print("\n[SUCCESS] COLLABORATION SETUP SUCCESSFUL!")
                
                # Now we need to prepare the supervisor and create its alias
                print("\n--- Preparing supervisor agent and creating alias ---")
                try:
                    # Prepare the supervisor
                    subprocess.run(
                        ["aws", "bedrock-agent", "prepare-agent", "--agent-id", supervisor_id],
                        capture_output=True, text=True, check=True,
                        encoding='cp1252' if sys.platform == 'win32' else 'utf-8',
                        errors='replace'
                    )
                    
                    # Wait for preparation
                    print("Waiting for supervisor preparation...")
                    time.sleep(10)
                    
                    # Create alias
                    result = subprocess.run(
                        ["aws", "bedrock-agent", "create-agent-alias", 
                         "--agent-id", supervisor_id,
                         "--agent-alias-name", "live"],
                        capture_output=True, text=True, check=True,
                        encoding='cp1252' if sys.platform == 'win32' else 'utf-8',
                        errors='replace'
                    )
                    
                    # Parse alias ID from result
                    alias_data = json.loads(result.stdout)
                    alias_id = alias_data['agentAlias']['agentAliasId']
                    
                    # Update the config and env with the alias ID
                    agent_ids['supervisor']['alias_id'] = alias_id
                    config['supervisor']['environment']['agent_alias_id'] = alias_id
                    
                    # Save updated config
                    with open(agents_config_path, 'w') as f:
                        yaml.dump(config, f, default_flow_style=False, sort_keys=False)
                    
                    # Update .env.local
                    env_file_path = Path('.env.local')
                    if env_file_path.exists():
                        env_vars = {}
                        with open(env_file_path, 'r') as f:
                            for line in f:
                                if '=' in line and not line.strip().startswith('#'):
                                    key, value = line.strip().split('=', 1)
                                    env_vars[key.strip()] = value.strip()
                        
                        env_vars['BEDROCK_SUPERVISOR_AGENT_ALIAS_ID'] = alias_id
                        env_vars['BEDROCK_AGENT_ALIAS_ID'] = alias_id
                        
                        with open(env_file_path, 'w') as f:
                            for key, value in env_vars.items():
                                f.write(f"{key}={value}\n")
                    
                    print(f"[SUCCESS] Supervisor prepared and alias created: {alias_id}")
                    
                except Exception as e:
                    print(f"[ERROR] Failed to prepare supervisor or create alias: {str(e)}")
                    collaboration_success = False
            else:
                print("\n[ERROR] COLLABORATION SETUP FAILED!")
                print("You may need to set up collaborations manually in the AWS console.")
                print_manual_collaboration_instructions(agent_ids, agent_names)
        else:
            print("\n[ERROR] SUPERVISOR COLLABORATION ENABLEMENT FAILED!")
            print("You may need to set up collaborations manually in the AWS console.")
            print_manual_collaboration_instructions(agent_ids, agent_names)
    elif 'supervisor' in failed_agents:
        print("\n[ERROR] NO COLLABORATIONS SET UP - Supervisor agent creation failed!")
    else:
        print("\n[WARNING]  NO COLLABORATIONS SET UP - No supervisor agent was configured.")
    
    # Step 8: FINAL HONEST STATUS
    print("\n" + "="*60)
    print("=== FINAL REBUILD STATUS ===")
    print("="*60)
    
    if failed_agents:
        print("[ERROR] REBUILD INCOMPLETE!")
        print(f"   - {len(failed_agents)} agent(s) failed to create")
        print(f"   - {len(agent_ids)} agent(s) created successfully")
        if 'supervisor' in failed_agents:
            print("   - No collaborations set up (supervisor failed)")
        elif not collaboration_success and 'supervisor' in agent_ids:
            print("   - Collaboration setup failed")
        sys.exit(1)  # Exit with error code
    else:
        if collaboration_success:
            print("[OK] REBUILD COMPLETE!")
            print(f"   - All {len(agent_ids)} agents created successfully")
            print("   - All collaborations set up successfully")
            print(f"\nSupervisor Agent ID: {agent_ids['supervisor']['agent_id']}")
            print(f"Supervisor Alias ID: {agent_ids['supervisor']['alias_id']}")
            print("\nYou can now test the supervisor agent to ensure collaborations are working correctly.")
        else:
            print("[WARNING]  REBUILD PARTIALLY COMPLETE!")
            print(f"   - All {len(agent_ids)} agents created successfully")
            if 'supervisor' not in agent_ids:
                print("   - No collaborations set up (no supervisor configured)")
            else:
                print("   - Collaboration setup failed")
            # Don't exit with error if agents were created successfully

def print_manual_collaboration_instructions(agent_ids, agent_names):
    """Print manual collaboration setup instructions"""
    if 'supervisor' not in agent_ids:
        return
        
    supervisor_id = agent_ids['supervisor']['agent_id']
    
    print("\n\n--- Manual Collaboration Setup Instructions ---")
    print(f"Supervisor Agent ID: {supervisor_id}")
    print(f"\nGo to the AWS Bedrock Console for agents:")
    print(f"https://console.aws.amazon.com/bedrock/home#/agents/{supervisor_id}")
    print("\nSteps:")
    print("1. Select the 'DRAFT' version and click 'Edit'.")
    print("2. In the Agent Builder, go to the 'Agent Collaboration' section.")
    print("3. Add the following agents as collaborators:")
    
    for agent_type, ids in agent_ids.items():
        if agent_type != 'supervisor':
            agent_name = agent_names.get(agent_type, 'Unknown Agent')
            print(f"   - {agent_name}: (ID: {ids['agent_id']})")
    
    print("\n4. Click 'Save' and then 'Prepare' to save the changes to the DRAFT.")
    print("5. Test the supervisor agent to ensure collaborations are working correctly.")

if __name__ == "__main__":
    main()
