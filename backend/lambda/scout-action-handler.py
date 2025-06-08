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
from typing import Dict, List, Any
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

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
    }
}

def lambda_handler(event, context):
    """Main Lambda handler for Scout Agent actions"""
    try:
        logger.info(f"[SCOUT] Event: {json.dumps(event)}")
        
        # Extract action details
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        request_body = event.get('requestBody', {})
        
        # Extract user ID
        user_id = extract_user_id(event)
        if not user_id:
            return create_response(400, {'error': 'User ID not found'}, api_path, http_method)
        
        logger.info(f"[SCOUT] Action: {api_path} | Method: {http_method} | User: {user_id}")
        
        # Route to appropriate handler
        if api_path == '/discover-artists' and http_method == 'POST':
            return handle_discover_artists(user_id, request_body)
        elif api_path == '/analyze-artist' and http_method == 'POST':
            return handle_analyze_artist(user_id, request_body)
        elif api_path == '/compare-artists' and http_method == 'POST':
            return handle_compare_artists(user_id, request_body)
        else:
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
    return {
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

def handle_discover_artists(user_id: str, request_body: Dict) -> Dict:
    """Handle discovery of new artists based on genre, metrics, and region"""
    try:
        body = json.loads(request_body.get('content', '{}'))
        
        # Extract parameters
        genre = body.get('genre', '').lower()
        region = body.get('region', '')
        min_followers = body.get('min_followers', 0)
        max_followers = body.get('max_followers', 10000000)
        limit = body.get('limit', 5)
        
        # Validate parameters
        if not genre:
            return create_response(400, {'error': 'Genre is required'}, '/discover-artists', 'POST')
            
        # In production, this would call a real API or database
        # For now, use mock data
        artists = []
        if genre in MOCK_ARTISTS_DB:
            artists = MOCK_ARTISTS_DB[genre]
            
        # Apply filters
        if region:
            artists = [a for a in artists if region.lower() in a['region'].lower()]
        artists = [a for a in artists if a['followers'] >= min_followers and a['followers'] <= max_followers]
        
        # Apply limit and sort by growth rate
        artists = sorted(artists, key=lambda x: x['growth_rate'], reverse=True)[:limit]
        
        return create_response(200, {'artists': artists}, '/discover-artists', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error discovering artists: {str(e)}")
        return create_response(500, {'error': str(e)}, '/discover-artists', 'POST')

def handle_analyze_artist(user_id: str, request_body: Dict) -> Dict:
    """Handle analysis of a specific artist's performance and growth metrics"""
    try:
        body = json.loads(request_body.get('content', '{}'))
        
        # Extract parameters
        artist_name = body.get('artist_name', '')
        platform = body.get('platform', 'spotify')
        time_period = body.get('time_period', '90d')
        
        # Validate parameters
        if not artist_name:
            return create_response(400, {'error': 'Artist name is required'}, '/analyze-artist', 'POST')
            
        # In production, this would call a real API or database
        # For now, use mock data
        if artist_name in MOCK_ARTIST_ANALYSIS:
            return create_response(200, {'artist': MOCK_ARTIST_ANALYSIS[artist_name]}, '/analyze-artist', 'POST')
        else:
            return create_response(404, {'error': 'Artist not found'}, '/analyze-artist', 'POST')
        
    except Exception as e:
        logger.error(f"[SCOUT] Error analyzing artist: {str(e)}")
        return create_response(500, {'error': str(e)}, '/analyze-artist', 'POST')

def handle_compare_artists(user_id: str, request_body: Dict) -> Dict:
    """Handle comparison between multiple artists"""
    try:
        body = json.loads(request_body.get('content', '{}'))
        
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