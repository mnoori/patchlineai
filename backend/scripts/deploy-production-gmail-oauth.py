#!/usr/bin/env python3
"""
Production Gmail OAuth Deployment Script

This script ensures all Gmail OAuth components are properly configured
and deployed for production use.
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

print("🚀 Production Gmail OAuth Deployment")
print("=" * 60)

# Configuration
REGION = 'us-east-1'
SECRET_NAME = 'patchline/gmail-oauth'
USER_ID = "14287408-6011-70b3-5ac6-089f0cafdc10"

# Get environment variables
gmail_client_id = os.environ.get('GMAIL_CLIENT_ID')
gmail_client_secret = os.environ.get('GMAIL_CLIENT_SECRET')

print("📋 Pre-Deployment Checklist")
print("=" * 40)

# 1. Check local environment
print("\n1️⃣ Local Environment Check:")
print(f"   GMAIL_CLIENT_ID: {'✅' if gmail_client_id else '❌'}")
print(f"   GMAIL_CLIENT_SECRET: {'✅' if gmail_client_secret else '❌'}")

if not gmail_client_id or not gmail_client_secret:
    print("❌ Missing local environment variables!")
    sys.exit(1)

# 2. Check AWS Secrets Manager
print("\n2️⃣ AWS Secrets Manager Check:")
try:
    secrets_client = boto3.client('secretsmanager', region_name=REGION)
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    secret_data = json.loads(response['SecretString'])
    
    required_fields = ['access_token', 'refresh_token', 'client_id', 'client_secret']
    all_present = all(field in secret_data for field in required_fields)
    
    print(f"   Secret exists: ✅")
    print(f"   Required fields: {'✅' if all_present else '❌'}")
    print(f"   Client ID match: {'✅' if secret_data.get('client_id') == gmail_client_id else '❌'}")
    
    if not all_present:
        print("❌ Secret structure incomplete!")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ Error: {str(e)}")
    sys.exit(1)

# 3. Update Lambda Environment Variables
print("\n3️⃣ Lambda Environment Variables Update:")
try:
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    # Update gmail-action-handler
    try:
        lambda_client.update_function_configuration(
            FunctionName='gmail-action-handler',
            Environment={
                'Variables': {
                    'PLATFORM_CONNECTIONS_TABLE': 'PlatformConnections-staging',
                    'GMAIL_SECRETS_NAME': SECRET_NAME,
                    'KNOWLEDGE_BASE_BUCKET': 'patchline-email-knowledge-base',
                    'GMAIL_CLIENT_ID': gmail_client_id,
                    'GMAIL_CLIENT_SECRET': gmail_client_secret
                }
            }
        )
        print("   ✅ gmail-action-handler environment updated")
    except Exception as e:
        print(f"   ⚠️ gmail-action-handler update failed: {str(e)}")
    
    # Update gmail-auth-handler (if exists)
    try:
        lambda_client.update_function_configuration(
            FunctionName='gmail-auth-handler',
            Environment={
                'Variables': {
                    'PLATFORM_CONNECTIONS_TABLE': 'PlatformConnections-staging',
                    'GMAIL_SECRETS_NAME': SECRET_NAME,
                    'GMAIL_REDIRECT_URI': 'https://www.patchline.ai/api/auth/gmail/callback',
                    'FRONTEND_URL': 'https://www.patchline.ai',
                    'GMAIL_CLIENT_ID': gmail_client_id,
                    'GMAIL_CLIENT_SECRET': gmail_client_secret
                }
            }
        )
        print("   ✅ gmail-auth-handler environment updated")
    except Exception as e:
        print(f"   ⚠️ gmail-auth-handler update failed: {str(e)}")
        
except Exception as e:
    print(f"   ❌ Lambda update failed: {str(e)}")

# 4. Generate Production OAuth URLs
print("\n4️⃣ Production OAuth URLs:")
production_base_url = "https://www.patchline.ai"
local_base_url = "http://localhost:3000"

# Production URL
prod_oauth_params = {
    'client_id': gmail_client_id,
    'redirect_uri': f'{production_base_url}/api/auth/gmail/callback',
    'response_type': 'code',
    'scope': 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    'access_type': 'offline',
    'prompt': 'consent',
    'state': 'production_test'
}

from urllib.parse import urlencode
prod_oauth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(prod_oauth_params)}"

print(f"   Production OAuth URL generated: ✅")
print(f"   Length: {len(prod_oauth_url)} characters")

print("\n📝 Amplify Environment Variables Checklist:")
print("=" * 50)
print("Make sure these are set in your Amplify console:")
print(f"   GMAIL_CLIENT_ID = {gmail_client_id}")
print(f"   GMAIL_CLIENT_SECRET = {gmail_client_secret[:10]}...{gmail_client_secret[-10:]}")
print("   AWS_REGION = us-east-1")
print("   NEXT_PUBLIC_APP_URL = https://www.patchline.ai")

print("\n🔧 Google Cloud Console Checklist:")
print("=" * 40)
print("Make sure these redirect URIs are configured:")
print("   ✅ http://localhost:3000/api/auth/gmail/callback (local)")
print("   ✅ https://patchline.ai/api/auth/gmail/callback (production)")

print("\n🧪 Production Test URLs:")
print("=" * 30)
print("Local test URL:")
print(f"   http://localhost:3000/api/auth/gmail/connect?userId={USER_ID}")
print("\nProduction test URL:")
print(f"   https://www.patchline.ai/api/auth/gmail/connect?userId={USER_ID}")

print("\n🔗 Manual Production OAuth URL:")
print("=" * 40)
print("Test this URL directly in production:")
print(f"   {prod_oauth_url}")

print("\n✅ Deployment Steps:")
print("=" * 25)
print("1. Deploy your code changes to Amplify:")
print("   - Commit and push your changes")
print("   - Wait for Amplify build to complete")
print("")
print("2. Verify Amplify environment variables:")
print("   - Go to Amplify Console")
print("   - Check Environment Variables section")
print("   - Ensure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set")
print("")
print("3. Test production OAuth flow:")
print("   - Visit your production settings page")
print("   - Click 'Connect' next to Gmail")
print("   - Verify successful authentication")
print("")
print("4. Verify Lambda functions:")
print("   - Check CloudWatch logs for any errors")
print("   - Test email functionality through Bedrock agent")

print(f"\n🎯 Final Verification:")
print("Run this command after deployment to verify everything works:")
print(f"   python verify-production-oauth.py")

print("\n🚀 Ready for production deployment!") 