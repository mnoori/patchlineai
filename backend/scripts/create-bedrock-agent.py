#!/usr/bin/env python3
"""
Script to create and configure Amazon Bedrock Agent with Gmail integration
"""

import boto3
import json
import time
import sys
import os
from typing import Dict, Any, Optional
from pathlib import Path

# Import centralized configuration
from config import (
    DEFAULT_REGION, 
    AGENT_CONFIG, 
    S3_CONFIG, 
    BEDROCK_MODELS,
    get_model_id
)

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
    
    # Normalize variable names
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']

# Configuration from centralized config
AGENT_NAME = AGENT_CONFIG['name']
AGENT_DESCRIPTION = AGENT_CONFIG['description']
FOUNDATION_MODEL = AGENT_CONFIG['foundation_model']
ACTION_GROUP_NAME = AGENT_CONFIG['action_group_name']
KNOWLEDGE_BASE_NAME = AGENT_CONFIG['knowledge_base_name']

# Allow model override via environment variable
MODEL_OVERRIDE = os.environ.get('BEDROCK_MODEL_NAME')
if MODEL_OVERRIDE:
    try:
        FOUNDATION_MODEL = get_model_id(MODEL_OVERRIDE)
        print(f"[UPDATE] Using model override: {MODEL_OVERRIDE} ({FOUNDATION_MODEL})")
    except ValueError as e:
        print(f"[WARNING] Invalid model override '{MODEL_OVERRIDE}': {e}")
        print(f"[UPDATE] Using default model: {FOUNDATION_MODEL}")

print(f"[ROBOT] Using foundation model: {FOUNDATION_MODEL}")

# Global variables will be initialized in main()
REGION = None
bedrock_agent = None
bedrock_runtime = None
iam = None
s3 = None
lambda_client = None

# ---------------------------------------------------------------------------
# UTILITY FUNCTIONS
# ---------------------------------------------------------------------------

def find_existing_agent() -> Optional[Dict[str, Any]]:
    """Find existing agent by name"""
    try:
        response = bedrock_agent.list_agents()
        for agent_summary in response.get('agentSummaries', []):
            if agent_summary['agentName'] == AGENT_NAME:
                # Get full agent details
                agent_response = bedrock_agent.get_agent(agentId=agent_summary['agentId'])
                return agent_response['agent']
        return None
    except Exception as e:
        print(f"Error checking for existing agent: {str(e)}")
        return None

def cleanup_existing_agent(agent_id: str):
    """Clean up existing agent and its components"""
    try:
        print(f"[CLEAN] Cleaning up existing agent {agent_id}...")
        
        # List and delete action groups
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
        
        # List and delete aliases
        try:
            aliases = bedrock_agent.list_agent_aliases(agentId=agent_id)
            for alias in aliases.get('agentAliasSummaries', []):
                if alias['agentAliasName'] != 'TSTALIASID':  # Don't delete test alias
                    bedrock_agent.delete_agent_alias(
                        agentId=agent_id,
                        agentAliasId=alias['agentAliasId']
                    )
                    print(f"   Deleted alias: {alias['agentAliasName']}")
        except Exception as e:
            print(f"   Warning: Could not clean up aliases: {str(e)}")
        
        # Delete the agent
        bedrock_agent.delete_agent(agentId=agent_id)
        print(f"[OK] Deleted existing agent")
        
        # Wait for deletion
        time.sleep(5)
        
    except Exception as e:
        print(f"Error cleaning up agent: {str(e)}")

def validate_openapi_schema(schema_path: str) -> bool:
    """Validate OpenAPI schema format"""
    try:
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Basic validation
        required_fields = ['openapi', 'info', 'paths']
        for field in required_fields:
            if field not in schema:
                print(f"[ERROR] Missing required field in OpenAPI schema: {field}")
                return False
        
        # Check OpenAPI version
        if not schema['openapi'].startswith('3.0'):
            print(f"[ERROR] Unsupported OpenAPI version: {schema['openapi']}")
            return False
        
        # Validate paths
        if not schema['paths']:
            print("[ERROR] No paths defined in OpenAPI schema")
            return False
        
        print("[OK] OpenAPI schema validation passed")
        return True
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON in OpenAPI schema: {str(e)}")
        return False
    except Exception as e:
        print(f"[ERROR] Error validating OpenAPI schema: {str(e)}")
        return False

# ---------------------------------------------------------------------------
# IAM ROLE HELPERS
# ---------------------------------------------------------------------------

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
                    "s3:GetObject"
                ],
                "Resource": [
                    f"arn:aws:s3:::{S3_CONFIG['schema_bucket']}/*",
                    f"arn:aws:s3:::{S3_CONFIG['knowledge_base_bucket']}/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::{S3_CONFIG['schema_bucket']}",
                    f"arn:aws:s3:::{S3_CONFIG['knowledge_base_bucket']}"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock:InvokeModel"
                ],
                "Resource": "*"
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
    bucket_name = S3_CONFIG['schema_bucket']
    
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
    
    # Validate schema before upload
    schema_path = os.path.join(os.path.dirname(__file__), '../lambda/gmail-actions-openapi.json')
    if not validate_openapi_schema(schema_path):
        print("[ERROR] OpenAPI schema validation failed. Please fix the schema.")
        sys.exit(1)
    
    # Upload schema
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
        print(f"Schema S3 URL: {schema_s3_url}")
        print(f"Bucket: {bucket}, Key: {key}")
        
        # Try to read the schema from S3 to debug
        try:
            obj = s3.get_object(Bucket=bucket, Key=key)
            schema_content = obj['Body'].read().decode('utf-8')
            print("Schema content preview:")
            print(schema_content[:500] + "..." if len(schema_content) > 500 else schema_content)
        except Exception as s3_error:
            print(f"Could not read schema from S3: {str(s3_error)}")
        
        sys.exit(1)

def prepare_agent(agent_id: str):
    """Prepare agent for use"""
    try:
        response = bedrock_agent.prepare_agent(
            agentId=agent_id
        )
        print(f"Preparing agent...")
        
        # Wait for preparation
        max_attempts = 30
        attempt = 0
        while attempt < max_attempts:
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
                print(f"Agent status: {status} (attempt {attempt + 1}/{max_attempts})")
                time.sleep(10)
                attempt += 1
        
        if attempt >= max_attempts:
            print("Agent preparation timed out")
            sys.exit(1)
                
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
        max_attempts = 20
        attempt = 0
        while attempt < max_attempts:
            response = bedrock_agent.get_agent_alias(
                agentId=agent_id,
                agentAliasId=alias['agentAliasId']
            )
            status = response['agentAlias']['agentAliasStatus']
            if status == 'PREPARED':
                print("Agent alias ready")
                break
            else:
                print(f"Alias status: {status} (attempt {attempt + 1}/{max_attempts})")
                time.sleep(10)
                attempt += 1
        
        if attempt >= max_attempts:
            print("Agent alias creation timed out")
            sys.exit(1)
        
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
    REGION = os.environ.get('AWS_REGION', DEFAULT_REGION)
    
    # Initialize AWS clients
    bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=REGION)
    iam = boto3.client('iam')
    s3 = boto3.client('s3', region_name=REGION)
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    print("Creating Bedrock Agent for Gmail integration...\n")
    
    # Check for existing agent
    existing_agent = find_existing_agent()
    if existing_agent:
        print(f"Found existing agent: {existing_agent['agentName']} (ID: {existing_agent['agentId']})")
        response = input("Do you want to delete and recreate it? (y/N): ").strip().lower()
        if response == 'y':
            cleanup_existing_agent(existing_agent['agentId'])
        else:
            print("Exiting. Please delete the existing agent manually if you want to recreate it.")
            sys.exit(0)
    
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