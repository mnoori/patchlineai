#!/usr/bin/env python3
"""
Update config.ts with agent IDs from agents.yaml
"""

import yaml
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

def load_agents_config():
    """Load agent configuration from agents.yaml"""
    config_file = PROJECT_ROOT / 'agents.yaml'
    if not config_file.exists():
        print(f"[ERROR] agents.yaml not found at {config_file}")
        return {}
    
    with open(config_file, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def update_config_ts():
    """Update config.ts with agent IDs from agents.yaml"""
    config_file = PROJECT_ROOT / 'lib' / 'config.ts'
    
    if not config_file.exists():
        print(f"[ERROR] config.ts not found at {config_file}")
        return
    
    # Load agent configuration
    cfg = load_agents_config()
    
    # Read the config.ts file
    with open(config_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    updates_made = []
    
    # Update each agent's IDs
    for agent_type in ['gmail', 'legal', 'scout', 'blockchain', 'supervisor']:
        if agent_type in cfg and 'environment' in cfg[agent_type]:
            agent_id = cfg[agent_type]['environment'].get('agent_id')
            alias_id = cfg[agent_type]['environment'].get('agent_alias_id')
            
            if agent_id and alias_id:
                # Update BEDROCK_AGENTS object
                agent_key = f'{agent_type.upper()}_AGENT'
                
                # Pattern for ID in BEDROCK_AGENTS
                id_pattern = rf'({agent_key}:\s*{{[^}}]*ID:\s*process\.env\.BEDROCK_{agent_type.upper()}_AGENT_ID\s*\|\|\s*")[^"]+(")'
                if re.search(id_pattern, content):
                    content = re.sub(id_pattern, rf'\g<1>{agent_id}\g<2>', content)
                    updates_made.append(f"{agent_key}.ID = {agent_id}")
                
                # Pattern for ALIAS_ID in BEDROCK_AGENTS
                alias_pattern = rf'({agent_key}:\s*{{[^}}]*ALIAS_ID:\s*process\.env\.BEDROCK_{agent_type.upper()}_AGENT_ALIAS_ID\s*\|\|\s*")[^"]+(")'
                if re.search(alias_pattern, content):
                    content = re.sub(alias_pattern, rf'\g<1>{alias_id}\g<2>', content)
                    updates_made.append(f"{agent_key}.ALIAS_ID = {alias_id}")
                
                # Update export const sections
                # Pattern: export const GMAIL_AGENT = { agentId: process.env.BEDROCK_GMAIL_AGENT_ID || 'xxx',
                export_pattern = rf'(export\s+const\s+{agent_type.upper()}_AGENT\s*=\s*{{[^}}]*agentId:\s*process\.env\.BEDROCK_{agent_type.upper()}_AGENT_ID\s*\|\|\s*[\'"])[^\'"]+([\'"])'
                if re.search(export_pattern, content):
                    content = re.sub(export_pattern, rf'\g<1>{agent_id}\g<2>', content)
                    updates_made.append(f"export {agent_type.upper()}_AGENT.agentId = {agent_id}")
                
                # Pattern for agentAliasId in export
                export_alias_pattern = rf'(export\s+const\s+{agent_type.upper()}_AGENT\s*=\s*{{[^}}]*agentAliasId:\s*process\.env\.BEDROCK_{agent_type.upper()}_AGENT_ALIAS_ID\s*\|\|\s*[\'"])[^\'"]+([\'"])'
                if re.search(export_alias_pattern, content):
                    content = re.sub(export_alias_pattern, rf'\g<1>{alias_id}\g<2>', content)
                    updates_made.append(f"export {agent_type.upper()}_AGENT.agentAliasId = {alias_id}")
                
                # Special handling for gmail as the default agent
                if agent_type == 'gmail':
                    # Update legacy BEDROCK_AGENT_ID in config object
                    legacy_id_pattern = r'(BEDROCK_AGENT_ID:\s*process\.env\.BEDROCK_AGENT_ID\s*\|\|\s*")[^"]+(")'
                    if re.search(legacy_id_pattern, content):
                        content = re.sub(legacy_id_pattern, rf'\g<1>{agent_id}\g<2>', content)
                        updates_made.append(f"BEDROCK_AGENT_ID = {agent_id}")
                    
                    # Update legacy BEDROCK_AGENT_ALIAS_ID
                    legacy_alias_pattern = r'(BEDROCK_AGENT_ALIAS_ID:\s*process\.env\.BEDROCK_AGENT_ALIAS_ID\s*\|\|\s*")[^"]+(")'
                    if re.search(legacy_alias_pattern, content):
                        content = re.sub(legacy_alias_pattern, rf'\g<1>{alias_id}\g<2>', content)
                        updates_made.append(f"BEDROCK_AGENT_ALIAS_ID = {alias_id}")
                    
                    # Update GMAIL_AGENT export that uses BEDROCK_AGENT_ID (without _GMAIL_)
                    gmail_export_pattern = r'(export\s+const\s+GMAIL_AGENT\s*=\s*{[^}]*agentId:\s*process\.env\.BEDROCK_AGENT_ID\s*\|\|\s*[\'"])[^\'"]+([\'"])'
                    if re.search(gmail_export_pattern, content):
                        content = re.sub(gmail_export_pattern, rf'\g<1>{agent_id}\g<2>', content)
                        updates_made.append(f"export GMAIL_AGENT.agentId (legacy) = {agent_id}")
                    
                    gmail_alias_export_pattern = r'(export\s+const\s+GMAIL_AGENT\s*=\s*{[^}]*agentAliasId:\s*process\.env\.BEDROCK_AGENT_ALIAS_ID\s*\|\|\s*[\'"])[^\'"]+([\'"])'
                    if re.search(gmail_alias_export_pattern, content):
                        content = re.sub(gmail_alias_export_pattern, rf'\g<1>{alias_id}\g<2>', content)
                        updates_made.append(f"export GMAIL_AGENT.agentAliasId (legacy) = {alias_id}")
    
    if content != original_content:
        # Write back to config.ts
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"[SUCCESS] Updated {config_file}")
        print("[UPDATES] Made the following updates:")
        for update in updates_made:
            print(f"  - {update}")
    else:
        print("[INFO] No updates needed for config.ts")

if __name__ == "__main__":
    update_config_ts() 