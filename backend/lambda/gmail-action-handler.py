import json
import os
import boto3
import logging
import base64
from datetime import datetime
from typing import Dict, List, Any, Union
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Services
dynamodb = boto3.resource('dynamodb')
secrets_manager = boto3.client('secretsmanager')
s3_client = boto3.client('s3')

# Environment variables
PLATFORM_CONNECTIONS_TABLE = os.environ.get('PLATFORM_CONNECTIONS_TABLE', 'PlatformConnections-staging')
GMAIL_SECRETS_NAME = os.environ.get('GMAIL_SECRETS_NAME', 'patchline/gmail-oauth')
KNOWLEDGE_BASE_BUCKET = os.environ.get('KNOWLEDGE_BASE_BUCKET', 'patchline-email-knowledge-base')

def get_gmail_credentials():
    """Retrieve Gmail OAuth credentials from Secrets Manager"""
    try:
        response = secrets_manager.get_secret_value(SecretId=GMAIL_SECRETS_NAME)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Error retrieving Gmail credentials: {str(e)}")
        raise

def parse_scopes(scopes_data: Union[str, List[str]]) -> List[str]:
    """Parse scopes whether they're stored as string or list"""
    default_scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send'
    ]
    
    if not scopes_data:
        return default_scopes
    
    # If it's already a list, return it
    if isinstance(scopes_data, list):
        return scopes_data
    
    # If it's a string, try to parse it
    if isinstance(scopes_data, str):
        # Check if it's a JSON array string
        if scopes_data.startswith('['):
            try:
                parsed = json.loads(scopes_data)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        
        # Check if it's a space-separated string of scopes
        if 'https://' in scopes_data:
            # Split by spaces and filter out empty strings
            return [s.strip() for s in scopes_data.split() if s.strip()]
        
        # If it's a single scope URL
        if scopes_data.startswith('https://'):
            return [scopes_data]
    
    # If we can't parse it, return default scopes
    logger.warning(f"Could not parse scopes: {scopes_data}, using defaults")
    return default_scopes

def get_user_gmail_service(user_id: str):
    """Get authenticated Gmail service for a user"""
    try:
        # Get user's tokens from DynamoDB
        table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)
        
        # Get Gmail connection using get_item with composite key
        response = table.get_item(
            Key={
                'userId': user_id,
                'provider': 'gmail'
            }
        )
        
        if 'Item' not in response:
            raise Exception(f"No Gmail connection found for user {user_id}")
        
        item = response['Item']
        logger.info(f"DynamoDB item for user {user_id}: {json.dumps(item, default=str)}")
        
        # Parse scopes properly
        scopes_data = item.get('scopes')
        scopes = parse_scopes(scopes_data)
        logger.info(f"Parsed scopes: {scopes}")
        
        # Create credentials
        creds_data = get_gmail_credentials()
        credentials = Credentials(
            token=item.get('accessToken'),
            refresh_token=item.get('refreshToken'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=creds_data['web']['client_id'],
            client_secret=creds_data['web']['client_secret'],
            scopes=scopes
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            logger.info("Refreshing expired credentials")
            credentials.refresh(Request())
            # Update tokens in DynamoDB
            table.update_item(
                Key={'userId': user_id, 'provider': 'gmail'},
                UpdateExpression='SET accessToken = :token, tokenExpiry = :expiry, updatedAt = :updated',
                ExpressionAttributeValues={
                    ':token': credentials.token,
                    ':expiry': credentials.expiry.isoformat() if credentials.expiry else None,
                    ':updated': datetime.utcnow().isoformat()
                }
            )
            logger.info("Updated tokens in DynamoDB")
        
        # Build and return Gmail service
        return build('gmail', 'v1', credentials=credentials)
        
    except Exception as e:
        logger.error(f"Error getting Gmail service: {str(e)}")
        raise

def lambda_handler(event, context):
    """Main Lambda handler for Bedrock Agent actions"""
    try:
        # Critical Debug Logging - Track Environment vs Event
        logger.info(f"[DEBUG] === LAMBDA ENV VARS ===")
        logger.info(f"[DEBUG] ENV BEDROCK_AGENT_ID: {os.environ.get('BEDROCK_AGENT_ID', 'NOT_SET')}")
        logger.info(f"[DEBUG] ENV BEDROCK_AGENT_ALIAS_ID: {os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'NOT_SET')}")
        
        logger.info(f"[DEBUG] === EVENT DATA ===")
        logger.info(f"Event: {json.dumps(event)}")
        
        # Log agent information for debugging
        agent_info = event.get('agent', {})
        logger.info(f"[DEBUG] EVENT Agent ID: {agent_info.get('id', 'NOT_SET')}")
        logger.info(f"[DEBUG] EVENT Agent Alias: {agent_info.get('alias', 'NOT_SET')}")
        logger.info(f"[DEBUG] EVENT Agent Name: {agent_info.get('name', 'NOT_SET')}")
        logger.info(f"[DEBUG] EVENT Agent Version: {agent_info.get('version', 'NOT_SET')}")
        
        # Extract action details from Bedrock Agent event
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        parameters = event.get('parameters', {})
        request_body = event.get('requestBody', {})
        
        # Log the extracted values
        logger.info(f"Action Group: {action_group}")
        logger.info(f"API Path: {api_path}")
        logger.info(f"HTTP Method: {http_method}")
        logger.info(f"Request Body: {json.dumps(request_body)}")
        
        # Try to extract user ID from multiple possible locations
        user_id = None
        
        # Method 1: Direct sessionAttributes
        session_attributes = event.get('sessionAttributes', {})
        if session_attributes:
            user_id = session_attributes.get('userId')
            logger.info(f"Session Attributes found: {json.dumps(session_attributes)}")
        
        # Method 2: Check in sessionState
        if not user_id and 'sessionState' in event:
            session_state = event.get('sessionState', {})
            session_attrs_in_state = session_state.get('sessionAttributes', {})
            if session_attrs_in_state:
                user_id = session_attrs_in_state.get('userId')
                logger.info(f"Session State Attributes found: {json.dumps(session_attrs_in_state)}")
        
        # Method 3: Check in agent object
        if not user_id and 'agent' in event:
            agent_info = event.get('agent', {})
            logger.info(f"Agent info: {json.dumps(agent_info)}")
        
        # Method 4: Check in inputText or other fields
        if not user_id:
            logger.info(f"Full event keys: {list(event.keys())}")
            # Log any other potential fields
            for key in ['sessionId', 'inputText', 'messageVersion']:
                if key in event:
                    logger.info(f"{key}: {event.get(key)}")
        
        logger.info(f"Final User ID: {user_id}")
        
        if not user_id:
            logger.error("User ID not found in any expected location")
            logger.error(f"Event structure: {json.dumps(event, indent=2)}")
            return create_response(400, {'error': 'User ID not found in session'}, api_path, http_method)
        
        # Route to appropriate handler
        if api_path == '/search-emails' and http_method == 'POST':
            return handle_search_emails(user_id, request_body)
        elif api_path == '/read-email' and http_method == 'POST':
            return handle_read_email(user_id, request_body)
        elif api_path == '/draft-email' and http_method == 'POST':
            return handle_draft_email(user_id, request_body)
        elif api_path == '/send-email' and http_method == 'POST':
            return handle_send_email(user_id, request_body)
        elif api_path == '/list-labels' and http_method == 'GET':
            return handle_list_labels(user_id)
        elif api_path == '/get-email-stats' and http_method == 'GET':
            return handle_get_email_stats(user_id)
        else:
            logger.error(f"Action not found: {api_path} {http_method}")
            return create_response(404, {'error': 'Action not found'}, api_path, http_method)
            
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return create_response(500, {'error': str(e)}, api_path or '/unknown', http_method or 'POST')

def handle_search_emails(user_id: str, request_body: Dict) -> Dict:
    """Search emails based on query"""
    try:
        service = get_user_gmail_service(user_id)
        # Parse request
        content = request_body.get('content', {})
        json_content = {}
        
        logger.info(f"[DEBUG] Raw request_body: {json.dumps(request_body)}")
        logger.info(f"[DEBUG] Content type: {type(content)}, Content: {json.dumps(content) if isinstance(content, dict) else str(content)}")
        
        if isinstance(content, dict):
            json_content = content.get('application/json', {})
            logger.info(f"[DEBUG] Initial json_content: {json.dumps(json_content)}")
            
            # Bedrock Agent may wrap parameters as list under "properties"
            if not json_content and 'properties' in content.get('application/json', {}):
                try:
                    props_list = content['application/json']['properties']
                    logger.info(f"[DEBUG] Found properties list: {json.dumps(props_list)}")
                    # convert list of {name,value} into dict
                    json_content = {p['name']: p.get('value') for p in props_list if isinstance(p, dict) and 'name' in p}
                    logger.info(f"[DEBUG] Converted properties to dict: {json.dumps(json_content)}")
                except Exception as ex:
                    logger.warning(f"Failed to parse properties list: {str(ex)}")

        query = (json_content.get('query') or '').strip()
        max_results = int(json_content.get('maxResults', 10))
        
        logger.info(f"[DEBUG] Final parsed query: '{query}', max_results: {max_results}")

        if not query:
            logger.error("[DEBUG] Query is empty after parsing!")
            return create_response(400, {'error': 'Query is required'}, '/search-emails', 'POST')
        
        logger.info(f"Searching emails with query: {query}")
        
        # Search emails
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        messages = results.get('messages', [])
        email_data = []
        
        # Fetch details for each message
        for msg in messages:
            try:
                message = service.users().messages().get(
                    userId='me',
                    id=msg['id'],
                    format='metadata'
                ).execute()
                
                # Extract email data
                headers = message['payload'].get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
                
                email_data.append({
                    'id': msg['id'],
                    'subject': subject,
                    'from': from_email,
                    'date': date,
                    'snippet': message.get('snippet', '')
                })
                
            except Exception as e:
                logger.error(f"Error fetching message {msg['id']}: {str(e)}")
        
        return create_response(200, {
            'emails': email_data,
            'totalResults': len(email_data)
        }, '/search-emails', 'POST')
        
    except Exception as e:
        logger.error(f"Error searching emails: {str(e)}")
        return create_response(500, {'error': str(e)}, '/search-emails', 'POST')

def handle_read_email(user_id: str, request_body: Dict) -> Dict:
    """Read a specific email"""
    try:
        service = get_user_gmail_service(user_id)
        content = request_body.get('content', {})
        if isinstance(content, dict):
            json_content = content.get('application/json', {})
        else:
            json_content = {}
        
        email_id = json_content.get('emailId', '')
        
        if not email_id:
            return create_response(400, {'error': 'Email ID is required'}, '/read-email', 'POST')
        
        message = service.users().messages().get(userId='me', id=email_id, format='full').execute()
        headers = message['payload'].get('headers', [])
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
        to_email = next((h['value'] for h in headers if h['name'] == 'To'), 'Unknown')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
        body = extract_email_body(message['payload'])
        attachments = extract_attachments(message['payload'])
        
        return create_response(200, {
            'id': email_id,
            'subject': subject,
            'from': from_email,
            'to': to_email,
            'date': date,
            'body': body,
            'attachments': attachments,
            'labels': message.get('labelIds', [])
        }, '/read-email', 'POST')
        
    except Exception as e:
        logger.error(f"Error reading email: {str(e)}")
        return create_response(500, {'error': str(e)}, '/read-email', 'POST')

def handle_draft_email(user_id: str, request_body: Dict) -> Dict:
    """Create an email draft"""
    try:
        service = get_user_gmail_service(user_id)
        content = request_body.get('content', {})
        if isinstance(content, dict):
            json_content = content.get('application/json', {})
        else:
            json_content = {}
        
        to_email = json_content.get('to', '')
        subject = json_content.get('subject', '')
        body = json_content.get('body', '')
        cc = json_content.get('cc', '')
        bcc = json_content.get('bcc', '')
        
        if not to_email or not subject:
            return create_response(400, {'error': 'To and Subject are required'}, '/draft-email', 'POST')
        
        message = MIMEMultipart()
        message['to'] = to_email
        message['subject'] = subject
        if cc:
            message['cc'] = cc
        if bcc:
            message['bcc'] = bcc
        message.attach(MIMEText(body, 'plain'))
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        draft = service.users().drafts().create(userId='me', body={'message': {'raw': raw_message}}).execute()
        
        return create_response(200, {
            'draftId': draft['id'],
            'message': 'Draft created successfully',
            'to': to_email,
            'subject': subject
        }, '/draft-email', 'POST')
        
    except Exception as e:
        logger.error(f"Error creating draft: {str(e)}")
        return create_response(500, {'error': str(e)}, '/draft-email', 'POST')

def handle_send_email(user_id: str, request_body: Dict) -> Dict:
    """Send an email (from draft or new)"""
    try:
        service = get_user_gmail_service(user_id)
        content = request_body.get('content', {})
        if isinstance(content, dict):
            json_content = content.get('application/json', {})
        else:
            json_content = {}
        
        draft_id = json_content.get('draftId', '')
        
        if draft_id:
            result = service.users().drafts().send(userId='me', body={'id': draft_id}).execute()
            return create_response(200, {
                'messageId': result['id'],
                'message': 'Email sent successfully from draft'
            }, '/send-email', 'POST')
        else:
            to_email = json_content.get('to', '')
            subject = json_content.get('subject', '')
            body = json_content.get('body', '')
            
            if not to_email or not subject:
                return create_response(400, {'error': 'To and Subject are required'}, '/send-email', 'POST')
            
            message = MIMEText(body)
            message['to'] = to_email
            message['subject'] = subject
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            result = service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
            
            return create_response(200, {
                'messageId': result['id'],
                'message': 'Email sent successfully'
            }, '/send-email', 'POST')
            
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return create_response(500, {'error': str(e)}, '/send-email', 'POST')

def handle_list_labels(user_id: str) -> Dict:
    """List Gmail labels"""
    try:
        service = get_user_gmail_service(user_id)
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        
        return create_response(200, {
            'labels': [{'id': label['id'], 'name': label['name']} for label in labels]
        }, '/list-labels', 'GET')
        
    except Exception as e:
        logger.error(f"Error listing labels: {str(e)}")
        return create_response(500, {'error': str(e)}, '/list-labels', 'GET')

def handle_get_email_stats(user_id: str) -> Dict:
    """Get email statistics"""
    try:
        service = get_user_gmail_service(user_id)
        inbox = service.users().messages().list(userId='me', labelIds=['INBOX']).execute()
        sent = service.users().messages().list(userId='me', labelIds=['SENT']).execute()
        unread = service.users().messages().list(userId='me', labelIds=['UNREAD']).execute()
        
        return create_response(200, {
            'stats': {
                'inbox': inbox.get('resultSizeEstimate', 0),
                'sent': sent.get('resultSizeEstimate', 0),
                'unread': unread.get('resultSizeEstimate', 0)
            }
        }, '/get-email-stats', 'GET')
        
    except Exception as e:
        logger.error(f"Error getting email stats: {str(e)}")
        return create_response(500, {'error': str(e)}, '/get-email-stats', 'GET')

def extract_email_body(payload: Dict) -> str:
    """Extract body from email payload"""
    body = ""
    
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                body = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                break
            elif 'parts' in part:
                body = extract_email_body(part)
                if body:
                    break
    elif payload['body'].get('data'):
        body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
    
    return body

def extract_attachments(payload: Dict) -> List[Dict]:
    """Extract attachment information from email payload"""
    attachments = []
    
    def process_parts(parts):
        for part in parts:
            filename = part.get('filename', '')
            if filename:
                attachments.append({
                    'filename': filename,
                    'mimeType': part.get('mimeType', ''),
                    'size': part['body'].get('size', 0)
                })
            if 'parts' in part:
                process_parts(part['parts'])
    
    if 'parts' in payload:
        process_parts(payload['parts'])
    
    return attachments

def store_email_in_knowledge_base(user_id: str, email_id: str, email_data: Dict):
    """Store email in S3 for Knowledge Base"""
    try:
        # Create document for Knowledge Base
        document = {
            'userId': user_id,
            'emailId': email_id,
            'subject': email_data['subject'],
            'from': email_data['from'],
            'date': email_data['date'],
            'body': email_data['body'],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Store in S3
        key = f"emails/{user_id}/{email_id}.json"
        s3_client.put_object(
            Bucket=KNOWLEDGE_BASE_BUCKET,
            Key=key,
            Body=json.dumps(document),
            ContentType='application/json'
        )
        
        logger.info(f"Stored email {email_id} in Knowledge Base")
        
    except Exception as e:
        logger.error(f"Error storing email in Knowledge Base: {str(e)}")

def create_response(status_code: int, body: Dict, api_path: str, http_method: str = 'POST') -> Dict:
    """Create response for Bedrock Agent that mirrors the incoming request path & method"""
    return {
        'messageVersion': '1.0',
        'response': {
            'actionGroup': 'GmailActions',
            'apiPath': api_path,
            'httpMethod': http_method,
            'httpStatusCode': status_code,
            'responseBody': {
                'application/json': {
                    'body': json.dumps(body)
                }
            }
        }
    } 