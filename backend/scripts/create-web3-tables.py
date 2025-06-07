#!/usr/bin/env python3
"""
Create DynamoDB tables for Web3 Portal functionality
Run: python backend/scripts/create-web3-tables.py
"""

import boto3
import os
import sys
from botocore.exceptions import ClientError

def get_aws_region():
    return os.environ.get('AWS_REGION', 'us-east-1')

def get_env_suffix():
    return os.environ.get('AWS_BRANCH', 'staging')

def create_web3_tables():
    """Create Web3 related DynamoDB tables"""
    
    dynamodb = boto3.resource('dynamodb', region_name=get_aws_region())
    env_suffix = get_env_suffix()
    
    print(f"🚀 Creating Web3 DynamoDB tables for environment: {env_suffix}")
    print(f"📍 Region: {get_aws_region()}")
    
    tables_to_create = [
        {
            'name': f'Web3Wallets-{env_suffix}',
            'key_schema': [
                {'AttributeName': 'userId', 'KeyType': 'HASH'},
                {'AttributeName': 'walletAddress', 'KeyType': 'RANGE'}
            ],
            'attribute_definitions': [
                {'AttributeName': 'userId', 'AttributeType': 'S'},
                {'AttributeName': 'walletAddress', 'AttributeType': 'S'}
            ],
            'description': 'Connected crypto wallets per user'
        },
        {
            'name': f'Web3Transactions-{env_suffix}',
            'key_schema': [
                {'AttributeName': 'transactionId', 'KeyType': 'HASH'}
            ],
            'attribute_definitions': [
                {'AttributeName': 'transactionId', 'AttributeType': 'S'},
                {'AttributeName': 'userId', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'S'}
            ],
            'global_secondary_indexes': [
                {
                    'IndexName': 'userId-timestamp-index',
                    'KeySchema': [
                        {'AttributeName': 'userId', 'KeyType': 'HASH'},
                        {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            'description': 'Web3 transaction history'
        },
        {
            'name': f'NFTTickets-{env_suffix}',
            'key_schema': [
                {'AttributeName': 'mintAddress', 'KeyType': 'HASH'}
            ],
            'attribute_definitions': [
                {'AttributeName': 'mintAddress', 'AttributeType': 'S'},
                {'AttributeName': 'eventId', 'AttributeType': 'S'}
            ],
            'global_secondary_indexes': [
                {
                    'IndexName': 'eventId-index',
                    'KeySchema': [
                        {'AttributeName': 'eventId', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            'description': 'NFT event tickets'
        }
    ]
    
    for table_config in tables_to_create:
        try:
            table_name = table_config['name']
            
            # Check if table already exists
            try:
                existing_table = dynamodb.Table(table_name)
                existing_table.load()
                print(f"✅ Table {table_name} already exists")
                continue
            except ClientError as e:
                if e.response['Error']['Code'] != 'ResourceNotFoundException':
                    raise
            
            # Create table
            table_args = {
                'TableName': table_name,
                'KeySchema': table_config['key_schema'],
                'AttributeDefinitions': table_config['attribute_definitions'],
                'BillingMode': 'PAY_PER_REQUEST'
            }
            
            # Add GSIs if specified
            if 'global_secondary_indexes' in table_config:
                table_args['GlobalSecondaryIndexes'] = []
                for gsi in table_config['global_secondary_indexes']:
                    gsi_config = {
                        'IndexName': gsi['IndexName'],
                        'KeySchema': gsi['KeySchema'],
                        'Projection': gsi['Projection']
                    }
                    table_args['GlobalSecondaryIndexes'].append(gsi_config)
            
            print(f"🔨 Creating table {table_name}...")
            table = dynamodb.create_table(**table_args)
            
            # Wait for table to be created
            print(f"⏳ Waiting for {table_name} to be active...")
            table.wait_until_exists()
            
            print(f"✅ Created {table_name} - {table_config['description']}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceInUseException':
                print(f"✅ Table {table_name} already exists")
            else:
                print(f"❌ Error creating table {table_name}: {e}")
                return False
        except Exception as e:
            print(f"❌ Unexpected error creating table {table_name}: {e}")
            return False
    
    print("\n🎉 Web3 DynamoDB tables setup complete!")
    print("\n📋 Created tables:")
    for table_config in tables_to_create:
        print(f"  • {table_config['name']} - {table_config['description']}")
    
    return True

def verify_tables():
    """Verify that all tables were created successfully"""
    
    dynamodb = boto3.resource('dynamodb', region_name=get_aws_region())
    env_suffix = get_env_suffix()
    
    expected_tables = [
        f'Web3Wallets-{env_suffix}',
        f'Web3Transactions-{env_suffix}',
        f'NFTTickets-{env_suffix}'
    ]
    
    print("\n🔍 Verifying tables...")
    
    for table_name in expected_tables:
        try:
            table = dynamodb.Table(table_name)
            table.load()
            
            status = table.table_status
            item_count = table.item_count
            
            print(f"✅ {table_name}: {status} ({item_count} items)")
            
        except ClientError as e:
            print(f"❌ {table_name}: Not found - {e}")
            return False
        except Exception as e:
            print(f"❌ {table_name}: Error - {e}")
            return False
    
    return True

def main():
    """Main execution function"""
    
    print("🔗 Patchline Web3 Portal - DynamoDB Setup")
    print("=" * 50)
    
    # Check AWS credentials
    try:
        session = boto3.Session()
        credentials = session.get_credentials()
        if not credentials:
            print("❌ AWS credentials not found. Please configure your AWS credentials.")
            sys.exit(1)
        
        print(f"✅ AWS credentials configured")
        
    except Exception as e:
        print(f"❌ AWS credentials error: {e}")
        sys.exit(1)
    
    # Create tables
    if not create_web3_tables():
        print("❌ Failed to create tables")
        sys.exit(1)
    
    # Verify tables
    if not verify_tables():
        print("❌ Table verification failed")
        sys.exit(1)
    
    print("\n🚀 Setup complete! Your Web3 Portal backend is ready.")

if __name__ == "__main__":
    main() 