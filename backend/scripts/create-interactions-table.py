#!/usr/bin/env python3
"""
Create UserInteractions DynamoDB table for tracking user behavior
"""

import boto3
import json
import os
from datetime import datetime

# Get environment variables
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'staging')

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb', region_name=AWS_REGION)

def create_interactions_table():
    """Create the UserInteractions table with appropriate indexes"""
    
    table_name = f"UserInteractions-{ENVIRONMENT}"
    
    try:
        # Check if table already exists
        existing_tables = dynamodb.list_tables()['TableNames']
        if table_name in existing_tables:
            print(f"✅ Table {table_name} already exists")
            return table_name
        
        # Create table
        print(f"🔄 Creating table {table_name}...")
        
        response = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'userId',
                    'KeyType': 'HASH'  # Partition key
                },
                {
                    'AttributeName': 'timestamp',
                    'KeyType': 'RANGE'  # Sort key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'userId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'timestamp',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'action',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'agent',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'sessionId',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST',  # On-demand billing
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'ActionIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'action',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'timestamp',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                },
                {
                    'IndexName': 'AgentIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'agent',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'timestamp',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                },
                {
                    'IndexName': 'SessionIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'sessionId',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'timestamp',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                }
            ],
            StreamSpecification={
                'StreamEnabled': True,
                'StreamViewType': 'NEW_AND_OLD_IMAGES'
            },
            Tags=[
                {
                    'Key': 'Environment',
                    'Value': ENVIRONMENT
                },
                {
                    'Key': 'Application',
                    'Value': 'Patchline'
                },
                {
                    'Key': 'Purpose',
                    'Value': 'UserInteractionTracking'
                }
            ]
        )
        
        # Wait for table to be created
        waiter = dynamodb.get_waiter('table_exists')
        print("⏳ Waiting for table to be created...")
        waiter.wait(TableName=table_name)
        
        # Enable TTL on the table
        dynamodb.update_time_to_live(
            TableName=table_name,
            TimeToLiveSpecification={
                'Enabled': True,
                'AttributeName': 'ttl'
            }
        )
        
        print(f"✅ Table {table_name} created successfully!")
        print(f"   - Partition key: userId")
        print(f"   - Sort key: timestamp")
        print(f"   - Global indexes: ActionIndex, AgentIndex, SessionIndex")
        print(f"   - TTL enabled on 'ttl' attribute")
        print(f"   - Streams enabled")
        
        return table_name
        
    except Exception as e:
        print(f"❌ Error creating table: {str(e)}")
        raise

def update_env_template():
    """Add the new table name to env template"""
    env_template_path = 'backend/env-template.txt'
    
    try:
        with open(env_template_path, 'r') as f:
            content = f.read()
        
        # Check if already added
        if 'USER_INTERACTIONS_TABLE' in content:
            print("✅ Environment template already contains USER_INTERACTIONS_TABLE")
            return
        
        # Find the DynamoDB tables section
        tables_section = content.find('# ===== DYNAMODB TABLES =====')
        if tables_section == -1:
            print("⚠️  Could not find DynamoDB tables section in env template")
            return
        
        # Find the next section
        next_section = content.find('# =====', tables_section + 1)
        if next_section == -1:
            next_section = len(content)
        
        # Insert the new table
        insert_pos = content.rfind('\n', tables_section, next_section)
        new_line = f"\nUSER_INTERACTIONS_TABLE=UserInteractions-{ENVIRONMENT}"
        
        content = content[:insert_pos] + new_line + content[insert_pos:]
        
        with open(env_template_path, 'w') as f:
            f.write(content)
        
        print("✅ Updated env-template.txt with USER_INTERACTIONS_TABLE")
        
    except Exception as e:
        print(f"⚠️  Could not update env template: {str(e)}")

def main():
    print("🚀 Setting up UserInteractions table for Patchline")
    print(f"   Region: {AWS_REGION}")
    print(f"   Environment: {ENVIRONMENT}")
    print()
    
    # Create the table
    table_name = create_interactions_table()
    
    # Update env template
    update_env_template()
    
    print()
    print("📝 Next steps:")
    print(f"1. Add USER_INTERACTIONS_TABLE={table_name} to your .env.local")
    print("2. Restart your development server")
    print("3. User interactions will now be tracked in DynamoDB")
    print()
    print("💡 The table uses TTL to automatically delete old interactions after 90 days")
    print("   You can query interactions by userId, action, agent, or sessionId")

if __name__ == "__main__":
    main() 