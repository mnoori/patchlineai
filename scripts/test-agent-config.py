#!/usr/bin/env python3
"""Test script to verify agent configuration and instructions"""

import os
import sys

# Add backend/scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend', 'scripts'))

# Test each agent type
agent_types = ['GMAIL', 'LEGAL', 'BLOCKCHAIN', 'SCOUT', 'SUPERVISOR']

for agent_type in agent_types:
    print(f"\n{'='*60}")
    print(f"Testing PATCHLINE_AGENT_TYPE={agent_type}")
    print('='*60)
    
    # Set environment variable
    os.environ['PATCHLINE_AGENT_TYPE'] = agent_type
    
    # Import config (this will re-evaluate based on env var)
    if 'config' in sys.modules:
        del sys.modules['config']
    from config import AGENT_CONFIG
    
    print(f"Agent Name: {AGENT_CONFIG['name']}")
    print(f"Description: {AGENT_CONFIG['description']}")
    print(f"Action Group: {AGENT_CONFIG['action_group_name']}")
    
    # Simulate the instruction selection logic from create-bedrock-agent.py
    ACTION_GROUP_NAME = AGENT_CONFIG['action_group_name']
    
    if ACTION_GROUP_NAME == 'GmailActions':
        instruction_type = "Gmail Agent Instructions"
    elif ACTION_GROUP_NAME == 'ContractAnalysis':
        instruction_type = "Legal Agent Instructions"
    else:
        instruction_type = "SUPERVISOR INSTRUCTIONS (BUG!)"
    
    print(f"Instructions: {instruction_type}")
    
    if agent_type in ['BLOCKCHAIN', 'SCOUT'] and instruction_type == "SUPERVISOR INSTRUCTIONS (BUG!)":
        print("⚠️  WARNING: This agent will get WRONG instructions!")

print("\n" + "="*60)
print("SUMMARY:")
print("="*60)
print("The create_agent() function only checks for:")
print("- ACTION_GROUP_NAME == 'GmailActions' → Gmail instructions")
print("- ACTION_GROUP_NAME == 'ContractAnalysis' → Legal instructions")
print("- else → Supervisor instructions")
print("\nBUT Blockchain has ACTION_GROUP_NAME = 'BlockchainActions'")
print("AND Scout has ACTION_GROUP_NAME = 'ScoutActions'")
print("So they both fall through to supervisor instructions!") 