import json
import os
import boto3
import logging
from urllib.parse import urlencode
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Services
dynamodb = boto3.resource('dynamodb')
secrets_manager = boto3.client('secretsmanager')

# Environment variables
PLATFORM_CONNECTIONS_TABLE = os.environ.get('PLATFORM_CONNECTIONS_TABLE', 'PlatformConnections-staging')
GMAIL_SECRETS_NAME = os.environ.get('GMAIL_SECRETS_NAME', 'patchline/gmail-oauth')
REDIRECT_URI = os.environ.get('GMAIL_REDIRECT_URI', 'https://www.patchline.ai/api/auth/gmail/callback')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://www.patchline.ai')

# Gmail OAuth scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
]

def get_gmail_credentials():
    """Retrieve Gmail OAuth credentials from Secrets Manager"""
    try:
        response = secrets_manager.get_secret_value(SecretId=GMAIL_SECRETS_NAME)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Error retrieving Gmail credentials: {str(e)}")
        raise

def lambda_handler(event, context):
    """Main Lambda handler for Gmail OAuth flow"""
    try:
        # Parse the event
        path = event.get('path', '')
        method = event.get('httpMethod', '')
        query_params = event.get('queryStringParameters', {}) or {}
        headers = event.get('headers', {}) or {}
        
        # Get user ID from authorization header or query params
        user_id = None
        auth_header = headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            # Extract user ID from token (implement your token validation)
            user_id = extract_user_id_from_token(auth_header[7:])
        elif 'state' in query_params:
            # Extract user ID from state parameter during callback
            state_data = json.loads(query_params.get('state', '{}'))
            user_id = state_data.get('userId')
        
        if not user_id and path != '/auth/gmail/callback':
            return {
                'statusCode': 401,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        # Route handling
        if path == '/auth/gmail/connect' and method == 'GET':
            return handle_auth_initiate(user_id)
        elif path == '/auth/gmail/callback' and method == 'GET':
            return handle_auth_callback(query_params)
        elif path == '/auth/gmail/status' and method == 'GET':
            return handle_auth_status(user_id)
        elif path == '/auth/gmail/disconnect' and method == 'POST':
            return handle_auth_disconnect(user_id)
        else:
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Not found'})
            }
            
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_auth_initiate(user_id):
    """Initiate Gmail OAuth flow"""
    try:
        # Get Gmail credentials
        creds_data = get_gmail_credentials()
        
        # Create flow
        flow = Flow.from_client_config(
            creds_data,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Generate authorization URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=json.dumps({'userId': user_id}),
            prompt='consent'
        )
        
        # Store flow state in DynamoDB
        table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)
        table.put_item(
            Item={
                'userId': user_id,
                'provider': 'gmail_flow',  # Use different provider name for flow state
                'flowState': flow.state,
                'ttl': int((context.aws_request_id + 3600))  # 1 hour TTL
            }
        )
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'authUrl': auth_url
            })
        }
        
    except Exception as e:
        logger.error(f"Error initiating auth: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to initiate authentication'})
        }

def handle_auth_callback(query_params):
    """Handle OAuth callback from Google"""
    try:
        code = query_params.get('code')
        state = query_params.get('state')
        error = query_params.get('error')
        
        if error:
            return {
                'statusCode': 302,
                'headers': {
                    'Location': f"{FRONTEND_URL}/dashboard/settings?error=gmail_auth_denied"
                }
            }
        
        if not code or not state:
            return {
                'statusCode': 302,
                'headers': {
                    'Location': f"{FRONTEND_URL}/dashboard/settings?error=invalid_callback"
                }
            }
        
        # Parse state to get user ID
        state_data = json.loads(state)
        user_id = state_data.get('userId')
        
        # Get Gmail credentials
        creds_data = get_gmail_credentials()
        
        # Create flow and exchange code for tokens
        flow = Flow.from_client_config(
            creds_data,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI,
            state=state
        )
        
        flow.fetch_token(code=code)
        
        # Get credentials
        credentials = flow.credentials
        
        # Store tokens in DynamoDB with composite key
        table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)
        table.put_item(
            Item={
                'userId': user_id,
                'provider': 'gmail',  # Use 'gmail' as the provider for the composite key
                'accessToken': credentials.token,
                'refreshToken': credentials.refresh_token,
                'tokenExpiry': credentials.expiry.isoformat() if credentials.expiry else None,
                'scopes': credentials.scopes,
                'createdAt': context.aws_request_id,
                'updatedAt': context.aws_request_id
            }
        )
        
        # Test the connection by getting user's email
        try:
            service = build('gmail', 'v1', credentials=credentials)
            profile = service.users().getProfile(userId='me').execute()
            email_address = profile.get('emailAddress', '')
            
            # Update record with email using composite key
            table.update_item(
                Key={'userId': user_id, 'provider': 'gmail'},
                UpdateExpression='SET emailAddress = :email',
                ExpressionAttributeValues={':email': email_address}
            )
            
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
        
        # Redirect to frontend success page
        return {
            'statusCode': 302,
            'headers': {
                'Location': f"{FRONTEND_URL}/dashboard/settings?success=gmail_connected"
            }
        }
        
    except Exception as e:
        logger.error(f"Error in auth callback: {str(e)}")
        return {
            'statusCode': 302,
            'headers': {
                'Location': f"{FRONTEND_URL}/dashboard/settings?error=auth_failed"
            }
        }

def handle_auth_status(user_id):
    """Check Gmail connection status"""
    try:
        table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)
        response = table.get_item(Key={'userId': user_id, 'provider': 'gmail'})
        
        if 'Item' not in response:
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'connected': False
                })
            }
        
        item = response['Item']
        
        # Check if token is still valid
        credentials = Credentials(
            token=item.get('accessToken'),
            refresh_token=item.get('refreshToken'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=get_gmail_credentials()['web']['client_id'],
            client_secret=get_gmail_credentials()['web']['client_secret'],
            scopes=item.get('scopes', SCOPES)
        )
        
        # Try to refresh if expired
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
                # Update tokens in DynamoDB with composite key
                table.update_item(
                    Key={'userId': user_id, 'provider': 'gmail'},
                    UpdateExpression='SET accessToken = :token, tokenExpiry = :expiry, updatedAt = :updated',
                    ExpressionAttributeValues={
                        ':token': credentials.token,
                        ':expiry': credentials.expiry.isoformat() if credentials.expiry else None,
                        ':updated': context.aws_request_id
                    }
                )
            except Exception as e:
                logger.error(f"Error refreshing token: {str(e)}")
                return {
                    'statusCode': 200,
                    'headers': get_cors_headers(),
                    'body': json.dumps({
                        'connected': False,
                        'error': 'Token refresh failed'
                    })
                }
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'connected': True,
                'emailAddress': item.get('emailAddress', ''),
                'connectedAt': item.get('createdAt', '')
            })
        }
        
    except Exception as e:
        logger.error(f"Error checking auth status: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to check status'})
        }

def handle_auth_disconnect(user_id):
    """Disconnect Gmail account"""
    try:
        table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)
        table.delete_item(Key={'userId': user_id, 'provider': 'gmail'})
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'success': True,
                'message': 'Gmail disconnected successfully'
            })
        }
        
    except Exception as e:
        logger.error(f"Error disconnecting Gmail: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to disconnect'})
        }

def extract_user_id_from_token(token):
    """Extract user ID from JWT token"""
    # Implement your token validation logic here
    # This is a placeholder - integrate with your actual auth system
    try:
        # For Cognito tokens, you would decode and validate
        # For now, return a placeholder
        return "user-" + token[:10]
    except:
        return None

def get_cors_headers():
    """Get CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    } 