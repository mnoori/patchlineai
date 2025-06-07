import json
import os
import logging
import boto3
import requests
from datetime import datetime
from typing import Dict, List, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
SOUNDCHARTS_APP_ID = os.environ.get('SOUNDCHARTS_APP_ID')
SOUNDCHARTS_API_KEY = os.environ.get('SOUNDCHARTS_API_KEY')
SOUNDCHARTS_BASE_URL = 'https://customer.api.soundcharts.com'

# DynamoDB setup
dynamodb = boto3.resource('dynamodb')
WATCHLIST_TABLE = os.environ.get('SCOUT_WATCHLIST_TABLE', 'ScoutWatchlist')

def lambda_handler(event, context):
    """Main Lambda handler for Scout Agent actions"""
    try:
        logger.info(f"Event: {json.dumps(event)}")
        
        # Extract action details
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        request_body = event.get('requestBody', {})
        
        # Extract user ID from session
        user_id = extract_user_id(event)
        if not user_id:
            return create_response(400, {'error': 'User ID not found'}, api_path, http_method)
        
        # Route to appropriate handler
        if api_path == '/search-artists' and http_method == 'POST':
            return handle_search_artists(user_id, request_body)
        elif api_path == '/get-artist-details' and http_method == 'POST':
            return handle_get_artist_details(user_id, request_body)
        elif api_path == '/get-artist-stats' and http_method == 'POST':
            return handle_get_artist_stats(user_id, request_body)
        elif api_path == '/get-playlist-data' and http_method == 'POST':
            return handle_get_playlist_data(user_id, request_body)
        elif api_path == '/track-artist' and http_method == 'POST':
            return handle_track_artist(user_id, request_body)
        elif api_path == '/generate-report' and http_method == 'POST':
            return handle_generate_report(user_id, request_body)
        else:
            return create_response(404, {'error': 'Action not found'}, api_path, http_method)
            
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return create_response(500, {'error': str(e)}, api_path or '/unknown', http_method or 'POST')

def extract_user_id(event: Dict) -> str:
    """Extract user ID from event"""
    # Check sessionState first
    if 'sessionState' in event:
        session_attrs = event['sessionState'].get('sessionAttributes', {})
        if 'userId' in session_attrs:
            return session_attrs['userId']
    
    # Check direct sessionAttributes
    if 'sessionAttributes' in event:
        if 'userId' in event['sessionAttributes']:
            return event['sessionAttributes']['userId']
    
    return None

def soundcharts_request(endpoint: str, method: str = 'GET', params: Dict = None) -> Dict:
    """Make request to Soundcharts API"""
    headers = {
        'x-app-id': SOUNDCHARTS_APP_ID,
        'x-api-key': SOUNDCHARTS_API_KEY,
        'Content-Type': 'application/json'
    }
    
    url = f"{SOUNDCHARTS_BASE_URL}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=params)
        else:
            response = requests.post(url, headers=headers, json=params)
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Soundcharts API error: {str(e)}")
        raise Exception(f"Soundcharts API error: {str(e)}")

def handle_search_artists(user_id: str, request_body: Dict) -> Dict:
    """Search for artists"""
    try:
        # Parse request
        content = parse_request_body(request_body)
        query = content.get('query', '')
        genre = content.get('genre', '')
        location = content.get('location', '')
        career_stage = content.get('career_stage', '')
        
        if not query:
            return create_response(400, {'error': 'Query is required'}, '/search-artists', 'POST')
        
        # Search via Soundcharts
        endpoint = f"/api/v2/artist/search/{query}"
        params = {'limit': 10}
        
        result = soundcharts_request(endpoint, params=params)
        
        # Format response
        artists = []
        for item in result.get('items', []):
            artists.append({
                'id': item.get('uuid'),
                'name': item.get('name'),
                'slug': item.get('slug'),
                'image_url': item.get('imageUrl'),
                'app_url': item.get('appUrl')
            })
        
        return create_response(200, {
            'artists': artists,
            'total': len(artists)
        }, '/search-artists', 'POST')
        
    except Exception as e:
        logger.error(f"Error searching artists: {str(e)}")
        return create_response(500, {'error': str(e)}, '/search-artists', 'POST')

def handle_get_artist_details(user_id: str, request_body: Dict) -> Dict:
    """Get detailed artist information"""
    try:
        content = parse_request_body(request_body)
        artist_id = content.get('artist_id', '')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/get-artist-details', 'POST')
        
        # Get artist metadata
        endpoint = f"/api/v2.9/artist/{artist_id}"
        result = soundcharts_request(endpoint)
        
        artist = result.get('object', {})
        
        # Format response
        details = {
            'id': artist.get('uuid'),
            'name': artist.get('name'),
            'slug': artist.get('slug'),
            'image_url': artist.get('imageUrl'),
            'country_code': artist.get('countryCode'),
            'genres': artist.get('genres', []),
            'biography': artist.get('biography'),
            'career_stage': artist.get('careerStage'),
            'gender': artist.get('gender'),
            'birth_date': artist.get('birthDate')
        }
        
        return create_response(200, details, '/get-artist-details', 'POST')
        
    except Exception as e:
        logger.error(f"Error getting artist details: {str(e)}")
        return create_response(500, {'error': str(e)}, '/get-artist-details', 'POST')

def handle_get_artist_stats(user_id: str, request_body: Dict) -> Dict:
    """Get artist statistics (limited in free tier)"""
    try:
        content = parse_request_body(request_body)
        artist_id = content.get('artist_id', '')
        platform = content.get('platform', 'spotify')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/get-artist-stats', 'POST')
        
        # Note: Stats endpoints require paid tier
        # Return mock data for demo purposes
        stats = {
            'artist_id': artist_id,
            'platform': platform,
            'monthly_listeners': 'Coming soon',
            'followers': 'Coming soon',
            'growth_rate': 'Coming soon',
            'engagement_rate': 'Coming soon',
            'note': 'Detailed stats require Soundcharts paid tier'
        }
        
        return create_response(200, stats, '/get-artist-stats', 'POST')
        
    except Exception as e:
        logger.error(f"Error getting artist stats: {str(e)}")
        return create_response(500, {'error': str(e)}, '/get-artist-stats', 'POST')

def handle_track_artist(user_id: str, request_body: Dict) -> Dict:
    """Add artist to watchlist"""
    try:
        content = parse_request_body(request_body)
        artist_id = content.get('artist_id', '')
        notes = content.get('notes', '')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/track-artist', 'POST')
        
        # Store in DynamoDB
        table = dynamodb.Table(WATCHLIST_TABLE)
        table.put_item(
            Item={
                'user_id': user_id,
                'artist_id': artist_id,
                'notes': notes,
                'added_at': datetime.utcnow().isoformat(),
                'status': 'active'
            }
        )
        
        return create_response(200, {
            'message': 'Artist added to watchlist',
            'artist_id': artist_id
        }, '/track-artist', 'POST')
        
    except Exception as e:
        logger.error(f"Error tracking artist: {str(e)}")
        return create_response(500, {'error': str(e)}, '/track-artist', 'POST')

def handle_generate_report(user_id: str, request_body: Dict) -> Dict:
    """Generate artist report"""
    try:
        content = parse_request_body(request_body)
        artist_id = content.get('artist_id', '')
        report_type = content.get('report_type', 'quick')
        
        if not artist_id:
            return create_response(400, {'error': 'Artist ID is required'}, '/generate-report', 'POST')
        
        # Get artist details
        endpoint = f"/api/v2.9/artist/{artist_id}"
        result = soundcharts_request(endpoint)
        artist = result.get('object', {})
        
        # Generate report based on type
        report = {
            'artist_name': artist.get('name'),
            'report_type': report_type,
            'generated_at': datetime.utcnow().isoformat(),
            'summary': f"{artist.get('name')} is a {artist.get('careerStage', 'emerging')} artist from {artist.get('countryCode', 'Unknown')}.",
            'genres': artist.get('genres', []),
            'career_stage': artist.get('careerStage'),
            'biography': artist.get('biography', 'No biography available'),
            'recommendations': generate_recommendations(artist)
        }
        
        return create_response(200, report, '/generate-report', 'POST')
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return create_response(500, {'error': str(e)}, '/generate-report', 'POST')

def generate_recommendations(artist: Dict) -> List[str]:
    """Generate recommendations based on artist data"""
    recommendations = []
    
    career_stage = artist.get('careerStage', 'emerging')
    
    if career_stage == 'emerging':
        recommendations.append("Focus on playlist placements to increase discovery")
        recommendations.append("Consider TikTok marketing campaigns")
        recommendations.append("Build local fanbase before expanding")
    elif career_stage == 'mid_level':
        recommendations.append("Time to consider label partnerships")
        recommendations.append("Expand touring to new markets")
        recommendations.append("Invest in professional music videos")
    elif career_stage == 'superstar':
        recommendations.append("Maintain momentum with consistent releases")
        recommendations.append("Explore brand partnerships")
        recommendations.append("Consider international expansion")
    
    return recommendations

def parse_request_body(request_body: Dict) -> Dict:
    """Parse request body from Bedrock Agent format"""
    content = request_body.get('content', {})
    
    if isinstance(content, dict):
        app_json = content.get('application/json', {})
        
        # Handle Bedrock Agent properties format
        if 'properties' in app_json and isinstance(app_json['properties'], list):
            parsed = {}
            for prop in app_json['properties']:
                if isinstance(prop, dict) and 'name' in prop:
                    parsed[prop['name']] = prop.get('value')
            return parsed
        else:
            return app_json
    
    return {}

def create_response(status_code: int, body: Dict, api_path: str, http_method: str) -> Dict:
    """Create response for Bedrock Agent"""
    return {
        'messageVersion': '1.0',
        'response': {
            'actionGroup': 'ScoutActions',
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