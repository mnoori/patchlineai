#!/usr/bin/env python3
"""
Setup all agent environment variables in .env.local
"""

import os
from pathlib import Path

# All agent credentials (from previous deployments and current setup)
AGENT_CREDENTIALS = {
    "BEDROCK_GMAIL_AGENT_ID": "C7VZ0QWDSG",
    "BEDROCK_GMAIL_AGENT_ALIAS_ID": "WDGFWL1YCB",
    "BEDROCK_LEGAL_AGENT_ID": "XL4F5TPHXB", 
    "BEDROCK_LEGAL_AGENT_ALIAS_ID": "EC7EVTWEUQ",
    "BEDROCK_BLOCKCHAIN_AGENT_ID": "TEH8TAXFHN",
    "BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID": "WUWJSMHQ8G",
    "BEDROCK_SCOUT_AGENT_ID": "VP9OKU9YMR",
    "BEDROCK_SCOUT_AGENT_ALIAS_ID": "JVVLS2WOWF",
    "BEDROCK_SUPERVISOR_AGENT_ID": "TYQSQNB2GI",
    "BEDROCK_SUPERVISOR_AGENT_ALIAS_ID": "BXHO9QQ40S"
}

def setup_all_agent_env():
    """Add all agent environment variables to .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if not env_file.exists():
        print(f"[ERROR] .env.local file not found at {env_file}")
        return
    
    # Read existing content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Check which variables are missing
    missing_vars = []
    existing_vars = []
    
    for var_name, var_value in AGENT_CREDENTIALS.items():
        if var_name not in content:
            missing_vars.append((var_name, var_value))
        else:
            existing_vars.append(var_name)
    
    if existing_vars:
        print(f"[INFO] Found {len(existing_vars)} existing agent variables:")
        for var in existing_vars:
            print(f"  ✓ {var}")
    
    if missing_vars:
        print(f"\n[ADD] Adding {len(missing_vars)} missing agent variables:")
        
        # Append missing variables
        with open(env_file, 'a') as f:
            f.write('\n\n# Complete Agent Configuration\n')
            for var_name, var_value in missing_vars:
                f.write(f"{var_name}={var_value}\n")
                print(f"  + {var_name}={var_value}")
        
        print(f"\n[OK] Added {len(missing_vars)} agent variables to .env.local")
    else:
        print("\n[OK] All agent environment variables are already present")
    
    print("\n[COMPLETE] Agent environment setup finished!")
    print("\n[NEXT STEPS]:")
    print("  1. Restart your Next.js dev server: pnpm dev")
    print("  2. Run collaboration setup: python manage-agent-collaborations.py")

if __name__ == "__main__":
    setup_all_agent_env() 