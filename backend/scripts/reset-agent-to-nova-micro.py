#!/usr/bin/env python3
"""
Reset Bedrock Agent to use Nova Micro model
"""

import boto3
import json
import os
import sys
import time
from pathlib import Path

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

def reset_agent():
    """Reset the agent to use Nova Micro model"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    
    if not agent_id:
        print("❌ Missing BEDROCK_AGENT_ID in environment")
        return False
    
    print(f"🤖 Resetting Bedrock Agent: {agent_id}")
    print(f"🔄 Setting model to: Nova Micro (amazon.nova-micro-v1:0)")
    
    # Initialize Bedrock agent client
    bedrock_agent = boto3.client('bedrock-agent', region_name=region)
    
    try:
        # Get current agent configuration
        response = bedrock_agent.get_agent(agentId=agent_id)
        current_agent = response['agent']
        
        print(f"📋 Current status: {current_agent['agentStatus']}")
        print(f"📋 Current model: {current_agent['foundationModel']}")
        
        # Update agent with Nova Micro model
        nova_micro_id = 'amazon.nova-micro-v1:0'
        print(f"🆕 Setting model to: {nova_micro_id}")
        
        # Update the agent
        update_response = bedrock_agent.update_agent(
            agentId=agent_id,
            agentName=current_agent['agentName'],
            agentResourceRoleArn=current_agent['agentResourceRoleArn'],
            description=current_agent.get('description', ''),
            foundationModel=nova_micro_id,
            instruction=current_agent.get('instruction', ''),
            idleSessionTTLInSeconds=current_agent.get('idleSessionTTLInSeconds', 900)
        )
        
        print("✅ Agent updated successfully")
        
        # Prepare the agent with new configuration
        print("🔄 Preparing agent...")
        bedrock_agent.prepare_agent(agentId=agent_id)
        
        # Wait for preparation
        max_attempts = 30
        attempt = 0
        
        while attempt < max_attempts:
            response = bedrock_agent.get_agent(agentId=agent_id)
            status = response['agent']['agentStatus']
            
            if status == 'PREPARED':
                print("✅ Agent prepared successfully!")
                break
            elif status == 'FAILED':
                print("❌ Agent preparation failed")
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
        
        print("\n🎉 Agent successfully reset to Nova Micro!")
        print(f"📋 Agent ID: {agent_id}")
        print(f"🤖 Model: {nova_micro_id}")
        print("\n✅ The agent should now work properly with Gmail integration")
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting agent: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🚀 Resetting Bedrock Agent to Nova Micro")
    print("="*50)
    
    success = reset_agent()
    
    if success:
        print("\n✅ Reset completed successfully!")
        print("\n📝 Next steps:")
        print("1. Test the agent with: python test-agent-with-session.py")
        print("2. The agent will use Nova Micro for processing requests")
        print("3. For chat mode, you can still use Claude models via inference profiles")
    else:
        print("\n❌ Reset failed!")
        sys.exit(1) 