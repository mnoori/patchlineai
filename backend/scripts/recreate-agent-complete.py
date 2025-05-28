#!/usr/bin/env python3
"""
Complete Bedrock Agent Recreation Script
This script will:
1. Delete existing agent (if confirmed)
2. Create new agent with proper model
3. Handle the alias creation properly
4. Output the correct IDs for environment variables
"""

import boto3
import json
import time
import sys
import os
from pathlib import Path
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'agent-recreation-{datetime.now().strftime("%Y%m%d-%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import config
sys.path.append(os.path.dirname(__file__))
from config import BEDROCK_MODELS, S3_CONFIG, get_model_id

# Load environment variables
def load_env_file():
    """Load environment variables from .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        logger.info(f"📁 Loading environment variables from {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        logger.info("✅ Environment variables loaded")
    
    # Normalize
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']

# Configuration
AGENT_NAME = 'PatchlineEmailAgent'
AGENT_DESCRIPTION = 'AI assistant for managing emails and communications'
ACTION_GROUP_NAME = 'GmailActions'

def get_aws_clients(region):
    """Initialize AWS clients"""
    return {
        'bedrock_agent': boto3.client('bedrock-agent', region_name=region),
        'bedrock_runtime': boto3.client('bedrock-runtime', region_name=region),
        'iam': boto3.client('iam'),
        's3': boto3.client('s3', region_name=region),
        'lambda': boto3.client('lambda', region_name=region),
        'sts': boto3.client('sts')
    }

def find_and_delete_existing_agent(bedrock_agent):
    """Find and optionally delete existing agent"""
    logger.info("\n🔍 Checking for existing agent...")
    
    try:
        response = bedrock_agent.list_agents()
        existing_agent = None
        
        for agent in response.get('agentSummaries', []):
            if agent['agentName'] == AGENT_NAME:
                existing_agent = agent
                break
        
        if existing_agent:
            logger.info(f"Found existing agent: {existing_agent['agentId']}")
            logger.info(f"Status: {existing_agent['agentStatus']}")
            logger.info(f"Updated: {existing_agent.get('updatedAt', 'Unknown')}")
            
            # Ask for deletion
            response = input("\n⚠️  Delete existing agent? (yes/no): ").strip().lower()
            
            if response == 'yes':
                agent_id = existing_agent['agentId']
                
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
                        logger.info(f"Deleted action group: {ag['actionGroupName']}")
                except Exception as e:
                    logger.warning(f"Could not delete action groups: {str(e)}")
                
                # Delete aliases (except TSTALIASID)
                try:
                    aliases = bedrock_agent.list_agent_aliases(agentId=agent_id)
                    for alias in aliases.get('agentAliasSummaries', []):
                        if alias['agentAliasName'] != 'TSTALIASID':
                            bedrock_agent.delete_agent_alias(
                                agentId=agent_id,
                                agentAliasId=alias['agentAliasId']
                            )
                            logger.info(f"Deleted alias: {alias['agentAliasName']}")
                except Exception as e:
                    logger.warning(f"Could not delete aliases: {str(e)}")
                
                # Delete agent
                bedrock_agent.delete_agent(agentId=agent_id)
                logger.info("✅ Deleted existing agent")
                time.sleep(10)  # Wait for deletion
                return True
            else:
                logger.info("Keeping existing agent")
                return False
        else:
            logger.info("No existing agent found")
            return True
            
    except Exception as e:
        logger.error(f"Error checking for existing agent: {str(e)}")
        return False

def create_agent_role(iam, region, account_id):
    """Create IAM role for agent"""
    role_name = f'{AGENT_NAME}Role'
    
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "bedrock.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }
    
    try:
        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description=f'Role for {AGENT_NAME}'
        )
        role_arn = response['Role']['Arn']
        logger.info(f"✅ Created IAM role: {role_arn}")
    except iam.exceptions.EntityAlreadyExistsException:
        role_arn = iam.get_role(RoleName=role_name)['Role']['Arn']
        logger.info(f"Using existing IAM role: {role_arn}")
    
    # Attach policy
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["lambda:InvokeFunction"],
                "Resource": [f"arn:aws:lambda:{region}:{account_id}:function:gmail-action-handler"]
            },
            {
                "Effect": "Allow",
                "Action": ["bedrock:InvokeModel"],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:ListBucket"],
                "Resource": [
                    f"arn:aws:s3:::{S3_CONFIG['schema_bucket']}/*",
                    f"arn:aws:s3:::{S3_CONFIG['schema_bucket']}"
                ]
            }
        ]
    }
    
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName=f'{AGENT_NAME}Policy',
        PolicyDocument=json.dumps(policy_document)
    )
    
    time.sleep(10)  # Wait for role propagation
    return role_arn

def upload_openapi_schema(s3, region):
    """Upload OpenAPI schema to S3"""
    bucket = S3_CONFIG['schema_bucket']
    
    # Create bucket if needed
    try:
        if region == 'us-east-1':
            s3.create_bucket(Bucket=bucket)
        else:
            s3.create_bucket(
                Bucket=bucket,
                CreateBucketConfiguration={'LocationConstraint': region}
            )
        logger.info(f"Created S3 bucket: {bucket}")
    except s3.exceptions.BucketAlreadyOwnedByYou:
        logger.info(f"S3 bucket exists: {bucket}")
    
    # Upload schema
    schema_path = Path(__file__).parent.parent / 'lambda' / 'gmail-actions-openapi.json'
    with open(schema_path, 'r') as f:
        schema_content = f.read()
    
    s3.put_object(
        Bucket=bucket,
        Key='gmail-actions-openapi.json',
        Body=schema_content,
        ContentType='application/json'
    )
    
    logger.info("✅ Uploaded OpenAPI schema")
    return f"s3://{bucket}/gmail-actions-openapi.json"

def create_new_agent(clients, model_name='nova-micro'):
    """Create new agent with specified model"""
    logger.info(f"\n🤖 Creating new agent with model: {model_name}")
    
    # Get model ID
    try:
        model_id = get_model_id(model_name)
        logger.info(f"Using model: {model_id}")
    except ValueError:
        logger.error(f"Invalid model name: {model_name}")
        return None
    
    # Get account ID
    account_id = clients['sts'].get_caller_identity()['Account']
    region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Create IAM role
    role_arn = create_agent_role(clients['iam'], region, account_id)
    
    # Upload schema
    schema_url = upload_openapi_schema(clients['s3'], region)
    
    # Agent instruction
    instruction = """You are Patchy, an AI assistant that helps music industry professionals manage their emails and communications. 

You have access to their Gmail account and can:
- Search and read emails
- Create email drafts  
- Send emails (with user approval)
- Analyze email content and provide summaries
- Help manage email conversations

When users ask about emails, contracts, communications, or anything email-related, use the Gmail actions to search and retrieve relevant information.

Always be professional, helpful, and respect user privacy. When drafting emails, match the user's tone and style. Ask for confirmation before sending any emails."""

    # Create agent
    try:
        response = clients['bedrock_agent'].create_agent(
            agentName=AGENT_NAME,
            agentResourceRoleArn=role_arn,
            description=AGENT_DESCRIPTION,
            foundationModel=model_id,
            instruction=instruction,
            idleSessionTTLInSeconds=900
        )
        
        agent = response['agent']
        agent_id = agent['agentId']
        logger.info(f"✅ Created agent: {agent_id}")
        
    except Exception as e:
        logger.error(f"Failed to create agent: {str(e)}")
        return None
    
    # Wait for agent to be ready
    time.sleep(5)
    
    # Create action group
    lambda_arn = clients['lambda'].get_function(FunctionName='gmail-action-handler')['Configuration']['FunctionArn']
    
    bucket = schema_url.split('/')[2]
    key = '/'.join(schema_url.split('/')[3:])
    
    try:
        response = clients['bedrock_agent'].create_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupName=ACTION_GROUP_NAME,
            actionGroupState='ENABLED',
            description='Gmail operations',
            actionGroupExecutor={'lambda': lambda_arn},
            apiSchema={'s3': {'s3BucketName': bucket, 's3ObjectKey': key}}
        )
        logger.info("✅ Created action group")
    except Exception as e:
        logger.error(f"Failed to create action group: {str(e)}")
        return None
    
    # Prepare agent
    logger.info("\n⏳ Preparing agent...")
    clients['bedrock_agent'].prepare_agent(agentId=agent_id)
    
    # Wait for preparation
    max_attempts = 30
    for i in range(max_attempts):
        response = clients['bedrock_agent'].get_agent(agentId=agent_id)
        status = response['agent']['agentStatus']
        
        if status == 'PREPARED':
            logger.info("✅ Agent prepared successfully")
            break
        elif status == 'FAILED':
            logger.error("❌ Agent preparation failed")
            return None
        else:
            logger.info(f"Status: {status} ({i+1}/{max_attempts})")
            time.sleep(10)
    
    # Create alias
    logger.info("\n📍 Creating agent alias...")
    try:
        response = clients['bedrock_agent'].create_agent_alias(
            agentId=agent_id,
            agentAliasName='Production',
            description='Production deployment'
        )
        
        alias = response['agentAlias']
        alias_id = alias['agentAliasId']
        logger.info(f"✅ Created alias: {alias_id}")
        
        # Wait for alias
        for i in range(20):
            response = clients['bedrock_agent'].get_agent_alias(
                agentId=agent_id,
                agentAliasId=alias_id
            )
            status = response['agentAlias']['agentAliasStatus']
            
            if status == 'PREPARED':
                logger.info("✅ Alias ready")
                break
            else:
                logger.info(f"Alias status: {status} ({i+1}/20)")
                time.sleep(10)
                
    except Exception as e:
        logger.error(f"Failed to create alias: {str(e)}")
        return None
    
    return {
        'agent_id': agent_id,
        'alias_id': alias_id,
        'model': model_name
    }

def update_agent_model(clients, agent_info, new_model='claude-3-7-sonnet'):
    """Update agent to use different model"""
    logger.info(f"\n🔄 Updating agent model from {agent_info['model']} to {new_model}")
    
    agent_id = agent_info['agent_id']
    
    try:
        # Get new model ID
        new_model_id = get_model_id(new_model)
        logger.info(f"New model ID: {new_model_id}")
        
        # Update agent
        response = clients['bedrock_agent'].update_agent(
            agentId=agent_id,
            agentName=AGENT_NAME,
            foundationModel=new_model_id
        )
        logger.info("✅ Updated agent model")
        
        # Prepare agent again
        logger.info("Preparing agent with new model...")
        clients['bedrock_agent'].prepare_agent(agentId=agent_id)
        
        # Wait for preparation
        for i in range(30):
            response = clients['bedrock_agent'].get_agent(agentId=agent_id)
            status = response['agent']['agentStatus']
            
            if status == 'PREPARED':
                logger.info("✅ Agent prepared with new model")
                break
            else:
                logger.info(f"Status: {status} ({i+1}/30)")
                time.sleep(10)
        
        # Create new alias (the old one points to old version)
        logger.info("\n📍 Creating new alias for updated agent...")
        response = clients['bedrock_agent'].create_agent_alias(
            agentId=agent_id,
            agentAliasName=f'Production-{new_model}',
            description=f'Production with {new_model}'
        )
        
        new_alias = response['agentAlias']
        new_alias_id = new_alias['agentAliasId']
        
        # Wait for alias
        for i in range(20):
            response = clients['bedrock_agent'].get_agent_alias(
                agentId=agent_id,
                agentAliasId=new_alias_id
            )
            status = response['agentAlias']['agentAliasStatus']
            
            if status == 'PREPARED':
                logger.info("✅ New alias ready")
                break
            else:
                logger.info(f"Alias status: {status} ({i+1}/20)")
                time.sleep(10)
        
        return {
            'agent_id': agent_id,
            'alias_id': new_alias_id,
            'model': new_model
        }
        
    except Exception as e:
        logger.error(f"Failed to update model: {str(e)}")
        return None

def main():
    """Main execution"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    logger.info(f"\n🌍 Region: {region}")
    
    # Initialize clients
    clients = get_aws_clients(region)
    
    # Check and delete existing agent
    should_create = find_and_delete_existing_agent(clients['bedrock_agent'])
    
    if not should_create:
        logger.info("\n❌ Exiting - keeping existing agent")
        return
    
    # Create new agent with nova-micro
    logger.info("\n📝 Step 1: Creating agent with nova-micro (for initial setup)")
    agent_info = create_new_agent(clients, model_name='nova-micro')
    
    if not agent_info:
        logger.error("❌ Failed to create agent")
        return
    
    logger.info("\n✅ Agent created successfully!")
    logger.info(f"Agent ID: {agent_info['agent_id']}")
    logger.info(f"Alias ID: {agent_info['alias_id']}")
    
    # Ask if should update to better model
    response = input("\n🔄 Update agent to claude-3-7-sonnet for production? (yes/no): ").strip().lower()
    
    if response == 'yes':
        updated_info = update_agent_model(clients, agent_info, 'claude-3-7-sonnet')
        
        if updated_info:
            agent_info = updated_info
            logger.info("\n✅ Agent updated to claude-3-7-sonnet!")
        else:
            logger.warning("⚠️  Failed to update model, keeping nova-micro")
    
    # Output final configuration
    logger.info("\n" + "="*60)
    logger.info("🎉 AGENT CREATION COMPLETE!")
    logger.info("="*60)
    logger.info("\n📋 Add these to your .env.local file:")
    logger.info(f"BEDROCK_AGENT_ID={agent_info['agent_id']}")
    logger.info(f"BEDROCK_AGENT_ALIAS_ID={agent_info['alias_id']}")
    logger.info(f"\n🤖 Current model: {agent_info['model']}")
    logger.info("\n📄 Next steps:")
    logger.info("1. Update .env.local with the IDs above")
    logger.info("2. Redeploy Lambda functions with: python backend/scripts/deploy-lambda-functions-enhanced.py")
    logger.info("3. Test the agent with: python backend/scripts/test-bedrock-agent.py")
    logger.info(f"\n📄 Log file: agent-recreation-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log")

if __name__ == '__main__':
    main() 