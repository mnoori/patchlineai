#!/usr/bin/env python3
"""
List All Creative Cloud Files
=============================

Simple script to list all Creative Cloud invoice files in the database.
"""

import os
import boto3
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except ImportError:
    pass

# AWS Configuration
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)
documents_table = dynamodb.Table('Documents-staging')

def get_all_creative_cloud_files():
    """Get all Creative Cloud files from database"""
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': 'default-user'}
    )
    
    documents = response.get('Items', [])
    creative_cloud_files = []
    
    for doc in documents:
        filename = doc.get('fileName') or doc.get('filename', '')
        # Pattern for Creative Cloud: invoice (number).pdf
        if 'invoice' in filename.lower() and any(x in filename for x in ['(', ')']):
            creative_cloud_files.append(filename)
    
    # Sort for easier reading
    creative_cloud_files.sort()
    
    return creative_cloud_files

def main():
    print("\n" + "="*60)
    print("ALL CREATIVE CLOUD INVOICE FILES")
    print("="*60 + "\n")
    
    files = get_all_creative_cloud_files()
    
    if not files:
        print("No Creative Cloud invoice files found.")
        return
    
    print(f"Found {len(files)} Creative Cloud invoice files:\n")
    
    for file in files:
        print(file)
    
    # Save to text file for easy use
    with open('creative-cloud-files.txt', 'w') as f:
        for file in files:
            f.write(file + '\n')
    
    print(f"\n\nList saved to: creative-cloud-files.txt")
    print(f"Total: {len(files)} files")

if __name__ == "__main__":
    main() 