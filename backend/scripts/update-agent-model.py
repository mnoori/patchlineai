#!/usr/bin/env python3
"""
Script to update existing Bedrock Agent to use Claude 4 Sonnet model
"""

import boto3
import json
import os
import sys
from pathlib import Path

# Import centralized configuration
from config import BEDROCK_MODELS, AGENT_FOUNDATION_MODEL

def load_env_file():
    """Load environment variables from .env.local file"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"📁 Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

def update_agent_model():
    """Update the agent to use Claude 4 Sonnet model"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    
    if not agent_id:
        print("❌ Missing BEDROCK_AGENT_ID in environment")
        return False
    
    print(f"🤖 Updating Bedrock Agent: {agent_id}")
    print(f"🔄 Changing model to: Claude 4 Sonnet")
    
    # Initialize Bedrock agent client
    bedrock_agent = boto3.client('bedrock-agent', region_name=region)
    
    try:
        # Get current agent configuration
        response = bedrock_agent.get_agent(agentId=agent_id)
        current_agent = response['agent']
        
        print(f"📋 Current model: {current_agent['foundationModel']}")
        
        # Use the Claude 4 Sonnet inference profile from config
        new_model_id = AGENT_FOUNDATION_MODEL
        print(f"🆕 New model ID: {new_model_id}")
        
        # Update the agent
        update_response = bedrock_agent.update_agent(
            agentId=agent_id,
            agentName=current_agent['agentName'],
            agentResourceRoleArn=current_agent['agentResourceRoleArn'],
            description=current_agent.get('description', ''),
            foundationModel=new_model_id,
            instruction=current_agent.get('instruction', ''),
            idleSessionTTLInSeconds=current_agent.get('idleSessionTTLInSeconds', 900)
        )
        
        print("✅ Agent updated successfully")
        
        # Prepare the agent with new configuration
        print("🔄 Preparing agent with new model...")
        bedrock_agent.prepare_agent(agentId=agent_id)
        
        # Wait for preparation
        import time
        max_attempts = 30
        attempt = 0
        
        while attempt < max_attempts:
            response = bedrock_agent.get_agent(agentId=agent_id)
            status = response['agent']['agentStatus']
            
            if status == 'PREPARED':
                print("✅ Agent prepared successfully with Claude 4 Sonnet!")
                break
            elif status == 'FAILED':
                print("❌ Agent preparation failed")
                # Get failure reasons if available
                if 'failureReasons' in response['agent']:
                    print("Failure reasons:")
                    for reason in response['agent']['failureReasons']:
                        print(f"  - {reason}")
                return False
            else:
                print(f"⏳ Agent status: {status} (attempt {attempt + 1}/{max_attempts})")
                time.sleep(10)
                attempt += 1
        
        if attempt >= max_attempts:
            print("❌ Agent preparation timed out")
            return False
        
        # Update aliases to use new version
        print("🔄 Updating agent aliases...")
        aliases = bedrock_agent.list_agent_aliases(agentId=agent_id)
        
        for alias in aliases.get('agentAliasSummaries', []):
            if alias['agentAliasName'] != 'TSTALIASID':
                try:
                    bedrock_agent.update_agent_alias(
                        agentId=agent_id,
                        agentAliasId=alias['agentAliasId'],
                        agentAliasName=alias['agentAliasName']
                    )
                    print(f"✅ Updated alias: {alias['agentAliasName']}")
                except Exception as e:
                    print(f"⚠️  Could not update alias {alias['agentAliasName']}: {str(e)}")
        
        print("\n🎉 Agent successfully updated to use Claude 4 Sonnet!")
        print(f"📋 Agent ID: {agent_id}")
        print(f"🤖 New Model: Claude 4 Sonnet")
        print(f"🔗 Model ARN: {new_model_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating agent: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🚀 Updating Bedrock Agent Model to Claude 4 Sonnet")
    print("="*50)
    
    success = update_agent_model()
    
    if success:
        print("\n✅ Update completed successfully!")
        print("\n📝 Next steps:")
        print("1. Test the agent with: python test-agent-with-session.py")
        print("2. The agent will now use Claude 4 Sonnet for better quality responses")
    else:
        print("\n❌ Update failed!")
        sys.exit(1) 