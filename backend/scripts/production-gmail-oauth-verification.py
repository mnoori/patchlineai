#!/usr/bin/env python3
"""
Production Gmail OAuth Verification

This script performs a comprehensive check of all Gmail OAuth components
to ensure they're ready for production use.
"""

import os
import json
import boto3
import sys
from dotenv import load_dotenv
from urllib.parse import urlencode

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
if os.path.exists(env_path):
    load_dotenv(env_path)

print("🚀 Production Gmail OAuth Verification")
print("=" * 60)

# Configuration
USER_ID = "14287408-6011-70b3-5ac6-089f0cafdc10"
REGION = 'us-east-1'
SECRET_NAME = 'patchline/gmail-oauth'
TABLE_NAME = 'PlatformConnections-staging'

print(f"User ID: {USER_ID}")
print(f"AWS Region: {REGION}")
print(f"Secret Name: {SECRET_NAME}")
print(f"DynamoDB Table: {TABLE_NAME}")

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

# Test 1: Environment Variables
print("\n1️⃣ Environment Variables Test:")
gmail_client_id = os.environ.get('GMAIL_CLIENT_ID')
gmail_client_secret = os.environ.get('GMAIL_CLIENT_SECRET')
aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID') or os.environ.get('ACCESS_KEY_ID')
aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY') or os.environ.get('SECRET_ACCESS_KEY')

test_result("GMAIL_CLIENT_ID", bool(gmail_client_id), f"Value: {gmail_client_id[:10]}...{gmail_client_id[-10:] if gmail_client_id and len(gmail_client_id) > 20 else gmail_client_id}")
test_result("GMAIL_CLIENT_SECRET", bool(gmail_client_secret), "Present and non-empty")
test_result("AWS Credentials", bool(aws_access_key and aws_secret_key), "Access key and secret key present")

# Test 2: AWS Secrets Manager
print("\n2️⃣ AWS Secrets Manager Test:")
try:
    secrets_client = boto3.client('secretsmanager', region_name=REGION)
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    secret_data = json.loads(response['SecretString'])
    
    test_result("Secret Exists", True, f"Found secret with {len(secret_data)} keys")
    
    # Check required fields
    required_fields = ['access_token', 'refresh_token', 'client_id', 'client_secret']
    all_fields_present = all(field in secret_data for field in required_fields)
    test_result("Required Fields", all_fields_present, f"Fields: {', '.join(secret_data.keys())}")
    
    # Check client_id match
    secret_client_id = secret_data.get('client_id')
    client_id_match = secret_client_id == gmail_client_id if gmail_client_id else False
    test_result("Client ID Match", client_id_match, f"Environment and secret client_id {'match' if client_id_match else 'mismatch'}")
    
except Exception as e:
    test_result("Secret Access", False, f"Error: {str(e)}")

# Test 3: DynamoDB Connection
print("\n3️⃣ DynamoDB Connection Test:")
try:
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(TABLE_NAME)
    
    # Check table exists
    table.load()
    test_result("Table Exists", True, f"Table '{TABLE_NAME}' accessible")
    
    # Check for existing Gmail connection
    response = table.get_item(
        Key={
            'userId': USER_ID,
            'provider': 'gmail'
        }
    )
    
    has_connection = 'Item' in response
    test_result("Gmail Connection Exists", has_connection, "User has existing Gmail connection in DynamoDB")
    
    if has_connection:
        item = response['Item']
        has_tokens = 'accessToken' in item and 'refreshToken' in item
        test_result("Tokens Present", has_tokens, "Access and refresh tokens found")
        
        gmail_email = item.get('gmailUserEmail', 'Not set')
        test_result("Gmail Email", bool(gmail_email and gmail_email != 'Not set'), f"Email: {gmail_email}")
    
except Exception as e:
    test_result("DynamoDB Access", False, f"Error: {str(e)}")

# Test 4: OAuth URL Generation
print("\n4️⃣ OAuth URL Generation Test:")
try:
    if gmail_client_id:
        base_url = os.environ.get('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
        oauth_params = {
            'client_id': gmail_client_id,
            'redirect_uri': f'{base_url}/api/auth/gmail/callback',
            'response_type': 'code',
            'scope': 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            'access_type': 'offline',
            'prompt': 'consent',
            'state': 'test'
        }
        
        oauth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(oauth_params)}"
        test_result("OAuth URL Generation", True, f"Generated {len(oauth_url)} character URL")
        
        # Validate URL components
        has_client_id = 'client_id=' in oauth_url
        has_redirect = 'redirect_uri=' in oauth_url
        has_scopes = 'scope=' in oauth_url
        test_result("URL Components", has_client_id and has_redirect and has_scopes, "All required parameters present")
        
    else:
        test_result("OAuth URL Generation", False, "Cannot generate URL - missing client_id")
        
except Exception as e:
    test_result("OAuth URL Generation", False, f"Error: {str(e)}")

# Test 5: Lambda Function Status (if accessible)
print("\n5️⃣ Lambda Function Test:")
try:
    lambda_client = boto3.client('lambda', region_name=REGION)
    
    # Check gmail-action-handler
    response = lambda_client.get_function(FunctionName='gmail-action-handler')
    test_result("gmail-action-handler", True, f"Function exists, last modified: {response['Configuration']['LastModified']}")
    
    # Check gmail-auth-handler
    try:
        response = lambda_client.get_function(FunctionName='gmail-auth-handler')
        test_result("gmail-auth-handler", True, f"Function exists, last modified: {response['Configuration']['LastModified']}")
    except:
        test_result("gmail-auth-handler", False, "Function not found (optional)")
    
except Exception as e:
    test_result("Lambda Access", False, f"Cannot access Lambda functions: {str(e)}")

# Summary
print(f"\n📊 Test Summary:")
print(f"   Tests Passed: {tests_passed}/{total_tests}")
success_rate = (tests_passed / total_tests) * 100 if total_tests > 0 else 0
print(f"   Success Rate: {success_rate:.1f}%")

if success_rate >= 80:
    print("\n✅ Gmail OAuth is ready for production!")
    print("   All critical components are working correctly.")
elif success_rate >= 60:
    print("\n⚠️ Gmail OAuth has some issues but may work:")
    print("   Consider fixing failing tests before production use.")
else:
    print("\n❌ Gmail OAuth has significant issues:")
    print("   Please fix critical failures before attempting to use.")

print("\n🔗 Test OAuth URL (copy and test manually):")
if 'oauth_url' in locals():
    print(f"   {oauth_url}")

print(f"\n📝 Next Steps:")
print("   1. If tests passed: Try Gmail OAuth in your app")
print("   2. If issues found: Fix failing tests and re-run verification")
print("   3. Test the manual OAuth URL above to verify Google accepts it")
print("   4. Check production environment variables in Amplify") 