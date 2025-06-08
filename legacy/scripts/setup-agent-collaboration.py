#!/usr/bin/env python3
"""
Set up collaboration between Gmail and Legal agents
This allows Gmail agent to hand off legal document analysis to the Legal agent
"""
import boto3
import json
import os
import time
from pathlib import Path

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file in project root"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Load env vars
load_env_file()

# Configuration
REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Agent IDs from our deployment
GMAIL_AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'C7VZ0QWDSG')
LEGAL_AGENT_ID = os.environ.get('BEDROCK_LEGAL_AGENT_ID', 'XL4F5TPHXB')
LEGAL_AGENT_ALIAS_ID = os.environ.get('BEDROCK_LEGAL_AGENT_ALIAS_ID', 'EC7EVTWEUQ')

# Get account ID for ARN construction
sts_client = boto3.client('sts', region_name=REGION)
account_id = sts_client.get_caller_identity()['Account']

# Construct Legal agent alias ARN
LEGAL_AGENT_ALIAS_ARN = f"arn:aws:bedrock:{REGION}:{account_id}:agent-alias/{LEGAL_AGENT_ALIAS_ID}"

def setup_collaboration():
    """Set up Legal agent as a collaborator for Gmail agent"""
    bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
    
    print("Setting up agent collaboration...")
    print(f"Gmail Agent ID: {GMAIL_AGENT_ID}")
    print(f"Legal Agent ID: {LEGAL_AGENT_ID}")
    print(f"Legal Agent Alias ARN: {LEGAL_AGENT_ALIAS_ARN}")
    
    # Define collaboration parameters
    collaboration_instruction = """When you encounter legal documents, contracts, agreements, or terms that need legal review:
1. Extract the full text of the legal document from the email
2. Pass the document to the Legal collaborator for analysis
3. Wait for the Legal agent's assessment
4. Include the legal analysis in your response to the user

Specifically invoke the Legal collaborator when:
- Users ask about contracts or legal documents in emails
- You find attachments or content that appears to be legal agreements
- Users request legal review of email content
- Questions involve terms, conditions, agreements, or contracts"""

    payload = {
        "agentId": GMAIL_AGENT_ID,
        "agentVersion": "DRAFT",
        "agentDescriptor": {"aliasArn": LEGAL_AGENT_ALIAS_ARN},
        "collaborationInstruction": collaboration_instruction,
        "collaboratorName": "LegalDocumentReview",
        "relayConversationHistory": "TO_COLLABORATOR",
        "clientToken": str(int(time.time() * 1000))
    }
    
    print("\nAdding Legal agent as collaborator to Gmail agent...")
    
    try:
        # Use the put_agent_collaborator API
        resp = bedrock_agent.put_agent_collaborator(**payload)
        print("✅ Collaboration set up successfully!")
        print("\nCollaborator details:")
        print(json.dumps(resp['agentCollaborator'], indent=2, default=str))
        
        # Prepare the Gmail agent to apply changes
        print("\nPreparing Gmail agent to apply collaboration changes...")
        bedrock_agent.prepare_agent(agentId=GMAIL_AGENT_ID)
        
        # Wait for preparation
        print("Waiting for agent preparation...")
        time.sleep(10)
        
        print("\n✅ Agent collaboration is now active!")
        print("\nThe Gmail agent can now hand off legal document analysis to the Legal agent.")
        
    except Exception as e:
        print(f"❌ Error setting up collaboration: {str(e)}")
        print("\nNote: The put_agent_collaborator API might not be available in your region or account.")
        print("You may need to set up collaboration manually in the AWS console.")

def test_collaboration():
    """Test the collaboration with a sample query"""
    print("\n" + "="*50)
    print("Testing collaboration...")
    print("="*50)
    
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)
    
    test_query = "Check if Mehdi sent the contract and analyze it for any risks"
    
    print(f"\nTest query: '{test_query}'")
    print("\nThis should trigger:")
    print("1. Gmail agent searches for emails from Mehdi about contracts")
    print("2. Gmail agent finds the contract")
    print("3. Gmail agent hands off to Legal agent for analysis")
    print("4. Legal agent analyzes the contract")
    print("5. Combined response is returned\n")
    
    try:
        response = bedrock_runtime.invoke_agent(
            agentId=GMAIL_AGENT_ID,
            agentAliasId=os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'WDGFWL1YCB'),
            sessionId='test-collaboration-session',
            inputText=test_query
        )
        
        print("Response:")
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    print(text, end='', flush=True)
        print("\n")
        
    except Exception as e:
        print(f"Error testing collaboration: {str(e)}")

def main():
    """Main function"""
    print("Multi-Agent Collaboration Setup")
    print("================================\n")
    
    # Set up collaboration
    setup_collaboration()
    
    # Optionally test
    response = input("\nWould you like to test the collaboration? (y/N): ").strip().lower()
    if response == 'y':
        test_collaboration()
    
    print("\nSetup complete!")

if __name__ == '__main__':
    main() 