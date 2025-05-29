#!/usr/bin/env python3
"""
Update .env.local with new supervisor agent variables
"""
import os
from pathlib import Path

# New supervisor agent IDs
SUPERVISOR_AGENT_ID = "TYQSQNB2GI"
SUPERVISOR_AGENT_ALIAS_ID = "BXHO9QQ40S"

def update_env_file():
    """Add supervisor agent variables to .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    print(f"📝 Updating environment file: {env_file}")
    
    # Read existing content
    existing_lines = []
    if env_file.exists():
        with open(env_file, 'r') as f:
            existing_lines = f.readlines()
    
    # Check if supervisor vars already exist
    has_supervisor_id = any('BEDROCK_SUPERVISOR_AGENT_ID' in line for line in existing_lines)
    has_supervisor_alias = any('BEDROCK_SUPERVISOR_AGENT_ALIAS_ID' in line for line in existing_lines)
    
    # Prepare new variables
    new_vars = []
    if not has_supervisor_id:
        new_vars.append(f"BEDROCK_SUPERVISOR_AGENT_ID={SUPERVISOR_AGENT_ID}\n")
        print(f"➕ Adding BEDROCK_SUPERVISOR_AGENT_ID={SUPERVISOR_AGENT_ID}")
    else:
        print("✅ BEDROCK_SUPERVISOR_AGENT_ID already exists")
        
    if not has_supervisor_alias:
        new_vars.append(f"BEDROCK_SUPERVISOR_AGENT_ALIAS_ID={SUPERVISOR_AGENT_ALIAS_ID}\n")
        print(f"➕ Adding BEDROCK_SUPERVISOR_AGENT_ALIAS_ID={SUPERVISOR_AGENT_ALIAS_ID}")
    else:
        print("✅ BEDROCK_SUPERVISOR_AGENT_ALIAS_ID already exists")
    
    # Add new variables if needed
    if new_vars:
        with open(env_file, 'a') as f:
            f.write("\n# Supervisor Agent Configuration\n")
            f.writelines(new_vars)
        print(f"✅ Updated {env_file}")
    else:
        print("✅ Environment file already up to date")
    
    # Display current configuration
    print("\n📋 Current Agent Configuration:")
    print(f"   Gmail Agent: C7VZ0QWDSG / WDGFWL1YCB")
    print(f"   Legal Agent: XL4F5TPHXB / EC7EVTWEUQ") 
    print(f"   Supervisor Agent: {SUPERVISOR_AGENT_ID} / {SUPERVISOR_AGENT_ALIAS_ID}")

if __name__ == '__main__':
    update_env_file() 