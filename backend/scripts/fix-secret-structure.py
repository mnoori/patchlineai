import boto3
import json
from datetime import datetime

print("🔧 Fixing AWS Secrets Manager Structure")
print("=" * 60)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

SECRET_NAME = 'patchline/gmail-oauth'
USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10'

print("\n1️⃣ Getting current secret...")
try:
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    current_secret = json.loads(response['SecretString'])
    
    print(f"   Current structure: {list(current_secret.keys())}")
    
    # Check if it's the wrong structure (nested under 'web')
    if 'web' in current_secret and isinstance(current_secret['web'], dict):
        print("   ⚠️  Found nested 'web' structure - this needs to be fixed")
        web_data = current_secret['web']
        print(f"   Keys under 'web': {list(web_data.keys())}")
    else:
        print("   ❌ Unexpected secret structure")
        print(f"   Full secret: {json.dumps(current_secret, indent=2)}")
        
except Exception as e:
    print(f"   ❌ Error getting secret: {str(e)}")
    exit(1)

print("\n2️⃣ Getting OAuth tokens from DynamoDB...")
table = dynamodb.Table('PlatformConnections-staging')

try:
    response = table.get_item(
        Key={
            'userId': USER_ID,
            'provider': 'gmail'
        }
    )
    
    if 'Item' not in response:
        print("   ❌ No DynamoDB item found for user")
        exit(1)
        
    item = response['Item']
    print("   ✅ Found DynamoDB item")
    print(f"   Email: {item.get('gmailUserEmail', 'Not found')}")
    print(f"   Has access token: {'accessToken' in item}")
    print(f"   Has refresh token: {'refreshToken' in item}")
    
    # Extract OAuth data
    access_token = item.get('accessToken')
    refresh_token = item.get('refreshToken')
    
    if not access_token or not refresh_token:
        print("   ❌ Missing tokens in DynamoDB")
        exit(1)
        
except Exception as e:
    print(f"   ❌ Error getting DynamoDB data: {str(e)}")
    exit(1)

print("\n3️⃣ Creating proper secret structure...")

# Get OAuth client config from the 'web' key if it exists
if 'web' in current_secret:
    client_config = current_secret['web']
else:
    # If no web key, assume the current secret might have the client config
    client_config = current_secret

# Create the proper secret structure
new_secret = {
    'access_token': access_token,
    'refresh_token': refresh_token,
    'token_uri': client_config.get('token_uri', 'https://oauth2.googleapis.com/token'),
    'client_id': client_config.get('client_id'),
    'client_secret': client_config.get('client_secret'),
    'scopes': ['https://www.googleapis.com/auth/gmail.readonly',
               'https://www.googleapis.com/auth/gmail.modify',
               'https://www.googleapis.com/auth/gmail.compose',
               'https://www.googleapis.com/auth/gmail.send'],
    'type': 'authorized_user',
    'email': item.get('gmailUserEmail', '')
}

# Check if we have all required fields
required_fields = ['access_token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
missing_fields = [field for field in required_fields if not new_secret.get(field)]

if missing_fields:
    print(f"   ❌ Missing required fields: {missing_fields}")
    print("\n   Current client config:")
    print(json.dumps(client_config, indent=2))
    print("\n   You may need to get the client_id and client_secret from your Google Cloud Console")
    exit(1)

print("   ✅ New secret structure created with all required fields")

print("\n4️⃣ Updating AWS Secrets Manager...")

try:
    secrets_client.update_secret(
        SecretId=SECRET_NAME,
        SecretString=json.dumps(new_secret)
    )
    print("   ✅ Secret updated successfully!")
    
    # Verify the update
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    updated_secret = json.loads(response['SecretString'])
    
    print("\n5️⃣ Verifying update...")
    print(f"   Keys in updated secret: {list(updated_secret.keys())}")
    print("   ✅ Secret structure fixed!")
    
except Exception as e:
    print(f"   ❌ Error updating secret: {str(e)}")
    exit(1)

print("\n" + "=" * 60)
print("✅ SECRET STRUCTURE FIXED SUCCESSFULLY!")
print("=" * 60)
print("\nNext steps:")
print("1. Run 'python diagnose-gmail-auth.py' to test the authentication")
print("2. The Lambda function should now work correctly")
print("3. Test the agent in the web app") 