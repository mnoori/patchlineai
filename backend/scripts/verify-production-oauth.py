#!/usr/bin/env python3
"""
Production Gmail OAuth Verification

This script verifies that Gmail OAuth is working correctly in production.
"""

import os
import json
import boto3
import requests
import sys
from dotenv import load_dotenv
from urllib.parse import urlencode

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
if os.path.exists(env_path):
    load_dotenv(env_path)

print("🔍 Production Gmail OAuth Verification")
print("=" * 60)

# Configuration
USER_ID = "14287408-6011-70b3-5ac6-089f0cafdc10"
PRODUCTION_URL = "https://www.patchline.ai"
REGION = 'us-east-1'
SECRET_NAME = 'patchline/gmail-oauth'

gmail_client_id = os.environ.get('GMAIL_CLIENT_ID')

if not gmail_client_id:
    print("❌ GMAIL_CLIENT_ID not found in environment")
    sys.exit(1)

# Test Results
tests_passed = 0
total_tests = 0

def test_result(test_name, passed, details=""):
    global tests_passed, total_tests
    total_tests += 1
    if passed:
        tests_passed += 1
        print(f"   ✅ {test_name}")
        if details:
            print(f"      {details}")
    else:
        print(f"   ❌ {test_name}")
        if details:
            print(f"      {details}")

print(f"Production URL: {PRODUCTION_URL}")
print(f"User ID: {USER_ID}")
print(f"Client ID: {gmail_client_id[:10]}...{gmail_client_id[-10:]}")

# Test 1: AWS Resources
print("\n1️⃣ AWS Resources Check:")
try:
    # Check Secrets Manager
    secrets_client = boto3.client('secretsmanager', region_name=REGION)
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    secret_data = json.loads(response['SecretString'])
    
    test_result("Secrets Manager", True, f"Secret has {len(secret_data)} keys")
    
    # Check DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table('PlatformConnections-staging')
    table.load()
    
    test_result("DynamoDB Table", True, "PlatformConnections-staging accessible")
    
    # Check Lambda functions
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    try:
        response = lambda_client.get_function(FunctionName='gmail-action-handler')
        test_result("Lambda gmail-action-handler", True, "Function exists and accessible")
    except:
        test_result("Lambda gmail-action-handler", False, "Function not found")
    
    try:
        response = lambda_client.get_function(FunctionName='gmail-auth-handler')
        test_result("Lambda gmail-auth-handler", True, "Function exists and accessible")
    except:
        test_result("Lambda gmail-auth-handler", False, "Function not found (optional)")
        
except Exception as e:
    test_result("AWS Resources", False, f"Error: {str(e)}")

# Test 2: Production OAuth URL Generation
print("\n2️⃣ Production OAuth URL Test:")
try:
    oauth_params = {
        'client_id': gmail_client_id,
        'redirect_uri': f'{PRODUCTION_URL}/api/auth/gmail/callback',
        'response_type': 'code',
        'scope': 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        'access_type': 'offline',
        'prompt': 'consent',
        'state': 'production_test'
    }
    
    oauth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(oauth_params)}"
    test_result("OAuth URL Generation", True, f"Generated {len(oauth_url)} character URL")
    
    # Validate URL format
    has_client_id = f'client_id={gmail_client_id}' in oauth_url
    has_redirect = f'redirect_uri={PRODUCTION_URL}' in oauth_url
    test_result("URL Parameters", has_client_id and has_redirect, "Client ID and redirect URI correct")
    
except Exception as e:
    test_result("OAuth URL Generation", False, f"Error: {str(e)}")

# Test 3: Google Cloud Console Configuration
print("\n3️⃣ Google Cloud Console Check:")
print("   📋 Manual verification required:")
print(f"   1. Visit: https://console.cloud.google.com/apis/credentials")
print(f"   2. Find your OAuth 2.0 Client: {gmail_client_id}")
print(f"   3. Verify redirect URIs include:")
print(f"      - http://localhost:3000/api/auth/gmail/callback")
print(f"      - https://www.patchline.ai/api/auth/gmail/callback")
print(f"   4. Verify test users include: mehdi@patchline.ai")

# Test 4: Production Endpoint Accessibility
print("\n4️⃣ Production Endpoint Test:")
try:
    # Test if production domain is accessible
    response = requests.head(PRODUCTION_URL, timeout=10)
    test_result("Production Domain", response.status_code == 200, f"Status: {response.status_code}")
    
    # Test OAuth connect endpoint (expect redirect)
    connect_url = f"{PRODUCTION_URL}/api/auth/gmail/connect?userId={USER_ID}"
    response = requests.head(connect_url, timeout=10, allow_redirects=False)
    
    # Should redirect (3xx) or return 200/405
    is_accessible = response.status_code in [200, 302, 405, 301]
    test_result("OAuth Connect Endpoint", is_accessible, f"Status: {response.status_code}")
    
except requests.RequestException as e:
    test_result("Production Endpoints", False, f"Connection error: {str(e)}")

# Test 5: Environment Variables Check
print("\n5️⃣ Environment Variables:")
local_vars = {
    'GMAIL_CLIENT_ID': os.environ.get('GMAIL_CLIENT_ID'),
    'GMAIL_CLIENT_SECRET': os.environ.get('GMAIL_CLIENT_SECRET'),
    'NEXT_PUBLIC_APP_URL': os.environ.get('NEXT_PUBLIC_APP_URL'),
}

for var_name, var_value in local_vars.items():
    test_result(f"Local {var_name}", bool(var_value), "Set locally" if var_value else "Missing")

print(f"\n   📋 Amplify Environment Variables to verify:")
print(f"   - GMAIL_CLIENT_ID = {gmail_client_id}")
print(f"   - GMAIL_CLIENT_SECRET = [HIDDEN]")
print(f"   - NEXT_PUBLIC_APP_URL = https://www.patchline.ai")

# Summary
print(f"\n📊 Verification Summary:")
print(f"   Tests Passed: {tests_passed}/{total_tests}")
success_rate = (tests_passed / total_tests) * 100 if total_tests > 0 else 0
print(f"   Success Rate: {success_rate:.1f}%")

if success_rate >= 80:
    print("\n✅ Production Gmail OAuth looks ready!")
    print("   Most components are working correctly.")
    print("   Manual testing recommended.")
elif success_rate >= 60:
    print("\n⚠️ Production Gmail OAuth has some issues:")
    print("   Some components may need attention.")
    print("   Check failed tests above.")
else:
    print("\n❌ Production Gmail OAuth has significant issues:")
    print("   Multiple components need fixing.")
    print("   Address failures before proceeding.")

print("\n🧪 Manual Testing Steps:")
print("=" * 30)
print("1. Visit production settings page:")
print(f"   {PRODUCTION_URL}/dashboard/settings")
print("")
print("2. Click 'Connect' next to Gmail")
print("")
print("3. Complete OAuth flow and verify success")
print("")
print("4. Test email functionality through Bedrock agent")

print("\n🔗 Direct OAuth Test URL:")
print("=" * 30)
if 'oauth_url' in locals():
    print(f"{oauth_url}")
    print("\nCopy this URL and test it manually in your browser.")

print(f"\n🎯 Next Steps:")
if success_rate >= 80:
    print("   ✅ Ready to test production OAuth flow!")
    print("   ✅ Monitor CloudWatch logs during testing")
else:
    print("   🔧 Fix failed tests above")
    print("   🔧 Re-run verification after fixes")
    print("   🔧 Check Amplify build logs for errors") 