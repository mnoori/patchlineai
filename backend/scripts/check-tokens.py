#!/usr/bin/env python3
"""Check current tokens in DynamoDB"""

import boto3
import json
from datetime import datetime

print("🔍 Checking current tokens in DynamoDB...")

# Configuration
USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10'
REGION = 'us-east-1'

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table('PlatformConnections-staging')

try:
    response = table.get_item(
        Key={
            'userId': USER_ID,
            'provider': 'gmail'
        }
    )
    
    if 'Item' not in response:
        print("❌ No Gmail connection found for user")
        exit(1)
        
    item = response['Item']
    
    print("\n📊 Current DynamoDB Data:")
    print(f"   Email: {item.get('gmailUserEmail', 'Not found')}")
    print(f"   Created: {datetime.fromtimestamp(int(item.get('createdAt', 0))/1000).strftime('%Y-%m-%d %H:%M:%S') if item.get('createdAt') else 'Unknown'}")
    print(f"   Updated: {datetime.fromtimestamp(int(item.get('updatedAt', 0))/1000).strftime('%Y-%m-%d %H:%M:%S') if item.get('updatedAt') else 'Unknown'}")
    
    # Check token freshness
    access_token = item.get('accessToken', '')
    refresh_token = item.get('refreshToken', '')
    
    print(f"\n🔑 Token Status:")
    print(f"   Has access token: {'Yes' if access_token else 'No'}")
    print(f"   Access token starts with: {access_token[:20]}..." if access_token else "   No access token")
    print(f"   Has refresh token: {'Yes' if refresh_token else 'No'}")
    print(f"   Refresh token starts with: {refresh_token[:20]}..." if refresh_token else "   No refresh token")
    
    # Check if tokens look fresh (updated recently)
    if item.get('updatedAt'):
        updated_timestamp = int(item.get('updatedAt')) / 1000
        time_diff = datetime.now().timestamp() - updated_timestamp
        hours_ago = time_diff / 3600
        
        if hours_ago < 1:
            print(f"   ✅ Tokens updated {hours_ago:.1f} hours ago (FRESH)")
        elif hours_ago < 24:
            print(f"   ⚠️  Tokens updated {hours_ago:.1f} hours ago")
        else:
            days_ago = hours_ago / 24
            print(f"   ❌ Tokens updated {days_ago:.1f} days ago (STALE)")
    
    print(f"\n📋 Full Item (for debugging):")
    # Hide sensitive tokens in output
    safe_item = item.copy()
    if 'accessToken' in safe_item:
        safe_item['accessToken'] = safe_item['accessToken'][:20] + "..." if safe_item['accessToken'] else None
    if 'refreshToken' in safe_item:
        safe_item['refreshToken'] = safe_item['refreshToken'][:20] + "..." if safe_item['refreshToken'] else None
    
    print(json.dumps(safe_item, indent=2, default=str))
    
except Exception as e:
    print(f"❌ Error checking tokens: {str(e)}")
    exit(1)

print("\n" + "=" * 60)
print("NEXT STEPS:")
print("=" * 60)
print("If tokens are STALE:")
print("1. Go to your web app and re-authenticate Gmail")
print("2. Run this script again to confirm tokens are fresh") 
print("3. Run 'python fix-secret-structure.py' to update Secrets Manager")
print("4. Test with 'python diagnose-gmail-auth.py'") 