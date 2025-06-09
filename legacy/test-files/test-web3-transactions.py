#!/usr/bin/env python3

import boto3
import json

def scan_transactions_table(table_name="Web3Transactions-staging", limit=10):
    """Scan the transactions table and display its contents"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        response = table.scan(Limit=limit)
        
        print(f"\n📊 TRANSACTIONS IN {table_name}:")
        print("=" * 50)
        
        if 'Items' in response and response['Items']:
            print(f"✅ Found {len(response['Items'])} transactions")
            for i, item in enumerate(response['Items']):
                print(f"\n📝 Transaction {i+1}:")
                print(json.dumps(item, indent=2, default=str))
        else:
            print(f"⚠️ No transactions found in '{table_name}'")
            
        # Get table schema
        client = boto3.client('dynamodb')
        schema = client.describe_table(TableName=table_name)
        print(f"\n📋 TABLE SCHEMA:")
        
        # Print key schema
        print("\nKey Schema:")
        for key in schema['Table']['KeySchema']:
            print(f"- {key['AttributeName']} ({key['KeyType']})")
            
        # Print attribute definitions
        print("\nAttribute Definitions:")
        for attr in schema['Table']['AttributeDefinitions']:
            print(f"- {attr['AttributeName']} ({attr['AttributeType']})")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    scan_transactions_table() 