#!/usr/bin/env python3

import boto3
import json

def check_table_exists(table_name):
    """Check if a DynamoDB table exists"""
    try:
        dynamodb = boto3.client('dynamodb')
        response = dynamodb.describe_table(TableName=table_name)
        print(f"✅ Table '{table_name}' exists!")
        return True
    except dynamodb.exceptions.ResourceNotFoundException:
        print(f"❌ Table '{table_name}' does not exist")
        return False
    except Exception as e:
        print(f"❌ Error checking table '{table_name}': {str(e)}")
        return False

def scan_table(table_name, limit=10):
    """Scan a DynamoDB table and return items"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        response = table.scan(Limit=limit)
        
        if 'Items' in response and response['Items']:
            print(f"✅ Found {len(response['Items'])} items in '{table_name}'")
            for i, item in enumerate(response['Items']):
                print(f"\n📊 Item {i+1}:")
                print(json.dumps(item, indent=2, default=str))
        else:
            print(f"⚠️ No items found in '{table_name}'")
    except Exception as e:
        print(f"❌ Error scanning table '{table_name}': {str(e)}")

def check_wallet(table_name, user_id, wallet_address=None):
    """Check if a wallet exists for a user"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        
        if wallet_address:
            # Check by wallet address
            response = table.scan(
                FilterExpression='walletAddress = :addr',
                ExpressionAttributeValues={':addr': wallet_address}
            )
        else:
            # Check by user ID
            response = table.scan(
                FilterExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
        
        if 'Items' in response and response['Items']:
            print(f"✅ Found {len(response['Items'])} wallets for user")
            for i, item in enumerate(response['Items']):
                print(f"\n👛 Wallet {i+1}:")
                print(json.dumps(item, indent=2, default=str))
        else:
            print(f"⚠️ No wallet found for user")
    except Exception as e:
        print(f"❌ Error checking wallet: {str(e)}")

def main():
    """Main function to check Web3 DynamoDB tables"""
    print("\n🔍 CHECKING WEB3 DYNAMODB TABLES\n" + "=" * 50)
    
    # Table names (check both staging and production)
    tables = [
        "Web3Wallets", 
        "Web3Wallets-staging", 
        "Web3Transactions", 
        "Web3Transactions-staging"
    ]
    
    # Check if tables exist
    print("\n📋 CHECKING TABLE EXISTENCE:")
    for table in tables:
        check_table_exists(table)
    
    # Scan wallet tables
    print("\n📋 SCANNING WALLET TABLES:")
    for table in [t for t in tables if 'Wallet' in t]:
        if check_table_exists(table):
            print(f"\n🔍 Contents of '{table}':")
            scan_table(table)
    
    # Check for specific user's wallet
    user_id = "14287408-6011-70b3-5ac6-089f0cafdc10"  # From Gmail test
    wallet_address = "3Pe8uEGq2gbgYHXG9DnQ5RL45DNDvf7dnjKcGTj2eVuJ"  # From summary
    
    print(f"\n👤 CHECKING USER WALLET:")
    print(f"User ID: {user_id}")
    print(f"Expected wallet address: {wallet_address}")
    
    for table in [t for t in tables if 'Wallet' in t]:
        if check_table_exists(table):
            print(f"\n🔍 Checking '{table}' for user:")
            check_wallet(table, user_id)
            print(f"\n🔍 Checking '{table}' for wallet address:")
            check_wallet(table, user_id, wallet_address)

if __name__ == "__main__":
    main() 