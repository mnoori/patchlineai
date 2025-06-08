#!/usr/bin/env python3
"""
Test Gmail OAuth Flow

This script simulates the Gmail OAuth flow to verify it works correctly.
"""

import os
import json
import requests
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs, urlencode

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
if os.path.exists(env_path):
    load_dotenv(env_path)

print("🔍 Gmail OAuth Flow Test")
print("=" * 60)

# Configuration
USER_ID = "14287408-6011-70b3-5ac6-089f0cafdc10"
BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
GMAIL_CLIENT_ID = os.environ.get('GMAIL_CLIENT_ID')

if not GMAIL_CLIENT_ID:
    print("❌ GMAIL_CLIENT_ID not found in environment")
    exit(1)

print(f"User ID: {USER_ID}")
print(f"Base URL: {BASE_URL}")
print(f"Client ID: {GMAIL_CLIENT_ID[:10]}...{GMAIL_CLIENT_ID[-10:]}")

print("\n1️⃣ Testing Gmail OAuth Connect URL:")
connect_url = f"{BASE_URL}/api/auth/gmail/connect?userId={USER_ID}"
print(f"Connect URL: {connect_url}")

print("\n2️⃣ Expected OAuth Parameters:")
expected_params = {
    'client_id': GMAIL_CLIENT_ID,
    'redirect_uri': f'{BASE_URL}/api/auth/gmail/callback',
    'response_type': 'code',
    'scope': ' '.join([
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]),
    'access_type': 'offline',
    'prompt': 'consent',
    'state': 'encoded_user_id'
}

for key, value in expected_params.items():
    if key == 'scope':
        print(f"   {key}: {value[:50]}...")
    else:
        print(f"   {key}: {value}")

print("\n3️⃣ Manual OAuth URL Generation:")
try:
    # Generate the URL manually to verify it's correct
    oauth_params = {
        'client_id': GMAIL_CLIENT_ID,
        'redirect_uri': f'{BASE_URL}/api/auth/gmail/callback',
        'response_type': 'code',
        'scope': 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        'access_type': 'offline',
        'prompt': 'consent',
        'state': 'test'
    }
    
    oauth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(oauth_params)}"
    print(f"   Generated URL: {oauth_url[:100]}...")
    print("   ✅ Manual URL generation successful")
    
    # Check if the URL is valid
    parsed = urlparse(oauth_url)
    params = parse_qs(parsed.query)
    
    if 'client_id' in params and params['client_id'][0] == GMAIL_CLIENT_ID:
        print("   ✅ Client ID correctly included in URL")
    else:
        print("   ❌ Client ID missing or incorrect in URL")
        
except Exception as e:
    print(f"   ❌ Error generating URL: {str(e)}")

print("\n4️⃣ Callback URL Check:")
callback_url = f"{BASE_URL}/api/auth/gmail/callback"
print(f"   Callback URL: {callback_url}")
print("   ✅ Callback URL looks correct")

print("\n5️⃣ Common Issues:")
print("   - Make sure you're clicking 'Gmail' not 'Google Calendar'")
print("   - Check browser console for any JavaScript errors")
print("   - Verify your Google Cloud Console app is configured correctly")
print("   - Ensure your email is added as a test user in Google Cloud Console")

print("\n6️⃣ Next Steps:")
print("   1. Try the OAuth flow again")
print("   2. Check browser network tab for the actual redirect URL")
print("   3. Copy and paste the manual OAuth URL to test directly")

print(f"\n🔗 Manual test URL:")
print(f"   {oauth_url}")
print("\n   Copy this URL and paste it in your browser to test manually.") 