#!/usr/bin/env python3
"""
Script to create and configure Amazon Bedrock Agent with Gmail integration
"""

import boto3
import json
import time
import sys
import os
from typing import Dict, Any
from pathlib import Path

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file in project root"""
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
    
    # Normalize variable names
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']

# Configuration constants (these don't need env vars)
AGENT_NAME = 'PatchlineEmailAgent'
AGENT_DESCRIPTION = 'AI assistant for managing emails and communications'
FOUNDATION_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0'
ACTION_GROUP_NAME = 'GmailActions'
KNOWLEDGE_BASE_NAME = 'PatchlineEmailKnowledge'

# Global variables will be initialized in main()
REGION = None
bedrock_agent = None
bedrock_runtime = None
iam = None
s3 = None
lambda_client = None

# ---------------------------------------------------------------------------
# IAM ROLE HELPERS
# ---------------------------------------------------------------------------
# If AGENT_ROLE_ARN env var is provided we simply return it. Otherwise the
# script will create (or reuse) the default <AGENT_NAME>Role and attach the
# required inline policy.

def create_agent_role():
    """Create IAM role for Bedrock Agent"""
    # If user provided an existing role ARN, reuse it
    existing_role_arn = os.environ.get('AGENT_ROLE_ARN')
    if existing_role_arn:
        print(f"Using existing IAM role from ENV AGENT_ROLE_ARN: {existing_role_arn}")
        return existing_role_arn

    role_name = f'{AGENT_NAME}Role'
    
    # Trust policy for Bedrock
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "bedrock.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    # Create role
    try:
        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description=f'Role for {AGENT_NAME} Bedrock Agent'
        )
        role_arn = response['Role']['Arn']
        print(f"Created IAM role: {role_arn}")
    except iam.exceptions.EntityAlreadyExistsException:
        response = iam.get_role(RoleName=role_name)
        role_arn = response['Role']['Arn']
        print(f"Using existing IAM role: {role_arn}")
    
    # Attach inline policy with permissions
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "lambda:InvokeFunction"
                ],
                "Resource": [
                    f"arn:aws:lambda:{REGION}:*:function:gmail-action-handler"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock:Retrieve",
                    "bedrock:RetrieveAndGenerate"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::patchline-agent-schemas/*",
                    "arn:aws:s3:::patchline-email-knowledge-base/*"
                ]
            }
        ]
    }

    policy_name = f'{AGENT_NAME}Policy'

    try:
        iam.put_role_policy(
            RoleName=role_name,
            PolicyName=policy_name,
            PolicyDocument=json.dumps(policy_document)
        )
        print("Attached policy to role")
    except Exception as e:
        print(f"Error attaching policy: {str(e)}")
    
    # Wait for role to be ready
    time.sleep(10)
    
    return role_arn

# ---------------------------------------------------------------------------
# S3 HELPERS
# ---------------------------------------------------------------------------

def upload_api_schema():
    """Upload OpenAPI schema to S3"""
    bucket_name = 'patchline-agent-schemas'
    
    try:
        if REGION == 'us-east-1':
            # us-east-1 does NOT accept CreateBucketConfiguration
            s3.create_bucket(Bucket=bucket_name)
        else:
            s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': REGION}
            )
        print(f"Created S3 bucket: {bucket_name}")
    except s3.exceptions.BucketAlreadyExists:
        print(f"S3 bucket already exists: {bucket_name}")
    except s3.exceptions.BucketAlreadyOwnedByYou:
        print(f"S3 bucket already owned: {bucket_name}")
    
    # Upload schema
    schema_path = os.path.join(os.path.dirname(__file__), '../lambda/gmail-actions-openapi.json')
    with open(schema_path, 'r') as f:
        schema_content = f.read()
    
    s3.put_object(
        Bucket=bucket_name,
        Key='gmail-actions-openapi.json',
        Body=schema_content,
        ContentType='application/json'
    )
    
    print(f"Uploaded API schema to S3")
    
    return f"s3://{bucket_name}/gmail-actions-openapi.json"

def get_lambda_arn(function_name: str) -> str:
    """Get Lambda function ARN"""
    try:
        response = lambda_client.get_function(FunctionName=function_name)
        return response['Configuration']['FunctionArn']
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"Lambda function {function_name} not found. Please deploy it first.")
        sys.exit(1)

def create_agent(role_arn: str) -> Dict[str, Any]:
    """Create Bedrock Agent"""
    
    instruction = """You are Patchy, an AI assistant that helps music industry professionals manage their emails and communications. 

You have access to their Gmail account and can:
- Search and read emails
- Create email drafts
- Send emails (with user approval)
- Analyze email content and provide summaries
- Help manage email conversations

When users ask about emails, contracts, communications, or anything email-related, use the Gmail actions to search and retrieve relevant information.

Always be professional, helpful, and respect user privacy. When drafting emails, match the user's tone and style. Ask for confirmation before sending any emails.

Important guidelines:
1. When searching emails, use appropriate Gmail search queries
2. Provide concise summaries of email content
3. Highlight important information like dates, deadlines, and action items
4. Maintain context across conversations
5. Be proactive in suggesting follow-ups or responses"""
    
    try:
        response = bedrock_agent.create_agent(
            agentName=AGENT_NAME,
            agentResourceRoleArn=role_arn,
            description=AGENT_DESCRIPTION,
            foundationModel=FOUNDATION_MODEL,
            instruction=instruction,
            idleSessionTTLInSeconds=900
        )
        
        agent = response['agent']
        print(f"Created agent: {agent['agentId']}")
        
        # Wait for agent to be ready
        time.sleep(5)
        
        return agent
        
    except Exception as e:
        print(f"Error creating agent: {str(e)}")
        sys.exit(1)

def create_action_group(agent_id: str, lambda_arn: str, schema_s3_url: str):
    """Create action group for Gmail operations"""
    
    # Parse S3 URL
    bucket = schema_s3_url.split('/')[2]
    key = '/'.join(schema_s3_url.split('/')[3:])
    
    try:
        response = bedrock_agent.create_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupName=ACTION_GROUP_NAME,
            actionGroupState='ENABLED',
            description='Actions for Gmail operations',
            actionGroupExecutor={
                'lambda': lambda_arn
            },
            apiSchema={
                's3': {
                    's3BucketName': bucket,
                    's3ObjectKey': key
                }
            }
        )
        
        action_group = response['agentActionGroup']
        print(f"Created action group: {action_group['actionGroupId']}")
        
        return action_group
        
    except Exception as e:
        print(f"Error creating action group: {str(e)}")
        sys.exit(1)

def prepare_agent(agent_id: str):
    """Prepare agent for use"""
    try:
        response = bedrock_agent.prepare_agent(
            agentId=agent_id
        )
        print(f"Preparing agent...")
        
        # Wait for preparation
        while True:
            response = bedrock_agent.get_agent(
                agentId=agent_id
            )
            status = response['agent']['agentStatus']
            if status == 'PREPARED':
                print("Agent prepared successfully")
                break
            elif status == 'FAILED':
                print("Agent preparation failed")
                sys.exit(1)
            else:
                print(f"Agent status: {status}")
                time.sleep(5)
                
    except Exception as e:
        print(f"Error preparing agent: {str(e)}")
        sys.exit(1)

def create_agent_alias(agent_id: str) -> Dict[str, Any]:
    """Create agent alias for deployment"""
    try:
        response = bedrock_agent.create_agent_alias(
            agentId=agent_id,
            agentAliasName='Production',
            description='Production alias for Patchline Email Agent'
        )
        
        alias = response['agentAlias']
        print(f"Created agent alias: {alias['agentAliasId']}")
        
        # Wait for alias to be ready
        while True:
            response = bedrock_agent.get_agent_alias(
                agentId=agent_id,
                agentAliasId=alias['agentAliasId']
            )
            status = response['agentAlias']['agentAliasStatus']
            if status == 'PREPARED':
                print("Agent alias ready")
                break
            else:
                print(f"Alias status: {status}")
                time.sleep(5)
        
        return alias
        
    except Exception as e:
        print(f"Error creating agent alias: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    # Load environment variables first
    load_env_file()
    
    # Now initialize configuration and AWS clients with loaded env vars
    global REGION, bedrock_agent, bedrock_runtime, iam, s3, lambda_client
    REGION = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Initialize AWS clients
    bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)
    iam = boto3.client('iam')
    s3 = boto3.client('s3', region_name=REGION)
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    print("Creating Bedrock Agent for Gmail integration...\n")
    
    # Step 1: Create IAM role
    print("Step 1: Creating IAM role...")
    role_arn = create_agent_role()
    
    # Step 2: Upload API schema
    print("\nStep 2: Uploading API schema...")
    schema_s3_url = upload_api_schema()
    
    # Step 3: Get Lambda ARN
    print("\nStep 3: Getting Lambda function...")
    lambda_arn = get_lambda_arn('gmail-action-handler')
    
    # Step 4: Create agent
    print("\nStep 4: Creating Bedrock Agent...")
    agent = create_agent(role_arn)
    agent_id = agent['agentId']
    
    # Step 5: Create action group
    print("\nStep 5: Creating action group...")
    action_group = create_action_group(agent_id, lambda_arn, schema_s3_url)
    
    # Step 6: Prepare agent
    print("\nStep 6: Preparing agent...")
    prepare_agent(agent_id)
    
    # Step 7: Create alias
    print("\nStep 7: Creating agent alias...")
    alias = create_agent_alias(agent_id)
    
    # Output configuration
    print("\n" + "="*50)
    print("BEDROCK AGENT CREATED SUCCESSFULLY!")
    print("="*50)
    print(f"Agent ID: {agent_id}")
    print(f"Agent Alias ID: {alias['agentAliasId']}")
    print(f"Agent ARN: {agent['agentArn']}")
    print(f"Role ARN: {role_arn}")
    print("\nAdd these to your environment variables:")
    print(f"BEDROCK_AGENT_ID={agent_id}")
    print(f"BEDROCK_AGENT_ALIAS_ID={alias['agentAliasId']}")
    print("\nAgent is ready to use!")

if __name__ == '__main__':
    main() 