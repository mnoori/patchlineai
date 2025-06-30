#!/usr/bin/env python3
import boto3
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(env_path)

# AWS Configuration
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

print("AWS Config:")
print(f"  Region: {aws_config['region_name']}")
print(f"  Access Key: {aws_config['aws_access_key_id'][:10]}..." if aws_config['aws_access_key_id'] else "  Access Key: None")

try:
    s3 = boto3.client('s3', **aws_config)
    buckets = s3.list_buckets()
    
    print("\nAvailable S3 buckets:")
    for bucket in buckets['Buckets']:
        print(f"  - {bucket['Name']}")
        
    # Check for patchline-related buckets
    patchline_buckets = [b['Name'] for b in buckets['Buckets'] if 'patch' in b['Name'].lower()]
    
    if patchline_buckets:
        print(f"\nSuggested bucket for documents: {patchline_buckets[0]}")
    else:
        print("\nNo patchline-related buckets found. You may need to create one.")
        
except Exception as e:
    print(f"\nError: {e}") 