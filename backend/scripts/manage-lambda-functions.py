#!/usr/bin/env python3
"""
Lambda function management script for all Patchline agents.
Supports create/update/delete operations for all agent Lambda functions.
"""

import boto3
import json
import os
import zipfile
import tempfile
import subprocess
import sys
from pathlib import Path
import time
import argparse
from typing import Dict, Optional

# ---------------------------------------------------------------------------
# ENV LOADER
# ---------------------------------------------------------------------------

def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent.parent

def load_env_file():
    """Load environment variables from project root .env.local"""
    env_file = get_project_root() / '.env.local'
    if env_file.exists():
        print(f"[INFO] Loading environment variables from {env_file}...")
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print("[OK] Environment variables loaded from .env.local")

    # Map REGION_AWS -> AWS_REGION for Amplify compatibility
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']
        print("[INFO] REGION_AWS mapped to AWS_REGION for compatibility")

# ---------------------------------------------------------------------------
# LAMBDA CONFIGURATIONS
# ---------------------------------------------------------------------------

LAMBDA_FUNCTIONS = {
    'gmail': [
        {
            'name': 'gmail-auth-handler',
            'handler_file': 'gmail-auth-handler.py',
            'description': 'Gmail OAuth authentication handler'
        },
        {
            'name': 'gmail-action-handler',
            'handler_file': 'gmail-action-handler.py',
            'description': 'Gmail action handler for Bedrock agent'
        }
    ],
    'legal': [
        {
            'name': 'legal-action-handler',
            'handler_file': 'legal-action-handler.py',
            'description': 'Legal contract analysis handler'
        }
    ],
    'blockchain': [
        {
            'name': 'blockchain-action-handler',
            'handler_file': 'blockchain-action-handler.py',
            'description': 'Blockchain operations handler'
        }
    ],
    'scout': [
        {
            'name': 'scout-action-handler',
            'handler_file': 'scout-action-handler.py',
            'description': 'Scout music data handler'
        }
    ]
}

# Global AWS clients (initialized in main)
lambda_client = None
iam = None
dynamodb = None
s3_client = None
secrets_client = None
REGION = None

# ---------------------------------------------------------------------------
# IAM ROLE
# ---------------------------------------------------------------------------

def get_or_create_lambda_role() -> str:
    """Get or create IAM role for Lambda execution."""
    # Check for existing role from environment
    existing_role = os.environ.get('LAMBDA_EXEC_ROLE_ARN')
    if existing_role:
        print(f"[INFO] Using existing Lambda execution role: {existing_role}")
        return existing_role

    role_name = 'PatchlineLambdaExecutionRole'

    try:
        role = iam.get_role(RoleName=role_name)
        print(f"[INFO] Using existing IAM role: {role['Role']['Arn']}")
        return role['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        pass

    # Create new role
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }

    response = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description='Execution role for Patchline Lambda functions'
    )
    role_arn = response['Role']['Arn']
    print(f"[SUCCESS] Created IAM role: {role_arn}")

    # Attach policies
    policies = [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess',
        'arn:aws:iam::aws:policy/AmazonBedrockFullAccess'
    ]
    
    for policy in policies:
        try:
            iam.attach_role_policy(RoleName=role_name, PolicyArn=policy)
        except Exception:
            pass

    print("[INFO] Waiting for IAM role propagation...")
    time.sleep(10)
    return role_arn

# ---------------------------------------------------------------------------
# DEPLOYMENT PACKAGE
# ---------------------------------------------------------------------------

def create_deployment_package(function_name: str, handler_file: str) -> bytes:
    """Create deployment package with Lambda code and dependencies."""
    lambda_src_dir = get_project_root() / 'backend' / 'lambda'
    source_path = lambda_src_dir / handler_file
    
    if not source_path.exists():
        raise FileNotFoundError(f"Lambda source not found: {source_path}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        
        # Copy handler as index.py
        (tmp_path / 'index.py').write_text(source_path.read_text(encoding='utf-8'))
        
        # Install dependencies if requirements.txt exists
        req_file = lambda_src_dir / 'requirements.txt'
        if req_file.exists():
            print(f"[INFO] Installing dependencies for {function_name}...")
            subprocess.run([
                sys.executable, '-m', 'pip', 'install',
                '-r', str(req_file),
                '-t', str(tmp_path),
                '--quiet'
            ], check=True)
        
        # Create zip
        zip_bytes_io = tempfile.SpooledTemporaryFile()
        with zipfile.ZipFile(zip_bytes_io, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file in tmp_path.rglob('*'):
                if file.is_file():
                    zf.write(file, file.relative_to(tmp_path))
        
        zip_bytes_io.seek(0)
        return zip_bytes_io.read()

# ---------------------------------------------------------------------------
# LAMBDA OPERATIONS
# ---------------------------------------------------------------------------

def delete_lambda_function(function_name: str) -> bool:
    """Delete a Lambda function if it exists."""
    try:
        lambda_client.delete_function(FunctionName=function_name)
        print(f"[INFO] Deleted Lambda function: {function_name}")
        return True
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"[INFO] Lambda function not found: {function_name}")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to delete {function_name}: {str(e)}")
        return False

def add_bedrock_permission(function_name: str):
    """Add permission for Bedrock to invoke the Lambda function."""
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId='AllowBedrockInvoke',
            Action='lambda:InvokeFunction',
            Principal='bedrock.amazonaws.com'
        )
        print(f"[SUCCESS] Added Bedrock invoke permission to {function_name}")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"[INFO] Bedrock permission already exists for {function_name}")
    except Exception as e:
        print(f"[WARNING] Could not add Bedrock permission to {function_name}: {str(e)}")

def deploy_lambda_function(function_config: Dict, role_arn: str, env_vars: Dict) -> Optional[str]:
    """Deploy (create or update) a Lambda function."""
    function_name = function_config['name']
    handler_file = function_config['handler_file']
    
    print(f"[INFO] Deploying {function_name} ...")
    
    try:
        # Create deployment package
        zip_bytes = create_deployment_package(function_name, handler_file)
        
        # Check if function exists
        try:
            lambda_client.get_function(FunctionName=function_name)
            exists = True
        except lambda_client.exceptions.ResourceNotFoundException:
            exists = False
        
        runtime = os.environ.get('LAMBDA_RUNTIME', 'python3.9')
        timeout = int(os.environ.get('LAMBDA_TIMEOUT', '300'))
        memory = int(os.environ.get('LAMBDA_MEMORY', '512'))
        
        if exists:
            # Update existing function
            lambda_client.update_function_code(
                FunctionName=function_name,
                ZipFile=zip_bytes
            )
            lambda_client.update_function_configuration(
                FunctionName=function_name,
                Runtime=runtime,
                Role=role_arn,
                Handler='index.lambda_handler',
                Timeout=timeout,
                MemorySize=memory,
                Environment={'Variables': env_vars}
            )
            print(f"[SUCCESS] Function updated.")
        else:
            # Create new function
            lambda_client.create_function(
                FunctionName=function_name,
                Runtime=runtime,
                Role=role_arn,
                Handler='index.lambda_handler',
                Code={'ZipFile': zip_bytes},
                Timeout=timeout,
                MemorySize=memory,
                Environment={'Variables': env_vars},
                Description=function_config.get('description', f'Patchline {function_name}')
            )
            print(f"[SUCCESS] Function created.")
        
        # Wait for function to be active
        lambda_client.get_waiter('function_active').wait(FunctionName=function_name)
        
        # Add Bedrock permission for action handlers
        if 'action-handler' in function_name:
            add_bedrock_permission(function_name)
        
        # Get function ARN
        response = lambda_client.get_function(FunctionName=function_name)
        arn = response['Configuration']['FunctionArn']
        print(f"[INFO] {function_name} ARN: {arn}")
        return arn
        
    except Exception as e:
        print(f"[ERROR] Failed to deploy {function_name}: {str(e)}")
        return None

# ---------------------------------------------------------------------------
# SUPPORTING RESOURCES
# ---------------------------------------------------------------------------

def ensure_dynamodb_table(table_name: str):
    """Ensure DynamoDB table exists."""
    try:
        dynamodb.describe_table(TableName=table_name)
        print(f"[INFO] DynamoDB table already exists: {table_name}")
    except dynamodb.exceptions.ResourceNotFoundException:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[{'AttributeName': 'userId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'userId', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"[SUCCESS] Created DynamoDB table: {table_name}")
        dynamodb.get_waiter('table_exists').wait(TableName=table_name)

def ensure_s3_bucket(bucket_name: str):
    """Ensure S3 bucket exists."""
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"[INFO] S3 bucket already exists: {bucket_name}")
    except s3_client.exceptions.NoSuchBucket:
        if REGION == 'us-east-1':
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': REGION}
            )
        print(f"[SUCCESS] Created S3 bucket: {bucket_name}")

def store_gmail_secret():
    """Store Gmail OAuth credentials in Secrets Manager."""
    secret_name = 'patchline/gmail-oauth'
    
    client_id = os.environ.get('GMAIL_CLIENT_ID', os.environ.get('GOOGLE_CLIENT_ID'))
    client_secret = os.environ.get('GMAIL_CLIENT_SECRET', os.environ.get('GOOGLE_CLIENT_SECRET'))
    redirect_uri = os.environ.get('GMAIL_REDIRECT_URI', os.environ.get('GOOGLE_REDIRECT_URI'))
    
    if not all([client_id, client_secret, redirect_uri]):
        print("[WARNING] Gmail OAuth credentials not found in environment")
        return
    
    secret_value = {
        'web': {
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uris': [redirect_uri],
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token'
        }
    }
    
    try:
        secrets_client.create_secret(
            Name=secret_name,
            SecretString=json.dumps(secret_value),
            Description='Gmail OAuth credentials for Patchline'
        )
        print(f"[SUCCESS] Created secret: {secret_name}")
    except secrets_client.exceptions.ResourceExistsException:
        secrets_client.update_secret(
            SecretId=secret_name,
            SecretString=json.dumps(secret_value)
        )
        print(f"[INFO] Updated existing secret: {secret_name}")

def store_soundcharts_secret():
    """Store Soundcharts credentials in Secrets Manager."""
    secret_name = 'patchline/soundcharts-api'
    
    soundcharts_id = os.environ.get('SOUNDCHARTS_ID')
    soundcharts_token = os.environ.get('SOUNDCHARTS_TOKEN')
    
    if not soundcharts_id or not soundcharts_token:
        print("[WARNING] SOUNDCHARTS_ID or SOUNDCHARTS_TOKEN not found in environment")
        return
    
    secret_value = {
        'id': soundcharts_id,
        'token': soundcharts_token
    }
    
    try:
        secrets_client.create_secret(
            Name=secret_name,
            SecretString=json.dumps(secret_value),
            Description='Soundcharts API key for Patchline Scout'
        )
        print(f"[SUCCESS] Created secret: {secret_name}")
    except secrets_client.exceptions.ResourceExistsException:
        secrets_client.update_secret(
            SecretId=secret_name,
            SecretString=json.dumps(secret_value)
        )
        print(f"[INFO] Updated existing secret: {secret_name}")

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Manage Lambda functions for Patchline agents')
    parser.add_argument('--agent', choices=['gmail', 'legal', 'blockchain', 'scout', 'all'],
                        default='all', help='Which agent Lambda functions to manage')
    parser.add_argument('--recreate', action='store_true',
                        help='Delete and recreate Lambda functions')
    parser.add_argument('--delete', action='store_true',
                        help='Delete Lambda functions without recreating')
    
    args = parser.parse_args()
    
    # Load environment
    load_env_file()
    
    # Initialize globals
    global REGION, lambda_client, iam, dynamodb, s3_client, secrets_client
    
    REGION = os.environ.get('AWS_REGION', 'us-east-1')
    print(f"[INFO] AWS Region: {REGION}")
    
    # Initialize AWS clients
    lambda_client = boto3.client('lambda', region_name=REGION)
    iam = boto3.client('iam', region_name=REGION)
    dynamodb = boto3.client('dynamodb', region_name=REGION)
    s3_client = boto3.client('s3', region_name=REGION)
    secrets_client = boto3.client('secretsmanager', region_name=REGION)
    
    # Get or create IAM role
    role_arn = get_or_create_lambda_role()
    
    # Common environment variables for Lambda functions
    env_vars = {
        'PATCHLINE_AWS_REGION': REGION,
        'PATCHLINE_DDB_TABLE': 'PatchlineTokens',
        'PATCHLINE_S3_BUCKET': f'patchline-files-{REGION}',
        'PATCHLINE_SECRETS_ID': 'patchline/gmail-oauth',
        'SOUNDCHARTS_SECRET_ID': 'patchline/soundcharts-api'
    }
    
    # Determine which agents to process
    if args.agent == 'all':
        agents_to_process = list(LAMBDA_FUNCTIONS.keys())
    else:
        agents_to_process = [args.agent]
    
    print(f"[INFO] Processing agents: {', '.join(agents_to_process)}")
    
    # Create supporting resources
    ensure_dynamodb_table(env_vars['PATCHLINE_DDB_TABLE'])
    ensure_s3_bucket(env_vars['PATCHLINE_S3_BUCKET'])
    
    # Store secrets if needed
    if 'gmail' in agents_to_process:
        store_gmail_secret()
    if 'scout' in agents_to_process:
        store_soundcharts_secret()
    
    # Track failed functions
    failed_functions = []
    
    # Process each agent's Lambda functions
    for agent in agents_to_process:
        print(f"\n[INFO] Processing {agent} agent Lambda functions...")
        
        for func_config in LAMBDA_FUNCTIONS.get(agent, []):
            function_name = func_config['name']
            
            # Delete if requested
            if args.delete or args.recreate:
                print(f"[INFO] Recreate flag set - deleting existing Lambda: {function_name}")
                delete_lambda_function(function_name)
                time.sleep(2)
            
            # Deploy unless delete-only
            if not args.delete:
                arn = deploy_lambda_function(func_config, role_arn, env_vars)
                if not arn:
                    failed_functions.append(function_name)
    
    # Final status
    if failed_functions:
        print(f"\n[ERROR] Failed to deploy {len(failed_functions)} functions:")
        for func in failed_functions:
            print(f"   - {func}")
        print("\n[ERROR] Lambda deployment failed! Stopping here.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] Lambda deployment complete!")

if __name__ == '__main__':
    main()
