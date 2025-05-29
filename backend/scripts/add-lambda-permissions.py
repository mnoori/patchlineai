#!/usr/bin/env python3
"""
Script to add permissions for Bedrock to invoke Lambda functions
"""
import boto3
import os
from pathlib import Path

# Load environment variables from .env.local
def load_env_file():
    """Load environment variables from .env.local file in project root"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Load env vars
load_env_file()

# Initialize AWS clients
REGION = os.environ.get('AWS_REGION', 'us-east-1')
lambda_client = boto3.client('lambda', region_name=REGION)

def add_bedrock_permission(function_name):
    """Add permission for Bedrock to invoke Lambda function"""
    print(f"Adding Bedrock permission to {function_name}...")
    
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f'AllowBedrockInvoke-{function_name}',
            Action='lambda:InvokeFunction',
            Principal='bedrock.amazonaws.com'
        )
        print(f"✅ Added permission for {function_name}")
    except lambda_client.exceptions.ResourceConflictException:
        print(f"⚠️ Permission already exists for {function_name}")
    except Exception as e:
        print(f"❌ Error adding permission: {str(e)}")

def main():
    """Main function"""
    # Add permissions for all Lambda functions
    add_bedrock_permission('legal-contract-handler')
    add_bedrock_permission('gmail-action-handler')
    
    print("Done!")

if __name__ == '__main__':
    main() 