#!/usr/bin/env python3
"""
Sync agent IDs from agents.yaml to .env.local
This ensures the application uses the correct agent IDs after a rebuild
"""

import yaml
import re
from pathlib import Path

def main():
    project_root = Path(__file__).parent.parent
    agents_yaml = project_root / 'agents.yaml'
    env_file = project_root / '.env.local'
    config_ts = project_root / 'lib' / 'config.ts'
    
    # Load agents.yaml
    with open(agents_yaml, 'r') as f:
        config = yaml.safe_load(f)
    
    # Read existing .env.local
    env_vars = {}
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    
    # Update with agent IDs from agents.yaml
    updated = False
    agent_ids = {}  # Store for config.ts update
    for agent_type in ['gmail', 'legal', 'scout', 'blockchain', 'supervisor']:
        if agent_type in config and 'environment' in config[agent_type]:
            agent_id = config[agent_type]['environment'].get('agent_id')
            alias_id = config[agent_type]['environment'].get('agent_alias_id')
            
            # Store for config.ts
            if agent_id and alias_id:
                agent_ids[agent_type] = {
                    'agent_id': agent_id,
                    'alias_id': alias_id
                }
            
            if agent_id:
                key = f'BEDROCK_{agent_type.upper()}_AGENT_ID'
                if env_vars.get(key) != agent_id:
                    env_vars[key] = agent_id
                    print(f"[UPDATE] {key}={agent_id}")
                    updated = True
            
            if alias_id:
                key = f'BEDROCK_{agent_type.upper()}_AGENT_ALIAS_ID'
                if env_vars.get(key) != alias_id:
                    env_vars[key] = alias_id
                    print(f"[UPDATE] {key}={alias_id}")
                    updated = True
            
            # Also update the default BEDROCK_AGENT_ID for supervisor
            if agent_type == 'supervisor':
                if agent_id and env_vars.get('BEDROCK_AGENT_ID') != agent_id:
                    env_vars['BEDROCK_AGENT_ID'] = agent_id
                    print(f"[UPDATE] BEDROCK_AGENT_ID={agent_id}")
                    updated = True
                if alias_id and env_vars.get('BEDROCK_AGENT_ALIAS_ID') != alias_id:
                    env_vars['BEDROCK_AGENT_ALIAS_ID'] = alias_id
                    print(f"[UPDATE] BEDROCK_AGENT_ALIAS_ID={alias_id}")
                    updated = True
    
    if updated:
        # Write back to .env.local
        with open(env_file, 'w', encoding='utf-8') as f:
            for key, value in sorted(env_vars.items()):
                f.write(f"{key}={value}\n")
        print(f"\n[SUCCESS] Updated {env_file}")
    else:
        print("[INFO] No updates needed - .env.local is already in sync")

    # Update lib/config.ts
    if config_ts.exists() and agent_ids:
        print(f"\n[INFO] Updating {config_ts}...")
        
        with open(config_ts, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update each agent's IDs in config.ts
        for agent_type, ids in agent_ids.items():
            # Pattern to match agent configurations
            # Looking for patterns like:
            # gmailAgentId: process.env.BEDROCK_GMAIL_AGENT_ID || 'some-id',
            # gmailAgentAliasId: process.env.BEDROCK_GMAIL_AGENT_ALIAS_ID || 'some-alias',
            
            agent_id_pattern = rf"({agent_type}AgentId:\s*process\.env\.BEDROCK_{agent_type.upper()}_AGENT_ID\s*\|\|\s*)'[^']*'"
            agent_alias_pattern = rf"({agent_type}AgentAliasId:\s*process\.env\.BEDROCK_{agent_type.upper()}_AGENT_ALIAS_ID\s*\|\|\s*)'[^']*'"
            
            # Replace with new IDs
            content = re.sub(agent_id_pattern, rf"\1'{ids['agent_id']}'", content)
            content = re.sub(agent_alias_pattern, rf"\1'{ids['alias_id']}'", content)
        
        # Also update the default agentId and agentAliasId (should be supervisor)
        if 'supervisor' in agent_ids:
            # Pattern for default agent configuration
            default_id_pattern = r"(agentId:\s*process\.env\.BEDROCK_AGENT_ID\s*\|\|\s*)'[^']*'"
            default_alias_pattern = r"(agentAliasId:\s*process\.env\.BEDROCK_AGENT_ALIAS_ID\s*\|\|\s*)'[^']*'"
            
            content = re.sub(default_id_pattern, rf"\1'{agent_ids['supervisor']['agent_id']}'", content)
            content = re.sub(default_alias_pattern, rf"\1'{agent_ids['supervisor']['alias_id']}'", content)
        
        if content != original_content:
            with open(config_ts, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[SUCCESS] Updated {config_ts}")
        else:
            print(f"[INFO] No updates needed for {config_ts}")

if __name__ == '__main__':
    main() 