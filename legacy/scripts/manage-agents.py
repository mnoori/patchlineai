#!/usr/bin/env python3
"""
Comprehensive Agent Management System for Patchline
Uses agents.yaml as the single source of truth
"""

import os
import sys
import yaml
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

# Add backend/scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend', 'scripts'))

class AgentManager:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.agents_config_path = self.project_root / 'agents.yaml'
        self.env_file_path = self.project_root / '.env.local'
        self.agents_config = self.load_agents_config()
        
    def load_agents_config(self) -> Dict:
        """Load agents configuration from agents.yaml"""
        with open(self.agents_config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def save_agents_config(self):
        """Save agents configuration back to agents.yaml"""
        with open(self.agents_config_path, 'w') as f:
            yaml.dump(self.agents_config, f, default_flow_style=False, sort_keys=False)
    
    def create_agent(self, agent_key: str) -> Dict[str, str]:
        """Create a single agent"""
        if agent_key not in self.agents_config:
            print(f"❌ Agent '{agent_key}' not found in agents.yaml")
            return {}
        
        agent_config = self.agents_config[agent_key]
        print(f"\n🚀 Creating {agent_config['name']}...")
        print(f"   Description: {agent_config['description']}")
        print(f"   Model: {agent_config['model']}")
        
        # Set environment variable for the create script
        env = os.environ.copy()
        env['PATCHLINE_AGENT_TYPE'] = agent_key.upper()
        
        # Run the create script
        cmd = ['python', 'backend/scripts/create-bedrock-agent.py']
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, cwd=self.project_root)
        
        if result.returncode != 0:
            print(f"❌ Failed to create agent: {result.stderr}")
            return {}
        
        # Parse output to get agent ID and alias ID
        output = result.stdout
        agent_id = None
        alias_id = None
        
        for line in output.split('\n'):
            if 'Agent ID:' in line:
                agent_id = line.split('Agent ID:')[1].strip()
            elif 'Agent Alias ID:' in line:
                alias_id = line.split('Agent Alias ID:')[1].strip()
        
        if agent_id and alias_id:
            print(f"✅ Created agent: {agent_id}")
            print(f"   Alias: {alias_id}")
            
            # Update agents.yaml with new IDs
            if 'environment' not in agent_config:
                agent_config['environment'] = {}
            agent_config['environment']['agent_id'] = agent_id
            agent_config['environment']['agent_alias_id'] = alias_id
            
            return {'agent_id': agent_id, 'alias_id': alias_id}
        else:
            print("❌ Failed to parse agent IDs from output")
            return {}
    
    def create_all_agents(self) -> Dict[str, Dict[str, str]]:
        """Create all agents defined in agents.yaml"""
        agent_ids = {}
        
        # Order matters - create non-supervisor agents first
        agent_order = ['gmail', 'legal', 'blockchain', 'scout', 'supervisor']
        
        for agent_key in agent_order:
            if agent_key in self.agents_config:
                ids = self.create_agent(agent_key)
                if ids:
                    agent_ids[agent_key] = ids
        
        # Save updated config with new IDs
        self.save_agents_config()
        
        return agent_ids
    
    def update_env_file(self, agent_ids: Dict[str, Dict[str, str]]):
        """Update .env.local with new agent IDs"""
        print("\n📝 Updating .env.local...")
        
        # Read existing env file
        env_lines = []
        if self.env_file_path.exists():
            with open(self.env_file_path, 'r') as f:
                env_lines = f.readlines()
        
        # Update or add agent IDs
        env_dict = {}
        for line in env_lines:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.strip().split('=', 1)
                env_dict[key] = value
        
        # Update with new IDs
        for agent_key, ids in agent_ids.items():
            if agent_key == 'supervisor':
                env_dict['BEDROCK_SUPERVISOR_AGENT_ID'] = ids['agent_id']
                env_dict['BEDROCK_SUPERVISOR_AGENT_ALIAS_ID'] = ids['alias_id']
            elif agent_key == 'gmail':
                env_dict['BEDROCK_AGENT_ID'] = ids['agent_id']
                env_dict['BEDROCK_AGENT_ALIAS_ID'] = ids['alias_id']
            else:
                # Store other agent IDs with their specific names
                env_dict[f'BEDROCK_{agent_key.upper()}_AGENT_ID'] = ids['agent_id']
                env_dict[f'BEDROCK_{agent_key.upper()}_AGENT_ALIAS_ID'] = ids['alias_id']
        
        # Write back to file
        with open(self.env_file_path, 'w') as f:
            for key, value in env_dict.items():
                f.write(f"{key}={value}\n")
        
        print("✅ Updated .env.local with new agent IDs")
    
    def setup_collaborations(self, agent_ids: Dict[str, Dict[str, str]]):
        """Print instructions for setting up collaborations"""
        if 'supervisor' not in agent_ids:
            return
        
        supervisor_id = agent_ids['supervisor']['agent_id']
        
        print("\n🤝 Setting up Collaborations")
        print("="*60)
        print(f"Supervisor Agent ID: {supervisor_id}")
        print(f"\nGo to: https://console.aws.amazon.com/bedrock/home#/agents/{supervisor_id}")
        print("\nSteps:")
        print("1. Click 'Edit in Agent Builder'")
        print("2. Go to 'Agent Collaboration' section")
        print("3. Add these collaborators:")
        
        for agent_key, ids in agent_ids.items():
            if agent_key != 'supervisor' and agent_key in self.agents_config:
                agent_name = self.agents_config[agent_key]['name']
                print(f"   - {agent_name}: {ids['agent_id']}")
        
        print("4. Save and prepare the agent")
        print("5. Test the supervisor agent to ensure collaborations work")
    
    def add_new_agent(self, agent_key: str, config: Dict):
        """Add a new agent to the system"""
        # Add to agents.yaml
        self.agents_config[agent_key] = config
        self.save_agents_config()
        
        # Create the agent
        ids = self.create_agent(agent_key)
        
        if ids:
            # Update env file
            self.update_env_file({agent_key: ids})
            
            # If supervisor exists, remind to update collaborations
            if 'supervisor' in self.agents_config and self.agents_config['supervisor'].get('environment', {}).get('agent_id'):
                print(f"\n⚠️  Remember to add {config['name']} as a collaborator to the supervisor agent!")
                print(f"   Supervisor ID: {self.agents_config['supervisor']['environment']['agent_id']}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Manage Patchline Bedrock Agents')
    parser.add_argument('command', choices=['create-all', 'create', 'add', 'list', 'update-env'],
                        help='Command to execute')
    parser.add_argument('--agent', help='Agent key (for create/add commands)')
    parser.add_argument('--name', help='Agent name (for add command)')
    parser.add_argument('--description', help='Agent description (for add command)')
    parser.add_argument('--model', default='claude-4-sonnet', help='Model to use (for add command)')
    parser.add_argument('--prompt-file', help='Prompt file name (for add command)')
    parser.add_argument('--action-group', help='Action group name (for add command)')
    parser.add_argument('--lambda-handler', help='Lambda handler name (for add command)')
    
    args = parser.parse_args()
    
    manager = AgentManager()
    
    if args.command == 'create-all':
        print("🚀 Creating all agents...")
        agent_ids = manager.create_all_agents()
        manager.update_env_file(agent_ids)
        manager.setup_collaborations(agent_ids)
        
    elif args.command == 'create':
        if not args.agent:
            print("❌ Please specify --agent")
            sys.exit(1)
        ids = manager.create_agent(args.agent)
        if ids:
            manager.update_env_file({args.agent: ids})
            
    elif args.command == 'add':
        if not all([args.agent, args.name, args.description, args.prompt_file]):
            print("❌ Please specify --agent, --name, --description, and --prompt-file")
            sys.exit(1)
        
        config = {
            'name': args.name,
            'description': args.description,
            'model': args.model,
            'prompt': f'prompts/{args.prompt_file}',
        }
        
        if args.action_group:
            config['action_group'] = {
                'name': args.action_group,
                'lambda': f'lambda/{args.lambda_handler or args.agent + "-action-handler"}'
            }
        
        manager.add_new_agent(args.agent, config)
        
    elif args.command == 'list':
        print("📋 Configured Agents:")
        for key, config in manager.agents_config.items():
            if isinstance(config, dict) and 'name' in config:
                print(f"\n{key}:")
                print(f"  Name: {config['name']}")
                print(f"  Description: {config['description']}")
                if 'environment' in config and 'agent_id' in config['environment']:
                    print(f"  Agent ID: {config['environment']['agent_id']}")
                else:
                    print(f"  Agent ID: Not created yet")
                    
    elif args.command == 'update-env':
        # Collect current IDs from agents.yaml
        agent_ids = {}
        for key, config in manager.agents_config.items():
            if isinstance(config, dict) and 'environment' in config:
                env = config['environment']
                if 'agent_id' in env and 'agent_alias_id' in env:
                    agent_ids[key] = {
                        'agent_id': env['agent_id'],
                        'alias_id': env['agent_alias_id']
                    }
        manager.update_env_file(agent_ids)

if __name__ == '__main__':
    main() 