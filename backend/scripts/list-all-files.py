#!/usr/bin/env python3
"""
List All Files in Database
==========================

Simple script to list ALL files that have been processed.
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

def get_all_files():
    """Get all files from database"""
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': 'default-user'}
    )
    
    documents = response.get('Items', [])
    
    # Extract filenames
    filenames = []
    for doc in documents:
        filename = doc.get('fileName') or doc.get('filename', '')
        if filename:
            filenames.append(filename)
    
    # Sort for easier reading
    filenames.sort()
    
    return filenames

def main():
    print("\n" + "="*60)
    print("ALL PROCESSED FILES")
    print("="*60 + "\n")
    
    files = get_all_files()
    
    if not files:
        print("No files found in database.")
        return
    
    print(f"Found {len(files)} files:\n")
    
    # Print all filenames
    for i, file in enumerate(files, 1):
        print(f"{i:3d}. {file}")
    
    # Save to text file for easy use
    with open('all-processed-files.txt', 'w') as f:
        for file in files:
            f.write(file + '\n')
    
    print(f"\n\nList saved to: all-processed-files.txt")
    print(f"Total: {len(files)} files")

if __name__ == "__main__":
    main() 