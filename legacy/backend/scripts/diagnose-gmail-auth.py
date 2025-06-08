import os
import sys
import json
import boto3
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local'))

print("🔍 Gmail Authentication Diagnostic Tool")
print("=" * 60)

# Configuration
REGION = 'us-east-1'
SECRET_NAME = 'patchline/gmail-oauth'
USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10'

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)

print(f"\n1️⃣ Checking AWS Secrets Manager...")
print(f"   Secret Name: {SECRET_NAME}")

try:
    # Get the secret
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    secret_data = json.loads(response['SecretString'])
    
    print("   ✅ Secret found successfully")
    print(f"   Version ID: {response.get('VersionId', 'Unknown')}")
    print(f"   Keys in secret: {list(secret_data.keys())}")
    
    # Check if required fields exist
    required_fields = ['access_token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
    missing_fields = [field for field in required_fields if field not in secret_data]
    
    if missing_fields:
        print(f"   ❌ Missing required fields: {missing_fields}")
        sys.exit(1)
    else:
        print("   ✅ All required fields present")
        
except Exception as e:
    print(f"   ❌ Error retrieving secret: {str(e)}")
    sys.exit(1)

print(f"\n2️⃣ Checking DynamoDB connection data...")
table = dynamodb.Table('PlatformConnections-staging')

try:
    response = table.get_item(
        Key={
            'userId': USER_ID,
            'provider': 'gmail'
        }
    )
    
    if 'Item' in response:
        item = response['Item']
        print("   ✅ DynamoDB item found")
        print(f"   Email: {item.get('gmailUserEmail', 'Not found')}")
        print(f"   Last updated: {datetime.fromtimestamp(int(item.get('updatedAt', 0))/1000).strftime('%Y-%m-%d %H:%M:%S') if item.get('updatedAt') else 'Unknown'}")
        
        # Check if tokens match
        db_access_token = item.get('accessToken', '')
        secret_access_token = secret_data.get('access_token', '')
        
        if db_access_token != secret_access_token:
            print("   ⚠️  Access tokens don't match between DynamoDB and Secrets Manager")
    else:
        print("   ❌ No DynamoDB item found for user")
        
except Exception as e:
    print(f"   ❌ Error checking DynamoDB: {str(e)}")

print(f"\n3️⃣ Testing Gmail API connection...")

# Create credentials from secret data
creds = Credentials(
    token=secret_data['access_token'],
    refresh_token=secret_data['refresh_token'],
    token_uri=secret_data['token_uri'],
    client_id=secret_data['client_id'],
    client_secret=secret_data['client_secret'],
    scopes=['https://www.googleapis.com/auth/gmail.readonly']
)

print("   Checking if token needs refresh...")
try:
    # Test if credentials are valid
    if creds.expired or not creds.valid:
        print("   🔄 Token expired or invalid, refreshing...")
        creds.refresh(Request())
        print("   ✅ Token refreshed successfully")
        
        # Update the secret with new access token
        print("\n4️⃣ Updating AWS Secrets Manager with new token...")
        secret_data['access_token'] = creds.token
        if creds.expiry:
            secret_data['expiry'] = creds.expiry.isoformat()
            
        secrets_client.update_secret(
            SecretId=SECRET_NAME,
            SecretString=json.dumps(secret_data)
        )
        print("   ✅ Secret updated with new access token")
        
        # Also update DynamoDB
        print("\n5️⃣ Updating DynamoDB with new token...")
        table.update_item(
            Key={
                'userId': USER_ID,
                'provider': 'gmail'
            },
            UpdateExpression="SET accessToken = :token, updatedAt = :timestamp",
            ExpressionAttributeValues={
                ':token': creds.token,
                ':timestamp': str(int(datetime.now().timestamp() * 1000))
            }
        )
        print("   ✅ DynamoDB updated with new access token")
    else:
        print("   ✅ Token is valid and not expired")
        
except Exception as e:
    print(f"   ❌ Error refreshing token: {str(e)}")
    print("   This might indicate the refresh token is invalid or revoked")

print(f"\n6️⃣ Testing Gmail API call...")
try:
    # Build the Gmail service
    service = build('gmail', 'v1', credentials=creds)
    
    # Try to list messages
    results = service.users().messages().list(
        userId='me',
        maxResults=1,
        q='is:unread'
    ).execute()
    
    print("   ✅ Gmail API call successful!")
    print(f"   Found {results.get('resultSizeEstimate', 0)} unread messages")
    
except Exception as e:
    print(f"   ❌ Gmail API call failed: {str(e)}")
    
print("\n7️⃣ Testing Lambda function...")

# Test the Lambda function
lambda_client = boto3.client('lambda', region_name=REGION)

test_event = {
    "messageVersion": "1.0",
    "actionGroup": "GmailActions",
    "apiPath": "/search-emails",
    "httpMethod": "POST",
    "requestBody": {
        "content": {
            "application/json": {
                "properties": [
                    {
                        "name": "query",
                        "type": "string",
                        "value": "is:unread"
                    }
                ]
            }
        }
    },
    "sessionAttributes": {
        "userId": USER_ID
    }
}

try:
    response = lambda_client.invoke(
        FunctionName='gmail-action-handler',
        InvocationType='RequestResponse',
        Payload=json.dumps(test_event)
    )
    
    response_payload = json.loads(response['Payload'].read())
    status_code = response_payload.get('httpStatusCode', 'Unknown')
    
    print(f"   Lambda response status: {status_code}")
    
    if status_code == 200:
        print("   ✅ Lambda function working correctly")
    else:
        print("   ❌ Lambda function returned error")
        print(f"   Response: {json.dumps(response_payload, indent=2)}")
        
except Exception as e:
    print(f"   ❌ Error invoking Lambda: {str(e)}")

print("\n" + "=" * 60)
print("📊 SUMMARY")
print("=" * 60)

# Print summary and recommendations
print("\nIf you're still seeing 401 errors, try these steps:")
print("1. Re-authenticate Gmail in the web app to get fresh tokens")
print("2. Check that the Lambda function has the correct environment variables")
print("3. Ensure the Lambda has permission to access Secrets Manager")
print("4. Verify the Gmail API is enabled in Google Cloud Console")
print("\nRun this script again after making any changes to verify the fix.") 