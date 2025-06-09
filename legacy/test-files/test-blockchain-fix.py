#!/usr/bin/env python3
"""Fix for blockchain agent wallet lookup and storage"""

import boto3
import json
import time
from datetime import datetime
import uuid

# User from conversation
USER_ID = "14287408-6011-70b3-5ac6-089f0cafdc10"
WALLET_ADDRESS = "3Pe8uEGq2gbgYHXG9DnQ5RL45DNDvf7dnjKcGTj2eVuJ"

# Table names
WALLETS_TABLE = "Web3Wallets-staging"
TRANSACTIONS_TABLE = "Web3Transactions-staging"

def get_or_create_wallet(user_id, wallet_address=None):
    """Get a user's wallet or create one if it doesn't exist"""
    try:
        # DynamoDB resource
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(WALLETS_TABLE)
        
        # Check if user already has a wallet
        response = table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        if 'Items' in response and response['Items']:
            wallet = response['Items'][0]
            print(f"✅ Found existing wallet for user {user_id}:")
            print(json.dumps(wallet, indent=2, default=str))
            return wallet
        
        # If wallet_address is provided, create a new wallet entry
        if wallet_address:
            now = datetime.utcnow().isoformat() + 'Z'
            wallet_item = {
                'userId': user_id,
                'walletAddress': wallet_address,
                'walletType': 'phantom',  # Assuming Phantom wallet
                'isActive': True,
                'createdAt': now,
                'lastUsed': now
            }
            
            # Save to DynamoDB
            table.put_item(Item=wallet_item)
            
            print(f"✅ Created new wallet for user {user_id}:")
            print(json.dumps(wallet_item, indent=2, default=str))
            return wallet_item
        
        print(f"❌ No wallet found for user {user_id} and no address provided to create one")
        return None
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def create_demo_transaction(user_id, wallet_address, amount="0.1", recipient="demo_recipient"):
    """Create a demo transaction in the transactions table"""
    try:
        # DynamoDB resource
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        
        # Generate a transaction ID
        transaction_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'
        timestamp = str(int(time.time()))
        
        # Create transaction item
        transaction_item = {
            'transactionId': transaction_id,
            'userId': user_id,
            'walletAddress': wallet_address,
            'recipientAddress': recipient,
            'amount': amount,
            'status': 'completed',
            'type': 'send',
            'timestamp': timestamp,
            'createdAt': now,
            'updatedAt': now,
            'blockchainId': f"demo_tx_{int(time.time())}"
        }
        
        # Save to DynamoDB
        table.put_item(Item=transaction_item)
        
        print(f"✅ Created demo transaction:")
        print(json.dumps(transaction_item, indent=2, default=str))
        return transaction_item
        
    except Exception as e:
        print(f"❌ Error creating transaction: {str(e)}")
        return None

def get_user_transactions(user_id):
    """Get all transactions for a user"""
    try:
        # DynamoDB resource
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(TRANSACTIONS_TABLE)
        
        # Query transactions for user
        response = table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        if 'Items' in response and response['Items']:
            transactions = response['Items']
            print(f"✅ Found {len(transactions)} transactions for user {user_id}:")
            for i, tx in enumerate(transactions):
                print(f"\n📝 Transaction {i+1}:")
                print(json.dumps(tx, indent=2, default=str))
            return transactions
        
        print(f"⚠️ No transactions found for user {user_id}")
        return []
        
    except Exception as e:
        print(f"❌ Error getting transactions: {str(e)}")
        return []

def main():
    """Main function to fix blockchain wallet lookup"""
    print("\n🔧 BLOCKCHAIN AGENT FIX")
    print("=" * 50)
    
    # 1. Get or create wallet
    print("\n📋 CHECKING USER WALLET:")
    wallet = get_or_create_wallet(USER_ID, WALLET_ADDRESS)
    
    if not wallet:
        print("❌ Cannot proceed without wallet")
        return
    
    # 2. Create a demo transaction
    print("\n📋 CREATING DEMO TRANSACTION:")
    transaction = create_demo_transaction(
        USER_ID, 
        wallet['walletAddress'],
        amount="0.05",
        recipient="BUX7s2ef2htTGb2KKoPHWkmzxPj4nTWMWRg5GbZvfAqK"
    )
    
    # 3. Get user transactions
    print("\n📋 CHECKING USER TRANSACTIONS:")
    get_user_transactions(USER_ID)
    
    # 4. Print final status
    print("\n✅ BLOCKCHAIN FIX COMPLETE")
    print("=" * 50)
    print("\nYou can now modify the Lambda handler to use the correct table names:")
    print("- Use WEB3_WALLETS_TABLE=Web3Wallets-staging")
    print("- Use WEB3_TRANSACTIONS_TABLE=Web3Transactions-staging")
    print("- Ensure the get_wallet_for_user function checks the right table")
    print("- Update Lambda environment variables")

if __name__ == "__main__":
    main() 