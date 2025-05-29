#!/usr/bin/env python3
"""
Fix Instagram Platform Connection Status

This script checks if there are any Instagram embeds for a user in the Embeds table,
and if so, updates the PlatformConnections table to show Instagram as connected.
"""

import boto3
import os
import sys
from pathlib import Path

# Load environment variables from project root .env.local
def load_env_file():
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

    # Normalize variable names
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']

def main():
    load_env_file()
    
    # Get environment - force staging since that's where our tables are
    region = os.environ.get('AWS_REGION', 'us-east-1')
    env = 'staging'  # Force staging environment since tables use -staging suffix
    
    print(f"🔧 Environment: {env}")
    print(f"🌍 Region: {region}")
    
    # Initialize DynamoDB client
    dynamodb = boto3.client('dynamodb', region_name=region)
    
    # Table names
    embeds_table = f'Embeds-{env}'
    platform_connections_table = f'PlatformConnections-{env}'
    
    try:
        # Scan Embeds table for Instagram embeds
        print(f"🔍 Scanning {embeds_table} for Instagram embeds...")
        
        paginator = dynamodb.get_paginator('scan')
        instagram_users = set()
        
        for page in paginator.paginate(TableName=embeds_table):
            for item in page.get('Items', []):
                # Check if the embed is from Instagram
                platform = item.get('platform', {}).get('S', '')
                if platform.lower() == 'instagram':
                    user_id = item.get('userId', {}).get('S', '')
                    if user_id:
                        instagram_users.add(user_id)
        
        print(f"📊 Found {len(instagram_users)} users with Instagram embeds")
        
        if not instagram_users:
            print("ℹ️ No Instagram embeds found, nothing to update")
            return
        
        # Update PlatformConnections for users with Instagram embeds
        for user_id in instagram_users:
            print(f"🔄 Updating Instagram connection for user: {user_id[:8]}...")
            
            # Check if user already has a platform connections record
            try:
                response = dynamodb.get_item(
                    TableName=platform_connections_table,
                    Key={'userId': {'S': user_id}}
                )
                
                if 'Item' in response:
                    # Update existing record
                    current_platforms = response['Item'].get('platforms', {}).get('M', {})
                    current_platforms['instagram'] = {'BOOL': True}
                    
                    dynamodb.update_item(
                        TableName=platform_connections_table,
                        Key={'userId': {'S': user_id}},
                        UpdateExpression='SET platforms.instagram = :instagram',
                        ExpressionAttributeValues={
                            ':instagram': {'BOOL': True}
                        }
                    )
                else:
                    # Create new record
                    dynamodb.put_item(
                        TableName=platform_connections_table,
                        Item={
                            'userId': {'S': user_id},
                            'platforms': {
                                'M': {
                                    'instagram': {'BOOL': True}
                                }
                            }
                        }
                    )
                
                print(f"✅ Updated Instagram connection for user {user_id[:8]}")
                
            except Exception as e:
                print(f"❌ Failed to update user {user_id[:8]}: {str(e)}")
        
        print(f"\n🎉 Instagram connection status updated for {len(instagram_users)} users!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 