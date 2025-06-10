#!/usr/bin/env python3
"""
Create ArtistRoster DynamoDB table for storing user's artist roster
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

def create_artist_roster_table():
    """Create the ArtistRoster table with appropriate indexes"""
    
    table_name = f"ArtistRoster-{ENVIRONMENT}"
    
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
                    'AttributeName': 'artistId',
                    'KeyType': 'RANGE'  # Sort key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'userId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'artistId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'platform',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'addedAt',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST',  # On-demand billing
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'PlatformIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'platform',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'addedAt',
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
                    'Value': 'ArtistRosterManagement'
                }
            ]
        )
        
        # Wait for table to be created
        waiter = dynamodb.get_waiter('table_exists')
        print("⏳ Waiting for table to be created...")
        waiter.wait(TableName=table_name)
        
        print(f"✅ Table {table_name} created successfully!")
        print(f"   - Partition key: userId")
        print(f"   - Sort key: artistId")
        print(f"   - Global indexes: PlatformIndex")
        print(f"   - Streams enabled")
        
        return table_name
        
    except Exception as e:
        print(f"❌ Error creating table: {str(e)}")
        raise

def main():
    print("🚀 Setting up ArtistRoster table for Patchline")
    print(f"   Region: {AWS_REGION}")
    print(f"   Environment: {ENVIRONMENT}")
    print()
    
    # Create the table
    table_name = create_artist_roster_table()
    
    print()
    print("📝 Next steps:")
    print(f"1. Add ARTIST_ROSTER_TABLE={table_name} to your .env.local")
    print("2. Restart your development server")
    print("3. Artists can now be added to user rosters")
    print()
    print("💡 The table stores artist information with user associations")
    print("   You can query by userId or platform")

if __name__ == "__main__":
    main() 