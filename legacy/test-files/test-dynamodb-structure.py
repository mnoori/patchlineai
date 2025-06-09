#!/usr/bin/env python3

import boto3
import json

# DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('PlatformConnections-staging')

# Get Gmail connection
try:
    response = table.get_item(
        Key={
            'userId': '14287408-6011-70b3-5ac6-089f0cafdc10',
            'provider': 'gmail'
        }
    )
    
    if 'Item' in response:
        print("✅ Gmail connection found!")
        print(json.dumps(response['Item'], indent=2, default=str))
        
        # Check specific fields
        item = response['Item']
        print("\n📊 Key fields:")
        print(f"- gmailUserEmail: {item.get('gmailUserEmail', 'NOT FOUND')}")
        print(f"- accessToken: {'EXISTS' if 'accessToken' in item else 'NOT FOUND'}")
        print(f"- refreshToken: {'EXISTS' if 'refreshToken' in item else 'NOT FOUND'}")
        print(f"- expiresAt: {item.get('expiresAt', 'NOT FOUND')}")
    else:
        print("❌ No Gmail connection found")
        
except Exception as e:
    print(f"❌ Error: {str(e)}") 