# API Integrations

## Soundcharts API

### Overview
The Scout agent uses the Soundcharts API to retrieve real-time data about artists in the music industry. This integration allows users to discover and analyze promising talent with accurate metadata and insights.

### Authentication
Authentication is handled via API keys:
- App ID: `PATCHLINE_A2F4F819`
- API Key: `d8e39c775adc8797`

These should be added to your environment variables in `.env.local`.

### Available Endpoints
The current API tier includes the following endpoints:

| Endpoint | Status | Description |
|----------|--------|-------------|
| `/api/v2/artist/search/{term}` | ✅ Working | Search for artists by name |
| `/api/v2.9/artist/{uuid}` | ✅ Working | Get detailed artist metadata |
| `/api/v2/artist/{uuid}/current/stats` | ❌ Not in plan | Get streaming metrics & stats |
| `/api/v2/artist/{uuid}/playlist/current/{platform}` | ❌ Not in plan | Get playlist appearances |

### Implementation Details

#### Architecture
1. **Backend Proxy**: A Next.js API route at `/api/soundcharts` handles API requests, avoiding CORS issues and securing credentials
2. **Service Layer**: TypeScript interfaces and classes manage API communication
3. **Client Layer**: React hooks and components consume the service

#### Key Files
- `app/api/soundcharts/route.ts`: API proxy endpoint
- `lib/services/soundcharts.ts`: TypeScript interfaces and types
- `lib/services/soundcharts-client.ts`: Client-side service with caching
- `app/dashboard/agents/scout/page.tsx`: Scout agent implementation

#### Quota Management
- Current free tier: 200 API calls per month
- Current usage: 188/200 remaining (as of June 6, 2023)
- Local caching implemented to minimize API usage (30-day TTL)

#### Data Enhancements
For data not available in our current API tier, we implement:
- Intelligent mock data generation based on career stage
- "Coming soon" placeholders in the UI
- Summaries generated from real artist biography data

### Testing
Use the test script to verify API connectivity:
```bash
node scripts/test-soundcharts.js
```

## Future API Integrations

### Planned Integrations
- **Spotify API**: For streaming data and playlist management
- **YouTube API**: For video performance metrics
- **Instagram API**: For social media engagement data

### Integration Roadmap
1. **Phase 1**: Core Soundcharts integration ✅
2. **Phase 2**: Spotify API integration
3. **Phase 3**: Social media platforms
4. **Phase 4**: Distribution platforms 