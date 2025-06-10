#!/usr/bin/env python3
"""
Patchline Scout Action Handler
Lambda function for artist discovery and analytics operations
"""

import json
import os
import logging
import boto3
import requests
import urllib.parse
from typing import Dict, List, Any
from datetime import datetime
from debug_logger import get_logger
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Smart debugging - zero overhead in prod
debug_logger = get_logger('scout-agent')

# Environment variables - Get from Secrets Manager
def get_soundcharts_credentials():
    """Get Soundcharts credentials from AWS Secrets Manager"""
    try:
        secret_id = os.environ.get('SOUNDCHARTS_SECRET_ID', 'patchline/soundcharts-api')
        secrets_client = boto3.client('secretsmanager', region_name=os.environ.get('PATCHLINE_AWS_REGION', 'us-east-1'))
        
        response = secrets_client.get_secret_value(SecretId=secret_id)
        secret_data = json.loads(response['SecretString'])
        
        return secret_data.get('id'), secret_data.get('token')
    except Exception as e:
        debug_logger.error("Failed to get Soundcharts credentials from Secrets Manager", {'error': str(e)})
        return None, None

# Try to get credentials from Secrets Manager first, fallback to env vars
SOUNDCHARTS_ID, SOUNDCHARTS_TOKEN = get_soundcharts_credentials()
if not SOUNDCHARTS_ID or not SOUNDCHARTS_TOKEN:
    # Fallback to environment variables (for local development)
    SOUNDCHARTS_ID = os.environ.get('SOUNDCHARTS_ID')
    SOUNDCHARTS_TOKEN = os.environ.get('SOUNDCHARTS_TOKEN')
    debug_logger.debug("Using environment variables for Soundcharts", {
        'has_id': bool(SOUNDCHARTS_ID),
        'has_token': bool(SOUNDCHARTS_TOKEN)
    })
else:
    debug_logger.debug("Using Secrets Manager for Soundcharts", {
        'has_id': bool(SOUNDCHARTS_ID),
        'has_token': bool(SOUNDCHARTS_TOKEN)
    })

SOUNDCHARTS_API_BASE = 'https://customer.api.soundcharts.com'  # Correct Soundcharts API URL

# DynamoDB client for interaction tracking
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('PATCHLINE_AWS_REGION', 'us-east-1'))
INTERACTIONS_TABLE = os.environ.get('USER_INTERACTIONS_TABLE', 'UserInteractions-staging')

def track_interaction(user_id: str, action: str, metadata: Dict = None):
    """Track user interactions in DynamoDB"""
    try:
        table = dynamodb.Table(INTERACTIONS_TABLE)
        
        interaction = {
            'interactionId': str(uuid.uuid4()),
            'userId': user_id,
            'timestamp': datetime.now().isoformat(),
            'action': f'scout_api_{action.replace("/", "_")}',
            'agent': 'scout',
            'metadata': metadata or {},
            'ttl': int((datetime.now().timestamp()) + (90 * 24 * 60 * 60))  # 90 days TTL
        }
        
        table.put_item(Item=interaction)
        debug_logger.debug("Tracked user interaction", {
            'userId': user_id,
            'action': interaction['action']
        })
        
    except Exception as e:
        # Don't fail the request if tracking fails
        debug_logger.error("Failed to track interaction", {
            'error': str(e),
            'userId': user_id,
            'action': action
        })

# Mock data for development - will be replaced with real APIs in production
MOCK_ARTISTS_DB = {
    "hyperpop": [
        {
            "name": "Alice Gas",
            "genre": "hyperpop",
            "followers": 85000,
            "region": "US",
            "growth_rate": 12.3,
            "spotify_url": "https://open.spotify.com/artist/2ySXEW1ppTaKGYGNUfVnF5"
        },
        {
            "name": "umru",
            "genre": "hyperpop",
            "followers": 65000,
            "region": "US",
            "growth_rate": 8.7,
            "spotify_url": "https://open.spotify.com/artist/0FVcxncwxw2OXBrUZCYd2Y"
        },
        {
            "name": "glaive",
            "genre": "hyperpop",
            "followers": 520000,
            "region": "US",
            "growth_rate": 25.1,
            "spotify_url": "https://open.spotify.com/artist/0Z8gcpr1V8qYtK1w3zBm7W"
        },
        {
            "name": "ericdoa",
            "genre": "hyperpop",
            "followers": 230000,
            "region": "US",
            "growth_rate": 15.8,
            "spotify_url": "https://open.spotify.com/artist/5bjR6xEnFCRaD7QA9VbnN7"
        },
        {
            "name": "dltzk",
            "genre": "hyperpop",
            "followers": 95000,
            "region": "US",
            "growth_rate": 18.2,
            "spotify_url": "https://open.spotify.com/artist/1AcQGHqRFvxbXqYa2tgUdh"
        }
    ],
    "afrobeats": [
        {
            "name": "Ayra Starr",
            "genre": "afrobeats",
            "followers": 1200000,
            "region": "Nigeria",
            "growth_rate": 45.2,
            "spotify_url": "https://open.spotify.com/artist/5pT5c5glujVTCZQgNGOICl"
        },
        {
            "name": "Victony",
            "genre": "afrobeats",
            "followers": 450000,
            "region": "Nigeria",
            "growth_rate": 38.7,
            "spotify_url": "https://open.spotify.com/artist/14KydWmDDIcLiZHYSNRtQA"
        },
        {
            "name": "Rema",
            "genre": "afrobeats",
            "followers": 3500000,
            "region": "Nigeria",
            "growth_rate": 23.1,
            "spotify_url": "https://open.spotify.com/artist/46pWGuE3dSwY3bMMXGBvVS"
        }
    ],
    "indie rock": [
        {
            "name": "Wet Leg",
            "genre": "indie rock",
            "followers": 950000,
            "region": "UK",
            "growth_rate": 28.3,
            "spotify_url": "https://open.spotify.com/artist/5vv7l6rLtdDgJPtEn7fNwf"
        },
        {
            "name": "Yard Act",
            "genre": "indie rock",
            "followers": 180000,
            "region": "UK",
            "growth_rate": 15.2,
            "spotify_url": "https://open.spotify.com/artist/4WmA5YPu5aQ7Z0X3wlQm5X"
        },
        {
            "name": "Black Country, New Road",
            "genre": "indie rock",
            "followers": 310000,
            "region": "UK",
            "growth_rate": 17.5,
            "spotify_url": "https://open.spotify.com/artist/2JlGCHTIrm5AEcrE3UkRQP"
        }
    ]
}

# Artist analysis mock data
MOCK_ARTIST_ANALYSIS = {
    "glaive": {
        "name": "glaive",
        "genres": ["hyperpop", "glitchcore", "digicore"],
        "followers": {
            "count": 520000,
            "growth_rate": 25.1
        },
        "monthly_listeners": {
            "count": 1850000,
            "growth_rate": 32.7
        },
        "playlists": {
            "count": 4200,
            "editorial_count": 85
        },
        "top_tracks": [
            {
                "name": "astrid",
                "streams": 38500000
            },
            {
                "name": "synopsis",
                "streams": 12700000
            },
            {
                "name": "1984",
                "streams": 9800000
            }
        ]
    },
    "Ayra Starr": {
        "name": "Ayra Starr",
        "genres": ["afrobeats", "afropop", "nigerian pop"],
        "followers": {
            "count": 1200000,
            "growth_rate": 45.2
        },
        "monthly_listeners": {
            "count": 5600000,
            "growth_rate": 58.3
        },
        "playlists": {
            "count": 8900,
            "editorial_count": 125
        },
        "top_tracks": [
            {
                "name": "Rush",
                "streams": 170000000
            },
            {
                "name": "Bloody Samaritan",
                "streams": 65000000
            },
            {
                "name": "Away",
                "streams": 28000000
            }
        ]
    },
    "James Hype": {
        "name": "James Hype",
        "genres": ["tech house", "uk garage", "electronic"],
        "followers": {
            "count": 850000,
            "growth_rate": 22.5
        },
        "monthly_listeners": {
            "count": 4200000,
            "growth_rate": 35.7
        },
        "playlists": {
            "count": 5600,
            "editorial_count": 95
        },
        "top_tracks": [
            {
                "name": "Ferrari",
                "streams": 125000000
            },
            {
                "name": "Afraid",
                "streams": 89000000
            },
            {
                "name": "More Than Friends",
                "streams": 67000000
            }
        ]
    }
}

def lambda_handler(event, context):
    """Main Lambda handler for Scout Agent actions"""
    try:
        # Enhanced debug logging with our new system
        debug_logger.debug("=== SCOUT LAMBDA HANDLER START ===", {
            'event_keys': list(event.keys()),
            'context': str(context)
        })
        
        logger.info(f"[SCOUT] Event: {json.dumps(event)}")
        
        # Extract action details
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        request_body = event.get('requestBody', {})
        
        debug_logger.debug("Extracted routing parameters", {
            'action_group': action_group,
            'api_path': api_path,
            'http_method': http_method,
            'has_request_body': bool(request_body)
        })
        
        # Extract user ID
        user_id = extract_user_id(event)
        if not user_id:
            debug_logger.error("No user ID found in event", {'event': event})
            return create_response(400, {'error': 'User ID not found'}, api_path, http_method)
        
        # Track the API interaction
        track_interaction(user_id, api_path, request_body)
        
        logger.info(f"[SCOUT] Action: {api_path} | Method: {http_method} | User: {user_id}")
        
        debug_logger.debug("Starting route matching", {
            'api_path_check': f"'{api_path}' == '/search/artist'",
            'method_check': f"'{http_method}' == 'GET'",
            'combined_check': api_path == '/search/artist' and http_method == 'GET'
        })
        
        # Route to appropriate handler - FIXED to match OpenAPI schema
        if api_path == '/search/artist' and http_method == 'GET':
            debug_logger.debug("Matched /search/artist GET route", {'parameters': event.get('parameters', [])})
            return handle_search_artist(user_id, event.get('parameters', []))
        elif api_path == '/search-artists' and http_method == 'POST':
            debug_logger.debug("Matched /search-artists POST route")
            return handle_search_artists(user_id, request_body)
        elif api_path == '/get-artist-details' and http_method == 'POST':
            debug_logger.debug("Matched /get-artist-details POST route")
            return handle_get_artist_details(user_id, request_body)
        elif api_path == '/get-artist-stats' and http_method == 'POST':
            debug_logger.debug("Matched /get-artist-stats POST route")
            return handle_get_artist_stats(user_id, request_body)
        elif api_path == '/track-artist' and http_method == 'POST':
            debug_logger.debug("Matched /track-artist POST route")
            return handle_track_artist(user_id, request_body)
        elif api_path == '/generate-report' and http_method == 'POST':
            debug_logger.debug("Matched /generate-report POST route")
            return handle_generate_report(user_id, request_body)
        # Legacy endpoints for backward compatibility
        elif api_path == '/discover-artists' and http_method == 'POST':
            debug_logger.debug("Matched legacy /discover-artists POST route")
            return handle_search_artists(user_id, request_body)
        elif api_path == '/analyze-artist' and http_method == 'POST':
            debug_logger.debug("Matched legacy /analyze-artist POST route")
            return handle_get_artist_details(user_id, request_body)
        elif api_path == '/compare-artists' and http_method == 'POST':
            debug_logger.debug("Matched /compare-artists POST route")
            return handle_compare_artists(user_id, request_body)
        else:
            debug_logger.error("No route matched - Action not found", {
                'api_path': api_path,
                'http_method': http_method,
                'all_checked_routes': [
                    '/search/artist GET',
                    '/search-artists POST',
                    '/get-artist-details POST',
                    '/get-artist-stats POST',
                    '/track-artist POST',
                    '/generate-report POST',
                    '/discover-artists POST',
                    '/analyze-artist POST',
                    '/compare-artists POST'
                ]
            })
            logger.error(f"[SCOUT] Action not found: {api_path} {http_method}")
            return create_response(404, {'error': 'Action not found'}, api_path, http_method)
            
    except Exception as e:
        logger.error(f"[SCOUT] Error in Lambda handler: {str(e)}")
        return create_response(500, {'error': str(e)}, api_path, http_method)

def extract_user_id(event: Dict) -> str:
    """Extract user ID from session attributes"""
    try:
        # Extract from session state if available
        session_attributes = event.get('sessionAttributes', {})
        if session_attributes and 'userId' in session_attributes:
            return session_attributes['userId']
            
        # Fallback to session state
        session_state = event.get('sessionState', {})
        if session_state and 'sessionAttributes' in session_state:
            return session_state['sessionAttributes'].get('userId', '')
            
        return ''
    except Exception as e:
        logger.error(f"[SCOUT] Error extracting user ID: {str(e)}")
        return ''

def create_response(status_code: int, body: Dict, api_path: str, http_method: str) -> Dict:
    """Create formatted response for Bedrock Agent"""
    response = {
        'messageVersion': '1.0',
        'response': {
            'actionGroup': 'ScoutActions',
            'apiPath': api_path,
            'httpMethod': http_method,
            'httpStatusCode': status_code,
            'responseBody': {
                'contentType': 'application/json',
                'content': json.dumps(body)
            }
        }
    }
    
    debug_logger.debug("Creating Scout response", {
        'status_code': status_code,
        'api_path': api_path,
        'http_method': http_method,
        'body_keys': list(body.keys()) if isinstance(body, dict) else 'not_dict',
        'full_response': response
    })
    
    return response

def handle_search_artist(user_id: str, parameters: List[Dict]) -> Dict:
    """Handle single artist search by name (GET request) - REAL SOUNDCHARTS API"""
    try:
        debug_logger.debug("=== HANDLE SEARCH ARTIST START (REAL API) ===", {
            'user_id': user_id,
            'parameters': parameters
        })
        
        # Extract artist name from parameters
        artist_name = ''
        for param in parameters:
            if param.get('name') == 'artistName':
                artist_name = param.get('value', '')
                break
        
        debug_logger.debug("Extracted artist name", {
            'artist_name': artist_name,
            'soundcharts_credentials_available': bool(SOUNDCHARTS_ID and SOUNDCHARTS_TOKEN)
        })
        
        if not artist_name:
            debug_logger.error("No artist name provided in parameters")
            return create_response(400, {'error': 'Artist name is required'}, '/search/artist', 'GET')
        
        # Try real Soundcharts API first
        if SOUNDCHARTS_ID and SOUNDCHARTS_TOKEN:
            try:
                debug_logger.debug("Calling Soundcharts API for artist search", {
                    'artist_name': artist_name,
                    'api_base': SOUNDCHARTS_API_BASE
                })
                
                artist_data = search_artist_soundcharts(artist_name)
                if artist_data:
                    debug_logger.debug("Artist found via Soundcharts API", {'artist_data': artist_data})
                    return create_response(200, artist_data, '/search/artist', 'GET')
                    
            except Exception as api_error:
                debug_logger.error("Soundcharts API failed, falling back to mock", {
                    'error': str(api_error),
                    'artist_name': artist_name
                })
                logger.warning(f"[SCOUT] Soundcharts API failed for {artist_name}: {str(api_error)}")
        
        # Fallback to mock data
        debug_logger.debug("Using mock data fallback", {
            'available_artists': list(MOCK_ARTIST_ANALYSIS.keys())
        })
        
        if artist_name in MOCK_ARTIST_ANALYSIS:
            debug_logger.debug("Artist found in mock data", {'artist_name': artist_name})
            artist_data = MOCK_ARTIST_ANALYSIS[artist_name]
            
            response_data = {
                'id': f"mock-{artist_name.lower().replace(' ', '-')}",
                'name': artist_data['name'],
                'social_links': {
                    'spotify': f"https://open.spotify.com/artist/{artist_name.lower().replace(' ', '')}"
                },
                'source': 'mock'
            }
            
            debug_logger.debug("Returning mock data response", {'response_data': response_data})
            return create_response(200, response_data, '/search/artist', 'GET')
        else:
            debug_logger.error("Artist not found anywhere", {
                'searched_artist': artist_name,
                'checked_soundcharts': bool(SOUNDCHARTS_ID and SOUNDCHARTS_TOKEN),
                'checked_mock': True
            })
            return create_response(404, {'error': f'Artist "{artist_name}" not found'}, '/search/artist', 'GET')
        
    except Exception as e:
        debug_logger.error("Exception in handle_search_artist", {
            'error': str(e),
            'user_id': user_id,
            'parameters': parameters
        })
        logger.error(f"[SCOUT] Error searching artist: {str(e)}")
        return create_response(500, {'error': str(e)}, '/search/artist', 'GET')

def handle_search_artists(user_id: str, request_body: Dict) -> Dict:
    """Handle discovery of new artists based on genre, metrics, and region"""
    try:
        body = parse_request_body(request_body)
        
        # Check if this is a simple search (with 'query') or discovery (with 'genre')
        query = body.get('query', '')
        if query:
            # This is a simple search by artist name - redirect to search_artist
            debug_logger.debug("Search-artists called with query, using simple search", {'query': query})
            
            # Try real Soundcharts API first
            if SOUNDCHARTS_ID and SOUNDCHARTS_TOKEN:
                try:
                    artist_data = search_artist_soundcharts(query)
                    if artist_data:
                        return create_response(200, artist_data, '/search-artists', 'POST')
                except Exception as api_error:
                    logger.warning(f"[SCOUT] Soundcharts API failed for {query}: {str(api_error)}")
            
            # Fallback to mock data
            if query in MOCK_ARTIST_ANALYSIS:
                artist_data = MOCK_ARTIST_ANALYSIS[query]
                response_data = {
                    'id': f"mock-{query.lower().replace(' ', '-')}",
                    'name': artist_data['name'],
                    'social_links': {
                        'spotify': f"https://open.spotify.com/artist/{query.lower().replace(' ', '')}"
                    },
                    'source': 'mock'
                }
                return create_response(200, response_data, '/search-artists', 'POST')
            else:
                return create_response(404, {'error': f'Artist "{query}" not found'}, '/search-artists', 'POST')
        
        # Otherwise, this is a discovery request
        genre = body.get('genre', '').lower()
        region = body.get('region', '')
        min_followers = body.get('min_followers', 0)
        max_followers = body.get('max_followers', 10000000)
        limit = body.get('limit', 5)
        
        # Validate parameters
        if not genre:
            return create_response(400, {'error': 'Genre is required'}, '/search-artists', 'POST')
            
        # Try to use real Soundcharts API if credentials are available
        if SOUNDCHARTS_ID and SOUNDCHARTS_TOKEN:
            try:
                artists = discover_artists_soundcharts(genre, region, min_followers, max_followers, limit)
                return create_response(200, {'artists': artists, 'source': 'soundcharts'}, '/search-artists', 'POST')
            except Exception as api_error:
                logger.warning(f"[SCOUT] Soundcharts API failed, falling back to mock data: {str(api_error)}")
        
        # Fallback to mock data
        artists = []
        if genre in MOCK_ARTISTS_DB:
            artists = MOCK_ARTISTS_DB[genre]
            
        # Apply filters
        if region:
            artists = [a for a in artists if region.lower() in a['region'].lower()]
        artists = [a for a in artists if a['followers'] >= min_followers and a['followers'] <= max_followers]
        
        # Apply limit and sort by growth rate
        artists = sorted(artists, key=lambda x: x['growth_rate'], reverse=True)[:limit]
        
        return create_response(200, {'artists': artists, 'source': 'mock'}, '/search-artists', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error discovering artists: {str(e)}")
        return create_response(500, {'error': str(e)}, '/search-artists', 'POST')

def handle_get_artist_details(user_id: str, request_body: Dict) -> Dict:
    """Handle getting detailed artist information"""
    try:
        body = parse_request_body(request_body)
        
        # Extract parameters
        artist_id = body.get('artist_id', '')
        artist_name = body.get('artist_name', '')  # Fallback for legacy calls
        
        # Validate parameters
        if not artist_id and not artist_name:
            return create_response(400, {'error': 'Artist ID or name is required'}, '/get-artist-details', 'POST')
            
        # For mock data, use artist name if available
        search_key = artist_name if artist_name else artist_id.replace('mock-', '').replace('-', ' ').title()
        
        if search_key in MOCK_ARTIST_ANALYSIS:
            artist_data = MOCK_ARTIST_ANALYSIS[search_key]
            return create_response(200, {
                'id': artist_id or f"mock-{search_key.lower().replace(' ', '-')}",
                'name': artist_data['name'],
                'genres': artist_data['genres'],
                'country_code': 'US',  # Mock data
                'career_stage': 'emerging',
                'biography': f"{artist_data['name']} is a rising artist in the {artist_data['genres'][0]} scene.",
                'followers': artist_data['followers'],
                'monthly_listeners': artist_data['monthly_listeners'],
                'top_tracks': artist_data['top_tracks']
            }, '/get-artist-details', 'POST')
        else:
            return create_response(404, {'error': 'Artist not found'}, '/get-artist-details', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error getting artist details: {str(e)}")
        return create_response(500, {'error': str(e)}, '/get-artist-details', 'POST')

def handle_get_artist_stats(user_id: str, request_body: Dict) -> Dict:
    """Handle getting artist statistics"""
    try:
        body = parse_request_body(request_body)
        artist_id = body.get('artist_id', '')
        platform = body.get('platform', 'spotify')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/get-artist-stats', 'POST')
        
        # Mock stats data
        return create_response(200, {
            'artist_id': artist_id,
            'platform': platform,
            'followers': 150000,
            'monthly_listeners': 500000,
            'growth_rate': 15.2,
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }, '/get-artist-stats', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error getting artist stats: {str(e)}")
        return create_response(500, {'error': str(e)}, '/get-artist-stats', 'POST')

def handle_track_artist(user_id: str, request_body: Dict) -> Dict:
    """Handle adding artist to tracking list"""
    try:
        body = parse_request_body(request_body)
        artist_id = body.get('artist_id', '')
        notes = body.get('notes', '')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/track-artist', 'POST')
        
        return create_response(200, {
            'message': 'Artist added to tracking list',
            'artist_id': artist_id,
            'notes': notes,
            'tracked_at': datetime.utcnow().isoformat() + 'Z'
        }, '/track-artist', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error tracking artist: {str(e)}")
        return create_response(500, {'error': str(e)}, '/track-artist', 'POST')

def handle_generate_report(user_id: str, request_body: Dict) -> Dict:
    """Handle generating artist report"""
    try:
        body = parse_request_body(request_body)
        artist_id = body.get('artist_id', '')
        report_type = body.get('report_type', 'quick')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/generate-report', 'POST')
        
        return create_response(200, {
            'report_id': f"report-{artist_id}-{int(datetime.utcnow().timestamp())}",
            'artist_id': artist_id,
            'report_type': report_type,
            'status': 'generated',
            'summary': f"Quick scouting report for artist {artist_id}. Shows strong potential in streaming metrics.",
            'generated_at': datetime.utcnow().isoformat() + 'Z'
        }, '/generate-report', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error generating report: {str(e)}")
        return create_response(500, {'error': str(e)}, '/generate-report', 'POST')

def handle_analyze_artist(user_id: str, request_body: Dict) -> Dict:
    """Legacy handler - redirects to get_artist_details"""
    return handle_get_artist_details(user_id, request_body)

def handle_compare_artists(user_id: str, request_body: Dict) -> Dict:
    """Handle comparison between multiple artists"""
    try:
        body = parse_request_body(request_body)
        
        # Extract parameters
        artist_names = body.get('artist_names', [])
        metrics = body.get('metrics', ['followers', 'monthly_listeners'])
        
        # Validate parameters
        if not artist_names or len(artist_names) < 2:
            return create_response(400, {'error': 'At least two artist names are required'}, '/compare-artists', 'POST')
            
        # In production, this would call a real API or database
        # For now, use mock data
        comparison = {}
        found_artists = []
        
        for name in artist_names:
            if name in MOCK_ARTIST_ANALYSIS:
                found_artists.append(name)
                artist_data = MOCK_ARTIST_ANALYSIS[name]
                comparison[name] = {}
                
                for metric in metrics:
                    if metric == 'followers':
                        comparison[name]['followers'] = artist_data['followers']
                    elif metric == 'monthly_listeners':
                        comparison[name]['monthly_listeners'] = artist_data['monthly_listeners']
                    elif metric == 'playlist_reach':
                        comparison[name]['playlist_reach'] = artist_data['playlists']
        
        if not comparison:
            return create_response(404, {'error': 'No artists found'}, '/compare-artists', 'POST')
            
        # Generate simple recommendation
        recommendation = f"Based on growth rates, {found_artists[0]} shows the strongest momentum in the {metrics[0]} metric."
        
        return create_response(200, {
            'comparison': comparison,
            'recommendation': recommendation
        }, '/compare-artists', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error comparing artists: {str(e)}")
        return create_response(500, {'error': str(e)}, '/compare-artists', 'POST')

# Helper Functions

def parse_request_body(request_body: Dict) -> Dict:
    """Parse request body from Bedrock Agent format"""
    try:
        debug_logger.debug("[SCOUT] Raw request_body", {'request_body': request_body})
        
        # Check if properties are directly in request_body (Bedrock sends it this way)
        if 'properties' in request_body and isinstance(request_body['properties'], list):
            debug_logger.debug("[SCOUT] Found properties list in request_body", {
                'properties': request_body['properties']
            })
            body = {p['name']: p.get('value') for p in request_body['properties'] if isinstance(p, dict) and 'name' in p}
            debug_logger.debug("[SCOUT] Parsed properties to dict", {'parsed_body': body})
            return body
        
        # Fallback to check nested content structure
        content = request_body.get('content', {})
        debug_logger.debug("[SCOUT] Checking content structure", {'content': content})
        
        if 'application/json' in content:
            app_json = content['application/json']
            debug_logger.debug("[SCOUT] Found application/json", {'app_json': app_json})
            
            # Handle Bedrock Agent properties format in app_json
            if 'properties' in app_json and isinstance(app_json['properties'], list):
                body = {p['name']: p.get('value') for p in app_json['properties'] if isinstance(p, dict) and 'name' in p}
                return body
            elif 'body' in app_json:
                body_str = app_json['body']
                if isinstance(body_str, str):
                    return json.loads(body_str)
                return body_str
            else:
                return app_json
        
        debug_logger.debug("[SCOUT] Returning empty dict - no valid structure found")
        return {}
    except Exception as e:
        logger.error(f"[SCOUT] Error parsing request body: {str(e)}")
        debug_logger.error("[SCOUT] Exception in parse_request_body", {
            'error': str(e),
            'request_body': request_body
        })
        return {}

def search_artist_soundcharts(artist_name: str) -> Dict:
    """Search for a single artist using Soundcharts API"""
    try:
        headers = {
            'x-app-id': SOUNDCHARTS_ID,
            'x-api-key': SOUNDCHARTS_TOKEN,
            'Content-Type': 'application/json'
        }
        
        # Use correct endpoint format: /api/v2/artist/search/{query}
        encoded_name = urllib.parse.quote(artist_name)
        url = f'{SOUNDCHARTS_API_BASE}/api/v2/artist/search/{encoded_name}'
        
        debug_logger.debug("Making Soundcharts API search request", {
            'url': url,
            'artist_name': artist_name,
            'encoded_name': encoded_name,
            'headers_keys': list(headers.keys())
        })
        
        params = {
            'limit': 1  # Just get the top result
        }
        
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=30
        )
        
        debug_logger.debug("Soundcharts API response", {
            'status_code': response.status_code,
            'response_size': len(response.text),
            'headers': dict(response.headers)
        })
        
        response.raise_for_status()
        data = response.json()
        
        debug_logger.debug("Soundcharts API response data", {
            'data_keys': list(data.keys()) if isinstance(data, dict) else 'not_dict',
            'data_preview': str(data)[:500]
        })
        
        # Extract the first artist from results
        if data.get('items') and len(data['items']) > 0:
            artist = data['items'][0]
            
            # Get additional details if we have the artist UUID
            artist_uuid = artist.get('uuid')
            artist_details = {}
            
            if artist_uuid:
                try:
                    # Get detailed stats
                    stats_response = requests.get(
                        f'{SOUNDCHARTS_API_BASE}/api/v2/artist/{artist_uuid}/current/stats',
                        headers=headers,
                        timeout=30
                    )
                    if stats_response.status_code == 200:
                        artist_details = stats_response.json()
                        debug_logger.debug("Got artist details from Soundcharts", {
                            'uuid': artist_uuid,
                            'details_keys': list(artist_details.keys()) if isinstance(artist_details, dict) else 'not_dict'
                        })
                except Exception as details_error:
                    debug_logger.error("Failed to get artist details", {'error': str(details_error)})
            
            # Transform to our format
            result = {
                'id': artist_uuid or f"soundcharts-{artist.get('name', '').lower().replace(' ', '-')}",
                'name': artist.get('name', ''),
                'social_links': {
                    'spotify': artist.get('platforms', {}).get('spotify', {}).get('url', ''),
                    'soundcharts': f"https://soundcharts.com/app/artist/{artist_uuid}" if artist_uuid else ''
                },
                'source': 'soundcharts',
                'stats': artist_details.get('object', {}) if artist_details else {},
                'raw_data': artist  # Include raw data for debugging
            }
            
            debug_logger.debug("Transformed Soundcharts data", {'result': result})
            return result
        
        debug_logger.debug("No artists found in Soundcharts response")
        return None
        
    except Exception as e:
        debug_logger.error("Soundcharts API error", {
            'error': str(e),
            'artist_name': artist_name
        })
        logger.error(f"[SCOUT] Soundcharts API error: {str(e)}")
        raise

def discover_artists_soundcharts(genre: str, region: str, min_followers: int, max_followers: int, limit: int) -> List[Dict]:
    """Discover artists using Soundcharts API"""
    try:
        headers = {
            'x-app-id': SOUNDCHARTS_ID,
            'x-api-key': SOUNDCHARTS_TOKEN,
            'Content-Type': 'application/json'
        }
        
        debug_logger.debug("Making Soundcharts discover request", {
            'genre': genre,
            'region': region,
            'limit': limit
        })
        
        # Use the top artists endpoint for discovery
        params = {
            'limit': limit,
            'platform': 'spotify'  # Focus on Spotify data
        }
        
        if region:
            params['country'] = region
            
        response = requests.get(
            f'{SOUNDCHARTS_API_BASE}/api/v2/top/artists',
            headers=headers,
            params=params,
            timeout=30
        )
        
        response.raise_for_status()
        data = response.json()
        
        # Transform Soundcharts data to our format
        artists = []
        for artist in data.get('items', []):
            # Filter by followers if data is available
            followers = 0
            stats = artist.get('stats', {})
            if stats and 'spotify' in stats:
                followers = stats['spotify'].get('followers', 0)
            
            if min_followers <= followers <= max_followers:
                artists.append({
                    'name': artist.get('name', ''),
                    'genre': genre,  # Default since Soundcharts doesn't always return genre in top lists
                    'followers': followers,
                    'region': artist.get('country', region),
                    'growth_rate': stats.get('growth_rate', 0) if stats else 0,
                    'spotify_url': artist.get('platforms', {}).get('spotify', {}).get('url', ''),
                    'soundcharts_id': artist.get('uuid', ''),
                    'source': 'soundcharts'
                })
        
        debug_logger.debug("Discovered artists from Soundcharts", {
            'count': len(artists),
            'artists': [a['name'] for a in artists]
        })
        
        return artists[:limit]
        
    except Exception as e:
        debug_logger.error("Soundcharts discover API error", {
            'error': str(e),
            'genre': genre
        })
        logger.error(f"[SCOUT] Soundcharts API error: {str(e)}")
        raise 