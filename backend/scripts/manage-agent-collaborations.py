#!/usr/bin/env python3
"""
Patchline Agent Collaboration Manager
Systematically manages collaborations between agents
"""

import boto3
import json
import os
import time
from typing import Dict, List, Any
from pathlib import Path

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file in project root"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"[LOAD] Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print("[OK] Environment variables loaded from .env.local")

# Load environment
load_env_file()

# Initialize Bedrock client
bedrock_agent = boto3.client('bedrock-agent', region_name='us-east-1')

# Agent collaboration configuration
COLLABORATION_CONFIG = {
    "supervisor": {
        "agent_id": os.environ.get('BEDROCK_SUPERVISOR_AGENT_ID'),
        "alias_id": os.environ.get('BEDROCK_SUPERVISOR_AGENT_ALIAS_ID'),
        "collaborators": {
            "gmail": {
                "agent_id": os.environ.get('BEDROCK_GMAIL_AGENT_ID', 'C7VZ0QWDSG'),
                "alias_id": os.environ.get('BEDROCK_GMAIL_AGENT_ALIAS_ID', 'WDGFWL1YCB'),
                "name": "GmailCollaborator",
                "instruction": """You are the Gmail specialist collaborator. Handle all email-related tasks including:
- Searching and reading emails
- Creating and sending email drafts
- Managing email conversations
- Analyzing email content and providing summaries
- Finding specific emails from senders or with keywords

When delegated a task, use your Gmail actions to:
1. Search for relevant emails using appropriate queries
2. Read email content to get full details
3. Provide comprehensive summaries with key information
4. Highlight important dates, deadlines, and action items

Always be thorough in your email searches and provide detailed, actionable responses."""
            },
            "legal": {
                "agent_id": os.environ.get('BEDROCK_LEGAL_AGENT_ID', 'XL4F5TPHXB'),
                "alias_id": os.environ.get('BEDROCK_LEGAL_AGENT_ALIAS_ID', 'EC7EVTWEUQ'),
                "name": "LegalCollaborator",
                "instruction": """You are the Legal specialist collaborator. Handle all legal document analysis including:
- Contract review and analysis
- Identifying key terms and conditions
- Highlighting potential risks and red flags
- Reviewing royalty structures and payment terms
- Analyzing territorial rights and exclusivity clauses

When delegated a task, use your ContractAnalysis actions to:
1. Thoroughly analyze legal documents
2. Identify concerning clauses or missing protections
3. Explain legal terms in plain language
4. Compare terms against industry standards
5. Recommend areas that need attorney review

Always maintain professional legal standards while making complex terms accessible."""
            },
            "blockchain": {
                "agent_id": os.environ.get('BEDROCK_BLOCKCHAIN_AGENT_ID', 'TEH8TAXFHN'),
                "alias_id": os.environ.get('BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID', 'WUWJSMHQ8G'),
                "name": "BlockchainCollaborator",
                "instruction": """You are the Blockchain specialist collaborator. Handle all Web3 and cryptocurrency operations including:
- Processing SOL and crypto payments
- Checking wallet balances and transaction history
- Validating wallet addresses
- Executing secure Solana transfers
- Providing market intelligence and network status

When delegated a task, use your BlockchainActions to:
1. Validate all transaction parameters for security
2. Check wallet balances before transfers
3. Execute payments with proper confirmations
4. Provide transaction receipts and status updates
5. Monitor network conditions and fees

Always prioritize security and user safety. Verify amounts and addresses before executing any transactions."""
            },
            "scout": {
                "agent_id": os.environ.get('BEDROCK_SCOUT_AGENT_ID', 'VP9OKU9YMR'),
                "alias_id": os.environ.get('BEDROCK_SCOUT_AGENT_ALIAS_ID', 'JVVLS2WOWF'),
                "name": "ScoutCollaborator",
                "instruction": """You are the Scout specialist collaborator. Handle all artist discovery and analytics including:
- Discovering emerging artists by genre and region
- Analyzing artist performance metrics and growth
- Comparing artists across different platforms
- Providing market insights and recommendations
- Identifying promising talent for partnerships

When delegated a task, use your ScoutActions to:
1. Search for artists matching specific criteria
2. Analyze growth metrics and performance data
3. Compare multiple artists side-by-side
4. Provide actionable insights and recommendations
5. Identify opportunities for collaboration or investment

Always focus on data-driven insights and provide clear recommendations based on artist metrics and market trends."""
            }
        }
    }
}

def get_agent_alias_arn(agent_id: str, alias_id: str) -> str:
    """Construct agent alias ARN"""
    account_id = boto3.client('sts').get_caller_identity()['Account']
    region = 'us-east-1'
    return f"arn:aws:bedrock:{region}:{account_id}:agent-alias/{agent_id}/{alias_id}"

def list_existing_collaborators(agent_id: str) -> List[Dict]:
    """List existing collaborators for an agent"""
    try:
        response = bedrock_agent.list_agent_collaborators(
            agentId=agent_id,
            agentVersion='DRAFT'
        )
        return response.get('agentCollaboratorSummaries', [])
    except Exception as e:
        print(f"[ERROR] Failed to list collaborators: {str(e)}")
        return []

def create_collaborator(supervisor_id: str, collaborator_config: Dict) -> bool:
    """Create a single collaborator relationship"""
    try:
        alias_arn = get_agent_alias_arn(
            collaborator_config['agent_id'], 
            collaborator_config['alias_id']
        )
        
        print(f"[COLLAB] Creating collaborator: {collaborator_config['name']}")
        print(f"         Agent ID: {collaborator_config['agent_id']}")
        print(f"         Alias ARN: {alias_arn}")
        
        response = bedrock_agent.associate_agent_collaborator(
            agentId=supervisor_id,
            agentVersion='DRAFT',
            agentDescriptor={
                'aliasArn': alias_arn
            },
            collaboratorName=collaborator_config['name'],
            collaborationInstruction=collaborator_config['instruction'],
            relayConversationHistory='TO_COLLABORATOR'
        )
        
        print(f"[OK] Created collaborator: {collaborator_config['name']}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to create collaborator {collaborator_config['name']}: {str(e)}")
        return False

def update_collaborator(supervisor_id: str, collaborator_id: str, collaborator_config: Dict) -> bool:
    """Update an existing collaborator relationship"""
    try:
        alias_arn = get_agent_alias_arn(
            collaborator_config['agent_id'], 
            collaborator_config['alias_id']
        )
        
        print(f"[UPDATE] Updating collaborator: {collaborator_config['name']}")
        
        response = bedrock_agent.update_agent_collaborator(
            agentId=supervisor_id,
            agentVersion='DRAFT',
            collaboratorId=collaborator_id,
            agentDescriptor={
                'aliasArn': alias_arn
            },
            collaboratorName=collaborator_config['name'],
            collaborationInstruction=collaborator_config['instruction'],
            relayConversationHistory='TO_COLLABORATOR'
        )
        
        print(f"[OK] Updated collaborator: {collaborator_config['name']}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to update collaborator {collaborator_config['name']}: {str(e)}")
        return False

def setup_supervisor_collaborations():
    """Set up all collaborations for the supervisor agent"""
    supervisor_config = COLLABORATION_CONFIG['supervisor']
    supervisor_id = supervisor_config['agent_id']
    
    if not supervisor_id:
        print("[ERROR] Supervisor agent ID not found in environment variables")
        print("Please set BEDROCK_SUPERVISOR_AGENT_ID in your .env.local file")
        return False
    
    print(f"[SETUP] Setting up collaborations for Supervisor Agent: {supervisor_id}")
    
    # Get existing collaborators
    existing_collaborators = list_existing_collaborators(supervisor_id)
    existing_names = {collab['collaboratorName']: collab['collaboratorId'] for collab in existing_collaborators}
    
    print(f"[INFO] Found {len(existing_collaborators)} existing collaborators")
    
    success_count = 0
    total_count = len(supervisor_config['collaborators'])
    
    # Process each collaborator
    for collab_key, collab_config in supervisor_config['collaborators'].items():
        if not collab_config['agent_id'] or not collab_config['alias_id']:
            print(f"[SKIP] Missing credentials for {collab_config['name']}")
            continue
            
        if collab_config['name'] in existing_names:
            # Update existing collaborator
            collaborator_id = existing_names[collab_config['name']]
            if update_collaborator(supervisor_id, collaborator_id, collab_config):
                success_count += 1
        else:
            # Create new collaborator
            if create_collaborator(supervisor_id, collab_config):
                success_count += 1
        
        # Small delay between operations
        time.sleep(1)
    
    print(f"\n[SUMMARY] Successfully configured {success_count}/{total_count} collaborators")
    
    if success_count == total_count:
        print("[SUCCESS] All collaborators configured successfully!")
        return True
    else:
        print("[WARNING] Some collaborators failed to configure")
        return False

def validate_environment():
    """Validate that all required environment variables are set"""
    print("[VALIDATE] Checking environment variables...")
    
    required_vars = [
        'BEDROCK_SUPERVISOR_AGENT_ID',
        'BEDROCK_SUPERVISOR_AGENT_ALIAS_ID',
        'BEDROCK_GMAIL_AGENT_ID',
        'BEDROCK_GMAIL_AGENT_ALIAS_ID',
        'BEDROCK_LEGAL_AGENT_ID',
        'BEDROCK_LEGAL_AGENT_ALIAS_ID',
        'BEDROCK_BLOCKCHAIN_AGENT_ID',
        'BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID',
        'BEDROCK_SCOUT_AGENT_ID',
        'BEDROCK_SCOUT_AGENT_ALIAS_ID'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"[ERROR] Missing environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nPlease add these to your .env.local file")
        return False
    
    print("[OK] All required environment variables are set")
    return True

def main():
    """Main function"""
    print("=" * 60)
    print("PATCHLINE AGENT COLLABORATION MANAGER")
    print("=" * 60)
    
    # Validate environment
    if not validate_environment():
        return
    
    # Setup collaborations
    if setup_supervisor_collaborations():
        print("\n[COMPLETE] Agent collaborations configured successfully!")
        print("The Supervisor agent can now delegate to all specialist agents.")
    else:
        print("\n[FAILED] Some collaborations could not be configured.")
        print("Please check the error messages above and try again.")

if __name__ == "__main__":
    main() 