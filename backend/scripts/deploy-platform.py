#!/usr/bin/env python3
"""
Unified Platform Deployment Script

Deploy Lambda functions for any platform (Gmail, Slack, Discord, etc.)
using the modular configuration system.

Usage:
    python deploy-platform.py gmail              # Deploy Gmail integration
    python deploy-platform.py slack              # Deploy Slack integration (when ready)
    python deploy-platform.py --all              # Deploy all configured platforms
    python deploy-platform.py gmail --validate   # Validate Gmail environment only
"""

import argparse
import boto3
import json
import os
import sys
import tempfile
import zipfile
import subprocess
from pathlib import Path
from typing import Dict

# Import our modular configuration system
from platform_configs import (
    PLATFORM_REGISTRY,
    get_platform_config,
    get_platform_env_vars,
    create_platform_secret,
    deploy_platform_lambdas,
    print_platform_deployment_summary,
    validate_platform_environment,
    print_platform_checklist,
    create_oauth_url
)

# ---------------------------------------------------------------------------
# ENV LOADER
# ---------------------------------------------------------------------------

def load_env_file():
    """Load environment variables from project root .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    if env_file.exists():
        print(f"✅ Loading environment variables from {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    else:
        print(f"⚠️  No .env.local file found at {env_file}")

# ---------------------------------------------------------------------------
# LAMBDA DEPLOYMENT
# ---------------------------------------------------------------------------

def create_deployment_package(function_name: str, source_filename: str) -> bytes:
    """Package the Lambda function code + dependencies"""
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

def deploy_lambda(function_name: str, handler_file: str, role_arn: str, env: Dict[str, str], lambda_client) -> str:
    """Create or update a Lambda function"""
    print(f"\n🚀 Deploying {function_name}...")
    zip_bytes = create_deployment_package(function_name, handler_file)
    
    # Check if function exists
    try:
        lambda_client.get_function(FunctionName=function_name)
        exists = True
    except lambda_client.exceptions.ResourceNotFoundException:
        exists = False
    
    if exists:
        lambda_client.update_function_code(FunctionName=function_name, ZipFile=zip_bytes)
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Runtime='python3.11',
            Role=role_arn,
            Handler='index.lambda_handler',
            Timeout=300,
            MemorySize=512,
            Environment={'Variables': env},
        )
        print("✅ Function updated.")
    else:
        lambda_client.create_function(
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
        print("✅ Function created.")
    
    # Wait for function to be active
    lambda_client.get_waiter('function_active').wait(FunctionName=function_name)
    fn_arn = lambda_client.get_function(FunctionName=function_name)['Configuration']['FunctionArn']
    
    # Add Bedrock permissions for action handlers
    if 'action-handler' in function_name:
        add_bedrock_invoke_permission(lambda_client, function_name)
    
    return fn_arn

def add_bedrock_invoke_permission(lambda_client, function_name: str):
    """Add resource-based policy to allow Bedrock to invoke the Lambda function"""
    try:
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

def create_lambda_execution_role(iam_client) -> str:
    """Create or get the Lambda execution role"""
    role_name = 'PatchlineLambdaExecutionRole'
    
    # Trust policy for Lambda
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
    
    # Try to create the role
    try:
        iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Execution role for Patchline Lambda functions'
        )
        print(f"✅ Created IAM role: {role_name}")
    except iam_client.exceptions.EntityAlreadyExistsException:
        print(f"ℹ️  IAM role already exists: {role_name}")
    
    # Attach necessary policies
    policies = [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
        'arn:aws:iam::aws:policy/AmazonS3FullAccess'
    ]
    
    for policy_arn in policies:
        try:
            iam_client.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
        except iam_client.exceptions.NoSuchEntityException:
            pass  # Policy already attached
    
    # Get role ARN
    role = iam_client.get_role(RoleName=role_name)
    return role['Role']['Arn']

# ---------------------------------------------------------------------------
# MAIN DEPLOYMENT FUNCTIONS
# ---------------------------------------------------------------------------

def validate_platform(platform_name: str) -> bool:
    """Validate platform environment and configuration"""
    print(f"\n🔍 Validating {platform_name} platform...")
    
    try:
        config = get_platform_config(platform_name)
        env_results = validate_platform_environment(platform_name)
        
        print(f"📋 Environment Variables Check:")
        all_good = True
        for var_name, is_set in env_results.items():
            status = "✅" if is_set else "❌"
            print(f"   {status} {var_name}")
            if not is_set:
                all_good = False
        
        print_platform_checklist(platform_name)
        
        if all_good:
            print(f"\n✅ {config['display_name']} environment validation passed!")
        else:
            print(f"\n❌ {config['display_name']} environment validation failed!")
            print("   Please set the missing environment variables.")
        
        return all_good
        
    except Exception as e:
        print(f"❌ Validation failed: {str(e)}")
        return False

def deploy_platform(platform_name: str, validate_only: bool = False) -> bool:
    """Deploy a specific platform"""
    print(f"\n🚀 Starting {platform_name} Platform Deployment")
    print("=" * 60)
    
    # Validate first
    if not validate_platform(platform_name):
        return False
    
    if validate_only:
        return True
    
    try:
        # Initialize AWS clients
        region = os.environ.get('AWS_REGION', 'us-east-1')
        lambda_client = boto3.client('lambda', region_name=region)
        iam_client = boto3.client('iam')
        secrets_client = boto3.client('secretsmanager', region_name=region)
        
        # Setup infrastructure
        print(f"\n🔐 Setting up IAM role...")
        role_arn = create_lambda_execution_role(iam_client)
        
        print(f"\n🔑 Setting up secrets...")
        create_platform_secret(platform_name, secrets_client)
        
        # Deploy Lambda functions
        print(f"\n📦 Deploying Lambda functions...")
        config = get_platform_config(platform_name)
        env_vars = get_platform_env_vars(platform_name)
        
        # Create deployment function that matches expected signature
        def deploy_func(func_name, handler_file, role_arn, env_vars):
            return deploy_lambda(func_name, handler_file, role_arn, env_vars, lambda_client)
        
        arns = deploy_platform_lambdas(platform_name, deploy_func, role_arn)
        
        # Print summary
        print_platform_deployment_summary(platform_name, arns)
        
        # Generate OAuth URL for testing
        client_id = os.environ.get(config['env_vars']['client_id'])
        if client_id:
            oauth_url = create_oauth_url(platform_name, client_id)
            print(f"\n🔗 Test OAuth URL:")
            print(f"   {oauth_url}")
        
        print(f"\n✅ {config['display_name']} deployment completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Deploy platform integrations')
    parser.add_argument('platform', nargs='?', help='Platform to deploy (gmail, slack, discord)')
    parser.add_argument('--all', action='store_true', help='Deploy all platforms')
    parser.add_argument('--validate', action='store_true', help='Validate environment only')
    parser.add_argument('--list', action='store_true', help='List available platforms')
    
    args = parser.parse_args()
    
    # Load environment variables
    load_env_file()
    
    if args.list:
        print("🌟 Available Platforms:")
        for name, config in PLATFORM_REGISTRY.items():
            print(f"   • {name}: {config['display_name']}")
        return
    
    if args.all:
        print("🚀 Deploying all platforms...")
        success = True
        for platform_name in PLATFORM_REGISTRY.keys():
            if not deploy_platform(platform_name, args.validate):
                success = False
        
        if success:
            print("\n🎉 All platforms deployed successfully!")
        else:
            print("\n❌ Some platforms failed to deploy.")
            sys.exit(1)
    
    elif args.platform:
        if args.platform not in PLATFORM_REGISTRY:
            print(f"❌ Unknown platform: {args.platform}")
            print(f"Available platforms: {list(PLATFORM_REGISTRY.keys())}")
            sys.exit(1)
        
        if not deploy_platform(args.platform, args.validate):
            sys.exit(1)
    
    else:
        parser.print_help()
        print(f"\nAvailable platforms: {list(PLATFORM_REGISTRY.keys())}")

if __name__ == '__main__':
    main() 