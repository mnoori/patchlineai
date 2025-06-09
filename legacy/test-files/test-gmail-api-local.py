#!/usr/bin/env python3

import json
import boto3
from datetime import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

print("🔍 TESTING GMAIL API LOCALLY")
print("=" * 60)

# 1. Test DynamoDB connection
print("\n1️⃣ Testing DynamoDB connection...")
try:
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('PlatformConnections-staging')
    
    response = table.get_item(
        Key={
            'userId': '14287408-6011-70b3-5ac6-089f0cafdc10',
            'provider': 'gmail'
        }
    )
    
    if 'Item' in response:
        item = response['Item']
        print("✅ Found Gmail connection in DynamoDB")
        print(f"   Email: {item.get('gmailUserEmail')}")
        print(f"   Access Token: {item.get('accessToken')[:20]}...")
        print(f"   Refresh Token: {item.get('refreshToken')[:20]}...")
        print(f"   Scopes: {item.get('scopes')}")
    else:
        print("❌ No Gmail connection found")
        exit(1)
except Exception as e:
    print(f"❌ DynamoDB Error: {str(e)}")
    exit(1)

# 2. Test Secrets Manager
print("\n2️⃣ Testing Secrets Manager...")
try:
    secrets_client = boto3.client('secretsmanager')
    response = secrets_client.get_secret_value(SecretId='patchline/gmail-oauth')
    secret_data = json.loads(response['SecretString'])
    
    print("✅ Retrieved Gmail OAuth credentials from Secrets Manager")
    print(f"   Structure: {list(secret_data.keys())}")
    
    # Check if nested or flat
    if 'web' in secret_data:
        print("   📦 Using nested 'web' structure")
        oauth_config = secret_data['web']
    else:
        print("   📦 Using flat structure")
        oauth_config = secret_data
    
    # Log what we have
    print(f"   Client ID: {oauth_config.get('client_id', 'MISSING')[:20]}...")
    print(f"   Token URI: {oauth_config.get('token_uri', 'MISSING')}")
    print(f"   Auth URI: {oauth_config.get('auth_uri', 'MISSING')}")
    
except Exception as e:
    print(f"❌ Secrets Manager Error: {str(e)}")
    exit(1)

# 3. Test Gmail API
print("\n3️⃣ Testing Gmail API...")
try:
    # Parse scopes
    scopes_str = item.get('scopes', '')
    scopes = [s.strip() for s in scopes_str.split() if s.strip()]
    print(f"   Parsed {len(scopes)} scopes")
    
    # Create credentials
    credentials = Credentials(
        token=item.get('accessToken'),
        refresh_token=item.get('refreshToken'),
        token_uri=oauth_config.get('token_uri'),
        client_id=oauth_config.get('client_id'),
        client_secret=oauth_config.get('client_secret'),
        scopes=scopes
    )
    
    print("✅ Created OAuth2 credentials object")
    
    # Check if expired
    if credentials.expired and credentials.refresh_token:
        print("⚠️  Access token expired, refreshing...")
        credentials.refresh(Request())
        print("✅ Token refreshed successfully!")
        print(f"   New token: {credentials.token[:20]}...")
    
    # Build Gmail service
    service = build('gmail', 'v1', credentials=credentials)
    print("✅ Built Gmail service client")
    
    # Test API call
    print("\n4️⃣ Making test API call...")
    results = service.users().messages().list(
        userId='me',
        q='from:mehdi',
        maxResults=5
    ).execute()
    
    messages = results.get('messages', [])
    print(f"✅ API call successful! Found {len(messages)} messages from Mehdi")
    
    # Get details of first message
    if messages:
        msg_id = messages[0]['id']
        message = service.users().messages().get(
            userId='me',
            id=msg_id,
            format='metadata'
        ).execute()
        
        headers = message['payload'].get('headers', [])
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
        
        print(f"\n   📧 First email:")
        print(f"      Subject: {subject}")
        print(f"      From: {from_email}")
        print(f"      Date: {date}")
    
except Exception as e:
    print(f"❌ Gmail API Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("✅ Local test complete!") 