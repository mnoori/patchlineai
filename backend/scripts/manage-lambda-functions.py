#!/usr/bin/env python3
"""
Enhanced Lambda Management Script for Patchline

Features:
- Delete existing Lambdas before recreation (optional)
- Target specific Lambdas (Gmail, Legal, or individual functions)
- Validate Lambda configuration before deployment
- Better error handling and progress reporting

Usage:
  python manage-lambda-functions.py [options]

Options:
  --recreate           Delete and recreate Lambdas instead of updating
  --agent=TYPE         Deploy specific agent Lambdas (gmail, legal, all)
  --function=NAME      Deploy a specific Lambda function by name
  --check              Validate configurations without deploying
  --verify             Verify Lambda permissions after deployment

Examples:
  python manage-lambda-functions.py --recreate --agent=legal
  python manage-lambda-functions.py --function=gmail-action-handler
"""

import boto3
import json
import os
import zipfile
import tempfile
import subprocess
import sys
import argparse
from pathlib import Path
import time
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# ARGUMENT PARSING
# ---------------------------------------------------------------------------

def parse_arguments():
    parser = argparse.ArgumentParser(description="Enhanced Lambda Management for Patchline")
    parser.add_argument("--recreate", action="store_true", 
                        help="Delete and recreate Lambdas instead of updating")
    parser.add_argument("--agent", choices=["gmail", "legal", "all"],
                        help="Deploy specific agent Lambdas")
    parser.add_argument("--function", 
                        help="Deploy a specific Lambda function by name")
    parser.add_argument("--check", action="store_true",
                        help="Validate configurations without deploying")
    parser.add_argument("--verify", action="store_true",
                        help="Verify Lambda permissions after deployment")
    
    return parser.parse_args()

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
    else:
        print("⚠️ No .env.local file found in project root")

    # Normalize variable names for the script
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

# Function mappings by agent type
LAMBDA_FUNCTIONS = {
    "gmail": ["gmail-auth-handler", "gmail-action-handler"],
    "legal": ["legal-contract-handler"],
    "all": ["gmail-auth-handler", "gmail-action-handler", "legal-contract-handler"]
}

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
# LAMBDA MANAGEMENT
# ---------------------------------------------------------------------------

def delete_lambda(function_name: str) -> bool:
    """Delete a Lambda function if it exists."""
    try:
        lambda_client.get_function(FunctionName=function_name)
        lambda_client.delete_function(FunctionName=function_name)
        print(f"🗑️  Deleted Lambda function: {function_name}")
        # Add a short delay to ensure AWS registers the deletion
        time.sleep(3)
        return True
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"ℹ️  Lambda function doesn't exist: {function_name}")
        return False
    except Exception as e:
        print(f"❌ Error deleting Lambda function {function_name}: {str(e)}")
        return False

def list_lambdas() -> List[str]:
    """List all Lambda functions with the Patchline prefix."""
    try:
        functions = []
        paginator = lambda_client.get_paginator('list_functions')
        for page in paginator.paginate():
            for fn in page['Functions']:
                name = fn['FunctionName']
                if name.startswith('gmail-') or name.startswith('legal-') or 'patchline' in name.lower():
                    functions.append(name)
        return functions
    except Exception as e:
        print(f"❌ Error listing Lambda functions: {str(e)}")
        return []

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

def deploy_lambda(function_name: str, handler_file: str, role_arn: str, env: Dict[str, str], recreate: bool = False) -> str:
    """Create or update the Lambda function and return its ARN."""
    print(f"\n🚀 Deploying {function_name} ...")
    
    # Check if function exists
    try:
        lambda_client.get_function(FunctionName=function_name)
        exists = True
    except lambda_client.exceptions.ResourceNotFoundException:
        exists = False
    
    # Delete if recreate flag is set and function exists
    if recreate and exists:
        print(f"🔄 Recreate flag set - deleting existing Lambda: {function_name}")
        delete_lambda(function_name)
        exists = False
    
    # Create deployment package
    zip_bytes = create_deployment_package(function_name, handler_file)

    if exists:
        # Update existing function
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
        # Create new function
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
    
    # Add resource-based policy for Bedrock to invoke the function
    if function_name in ['gmail-action-handler', 'legal-contract-handler']:
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

def verify_lambda_permissions(function_name: str) -> bool:
    """Verify that a Lambda function has the necessary permissions for Bedrock."""
    try:
        policy = lambda_client.get_policy(FunctionName=function_name)
        policy_json = json.loads(policy['Policy'])
        
        # Check for Bedrock permissions
        for statement in policy_json['Statement']:
            if (statement['Principal'].get('Service') == 'bedrock.amazonaws.com' and 
                statement['Action'] == 'lambda:InvokeFunction'):
                print(f"✅ {function_name} has proper Bedrock permissions")
                return True
                
        print(f"⚠️ {function_name} is missing Bedrock permissions")
        return False
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"❌ Lambda function not found: {function_name}")
        return False
    except Exception as e:
        if 'ResourceNotFoundException' in str(e):
            print(f"⚠️ {function_name} has no resource policy")
            return False
        print(f"❌ Error checking permissions for {function_name}: {str(e)}")
        return False

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
    args = parse_arguments()
    
    # Print mode
    if args.check:
        print("\n🔍 CHECK MODE: Will validate configuration without deploying")
    if args.recreate:
        print("\n🔄 RECREATE MODE: Will delete and recreate Lambda functions")
        
    # Ensure environment variables are loaded first
    load_env_file()

    # Ensure our AWS region is set
    global REGION, lambda_client, iam, logs_client, dynamodb, s3_client, secrets_client
    global LAMBDA_RUNTIME, LAMBDA_TIMEOUT, LAMBDA_MEMORY
    global GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI

    REGION = os.environ.get('AWS_REGION', 'us-east-1')
    print(f"⚙️  AWS Region: {REGION}")

    # Set up AWS clients
    lambda_client = boto3.client('lambda', region_name=REGION)
    iam = boto3.client('iam', region_name=REGION)
    logs_client = boto3.client('logs', region_name=REGION)
    dynamodb = boto3.client('dynamodb', region_name=REGION)
    s3_client = boto3.client('s3', region_name=REGION)
    secrets_client = boto3.client('secretsmanager', region_name=REGION)

    # Set additional Lambda configs
    LAMBDA_RUNTIME = os.environ.get('LAMBDA_RUNTIME', 'python3.9')
    LAMBDA_TIMEOUT = int(os.environ.get('LAMBDA_TIMEOUT', '30'))
    LAMBDA_MEMORY = int(os.environ.get('LAMBDA_MEMORY', '256'))
    print(f"⚙️  Lambda Config: {LAMBDA_RUNTIME}, {LAMBDA_TIMEOUT}s timeout, {LAMBDA_MEMORY}MB memory")

    # Gmail OAuth credentials
    GMAIL_CLIENT_ID = os.environ.get('GMAIL_CLIENT_ID')
    GMAIL_CLIENT_SECRET = os.environ.get('GMAIL_CLIENT_SECRET')
    GMAIL_REDIRECT_URI = os.environ.get('GMAIL_REDIRECT_URI')

    # If in check mode, just list the current Lambdas and exit
    if args.check:
        print("\n📋 Current Lambda functions:")
        for fn in list_lambdas():
            try:
                config = lambda_client.get_function(FunctionName=fn)['Configuration']
                print(f"  • {fn}")
                print(f"    - Runtime: {config['Runtime']}")
                print(f"    - Memory: {config['MemorySize']}MB")
                print(f"    - Timeout: {config['Timeout']}s")
                print(f"    - Last Modified: {config['LastModified']}")
                
                # Check permissions
                has_permissions = verify_lambda_permissions(fn)
                if not has_permissions and fn in ['gmail-action-handler', 'legal-contract-handler']:
                    print(f"    ⚠️  Missing Bedrock permissions")
                    
            except Exception as e:
                print(f"  • {fn} - Error getting details: {str(e)}")
        
        print("\n✅ Check complete!")
        return

    # Need execution role for Lambda
    role_arn = create_lambda_execution_role()

    # Common Lambda environment for all functions
    LAMBDA_ENV = {
        'PATCHLINE_AWS_REGION': REGION,  # Use a custom prefix to avoid reserved key AWS_REGION
        'PATCHLINE_DDB_TABLE': 'PatchlineTokens',
        'PATCHLINE_S3_BUCKET': f'patchline-files-{REGION}',
        'PATCHLINE_SECRETS_ID': 'PatchlineGmailSecrets',
    }

    # Determine which functions to deploy
    functions_to_deploy = []
    
    if args.function:
        # Deploy a single specific function
        functions_to_deploy.append(args.function)
    elif args.agent:
        # Deploy functions for a specific agent type
        agent_type = args.agent.lower()
        if agent_type in LAMBDA_FUNCTIONS:
            functions_to_deploy = LAMBDA_FUNCTIONS[agent_type]
        else:
            print(f"❌ Unknown agent type: {agent_type}")
            return
    else:
        # Default to deploying all functions
        functions_to_deploy = LAMBDA_FUNCTIONS["all"]
    
    print(f"\n🔧 Will deploy the following Lambda functions: {', '.join(functions_to_deploy)}")
    
    # Create supporting resources if needed
    if any(fn.startswith('gmail-') for fn in functions_to_deploy):
        # Make sure we have DynamoDB table (for token storage)
        ensure_dynamodb_table(LAMBDA_ENV['PATCHLINE_DDB_TABLE'])

        # Make sure we have S3 bucket (for file attachments)
        ensure_s3_bucket(LAMBDA_ENV['PATCHLINE_S3_BUCKET'])

        # Make sure we have stored Gmail OAuth credentials in AWS Secrets Manager
        store_gmail_secret()
    
    # Deploy each function
    for function_name in functions_to_deploy:
        handler_file = f"{function_name}.py"
        
        try:
            deploy_lambda(
                function_name,
                handler_file,
                role_arn,
                LAMBDA_ENV,
                recreate=args.recreate
            )
        except FileNotFoundError as e:
            print(f"❌ Error: {str(e)}")
            print(f"   Make sure {handler_file} exists in the backend/lambda directory")
        except Exception as e:
            print(f"❌ Error deploying {function_name}: {str(e)}")
    
    # Verify permissions if requested
    if args.verify:
        print("\n🔍 Verifying Lambda permissions:")
        for function_name in functions_to_deploy:
            verify_lambda_permissions(function_name)

    print("\n✅ Lambda deployment complete!")


if __name__ == '__main__':
    main() 