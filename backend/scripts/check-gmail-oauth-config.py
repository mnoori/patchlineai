#!/usr/bin/env python3
"""
Gmail OAuth Configuration Checker

This script verifies that Gmail OAuth environment variables are properly configured
and checks the current secret structure in AWS Secrets Manager.
"""

import os
import json
import boto3
import sys
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded environment from: {env_path}")
else:
    print(f"❌ No .env.local found at: {env_path}")

print("🔍 Gmail OAuth Configuration Check")
print("=" * 60)

# Check environment variables
print("\n1️⃣ Environment Variables:")
gmail_client_id = os.environ.get('GMAIL_CLIENT_ID')
gmail_client_secret = os.environ.get('GMAIL_CLIENT_SECRET')

print(f"   GMAIL_CLIENT_ID: {'✅ SET' if gmail_client_id else '❌ NOT SET'}")
if gmail_client_id:
    print(f"   Value: {gmail_client_id[:10]}...{gmail_client_id[-10:] if len(gmail_client_id) > 20 else gmail_client_id}")

print(f"   GMAIL_CLIENT_SECRET: {'✅ SET' if gmail_client_secret else '❌ NOT SET'}")
if gmail_client_secret:
    print(f"   Value: {gmail_client_secret[:10]}...{gmail_client_secret[-10:] if len(gmail_client_secret) > 20 else gmail_client_secret}")

# Check AWS Secrets Manager
print("\n2️⃣ AWS Secrets Manager:")
try:
    # Initialize AWS clients
    region = os.environ.get('AWS_REGION', 'us-east-1')
    secrets_client = boto3.client('secretsmanager', region_name=region)
    
    # Get the secret
    secret_name = 'patchline/gmail-oauth'
    response = secrets_client.get_secret_value(SecretId=secret_name)
    secret_data = json.loads(response['SecretString'])
    
    print(f"   Secret '{secret_name}': ✅ FOUND")
    print(f"   Keys in secret: {list(secret_data.keys())}")
    
    # Check if we have the required fields
    required_fields = ['access_token', 'refresh_token', 'client_id', 'client_secret']
    for field in required_fields:
        has_field = field in secret_data
        print(f"   {field}: {'✅ PRESENT' if has_field else '❌ MISSING'}")
        
    # Check if client_id from secret matches environment variable
    secret_client_id = secret_data.get('client_id')
    if secret_client_id and gmail_client_id:
        match = secret_client_id == gmail_client_id
        print(f"   Client ID Match (env vs secret): {'✅ MATCH' if match else '❌ MISMATCH'}")
        if not match:
            print(f"     Env: {gmail_client_id}")
            print(f"     Secret: {secret_client_id}")
    
except Exception as e:
    print(f"   ❌ Error checking secret: {str(e)}")

# Summary
print("\n3️⃣ Summary:")
issues = []

if not gmail_client_id:
    issues.append("GMAIL_CLIENT_ID environment variable not set")
if not gmail_client_secret:
    issues.append("GMAIL_CLIENT_SECRET environment variable not set")

if issues:
    print("   ❌ Issues found:")
    for issue in issues:
        print(f"     - {issue}")
    print("\n💡 To fix:")
    print("   1. Check your .env.local file")
    print("   2. Verify Amplify environment variables")
    print("   3. Restart your development server")
else:
    print("   ✅ All checks passed!")

print("\n4️⃣ Test OAuth URL Generation:")
try:
    app_base_url = os.environ.get('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    if gmail_client_id:
        test_params = {
            'client_id': gmail_client_id,
            'redirect_uri': f'{app_base_url}/api/auth/gmail/callback',
            'response_type': 'code',
            'scope': 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            'access_type': 'offline',
            'prompt': 'consent',
            'state': 'test'
        }
        
        from urllib.parse import urlencode
        test_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(test_params)}"
        print("   ✅ Test OAuth URL generated successfully")
        print(f"   URL: {test_url[:100]}...")
    else:
        print("   ❌ Cannot generate test URL - missing client_id")
except Exception as e:
    print(f"   ❌ Error generating test URL: {str(e)}") 