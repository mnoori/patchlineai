#!/usr/bin/env python3
"""
Add Scout Agent environment variables to .env.local
"""

import os
from pathlib import Path

# Scout agent credentials from the creation output
SCOUT_AGENT_ID = "VP9OKU9YMR"
SCOUT_AGENT_ALIAS_ID = "JVVLS2WOWF"

def add_scout_env_vars():
    """Add Scout agent environment variables to .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    # Environment variables to add
    scout_vars = [
        f"BEDROCK_SCOUT_AGENT_ID={SCOUT_AGENT_ID}",
        f"BEDROCK_SCOUT_AGENT_ALIAS_ID={SCOUT_AGENT_ALIAS_ID}"
    ]
    
    if env_file.exists():
        # Read existing content
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Check if Scout variables already exist
        existing_vars = []
        for var in scout_vars:
            var_name = var.split('=')[0]
            if var_name in content:
                existing_vars.append(var_name)
        
        if existing_vars:
            print(f"[INFO] Scout agent variables already exist in .env.local:")
            for var in existing_vars:
                print(f"  - {var}")
            
            response = input("Do you want to update them? (y/N): ").strip().lower()
            if response != 'y':
                print("[SKIP] Not updating existing variables")
                return
            
            # Update existing variables
            lines = content.split('\n')
            updated_lines = []
            
            for line in lines:
                updated = False
                for var in scout_vars:
                    var_name = var.split('=')[0]
                    if line.startswith(f"{var_name}="):
                        updated_lines.append(var)
                        updated = True
                        break
                if not updated:
                    updated_lines.append(line)
            
            # Write updated content
            with open(env_file, 'w') as f:
                f.write('\n'.join(updated_lines))
            
            print("[OK] Updated Scout agent variables in .env.local")
        else:
            # Append new variables
            with open(env_file, 'a') as f:
                f.write('\n\n# Scout Agent Configuration\n')
                for var in scout_vars:
                    f.write(f"{var}\n")
            
            print("[OK] Added Scout agent variables to .env.local")
    else:
        print("[ERROR] .env.local file not found")
        print(f"Expected location: {env_file}")
        return
    
    print("\nAdded variables:")
    for var in scout_vars:
        print(f"  {var}")
    
    print("\n[NEXT] Please restart your Next.js dev server to load the new environment variables:")
    print("  1. Stop the current server (Ctrl+C)")
    print("  2. Run: pnpm dev")

if __name__ == "__main__":
    add_scout_env_vars() 