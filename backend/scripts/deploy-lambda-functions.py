#!/usr/bin/env python3
"""
Automated deployment script for Patchline Lambda functions
This script can:
  • Create (or reuse) an execution role for the Lambda functions.
  • Package `gmail-auth-handler.py` and `gmail-action-handler.py` together with
    their Python dependencies (from `requirements.txt`).
  • Deploy (create or update) the Lambda functions.
  • Create supporting AWS resources (Secrets Manager secret, DynamoDB table,
    S3 bucket) if they do not yet exist.

Environment variables are automatically loaded from your project-root
`.env.local` so you do not need to export them manually.

Optional overrides:
  • LAMBDA_EXEC_ROLE_ARN   – Use an existing IAM role for Lambda instead of
                              creating a new one.
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
from typing import Dict

# ---------------------------------------------------------------------------
# ENV LOADER (reuse existing project .env.local so no variable duplication)
# ---------------------------------------------------------------------------

def load_env_file():
    """Load environment variables from project root .env.local"""
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

    # Normalise variable names for the script
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']
    if os.environ.get('ACCESS_KEY_ID') and not os.environ.get('AWS_ACCESS_KEY_ID'):
        os.environ['AWS_ACCESS_KEY_ID'] = os.environ['ACCESS_KEY_ID']
    if os.environ.get('SECRET_ACCESS_KEY') and not os.environ.get('AWS_SECRET_ACCESS_KEY'):
        os.environ['AWS_SECRET_ACCESS_KEY'] = os.environ['SECRET_ACCESS_KEY']
    if os.environ.get('GOOGLE_CLIENT_ID') and not os.environ.get('GMAIL_CLIENT_ID'):
        os.environ['GMAIL_CLIENT_ID'] = os.environ['GOOGLE_CLIENT_ID']
    if os.environ.get('GOOGLE_CLIENT_SECRET') and not os.environ.get('GMAIL_CLIENT_SECRET'):
        os.environ['GMAIL_CLIENT_SECRET'] = os.environ['GOOGLE_CLIENT_SECRET']
    if os.environ.get('GOOGLE_REDIRECT_URI') and not os.environ.get('GMAIL_REDIRECT_URI'):
        os.environ['GMAIL_REDIRECT_URI'] = os.environ['GOOGLE_REDIRECT_URI']

# ---------------------------------------------------------------------------
# BASIC CONFIG
# ---------------------------------------------------------------------------

# We will set REGION later after loading env file

# Allow consumer to supply an existing execution role ARN
EXISTING_LAMBDA_ROLE_ARN = os.environ.get('LAMBDA_EXEC_ROLE_ARN')

# Global variables will be initialized in main()
REGION = None
LAMBDA_RUNTIME = None
LAMBDA_TIMEOUT = None
LAMBDA_MEMORY = None
lambda_client = None
iam = None
logs_client = None
dynamodb = None
s3_client = None
secrets_client = None
GMAIL_CLIENT_ID = None
GMAIL_CLIENT_SECRET = None
GMAIL_REDIRECT_URI = None

# ---------------------------------------------------------------------------
# AWS CLIENTS
# ---------------------------------------------------------------------------

# We will set lambda_client, iam, and logs_client later after loading env file


# ---------------------------------------------------------------------------
# IAM ROLE
# ---------------------------------------------------------------------------

def create_lambda_execution_role() -> str:
    """Return an IAM role ARN suitable for Lambda execution."""
    # Check if we should use an existing role from environment
    existing_role = os.environ.get('LAMBDA_EXEC_ROLE_ARN')
    if existing_role:
        print(f"🔗 Using existing Lambda execution role from LAMBDA_EXEC_ROLE_ARN: {existing_role}")
        return existing_role

    role_name = 'PatchlineLambdaExecutionRole'

    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }
        ],
    }

    try:
        resp = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Execution role for Patchline Lambda functions',
        )
        role_arn = resp['Role']['Arn']
        print(f"✅ Created IAM role: {role_arn}")
    except iam.exceptions.EntityAlreadyExistsException:
        role_arn = iam.get_role(RoleName=role_name)['Role']['Arn']
        print(f"ℹ️  Re-using existing IAM role: {role_arn}")

    # Attach basic and service policies (idempotent)
    policies = [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess',
    ]
    for p in policies:
        try:
            iam.attach_role_policy(RoleName=role_name, PolicyArn=p)
        except Exception:
            pass

    print("⏳ Waiting for IAM role propagation ...")
    time.sleep(10)
    return role_arn


# ---------------------------------------------------------------------------
# ZIP PACKAGE CREATION
# ---------------------------------------------------------------------------

def create_deployment_package(function_name: str, source_filename: str) -> bytes:
    """Package the Lambda function code + dependencies and return bytes."""
    lambda_src_dir = Path(__file__).parent.parent / 'lambda'
    source_path = lambda_src_dir / source_filename
    if not source_path.exists():
        raise FileNotFoundError(f"Lambda source not found: {source_path}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)

        # Copy handler as index.py
        (tmp_path / 'index.py').write_text(source_path.read_text(encoding='utf-8'))

        # Install dependencies
        req_file = lambda_src_dir / 'requirements.txt'
        if req_file.exists():
            subprocess.run([
                sys.executable,
                '-m',
                'pip',
                'install',
                '-r',
                str(req_file),
                '-t',
                str(tmp_path),
                '--quiet',
            ], check=True)

        # Zip up
        zip_bytes_io = tempfile.SpooledTemporaryFile()
        with zipfile.ZipFile(zip_bytes_io, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file in tmp_path.rglob('*'):
                if file.is_file():
                    zf.write(file, file.relative_to(tmp_path))
        zip_bytes_io.seek(0)
        return zip_bytes_io.read()


# ---------------------------------------------------------------------------
# LAMBDA DEPLOY/UPDATE
# ---------------------------------------------------------------------------

def deploy_lambda(function_name: str, handler_file: str, role_arn: str, env: Dict[str, str]) -> str:
    """Create or update the Lambda function and return its ARN."""
    print(f"\n🚀 Deploying {function_name} ...")
    zip_bytes = create_deployment_package(function_name, handler_file)

    # Determine if function exists
    try:
        lambda_client.get_function(FunctionName=function_name)
        exists = True
    except lambda_client.exceptions.ResourceNotFoundException:
        exists = False

    if exists:
        lambda_client.update_function_code(FunctionName=function_name, ZipFile=zip_bytes)
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Runtime=LAMBDA_RUNTIME,
            Role=role_arn,
            Handler='index.lambda_handler',
            Timeout=LAMBDA_TIMEOUT,
            MemorySize=LAMBDA_MEMORY,
            Environment={'Variables': env},
        )
        print("✅ Function updated.")
    else:
        lambda_client.create_function(
            FunctionName=function_name,
            Runtime=LAMBDA_RUNTIME,
            Role=role_arn,
            Handler='index.lambda_handler',
            Code={'ZipFile': zip_bytes},
            Timeout=LAMBDA_TIMEOUT,
            MemorySize=LAMBDA_MEMORY,
            Environment={'Variables': env},
            Description=f'Patchline {function_name}',
        )
        print("✅ Function created.")

    # Wait for code update to finish
    lambda_client.get_waiter('function_active').wait(FunctionName=function_name)
    fn_arn = lambda_client.get_function(FunctionName=function_name)['Configuration']['FunctionArn']
    
    # Add resource-based policy for Bedrock to invoke the function (for action handler)
    if function_name == 'gmail-action-handler':
        add_bedrock_invoke_permission(function_name)
    
    print(f"🔗 {function_name} ARN: {fn_arn}")
    return fn_arn


def add_bedrock_invoke_permission(function_name: str):
    """Add resource-based policy to allow Bedrock to invoke the Lambda function"""
    try:
        # Get account ID using STS
        sts_client = boto3.client('sts')
        account_id = sts_client.get_caller_identity()['Account']
        
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId='AllowBedrockInvoke',
            Action='lambda:InvokeFunction',
            Principal='bedrock.amazonaws.com',
            SourceAccount=account_id
        )
        print(f"✅ Added Bedrock invoke permission to {function_name}")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"ℹ️  Bedrock invoke permission already exists for {function_name}")
    except Exception as e:
        print(f"⚠️  Could not add Bedrock permission: {str(e)}")
        # Try without SourceAccount
        try:
            lambda_client.add_permission(
                FunctionName=function_name,
                StatementId='AllowBedrockInvokeSimple',
                Action='lambda:InvokeFunction',
                Principal='bedrock.amazonaws.com'
            )
            print(f"✅ Added simplified Bedrock invoke permission to {function_name}")
        except lambda_client.exceptions.ResourceConflictException:
            print(f"ℹ️  Bedrock invoke permission already exists for {function_name}")
        except Exception as e2:
            print(f"❌ Failed to add Bedrock permission: {str(e2)}")
            print("   You may need to add this permission manually in the AWS console")


# ---------------------------------------------------------------------------
# SUPPORTING RESOURCES
# ---------------------------------------------------------------------------

def ensure_dynamodb_table(table_name: str) -> None:
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[{'AttributeName': 'userId', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'userId', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST',
        )
        print(f"✅ Created DynamoDB table: {table_name}")
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        print(f"ℹ️  DynamoDB table already exists: {table_name}")


def ensure_s3_bucket(bucket_name: str) -> None:
    try:
        if REGION == 'us-east-1':
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': REGION},
            )
        print(f"✅ Created S3 bucket: {bucket_name}")
    except s3_client.exceptions.BucketAlreadyOwnedByYou:
        print(f"ℹ️  S3 bucket already exists: {bucket_name}")
    except s3_client.exceptions.BucketAlreadyExists:
        print(f"ℹ️  S3 bucket name taken but owned by another account: {bucket_name}")


def store_gmail_secret():
    """Store Gmail OAuth credentials in Secrets Manager"""
    if not all([GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI]):
        print("⚠️  Skipping Gmail secret creation - credentials not found in environment")
        return
        
    secret_name = 'patchline/gmail-oauth'
    secret_val = {
        'web': {
            'client_id': GMAIL_CLIENT_ID,
            'client_secret': GMAIL_CLIENT_SECRET,
            'redirect_uris': [GMAIL_REDIRECT_URI],
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
        }
    }

    try:
        secrets_client.create_secret(
            Name=secret_name,
            SecretString=json.dumps(secret_val),
            Description='Gmail OAuth credentials for Patchline',
        )
        print(f"✅ Created Secrets Manager secret: {secret_name}")
    except secrets_client.exceptions.ResourceExistsException:
        secrets_client.update_secret(SecretId=secret_name, SecretString=json.dumps(secret_val))
        print(f"ℹ️  Updated existing secret: {secret_name}")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    # Ensure environment variables are loaded first
    load_env_file()

    global REGION, LAMBDA_RUNTIME, LAMBDA_TIMEOUT, LAMBDA_MEMORY
    global lambda_client, iam, logs_client, dynamodb, s3_client, secrets_client
    global GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI
    
    # Set configuration
    REGION = os.environ.get('AWS_REGION', 'us-east-1')
    LAMBDA_RUNTIME = 'python3.11'
    LAMBDA_TIMEOUT = 300
    LAMBDA_MEMORY = 512
    
    # Set Gmail variables
    GMAIL_CLIENT_ID = os.environ.get('GMAIL_CLIENT_ID')
    GMAIL_CLIENT_SECRET = os.environ.get('GMAIL_CLIENT_SECRET')
    GMAIL_REDIRECT_URI = os.environ.get('GMAIL_REDIRECT_URI')
    
    # Initialize all AWS clients
    lambda_client = boto3.client('lambda', region_name=REGION)
    iam = boto3.client('iam')
    logs_client = boto3.client('logs')
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    s3_client = boto3.client('s3', region_name=REGION)
    secrets_client = boto3.client('secretsmanager', region_name=REGION)

    print("🚀 Starting Patchline Lambda Functions Deployment")
    role_arn = create_lambda_execution_role()

    # Supporting resources
    # Note: PlatformConnections-staging should already exist from your app
    # ensure_dynamodb_table('PlatformConnections-staging')  # Commented out - table already exists
    ensure_s3_bucket('patchline-email-knowledge-base')
    store_gmail_secret()

    env_vars_common = {
        'PLATFORM_CONNECTIONS_TABLE': 'PlatformConnections-staging',  # Use the existing table
        'GMAIL_SECRETS_NAME': 'patchline/gmail-oauth',
        'KNOWLEDGE_BASE_BUCKET': 'patchline-email-knowledge-base',
        'BEDROCK_AGENT_ID': os.environ.get('BEDROCK_AGENT_ID', ''),
        'BEDROCK_AGENT_ALIAS_ID': os.environ.get('BEDROCK_AGENT_ALIAS_ID', ''),
        # Gmail-specific variables (for existing Gmail agent)
        'GMAIL_REDIRECT_URI': os.environ.get('GMAIL_REDIRECT_URI', 'https://www.patchline.ai/api/auth/gmail/callback'),
        'FRONTEND_URL': os.environ.get('FRONTEND_URL', 'https://www.patchline.ai'),
        'GMAIL_CLIENT_ID': os.environ.get('GMAIL_CLIENT_ID', ''),
        'GMAIL_CLIENT_SECRET': os.environ.get('GMAIL_CLIENT_SECRET', ''),
    }

    auth_fn_arn = deploy_lambda('gmail-auth-handler', 'gmail-auth-handler.py', role_arn, env_vars_common)
    action_fn_arn = deploy_lambda('gmail-action-handler', 'gmail-action-handler.py', role_arn, env_vars_common)

    print("\n🎉 Lambda functions deployed successfully!")
    print("   • gmail-auth-handler  =>", auth_fn_arn)
    print("   • gmail-action-handler =>", action_fn_arn)


if __name__ == '__main__':
    main()