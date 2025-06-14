# Soundcharts API Integration Guide

## Overview

The Scout agent now uses real-time data from Soundcharts API to provide music industry professionals with accurate, up-to-date artist discovery and analytics.

## Features

### Real-Time Artist Data
- **Streaming Metrics**: Spotify monthly listeners, follower counts, growth rates
- **Social Media Stats**: Instagram, TikTok, YouTube follower counts and engagement
- **Soundcharts Score**: Proprietary growth and performance scoring
- **Playlist Placements**: Current playlist features across platforms
- **Career Stage Classification**: Emerging, mid-level, mainstream, superstar

### Enhanced Scout Agent Capabilities
1. **Trending Artist Discovery**: Find rapidly growing artists filtered by career stage
2. **Smart Search**: Search artists by name with instant results
3. **Watchlist Management**: Save and track artists of interest (persisted locally)
4. **Growth Analytics**: Real-time growth percentages and trend analysis
5. **Revenue Estimation**: Potential revenue calculations based on streaming data

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Scout Agent UI                           │
├─────────────────────────────────────────────────────────────┤
│              soundchartsClient (Frontend)                   │
│                 ↓ HTTP Requests ↓                           │
├─────────────────────────────────────────────────────────────┤
│           Next.js API Route (/api/soundcharts)             │
│         (Proxy with CORS handling & API keys)              │
│                 ↓ HTTPS Requests ↓                          │
├─────────────────────────────────────────────────────────────┤
│              Soundcharts API (External)                     │
│         https://customer.api.soundcharts.com               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Soundcharts Service** (`lib/services/soundcharts.ts`)
   - TypeScript types for all API responses
   - Server-side service with caching (24-hour TTL)
   - Helper methods for data formatting

2. **Soundcharts Client** (`lib/services/soundcharts-client.ts`)
   - Client-side API wrapper
   - Handles API communication through Next.js proxy
   - Formats data for Scout UI components

3. **API Proxy Route** (`app/api/soundcharts/route.ts`)
   - Protects API credentials
   - Handles CORS
   - Monitors API quota usage

4. **Scout Agent Page** (`app/dashboard/agents/scout/page.tsx`)
   - Real-time data fetching with loading states
   - Debounced search (500ms delay)
   - Local watchlist persistence
   - Error handling and retry logic

## API Credentials

```env
SOUNDCHARTS_APP_ID=PATCHLINE_A2F4F819
SOUNDCHARTS_API_KEY=d8e39c775adc8797
SOUNDCHARTS_API_URL=https://customer.api.soundcharts.com
```

**Quota**: 200 free API calls per month

## Usage Guide

### Testing the Integration

1. **Test Endpoint**: Navigate to `/api/soundcharts/test` to verify the integration
2. **Scout Agent**: Go to Dashboard → Agents → Scout to see live data

### API Endpoints Used

| Endpoint | Purpose | Quota Cost |
|----------|---------|------------|
| `/api/v2/top/artists` | Get trending artists | 1 call |
| `/api/v2/search/artist` | Search artists by name | 1 call |
| `/api/v2.9/artist/{uuid}` | Get artist metadata | 1 call |
| `/api/v2/artist/{uuid}/current/stats` | Get current stats | 1 call |
| `/api/v2.20/artist/{uuid}/playlist/current/{platform}` | Get playlist data | 1 call |

### Optimization Strategies

1. **Caching**: 24-hour cache for all API responses
2. **Batch Loading**: Fetch only top 10 artists initially
3. **Progressive Enhancement**: Load basic data first, details on demand
4. **Debounced Search**: Prevent excessive API calls during typing

## Data Mapping

### Soundcharts → Scout UI

| Soundcharts Field | Scout UI Field | Transformation |
|-------------------|----------------|----------------|
| `artist.name` | `name` | Direct mapping |
| `artist.genres[0]` | `genre` | First genre as primary |
| `stats.score.soundcharts` | `matchScore` | Direct mapping |
| `stats.score.growth` | `growthScore` | Direct mapping |
| `audience.spotify.followers` | `growth` | Calculate % change |
| `streaming.spotify.monthly_listeners` | `streams`, `monthlyListeners` | Format as "1.2M" |
| `artist.careerStage` | `careerStage` | Direct mapping |
| Playlist data | `playlistMatches` | Extract playlist names |

## Error Handling

1. **API Errors**: Graceful fallback with error messages
2. **Rate Limiting**: Monitor quota headers, show warnings
3. **Network Issues**: Retry logic with exponential backoff
4. **Data Validation**: Safe property access with optional chaining

## Future Enhancements

1. **Advanced Filters**: Genre, location, growth rate filters
2. **TikTok Integration**: Viral content tracking
3. **Chart Performance**: Billboard, Spotify chart positions
4. **Export Functionality**: CSV/PDF reports
5. **Automated Alerts**: Notify when artists hit growth thresholds

## Troubleshooting

### Common Issues

1. **No Data Loading**
   - Check API credentials in `.env.local`
   - Verify API quota hasn't been exceeded
   - Check browser console for errors

2. **Slow Performance**
   - Clear cache if data seems stale
   - Check network tab for API response times

3. **Missing Artist Data**
   - Some artists may not have complete data
   - Soundcharts coverage varies by platform

### Debug Mode

Add `?debug=true` to Scout agent URL to see:
- API call logs in console
- Response times
- Cache hit/miss rates

## Maintenance

### Monthly Tasks
1. Monitor API usage to stay within quota
2. Review and optimize cached data
3. Update artist filters based on user feedback

### Updating API Credentials
1. Update `.env.local` with new credentials
2. Restart development server
3. Clear browser cache

## Support

For issues or questions:
1. Check Soundcharts API status: https://status.soundcharts.com/
2. Review API documentation: https://doc.api.soundcharts.com/
3. Contact Soundcharts support for API issues 