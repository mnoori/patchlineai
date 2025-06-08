#!/usr/bin/env python3
"""
Finalize supervisor agent - prepare it and create alias
"""

import os
import sys
import yaml
import json
import subprocess
from pathlib import Path

def main():
    print("[DEBUG] Finalizing supervisor agent...")
    
    # Load agents.yaml to get supervisor ID
    agents_config_path = Path('agents.yaml')
    with open(agents_config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    supervisor_id = config['supervisor']['environment']['agent_id']
    print(f"[INFO] Supervisor Agent ID: {supervisor_id}")
    
    # Prepare the supervisor agent
    print("[INFO] Preparing supervisor agent...")
    try:
        encoding = 'cp1252' if sys.platform == 'win32' else 'utf-8'
        subprocess.run(
            ["aws", "bedrock-agent", "prepare-agent", "--agent-id", supervisor_id],
            capture_output=True, text=True, check=True,
            encoding=encoding, errors='replace'
        )
        print("[SUCCESS] Supervisor prepared")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to prepare supervisor: {e.stderr}")
        return False
    
    # Wait a bit for preparation
    import time
    time.sleep(10)
    
    # Create alias
    print("[INFO] Creating supervisor alias...")
    try:
        result = subprocess.run(
            ["aws", "bedrock-agent", "create-agent-alias", 
             "--agent-id", supervisor_id,
             "--agent-alias-name", "live"],
            capture_output=True, text=True, check=True,
            encoding=encoding, errors='replace'
        )
        
        # Parse alias ID from result
        alias_data = json.loads(result.stdout)
        alias_id = alias_data['agentAlias']['agentAliasId']
        print(f"[SUCCESS] Created alias: {alias_id}")
        
        # Update agents.yaml
        config['supervisor']['environment']['agent_alias_id'] = alias_id
        with open(agents_config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)
        print("[SUCCESS] Updated agents.yaml")
        
        # Run sync script to update .env.local and lib/config.ts
        print("[INFO] Syncing to .env.local and lib/config.ts...")
        sync_result = subprocess.run(
            ["python", "scripts/sync-env-from-yaml.py"],
            capture_output=True, text=True, check=True,
            encoding=encoding, errors='replace'
        )
        print(sync_result.stdout)
        
        print(f"\n[COMPLETE] Supervisor finalized!")
        print(f"Agent ID: {supervisor_id}")
        print(f"Alias ID: {alias_id}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to create alias: {e.stderr}")
        return False

if __name__ == "__main__":
    main() 