#!/usr/bin/env python3
"""
Dynamically creates and configures an Amazon Bedrock Agent based on YAML config.
"""

import boto3
import json
import time
import sys
import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path

# --- Configuration Loader ---

def get_project_root() -> Path:
    """Gets the project root directory."""
    return Path(__file__).parent.parent.parent

def load_env_file():
    """Loads environment variables from .env.local file in project root."""
    env_file = get_project_root() / '.env.local'
    if env_file.exists():
        print(f"[LOAD] Loading environment variables from {env_file}...")
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print("[OK] Environment variables loaded.")

def load_agent_config() -> Dict[str, Any]:
    """Loads agent configurations from agents.yaml and returns the one to be created."""
    agent_type_to_create = os.environ.get('PATCHLINE_AGENT_TYPE')
    if not agent_type_to_create:
        print("[ERROR] PATCHLINE_AGENT_TYPE environment variable not set.")
        sys.exit(1)
    
    agent_type_to_create = agent_type_to_create.lower()
    
    config_path = get_project_root() / 'agents.yaml'
    if not config_path.exists():
        print(f"[ERROR] agents.yaml not found at {config_path}")
        sys.exit(1)
        
    with open(config_path, 'r', encoding='utf-8') as f:
        full_config = yaml.safe_load(f)
        
    if agent_type_to_create not in full_config:
        print(f"[ERROR] Agent type '{agent_type_to_create}' not found in agents.yaml.")
        sys.exit(1)
        
    print(f"[OK] Loaded configuration for agent type: '{agent_type_to_create}'")
    return full_config[agent_type_to_create]

# --- AWS Clients (initialized in main) ---
bedrock_agent, iam, s3, lambda_client = None, None, None, None
REGION = os.environ.get('AWS_REGION', 'us-east-1')

# --- Main Functions ---

def main():
    """Main execution function."""
    global bedrock_agent, iam, s3, lambda_client, REGION
    
    # Load configs and environment
    load_env_file()
    config = load_agent_config()
    
    REGION = os.environ.get('AWS_REGION', REGION)

    # Initialize AWS clients
    bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
    iam = boto3.client('iam', region_name=REGION)
    s3 = boto3.client('s3', region_name=REGION)
    lambda_client = boto3.client('lambda', region_name=REGION)

    print(f"--- Starting creation process for: {config['name']} ---")
    
    # Step 1: Get or create IAM Role
    print("\nStep 1: Creating/validating IAM role...")
    role_arn = get_or_create_agent_role(config['name'])

    # Step 2: Create the Agent
    print("\nStep 2: Creating Bedrock Agent...")
    agent = create_agent(config, role_arn)
    agent_id = agent['agentId']

    # Step 3: Create and attach Action Group (if defined)
    if 'action_group' in config:
        print("\nStep 3: Uploading API schema and creating action group...")
        ag_config = config['action_group']
        s3_url = upload_api_schema(config['name'], ag_config['api_schema'])
        
        lambda_arn = get_lambda_arn(ag_config['lambda'])
        create_action_group(agent_id, lambda_arn, s3_url, config)
    else:
        print("\nSupervisor agent - skipping action group creation...")

    # Step 4: Prepare the Agent
    print("\nStep 4: Preparing agent...")
    prepare_agent(agent_id)
    
    # Step 5: Create Agent Alias
    print("\nStep 5: Creating agent alias...")
    alias = create_agent_alias(agent_id, config['name'])
    
    # Final output
    print_summary(agent, alias, role_arn, config)

# ... (rest of the helper functions will be refactored below) ...

# (The rest of the script needs to be replaced with refactored helpers)
# I will provide the full script content.

def get_or_create_agent_role(agent_name: str) -> str:
    """Gets a pre-existing agent role from ENV or creates one."""
    existing_role_arn = os.environ.get('AGENT_ROLE_ARN')
    if existing_role_arn:
        print(f"Using existing IAM role from AGENT_ROLE_ARN: {existing_role_arn}")
        return existing_role_arn

    role_name = f'{agent_name}Role'
    try:
        response = iam.get_role(RoleName=role_name)
        print(f"Using existing IAM role: {response['Role']['Arn']}")
        return response['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        print(f"Role '{role_name}' not found, creating new one.")
        # ... (role creation logic as before)
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [{"Effect": "Allow", "Principal": {"Service": "bedrock.amazonaws.com"}, "Action": "sts:AssumeRole"}]
        }
        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description=f'Role for {agent_name} Bedrock Agent'
        )
        role_arn = response['Role']['Arn']
        print(f"Created IAM role: {role_arn}")
        # Attach policy (can be a managed policy or inline)
        # For simplicity, we assume a generic policy is sufficient.
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess' # WARNING: Overly permissive, for dev only
        )
        print("Attached AdministratorAccess policy for development. Please restrict in production.")
        time.sleep(10) # Wait for role to propagate
        return role_arn

def create_agent(config: Dict[str, Any], role_arn: str) -> Dict[str, Any]:
    """Creates the Bedrock Agent using loaded configuration."""
    agent_name = config['name']
    foundation_model = config['model']
    instruction_file = config['prompt']

    prompt_path = get_project_root() / instruction_file
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            instruction = f.read()
        print(f"✅ Loaded instructions from {prompt_path}")
    except FileNotFoundError:
        print(f"[ERROR] Instruction file not found: {prompt_path}")
        sys.exit(1)

    try:
        response = bedrock_agent.create_agent(
            agentName=agent_name,
            agentResourceRoleArn=role_arn,
            description=config.get('description', 'A Bedrock agent.'),
            foundationModel=foundation_model,
            instruction=instruction,
            idleSessionTTLInSeconds=config.get('idle_session_ttl', 900)
        )
        agent = response['agent']
        print(f"Successfully created agent: {agent['agentId']}")
        time.sleep(2)
        return agent
    except Exception as e:
        print(f"[ERROR] Failed to create agent: {e}")
        sys.exit(1)

def upload_api_schema(agent_name: str, schema_config: Dict[str, Any]) -> str:
    """Uploads the OpenAPI schema defined in the config to S3."""
    bucket_name = schema_config['s3_bucket']
    schema_file = get_project_root() / schema_config['file']
    s3_key = f"{agent_name}/{schema_file.name}"

    if not schema_file.exists():
        print(f"[ERROR] OpenAPI schema file not found at path: {schema_file}")
        sys.exit(1)

    print(f"  Found schema file: {schema_file}")

    try:
        if REGION != 'us-east-1':
            s3.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={'LocationConstraint': REGION})
        else:
            s3.create_bucket(Bucket=bucket_name)
        print(f"Created S3 bucket: {bucket_name}")
    except s3.exceptions.ClientError as e:
        if e.response['Error']['Code'] not in ['BucketAlreadyOwnedByYou', 'BucketAlreadyExists']:
            raise
        print(f"S3 bucket '{bucket_name}' already exists.")

    with open(schema_file, 'rb') as f:
        s3.put_object(Bucket=bucket_name, Key=s3_key, Body=f)
    
    print(f"Uploaded API schema to s3://{bucket_name}/{s3_key}")
    return f"s3://{bucket_name}/{s3_key}"

def get_lambda_arn(function_name: str) -> str:
    """Gets the ARN for a given Lambda function name."""
    try:
        response = lambda_client.get_function(FunctionName=function_name)
        return response['Configuration']['FunctionArn']
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"[ERROR] Lambda function '{function_name}' not found. Please deploy it first.")
        sys.exit(1)

def create_action_group(agent_id: str, lambda_arn: str, schema_s3_url: str, config: Dict[str, Any]):
    """Creates and attaches an action group to the agent."""
    ag_config = config['action_group']
    bucket_name, s3_key = schema_s3_url.replace("s3://", "").split("/", 1)

    try:
        bedrock_agent.create_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupName=ag_config['name'],
            actionGroupExecutor={'lambda': lambda_arn},
            apiSchema={'s3': {'s3BucketName': bucket_name, 's3ObjectKey': s3_key}},
            description=ag_config.get('description', f"Actions for {ag_config['name']}."),
            actionGroupState='ENABLED'
        )
        print(f"Successfully created action group '{ag_config['name']}'")
    except Exception as e:
        print(f"[ERROR] Could not create action group: {e}")
        sys.exit(1)

def prepare_agent(agent_id: str):
    """Prepares the agent DRAFT version."""
    bedrock_agent.prepare_agent(agentId=agent_id)
    
    max_attempts, attempt = 30, 0
    while attempt < max_attempts:
        response = bedrock_agent.get_agent(agentId=agent_id)
        status = response['agent']['agentStatus']
        if status == 'PREPARED':
            print("Agent prepared successfully.")
            return
        if status == 'FAILED':
            print("[ERROR] Agent preparation failed.")
            sys.exit(1)
        print(f"Agent status: {status} (attempt {attempt + 1}/{max_attempts})")
        time.sleep(10)
        attempt += 1
    print("[ERROR] Agent preparation timed out.")
    sys.exit(1)

def create_agent_alias(agent_id: str, agent_name: str) -> Dict[str, Any]:
    """Creates a 'live' alias for the agent."""
    try:
        response = bedrock_agent.create_agent_alias(
            agentId=agent_id,
            agentAliasName='live'
        )
        alias = response['agentAlias']
        print(f"Created agent alias: {alias['agentAliasId']}")
        
        # Wait for alias to be ready
        max_attempts, attempt = 20, 0
        while attempt < max_attempts:
            response = bedrock_agent.get_agent_alias(agentId=agent_id, agentAliasId=alias['agentAliasId'])
            status = response['agentAlias']['agentAliasStatus']
            if status == 'PREPARED':
                print("Agent alias is ready.")
                return alias
            print(f"Alias status: {status} (attempt {attempt + 1}/{max_attempts})")
            time.sleep(10)
            attempt += 1
        print("[ERROR] Agent alias creation timed out.")
        sys.exit(1)
    except bedrock_agent.exceptions.ConflictException:
        print("Alias 'live' already exists. Reusing it.")
        aliases = bedrock_agent.list_agent_aliases(agentId=agent_id)
        for a in aliases['agentAliasSummaries']:
            if a['agentAliasName'] == 'live':
                return bedrock_agent.get_agent_alias(agentId=agent_id, agentAliasId=a['agentAliasId'])['agentAlias']
    except Exception as e:
        print(f"[ERROR] Could not create agent alias: {e}")
        sys.exit(1)

def print_summary(agent: Dict, alias: Dict, role_arn: str, config: Dict):
    """Prints a summary of the created agent and next steps."""
    print("\n" + "="*50)
    print("BEDROCK AGENT CREATED SUCCESSFULLY!")
    print("="*50)
    print(f"Agent Name:     {agent['agentName']}")
    print(f"Agent ID:       {agent['agentId']}")
    print(f"Agent Alias ID: {alias['agentAliasId']}")
    print(f"Role ARN:       {role_arn}")
    print("\n--- Environment Variables ---")

    agent_type_upper = os.environ.get('PATCHLINE_AGENT_TYPE').upper()
    print(f"# Vars for this agent:")
    print(f"BEDROCK_{agent_type_upper}_AGENT_ID={agent['agentId']}")
    print(f"BEDROCK_{agent_type_upper}_AGENT_ALIAS_ID={alias['agentAliasId']}")

    if agent_type_upper == 'SUPERVISOR':
        print(f"\\n# This is the supervisor, so it will be set as the default agent:")
        print(f"BEDROCK_AGENT_ID={agent['agentId']}")
        print(f"BEDROCK_AGENT_ALIAS_ID={alias['agentAliasId']}")
        print("\\n--- SUPERVISOR AGENT NOTES ---")
        print("- This is a supervisor agent that coordinates other agents.")
        print("- You must now MANUALLY set up collaborators in the AWS console.")

if __name__ == "__main__":
    main() 