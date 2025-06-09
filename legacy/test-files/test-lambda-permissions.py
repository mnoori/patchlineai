#!/usr/bin/env python3

import boto3
import json

# Test Lambda permissions
def test_permissions():
    # Test DynamoDB access
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('PlatformConnections-staging')
        
        # Try to describe the table
        print("✅ Can access DynamoDB resource")
        
        # Try to get an item
        response = table.get_item(
            Key={
                'userId': '14287408-6011-70b3-5ac6-089f0cafdc10',
                'provider': 'gmail'
            }
        )
        
        if 'Item' in response:
            print("✅ Can read from PlatformConnections-staging table")
            print(f"✅ Found Gmail connection for user")
        else:
            print("❌ No Gmail connection found in table")
            
    except Exception as e:
        print(f"❌ DynamoDB Error: {str(e)}")
        print(f"   Error Type: {type(e).__name__}")
        
    # Test S3 access
    try:
        s3 = boto3.client('s3')
        s3.list_objects_v2(Bucket='patchline-files-us-east-1', MaxKeys=1)
        print("✅ Can access S3 bucket")
    except Exception as e:
        print(f"❌ S3 Error: {str(e)}")

if __name__ == "__main__":
    print("🔍 Testing Lambda Permissions")
    test_permissions() 