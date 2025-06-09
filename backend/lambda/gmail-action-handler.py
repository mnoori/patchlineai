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
from boto3.dynamodb.types import TypeDeserializer
from debug_logger import get_logger
import traceback

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Smart debugging - zero overhead in prod
debug_logger = get_logger('gmail-agent')

# AWS Services
dynamodb = boto3.resource('dynamodb')
secrets_manager = boto3.client('secretsmanager')
s3_client = boto3.client('s3')

# Environment variables
PLATFORM_CONNECTIONS_TABLE = os.environ.get('PATCHLINE_DDB_TABLE', 'PlatformConnections-staging')
GMAIL_SECRETS_NAME = os.environ.get('GMAIL_SECRETS_NAME', 'patchline/gmail-oauth')
KNOWLEDGE_BASE_BUCKET = os.environ.get('KNOWLEDGE_BASE_BUCKET', 'patchline-email-knowledge-base')

# DynamoDB table for platform connections
platform_table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)

def get_gmail_credentials():
    """Get Gmail OAuth credentials from AWS Secrets Manager"""
    try:
        logger.info(f"[DEBUG] Getting secret: {GMAIL_SECRETS_NAME}")
        response = secrets_manager.get_secret_value(SecretId=GMAIL_SECRETS_NAME)
        secret_string = response['SecretString']
        logger.info(f"[DEBUG] Secret string length: {len(secret_string)}")
        
        secret_data = json.loads(secret_string)
        logger.info(f"[DEBUG] Secret data keys: {list(secret_data.keys())}")
        
        # Handle both flat structure and nested 'web' structure
        if 'access_token' in secret_data and 'refresh_token' in secret_data:
            # New flat structure - return as is
            logger.info("Using flat secret structure")
            result = secret_data
        elif 'web' in secret_data:
            # Old nested structure - return the web part
            logger.info("Using nested web secret structure")
            result = secret_data['web']
            logger.info(f"[DEBUG] Web section keys: {list(result.keys())}")
            logger.info(f"[DEBUG] token_uri: {result.get('token_uri', 'MISSING')}")
            logger.info(f"[DEBUG] client_id: {result.get('client_id', 'MISSING')[:20] if result.get('client_id') else 'MISSING'}")
        else:
            logger.error(f"[DEBUG] Invalid secret structure. Keys: {list(secret_data.keys())}")
            raise Exception("Invalid secret structure - missing required fields")
        
        logger.info(f"[DEBUG] Returning credentials with keys: {list(result.keys())}")
        return result
            
    except Exception as e:
        logger.error(f"Error retrieving Gmail credentials: {str(e)}")
        logger.error(f"[DEBUG] Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"[DEBUG] Traceback: {traceback.format_exc()}")
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
    """Get Gmail service for a specific user"""
    try:
        debug_logger.debug("Starting Gmail service setup", {'user_id': user_id})
        
        # Get user's credentials from DynamoDB
        table = dynamodb.Table(PLATFORM_CONNECTIONS_TABLE)
        debug_logger.debug("Querying DynamoDB", {'table': PLATFORM_CONNECTIONS_TABLE, 'user_id': user_id})
        
        response = table.get_item(
            Key={
                'userId': user_id,
                'provider': 'gmail'
            }
        )
        
        debug_logger.debug("DynamoDB raw response", {'response_keys': list(response.keys())})
        
        if 'Item' not in response:
            debug_logger.error("No Gmail credentials found", {'user_id': user_id, 'response': response})
            raise Exception(f"No Gmail credentials found for user {user_id}")
        
        debug_logger.debug("Raw DynamoDB item", {'raw_item': str(response['Item'])})
        
        # If the DynamoDB client was the low-level client we would need to deserialize.
        # However boto3.resource already returns native Python types, so just use the item as-is.
        # Only fall back to explicit deserialization if values are still in AttributeValue dict form.
        raw_item = response['Item']
        if all(isinstance(v, dict) and len(v) == 1 for v in raw_item.values()):
            deserializer = TypeDeserializer()
            item = {k: deserializer.deserialize(v) for k, v in raw_item.items()}
        else:
            item = raw_item
        
        debug_logger.debug("Converted DynamoDB item", {'converted_item': item})
        logger.info(f"DynamoDB item for user {user_id}: {json.dumps(item, default=str)}")
        
        # Parse scopes
        scopes = parse_scopes(item.get('scopes', ''))
        logger.info(f"Parsed scopes: {scopes}")
        
        # Get OAuth2 credentials
        client_config = get_gmail_credentials()
        
        # Create credentials from stored tokens
        credentials = Credentials(
            token=item.get('accessToken'),
            refresh_token=item.get('refreshToken'),
            token_uri=client_config['token_uri'],
            client_id=client_config['client_id'],
            client_secret=client_config['client_secret'],
            scopes=scopes
        )
        
        # Check if token needs refresh
        if credentials.expired and credentials.refresh_token:
            try:
                logger.info("Token expired, attempting to refresh...")
                credentials.refresh(Request())
                logger.info("Token refreshed successfully")
                
                # Update the new access token in DynamoDB
                table.update_item(
                    Key={'userId': user_id, 'provider': 'gmail'},
                    UpdateExpression='SET accessToken = :token, updatedAt = :updated',
                    ExpressionAttributeValues={
                        ':token': credentials.token,
                        ':updated': datetime.utcnow().isoformat()
                    }
                )
                logger.info("Updated accessToken in DynamoDB")
            except Exception as refresh_error:
                logger.error(f"Token refresh failed: {str(refresh_error)}")
                
                # Check for invalid_grant error
                if 'invalid_grant' in str(refresh_error):
                    logger.error("Refresh token is invalid or revoked. User needs to re-authenticate.")
                    
                    # Delete the invalid credentials from DynamoDB
                    try:
                        table.delete_item(
                            Key={'userId': user_id, 'provider': 'gmail'}
                        )
                        logger.info("Deleted invalid credentials from DynamoDB")
                    except Exception as delete_error:
                        logger.error(f"Failed to delete invalid credentials: {str(delete_error)}")
                    
                    # Return a specific error that the frontend can handle
                    raise Exception("GMAIL_AUTH_REQUIRED: Your Gmail connection has expired. Please reconnect your Gmail account.")
                else:
                    # Re-raise other errors
                    raise refresh_error
        
        # Build and return Gmail service
        return build('gmail', 'v1', credentials=credentials)
        
    except Exception as e:
        logger.error(f"Error getting Gmail service: {str(e)}")
        
        # Check if it's an auth error that needs user action
        if "GMAIL_AUTH_REQUIRED" in str(e):
            raise e  # Re-raise auth errors as-is
        
        raise

def lambda_handler(event, context):
    """
    Gmail action handler for Bedrock agent
    """
    try:
        # Log the incoming event
        debug_logger.debug("Received event", {"event": event})
        
        # Extract the API path from the event
        api_path = event.get('apiPath', '')
        debug_logger.debug("API path", {"api_path": api_path})
        
        # Extract session info
        session_id = event.get('sessionId', 'unknown')
        debug_logger.debug("Session info", {"session_id": session_id})

        # Extract user ID from session attributes if available
        user_id = None
        if 'sessionAttributes' in event and event['sessionAttributes']:
            user_id = event['sessionAttributes'].get('userId')
        
        # Fallback to hardcoded user ID for testing (remove in production)
        if not user_id:
            user_id = "14287408-6011-70b3-5ac6-089f0cafdc10"
            debug_logger.debug("Using fallback user ID", {"user_id": user_id})
        
        debug_logger.debug("User ID", {"user_id": user_id, "session_id": session_id})
        
        # Check if Gmail is authenticated for this user
        gmail_connection = check_gmail_authentication(user_id)
        
        # If not authenticated, return auth required response
        if not gmail_connection:
            debug_logger.error("Gmail not authenticated", {"user_id": user_id, "session_id": session_id})
            return {
                "messageVersion": "1.0",
                "response": {
                    "actionGroup": "GmailActions",
                    "apiPath": api_path,
                    "httpMethod": "POST",
                    "httpStatusCode": 401,
                    "responseBody": {
                        "content": {
                            "application/json": {
                                "message": "Gmail authentication required. Please connect your Gmail account in the settings page first.",
                                "authenticated": False
                            }
                        },
                        "contentType": "application/json"
                    }
                }
            }
        
        debug_logger.debug("Gmail authenticated", {
            "user_id": user_id,
            "gmail_email": gmail_connection.get('gmailUserEmail', 'unknown'),
            "session_id": session_id
        })
        
        # Extract request body if present
        request_body = None
        if 'requestBody' in event and 'content' in event['requestBody'] and 'application/json' in event['requestBody']['content']:
            request_body = event['requestBody']['content']['application/json']
            debug_logger.debug("Request body", {"request_body": request_body})
        
        # Route the request based on the API path
        if api_path == '/check-emails':
            return handle_get_email_stats(user_id)  # Use real Gmail stats instead of mock
        elif api_path == '/search-emails':
            return handle_search_emails(user_id, request_body)  # Use REAL Gmail search
        elif api_path == '/send-email':
            return handle_send_email(user_id, request_body)  # Use REAL Gmail send
        else:
            debug_logger.error("Unknown API path", {"api_path": api_path})
            return {
                "messageVersion": "1.0",
                "response": {
                    "actionGroup": "GmailActions",
                    "apiPath": api_path,
                    "httpMethod": "POST",
                    "httpStatusCode": 400,
                    "responseBody": {
                        "content": {
                            "application/json": {
                                "message": f"Unknown API path: {api_path}"
                            }
                        },
                        "contentType": "application/json"
                    }
                }
            }
        
    except Exception as e:
        error_details = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        debug_logger.error("Exception in lambda_handler", error_details)
        
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": event.get("apiPath", "/unknown"),
                "httpMethod": event.get("httpMethod", "POST"),
                "httpStatusCode": 500,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Internal server error: {str(e)}"
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }

def check_gmail_authentication(user_id):
    """
    Check if user has Gmail connection in PlatformConnections-staging table
    """
    try:
        debug_logger.debug("Checking Gmail authentication", {"user_id": user_id})
        
        # Query DynamoDB for Gmail connection
        response = platform_table.get_item(
            Key={
                'userId': user_id,
                'provider': 'gmail'
            }
        )
        
        # Check if connection exists
        if 'Item' in response:
            debug_logger.debug("Gmail connection found", {
                "user_id": user_id,
                "gmail_email": response['Item'].get('gmailUserEmail', 'unknown')
            })
            return response['Item']
        else:
            debug_logger.error("No Gmail connection found", {"user_id": user_id})
            return None
            
    except Exception as e:
        debug_logger.error("Error checking Gmail authentication", {
            "error": str(e),
            "error_type": type(e).__name__,
            "user_id": user_id,
            "table_name": PLATFORM_CONNECTIONS_TABLE
        })
        import traceback
        debug_logger.error("Traceback", {"traceback": traceback.format_exc()})
        return None

def check_emails(request_body, session_id, user_id, gmail_connection):
    """
    Check recent emails for a user
    """
    debug_logger.debug("Checking emails", {
        "session_id": session_id, 
        "user_id": user_id,
        "gmail_email": gmail_connection.get('gmailUserEmail', 'unknown')
    })
    
    try:
        # In a real implementation, this would use the Gmail API with the access token
        access_token = gmail_connection.get('accessToken', 'unknown')
        gmail_email = gmail_connection.get('gmailUserEmail', 'unknown')
        
        debug_logger.debug("Gmail API call would use", {
            "access_token_length": len(access_token) if access_token != 'unknown' else 0,
            "gmail_email": gmail_email
        })
        
        # For now, return a basic mock response 
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": "/check-emails",
                "httpMethod": "POST",
                "httpStatusCode": 200,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Email check successful for {gmail_email}",
                            "authenticated": True,
                            "gmail_email": gmail_email,
                            "emails": [
                                {
                                    "id": "msg_123",
                                    "subject": "Your Daily Update",
                                    "sender": "updates@example.com",
                                    "date": datetime.datetime.now().isoformat(),
                                    "snippet": "Here's your daily update with the latest news..."
                                },
                                {
                                    "id": "msg_124",
                                    "subject": "Meeting Reminder",
                                    "sender": "calendar@example.com",
                                    "date": datetime.datetime.now().isoformat(),
                                    "snippet": "Reminder: You have a meeting scheduled for tomorrow..."
                                }
                            ]
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }
        
    except Exception as e:
        error_details = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "session_id": session_id
        }
        debug_logger.error("Exception in check_emails", error_details)
        
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": "/check-emails",
                "httpMethod": "POST",
                "httpStatusCode": 500,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Error checking emails: {str(e)}"
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }

def search_emails(request_body, session_id, user_id, gmail_connection):
    """
    Search emails using query parameters
    """
    debug_logger.debug("Searching emails", {
        "request_body": request_body, 
        "session_id": session_id, 
        "user_id": user_id,
        "gmail_email": gmail_connection.get('gmailUserEmail', 'unknown')
    })
    
    try:
        # Extract the query from the request body
        query = None
        if request_body and 'properties' in request_body:
            for prop in request_body['properties']:
                if prop.get('name') == 'query' and 'value' in prop:
                    query = prop['value']
        
        debug_logger.debug("Search query", {"query": query, "session_id": session_id})
        
        if not query:
            debug_logger.error("No query provided", {"session_id": session_id})
            return {
                "messageVersion": "1.0",
                "response": {
                    "actionGroup": "GmailActions",
                    "apiPath": "/search-emails",
                    "httpMethod": "POST",
                    "httpStatusCode": 400,
                    "responseBody": {
                        "content": {
                            "application/json": {
                                "message": "No search query provided"
                            }
                        },
                        "contentType": "application/json"
                    }
                }
            }
        
        gmail_email = gmail_connection.get('gmailUserEmail', 'unknown')
        
        # In a real implementation, this would use the Gmail API to search
        # For now, return a basic mock response
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": "/search-emails",
                "httpMethod": "POST",
                "httpStatusCode": 200,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Email search successful for {gmail_email}",
                            "authenticated": True,
                            "gmail_email": gmail_email,
                            "query": query,
                            "results": [
                                {
                                    "id": "msg_126",
                                    "subject": "Search Results",
                                    "sender": "search-match@example.com",
                                    "date": datetime.datetime.now().isoformat(),
                                    "snippet": f"This email matches your search criteria for '{query}'..."
                                }
                            ]
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }
        
    except Exception as e:
        error_details = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "session_id": session_id
        }
        debug_logger.error("Exception in search_emails", error_details)
        
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": "/search-emails",
                "httpMethod": "POST",
                "httpStatusCode": 500,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Error searching emails: {str(e)}"
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }

def send_email(request_body, session_id, user_id, gmail_connection):
    """
    Send an email
    """
    debug_logger.debug("Sending email", {
        "request_body": request_body, 
        "session_id": session_id, 
        "user_id": user_id,
        "gmail_email": gmail_connection.get('gmailUserEmail', 'unknown')
    })
    
    try:
        # Extract email details from the request body
        to_address = None
        subject = None
        message = None
        
        if request_body and 'properties' in request_body:
            for prop in request_body['properties']:
                if prop.get('name') == 'to' and 'value' in prop:
                    to_address = prop['value']
                elif prop.get('name') == 'subject' and 'value' in prop:
                    subject = prop['value']
                elif prop.get('name') == 'message' and 'value' in prop:
                    message = prop['value']
        
        debug_logger.debug("Email details", {
            "to": to_address,
            "subject": subject,
            "message_length": len(message) if message else 0,
            "session_id": session_id
        })
        
        # Validate required fields
        if not all([to_address, subject, message]):
            missing_fields = []
            if not to_address:
                missing_fields.append('to')
            if not subject:
                missing_fields.append('subject')
            if not message:
                missing_fields.append('message')
                
            debug_logger.error("Missing email fields", {
                "missing_fields": missing_fields,
                "session_id": session_id
            })
            
            return {
                "messageVersion": "1.0",
                "response": {
                    "actionGroup": "GmailActions",
                    "apiPath": "/send-email",
                    "httpMethod": "POST",
                    "httpStatusCode": 400,
                    "responseBody": {
                        "content": {
                            "application/json": {
                                "message": f"Missing required fields: {', '.join(missing_fields)}"
                            }
                        },
                        "contentType": "application/json"
                    }
                }
            }
        
        gmail_email = gmail_connection.get('gmailUserEmail', 'unknown')
        
        # In a real implementation, this would use the Gmail API to send an email
        # For now, return a success response
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": "/send-email",
                "httpMethod": "POST",
                "httpStatusCode": 200,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Email sent successfully from {gmail_email}",
                            "authenticated": True,
                            "gmail_email": gmail_email,
                            "to": to_address,
                            "subject": subject,
                            "timestamp": datetime.datetime.now().isoformat()
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }
        
    except Exception as e:
        error_details = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "session_id": session_id
        }
        debug_logger.error("Exception in send_email", error_details)
        
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": "GmailActions",
                "apiPath": "/send-email",
                "httpMethod": "POST",
                "httpStatusCode": 500,
                "responseBody": {
                    "content": {
                        "application/json": {
                            "message": f"Error sending email: {str(e)}"
                        }
                    },
                    "contentType": "application/json"
                }
            }
        }

def handle_search_emails(user_id: str, request_body: Dict) -> Dict:
    """Search emails based on query"""
    try:
        service = get_user_gmail_service(user_id)
        # Parse request
        json_content = {}
        
        logger.info(f"[DEBUG] Raw request_body: {json.dumps(request_body)}")
        
        # Check if properties are directly in request_body (Bedrock sends it this way)
        if 'properties' in request_body and isinstance(request_body['properties'], list):
            try:
                props_list = request_body['properties']
                logger.info(f"[DEBUG] Found properties list in request_body: {json.dumps(props_list)}")
                # convert list of {name,value} into dict
                json_content = {p['name']: p.get('value') for p in props_list if isinstance(p, dict) and 'name' in p}
                logger.info(f"[DEBUG] Converted properties to dict: {json.dumps(json_content)}")
            except Exception as ex:
                logger.warning(f"Failed to parse properties list: {str(ex)}")
        
        # Only check nested structure if we didn't find properties in request_body
        if not json_content:
            # Fallback to check nested content structure
            content = request_body.get('content', {})
            logger.info(f"[DEBUG] Content type: {type(content)}, Content: {json.dumps(content) if isinstance(content, dict) else str(content)}")
            
            if isinstance(content, dict):
                app_json = content.get('application/json', {})
                logger.info(f"[DEBUG] app_json: {json.dumps(app_json)}")
                
                # Check if properties in app_json
                if 'properties' in app_json and isinstance(app_json['properties'], list):
                    try:
                        props_list = app_json['properties']
                        logger.info(f"[DEBUG] Found properties list in app_json: {json.dumps(props_list)}")
                        # convert list of {name,value} into dict
                        json_content = {p['name']: p.get('value') for p in props_list if isinstance(p, dict) and 'name' in p}
                        logger.info(f"[DEBUG] Converted properties to dict: {json.dumps(json_content)}")
                    except Exception as ex:
                        logger.warning(f"Failed to parse properties list: {str(ex)}")
                else:
                    # Fallback to direct JSON content
                    json_content = app_json
                    logger.info(f"[DEBUG] Using direct json_content: {json.dumps(json_content)}")
        
        # json_content now has our parsed data
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
        
        # Check if it's an auth error
        if "GMAIL_AUTH_REQUIRED" in str(e):
            return create_response(401, {
                'error': 'Gmail authentication required',
                'code': 'GMAIL_AUTH_REQUIRED',
                'message': 'Please reconnect your Gmail account'
            }, '/search-emails', 'POST')
        
        return create_response(500, {'error': str(e)}, '/search-emails', 'POST')

def handle_read_email(user_id: str, request_body: Dict) -> Dict:
    """Read a specific email"""
    try:
        service = get_user_gmail_service(user_id)
        content = request_body.get('content', {})
        json_content = {}
        
        logger.info(f"[DEBUG] Raw request_body: {json.dumps(request_body)}")
        logger.info(f"[DEBUG] Content type: {type(content)}, Content: {json.dumps(content) if isinstance(content, dict) else str(content)}")
        
        if isinstance(content, dict):
            app_json = content.get('application/json', {})
            logger.info(f"[DEBUG] app_json: {json.dumps(app_json)}")
            
            # Bedrock Agent sends parameters as list under "properties"
            if 'properties' in app_json and isinstance(app_json['properties'], list):
                try:
                    props_list = app_json['properties']
                    logger.info(f"[DEBUG] Found properties list: {json.dumps(props_list)}")
                    # convert list of {name,value} into dict
                    json_content = {p['name']: p.get('value') for p in props_list if isinstance(p, dict) and 'name' in p}
                    logger.info(f"[DEBUG] Converted properties to dict: {json.dumps(json_content)}")
                except Exception as ex:
                    logger.warning(f"Failed to parse properties list: {str(ex)}")
            else:
                # Fallback to direct JSON content
                json_content = app_json
                logger.info(f"[DEBUG] Using direct json_content: {json.dumps(json_content)}")
        
        email_id = json_content.get('emailId', '')
        logger.info(f"[DEBUG] Final parsed emailId: '{email_id}'")
        
        if not email_id:
            logger.error("[DEBUG] Email ID is empty after parsing!")
            return create_response(400, {'error': 'Email ID is required'}, '/read-email', 'POST')
        
        logger.info(f"Reading email with ID: {email_id}")
        
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
        json_content = {}
        
        logger.info(f"[DEBUG] Raw request_body: {json.dumps(request_body)}")
        
        if isinstance(content, dict):
            app_json = content.get('application/json', {})
            
            # Bedrock Agent sends parameters as list under "properties"
            if 'properties' in app_json and isinstance(app_json['properties'], list):
                try:
                    props_list = app_json['properties']
                    json_content = {p['name']: p.get('value') for p in props_list if isinstance(p, dict) and 'name' in p}
                    logger.info(f"[DEBUG] Converted properties to dict: {json.dumps(json_content)}")
                except Exception as ex:
                    logger.warning(f"Failed to parse properties list: {str(ex)}")
            else:
                # Fallback to direct JSON content
                json_content = app_json
        
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
        json_content = {}
        
        logger.info(f"[DEBUG] Raw request_body: {json.dumps(request_body)}")
        
        if isinstance(content, dict):
            app_json = content.get('application/json', {})
            
            # Bedrock Agent sends parameters as list under "properties"
            if 'properties' in app_json and isinstance(app_json['properties'], list):
                try:
                    props_list = app_json['properties']
                    json_content = {p['name']: p.get('value') for p in props_list if isinstance(p, dict) and 'name' in p}
                    logger.info(f"[DEBUG] Converted properties to dict: {json.dumps(json_content)}")
                except Exception as ex:
                    logger.warning(f"Failed to parse properties list: {str(ex)}")
            else:
                # Fallback to direct JSON content
                json_content = app_json
        
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
        
        # Check if it's an auth error
        if "GMAIL_AUTH_REQUIRED" in str(e):
            return create_response(401, {
                'error': 'Gmail authentication required',
                'code': 'GMAIL_AUTH_REQUIRED',
                'message': 'Please reconnect your Gmail account'
            }, '/get-email-stats', 'GET')
        
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
    response = {
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
    
    debug_logger.debug("Creating Gmail response", {
        'status_code': status_code,
        'api_path': api_path,
        'http_method': http_method,
        'body': body,
        'full_response': response
    })
    
    return response 