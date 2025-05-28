#!/usr/bin/env python3
"""
Enhanced Lambda deployment script with cleanup and better logging
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
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'lambda-deploy-{datetime.now().strftime("%Y%m%d-%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# ENV LOADER
# ---------------------------------------------------------------------------

def load_env_file():
    """Load environment variables from project root .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    if env_file.exists():
        logger.info(f"Loading environment variables from {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        logger.info("✅ Environment variables loaded")
    else:
        logger.warning(f"⚠️  No .env.local file found at {env_file}")

    # Normalize variable names
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
# CLEANUP FUNCTIONS
# ---------------------------------------------------------------------------

def cleanup_existing_lambdas(lambda_client, function_names: list):
    """Delete existing Lambda functions if requested"""
    existing_functions = []
    
    # Check which functions exist
    for func_name in function_names:
        try:
            lambda_client.get_function(FunctionName=func_name)
            existing_functions.append(func_name)
        except lambda_client.exceptions.ResourceNotFoundException:
            pass
    
    if existing_functions:
        logger.info(f"\n🗑️  Found existing Lambda functions: {', '.join(existing_functions)}")
        response = input("Do you want to DELETE these functions before deploying? (yes/no): ").strip().lower()
        
        if response == 'yes':
            for func_name in existing_functions:
                try:
                    logger.info(f"Deleting {func_name}...")
                    lambda_client.delete_function(FunctionName=func_name)
                    logger.info(f"✅ Deleted {func_name}")
                    time.sleep(2)  # Give AWS time to process
                except Exception as e:
                    logger.error(f"❌ Error deleting {func_name}: {str(e)}")
        else:
            logger.info("Keeping existing functions (will update them)")

# ---------------------------------------------------------------------------
# DEPLOY WITH ENHANCED LOGGING
# ---------------------------------------------------------------------------

def deploy_lambda_with_logging(function_name: str, handler_file: str, role_arn: str, env: Dict[str, str], lambda_client, zip_bytes: bytes) -> str:
    """Deploy Lambda with enhanced logging"""
    logger.info(f"\n🚀 Deploying {function_name}...")
    logger.info(f"Handler file: {handler_file}")
    logger.info(f"Role ARN: {role_arn}")
    logger.info(f"Environment variables: {json.dumps(env, indent=2)}")
    
    # Check if function exists
    try:
        existing_func = lambda_client.get_function(FunctionName=function_name)
        exists = True
        logger.info(f"Function exists, will update it")
        
        # Log current configuration
        logger.info("Current function configuration:")
        config = existing_func['Configuration']
        logger.info(f"  Runtime: {config.get('Runtime')}")
        logger.info(f"  Handler: {config.get('Handler')}")
        logger.info(f"  Timeout: {config.get('Timeout')}")
        logger.info(f"  Memory: {config.get('MemorySize')}")
        logger.info(f"  Last Modified: {config.get('LastModified')}")
    except lambda_client.exceptions.ResourceNotFoundException:
        exists = False
        logger.info(f"Function does not exist, will create it")

    if exists:
        # Update function code
        logger.info("Updating function code...")
        code_response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_bytes
        )
        logger.info(f"Code update response: {code_response['CodeSha256']}")
        
        # Wait for code update
        time.sleep(3)
        
        # Update function configuration
        logger.info("Updating function configuration...")
        config_response = lambda_client.update_function_configuration(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=role_arn,
            Handler='index.lambda_handler',
            Timeout=300,
            MemorySize=512,
            Environment={'Variables': env},
        )
        logger.info(f"Configuration update response: {config_response['LastUpdateStatus']}")
    else:
        # Create new function
        logger.info("Creating new function...")
        create_response = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=role_arn,
            Handler='index.lambda_handler',
            Code={'ZipFile': zip_bytes},
            Timeout=300,
            MemorySize=512,
            Environment={'Variables': env},
            Description=f'Patchline {function_name}',
        )
        logger.info(f"Function created: {create_response['FunctionArn']}")

    # Wait for function to be active
    logger.info("Waiting for function to be active...")
    waiter = lambda_client.get_waiter('function_active')
    waiter.wait(FunctionName=function_name)
    
    # Get final function info
    final_func = lambda_client.get_function(FunctionName=function_name)
    fn_arn = final_func['Configuration']['FunctionArn']
    logger.info(f"✅ Function ready: {fn_arn}")
    
    # Add Bedrock permissions for action handler
    if function_name == 'gmail-action-handler':
        add_bedrock_permissions_with_logging(lambda_client, function_name)
    
    return fn_arn

def add_bedrock_permissions_with_logging(lambda_client, function_name: str):
    """Add Bedrock invoke permissions with detailed logging"""
    logger.info(f"\n🔐 Adding Bedrock permissions to {function_name}...")
    
    # Get account ID
    sts_client = boto3.client('sts')
    account_id = sts_client.get_caller_identity()['Account']
    logger.info(f"Account ID: {account_id}")
    
    # List existing policy statements
    try:
        policy = lambda_client.get_policy(FunctionName=function_name)
        logger.info("Existing policy statements:")
        policy_doc = json.loads(policy['Policy'])
        for statement in policy_doc.get('Statement', []):
            logger.info(f"  - {statement.get('Sid', 'No SID')}: {statement.get('Principal', {})}")
    except lambda_client.exceptions.ResourceNotFoundException:
        logger.info("No existing policy")
    
    # Try to add permissions
    permissions_to_add = [
        {
            'StatementId': 'AllowBedrockInvoke',
            'Action': 'lambda:InvokeFunction',
            'Principal': 'bedrock.amazonaws.com',
            'SourceAccount': account_id
        },
        {
            'StatementId': 'AllowBedrockInvokeWildcard',
            'Action': 'lambda:InvokeFunction',
            'Principal': 'bedrock.amazonaws.com',
            'SourceArn': f'arn:aws:bedrock:{os.environ.get("AWS_REGION", "us-east-1")}:{account_id}:agent/*'
        }
    ]
    
    for perm in permissions_to_add:
        try:
            logger.info(f"Adding permission: {perm['StatementId']}")
            lambda_client.add_permission(FunctionName=function_name, **perm)
            logger.info(f"✅ Added {perm['StatementId']}")
        except lambda_client.exceptions.ResourceConflictException:
            logger.info(f"ℹ️  {perm['StatementId']} already exists")
        except Exception as e:
            logger.error(f"❌ Failed to add {perm['StatementId']}: {str(e)}")

# ---------------------------------------------------------------------------
# MAIN DEPLOYMENT
# ---------------------------------------------------------------------------

def create_deployment_package(function_name: str, source_filename: str) -> bytes:
    """Package the Lambda function code + dependencies"""
    logger.info(f"📦 Creating deployment package for {function_name}")
    
    lambda_src_dir = Path(__file__).parent.parent / 'lambda'
    source_path = lambda_src_dir / source_filename
    
    if not source_path.exists():
        raise FileNotFoundError(f"Lambda source not found: {source_path}")
    
    logger.info(f"Source file: {source_path}")
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        
        # Copy handler as index.py
        (tmp_path / 'index.py').write_text(source_path.read_text(encoding='utf-8'))
        
        # Install dependencies
        req_file = lambda_src_dir / 'requirements.txt'
        if req_file.exists():
            logger.info("Installing dependencies...")
            subprocess.run([
                sys.executable, '-m', 'pip', 'install',
                '-r', str(req_file),
                '-t', str(tmp_path),
                '--quiet'
            ], check=True)
        
        # Create zip
        zip_bytes_io = tempfile.SpooledTemporaryFile()
        with zipfile.ZipFile(zip_bytes_io, 'w', zipfile.ZIP_DEFLATED) as zf:
            files_count = 0
            for file in tmp_path.rglob('*'):
                if file.is_file():
                    zf.write(file, file.relative_to(tmp_path))
                    files_count += 1
            logger.info(f"Added {files_count} files to zip")
        
        zip_bytes_io.seek(0)
        zip_content = zip_bytes_io.read()
        logger.info(f"Package size: {len(zip_content) / 1024 / 1024:.2f} MB")
        return zip_content

def main():
    """Main deployment function"""
    # Load environment
    load_env_file()
    
    # Initialize AWS clients
    REGION = os.environ.get('AWS_REGION', 'us-east-1')
    logger.info(f"\n🌍 AWS Region: {REGION}")
    
    lambda_client = boto3.client('lambda', region_name=REGION)
    iam = boto3.client('iam')
    
    # Configuration
    function_configs = [
        ('gmail-auth-handler', 'gmail-auth-handler.py'),
        ('gmail-action-handler', 'gmail-action-handler.py')
    ]
    
    # Check for cleanup
    cleanup_existing_lambdas(lambda_client, [name for name, _ in function_configs])
    
    # Create or get IAM role
    logger.info("\n🔐 Setting up IAM role...")
    role_name = 'PatchlineLambdaExecutionRole'
    
    try:
        role = iam.get_role(RoleName=role_name)
        role_arn = role['Role']['Arn']
        logger.info(f"Using existing role: {role_arn}")
    except iam.exceptions.NoSuchEntityException:
        logger.info("Creating new IAM role...")
        # Create role logic here (keeping it simple for now)
        
    # Environment variables
    env_vars = {
        'PLATFORM_CONNECTIONS_TABLE': 'PlatformConnections-staging',
        'GMAIL_SECRETS_NAME': 'patchline/gmail-oauth',
        'KNOWLEDGE_BASE_BUCKET': 'patchline-email-knowledge-base',
        'BEDROCK_AGENT_ID': os.environ.get('BEDROCK_AGENT_ID', ''),
        'BEDROCK_AGENT_ALIAS_ID': os.environ.get('BEDROCK_AGENT_ALIAS_ID', ''),
        'AWS_REGION': REGION
    }
    
    logger.info("\n📋 Configuration Summary:")
    logger.info(f"Agent ID: {env_vars['BEDROCK_AGENT_ID'] or 'NOT SET'}")
    logger.info(f"Alias ID: {env_vars['BEDROCK_AGENT_ALIAS_ID'] or 'NOT SET'}")
    
    # Deploy functions
    deployed_functions = {}
    for func_name, source_file in function_configs:
        try:
            zip_bytes = create_deployment_package(func_name, source_file)
            arn = deploy_lambda_with_logging(
                func_name, source_file, role_arn, env_vars,
                lambda_client, zip_bytes
            )
            deployed_functions[func_name] = arn
        except Exception as e:
            logger.error(f"❌ Failed to deploy {func_name}: {str(e)}")
            raise
    
    # Summary
    logger.info("\n✅ Deployment Complete!")
    logger.info("Deployed functions:")
    for name, arn in deployed_functions.items():
        logger.info(f"  • {name}: {arn}")
    
    logger.info(f"\n📄 Log file: lambda-deploy-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log")

if __name__ == '__main__':
    main() 