#!/usr/bin/env python3
"""
Master deployment script for complete Patchline Bedrock Agent setup
"""

import subprocess
import sys
import os
import re
from pathlib import Path

# Load environment variables from .env.local file
def load_env_file():
    """Load environment variables from .env.local file in project root"""
    # Go up two directories to reach project root from backend/scripts
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
        print("✅ Environment variables loaded from .env.local")
    else:
        print(f"⚠️  No .env.local file found at {env_file}")
        print("   Please create .env.local in your project root with required variables")

def delete_existing_agent():
    """Delete existing Bedrock agent if it exists"""
    print("\n🧹 Checking for existing Bedrock agent...")
    
    # Check if agent exists by trying to list agents and find PatchlineEmailAgent
    try:
        import boto3
        bedrock_agent = boto3.client('bedrock-agent', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        
        response = bedrock_agent.list_agents()
        existing_agent = None
        
        for agent_summary in response.get('agentSummaries', []):
            if agent_summary['agentName'] == 'PatchlineEmailAgent':
                existing_agent = agent_summary
                break
        
        if existing_agent:
            agent_id = existing_agent['agentId']
            print(f"🗑️  Found existing agent: {agent_id}")
            
            # Delete aliases first
            try:
                aliases = bedrock_agent.list_agent_aliases(agentId=agent_id)
                for alias in aliases.get('agentAliasSummaries', []):
                    if alias['agentAliasName'] != 'TSTALIASID':
                        bedrock_agent.delete_agent_alias(
                            agentId=agent_id,
                            agentAliasId=alias['agentAliasId']
                        )
                        print(f"   Deleted alias: {alias['agentAliasName']}")
            except Exception as e:
                print(f"   Warning: Could not clean up aliases: {str(e)}")
            
            # Delete action groups
            try:
                action_groups = bedrock_agent.list_agent_action_groups(
                    agentId=agent_id,
                    agentVersion='DRAFT'
                )
                for ag in action_groups.get('actionGroupSummaries', []):
                    bedrock_agent.delete_agent_action_group(
                        agentId=agent_id,
                        agentVersion='DRAFT',
                        actionGroupId=ag['actionGroupId']
                    )
                    print(f"   Deleted action group: {ag['actionGroupName']}")
            except Exception as e:
                print(f"   Warning: Could not clean up action groups: {str(e)}")
            
            # Delete the agent
            bedrock_agent.delete_agent(agentId=agent_id)
            print(f"✅ Deleted existing agent: {agent_id}")
            
            # Wait for deletion
            import time
            time.sleep(5)
            
        else:
            print("ℹ️  No existing agent found")
            
    except Exception as e:
        print(f"⚠️  Could not check/delete existing agent: {str(e)}")
        print("   Continuing with deployment...")

def create_bedrock_agent_and_get_ids():
    """Create Bedrock Agent and return its ID and alias ID"""
    print("\n🚀 Creating new Bedrock Agent...")
    
    script_path = Path(__file__).parent / 'create-bedrock-agent.py'
    
    try:
        result = subprocess.run([
            sys.executable, str(script_path)
        ], check=True, capture_output=True, text=True)
        
        print("✅ Bedrock Agent created successfully!")
        
        # Parse the output to extract BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID
        agent_id = None
        alias_id = None
        
        for line in result.stdout.splitlines():
            if "BEDROCK_AGENT_ID=" in line:
                agent_id = line.split('=')[1].strip()
            elif "BEDROCK_AGENT_ALIAS_ID=" in line:
                alias_id = line.split('=')[1].strip()
        
        if not agent_id or not alias_id:
            # Try alternative parsing method
            agent_id_match = re.search(r'Agent ID: ([A-Z0-9]+)', result.stdout)
            alias_id_match = re.search(r'Agent Alias ID: ([A-Z0-9]+)', result.stdout)
            
            if agent_id_match:
                agent_id = agent_id_match.group(1)
            if alias_id_match:
                alias_id = alias_id_match.group(1)
        
        if not agent_id or not alias_id:
            print("❌ Could not extract agent ID and alias ID from output")
            print("Output:", result.stdout)
            sys.exit(1)
        
        print(f"📋 Agent ID: {agent_id}")
        print(f"📋 Alias ID: {alias_id}")
        
        return agent_id, alias_id
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Bedrock Agent creation failed with exit code {e.returncode}")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        sys.exit(1)

def delete_existing_lambdas():
    """Delete existing Lambda functions"""
    print("\n🧹 Deleting existing Lambda functions...")
    
    try:
        import boto3
        lambda_client = boto3.client('lambda', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
        
        functions_to_delete = ['gmail-auth-handler', 'gmail-action-handler']
        
        for func_name in functions_to_delete:
            try:
                lambda_client.delete_function(FunctionName=func_name)
                print(f"✅ Deleted Lambda function: {func_name}")
            except lambda_client.exceptions.ResourceNotFoundException:
                print(f"ℹ️  Lambda function {func_name} does not exist")
            except Exception as e:
                print(f"⚠️  Could not delete {func_name}: {str(e)}")
    
    except Exception as e:
        print(f"⚠️  Could not delete Lambda functions: {str(e)}")
        print("   Continuing with deployment...")

def deploy_lambda_with_agent_ids(agent_id: str, alias_id: str):
    """Deploy Lambda functions with the correct agent IDs"""
    print(f"\n🚀 Deploying Lambda Functions with Agent IDs...")
    print(f"   Agent ID: {agent_id}")
    print(f"   Alias ID: {alias_id}")
    
    # Set environment variables for the lambda deployment script
    os.environ['BEDROCK_AGENT_ID'] = agent_id
    os.environ['BEDROCK_AGENT_ALIAS_ID'] = alias_id
    
    script_path = Path(__file__).parent / 'deploy-lambda-functions.py'
    
    try:
        result = subprocess.run([
            sys.executable, str(script_path)
        ], check=True, capture_output=False)
        
        print("✅ Lambda functions deployed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Lambda deployment failed with exit code {e.returncode}")
        return False

def run_script(script_name: str, description: str):
    """Run a deployment script"""
    print(f"\n🚀 {description}")
    print("=" * 60)
    
    script_path = Path(__file__).parent / script_name
    
    try:
        result = subprocess.run([
            sys.executable, str(script_path)
        ], check=True, capture_output=False)
        
        print(f"✅ {description} completed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False

def check_environment():
    """Check required environment variables"""
    # Map the variables to what might be in your .env.local
    required_vars = {
        'AWS_REGION': ['AWS_REGION', 'REGION_AWS'],
        'AWS_ACCESS_KEY_ID': ['AWS_ACCESS_KEY_ID', 'ACCESS_KEY_ID'],
        'AWS_SECRET_ACCESS_KEY': ['AWS_SECRET_ACCESS_KEY', 'SECRET_ACCESS_KEY'],
        'GMAIL_CLIENT_ID': ['GMAIL_CLIENT_ID', 'GOOGLE_CLIENT_ID'],
        'GMAIL_CLIENT_SECRET': ['GMAIL_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'],
        'GMAIL_REDIRECT_URI': ['GMAIL_REDIRECT_URI', 'GOOGLE_REDIRECT_URI']
    }
    
    missing_vars = []
    found_vars = {}
    
    for standard_name, possible_names in required_vars.items():
        value = None
        for name in possible_names:
            value = os.environ.get(name)
            if value:
                # Set the standard name if it's not already set
                if not os.environ.get(standard_name):
                    os.environ[standard_name] = value
                found_vars[standard_name] = value
                break
        
        if not value:
            missing_vars.append(f"{standard_name} (or {', '.join(possible_names)})")
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease add these variables to your .env.local file and try again.")
        return False
    
    print("✅ All required environment variables are set:")
    for var, value in found_vars.items():
        # Mask sensitive values
        if 'SECRET' in var or 'KEY' in var:
            masked_value = value[:8] + '...' if len(value) > 8 else '***'
            print(f"   ✓ {var}={masked_value}")
        else:
            print(f"   ✓ {var}={value}")
    
    return True

def update_env_file(agent_id: str, alias_id: str):
    """Update .env.local file with new agent IDs"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if not env_file.exists():
        print("⚠️  .env.local file not found, skipping update")
        return
    
    # Read current content
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    # Update or add agent IDs
    agent_id_updated = False
    alias_id_updated = False
    
    for i, line in enumerate(lines):
        if line.startswith('BEDROCK_AGENT_ID='):
            lines[i] = f'BEDROCK_AGENT_ID={agent_id}\n'
            agent_id_updated = True
        elif line.startswith('BEDROCK_AGENT_ALIAS_ID='):
            lines[i] = f'BEDROCK_AGENT_ALIAS_ID={alias_id}\n'
            alias_id_updated = True
    
    # Add missing variables
    if not agent_id_updated:
        lines.append(f'BEDROCK_AGENT_ID={agent_id}\n')
    if not alias_id_updated:
        lines.append(f'BEDROCK_AGENT_ALIAS_ID={alias_id}\n')
    
    # Write back to file
    with open(env_file, 'w') as f:
        f.writelines(lines)
    
    print(f"✅ Updated .env.local with new agent IDs")

def main():
    """Main deployment orchestrator"""
    print("🎵 Patchline Bedrock Agent - Complete Deployment")
    print("=" * 60)
    print("This script will deploy everything needed for the Gmail Agent:")
    print("1. Delete existing Bedrock agent (if exists)")
    print("2. Create new Bedrock agent")
    print("3. Delete existing Lambda functions")
    print("4. Deploy Lambda functions with correct agent IDs")
    print("5. Update .env.local with new agent IDs")
    
    # Load environment variables from .env.local
    load_env_file()
    
    # Check environment
    print("\n📋 Checking environment...")
    if not check_environment():
        sys.exit(1)
    
    # Confirm deployment
    response = input("\n🤔 Ready to deploy? This will DELETE and recreate AWS resources. (y/N): ")
    if response.lower() != 'y':
        print("Deployment cancelled.")
        sys.exit(0)
    
    # Step 1: Delete existing agent
    delete_existing_agent()
    
    # Step 2: Create new Bedrock Agent and get IDs
    agent_id, alias_id = create_bedrock_agent_and_get_ids()
    
    # Step 3: Delete existing Lambda functions
    delete_existing_lambdas()
    
    # Step 4: Deploy Lambda functions with correct agent IDs
    if not deploy_lambda_with_agent_ids(agent_id, alias_id):
        print("❌ Lambda deployment failed. Stopping.")
        sys.exit(1)
    
    # Step 5: Update .env.local file
    update_env_file(agent_id, alias_id)
    
    # Success!
    print("\n" + "🎉" * 20)
    print("🎵 PATCHLINE BEDROCK AGENT DEPLOYED SUCCESSFULLY! 🎵")
    print("🎉" * 20)
    print("\n📋 What's been created:")
    print("✅ New Bedrock Agent with Gmail actions")
    print("✅ Gmail Lambda functions with correct agent IDs")
    print("✅ DynamoDB table for OAuth tokens")
    print("✅ S3 bucket for knowledge base")
    print("✅ Secrets Manager for Gmail credentials")
    print("✅ Updated .env.local with new agent IDs")
    print(f"\n📋 Agent Details:")
    print(f"   Agent ID: {agent_id}")
    print(f"   Alias ID: {alias_id}")
    print("\n📋 Next steps:")
    print("1. Test the Gmail OAuth flow in your app")
    print("2. Try asking the agent about your emails!")
    print("3. Update Amplify environment variables with new agent IDs")
    print("\n🎸 Rock on! Your AI assistant is ready to help manage your music career!")

if __name__ == '__main__':
    main()