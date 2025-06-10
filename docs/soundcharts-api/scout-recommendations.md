# Soundcharts API Recommendations for Scout Agent

## Current Issues with Our Implementation

1. **Text Search Problem**: We're using `/api/v2/artist/search/{term}` with literal genre names
   - Searching "electronic" finds an artist named "Electronic"
   - This is not how we should discover artists by genre

## Better Approaches Available

### 1. Use POST /api/v2/top/artists (Recommended)
This endpoint allows filtering by:
- **Genres**: Proper genre filtering instead of text search
- **Career Stage**: superstar, mainstream, mid_level, long_tail
- **Country**: Target specific markets
- **Metrics**: Sort by followers, monthly listeners, etc.

```json
POST /api/v2/top/artists
{
  "sort": {
    "platform": "spotify",
    "metricType": "monthly_listeners", 
    "sortBy": "total",
    "order": "desc"
  },
  "filters": [
    {
      "type": "genre",
      "data": {
        "values": ["electronic", "hip-hop"],
        "operator": "in"
      }
    },
    {
      "type": "careerStage", 
      "data": {
        "values": ["mid_level", "long_tail"],
        "operator": "in"
      }
    }
  ]
}
```

### 2. Get Available Genres First
Use `GET /api/v2/referential/artist/genres` to get proper genre IDs

### 3. Smart Filtering Options
Available filter types:


## Implementation Plan

1. **Replace genre mapping** with proper genre API calls
2. **Use /api/v2/top/artists** instead of search for discovery
3. **Implement career stage filtering** based on user preferences  
4. **Add market/country filtering** for geographic preferences
5. **Sort by relevant metrics** (monthly listeners, followers, etc.)

## Key Endpoints for Scout Agent

- **GET** /api/v2/artist/search/{term}: Search artist by name
- **GET** /api/v2/song/search/{term}: Search song by name
- **GET** /api/v2/playlist/search/{term}: Search playlist by name
- **GET** /api/v2/radio/search/{term}: Search radio by name
- **GET** /api/v2/festival/search/{term}: Search festival by name
- **GET** /api/v2/venue/search/{term}: Search venue by name
- **GET** /api/v2/search/external/url: Get Soundcharts URL from platform URL
- **POST** /api/v2/top/artists: Get artists
- **GET** /api/v2.9/artist/{uuid}: Get artist metadata
- **GET** /api/v2.9/artist/by-platform/{platform}/{identifier}: Get artist by platform ID

Generated on: 2025-06-10T01:43:27.586Z
