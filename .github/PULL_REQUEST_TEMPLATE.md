# Pull Request

## Description
This PR adds Soundcharts API integration to the Scout agent, replacing mock artist data with real-time information. It also fixes a critical issue with the Supervisor agent.

## Changes
- Added Soundcharts API service with TypeScript interfaces
- Created API proxy to handle CORS and protect credentials
- Updated Scout agent to fetch real artist data
- Added error handling and fallbacks for unavailable metrics
- Fixed DependencyFailedException in Supervisor agent

## New Environment Variables
```
SOUNDCHARTS_APP_ID=PATCHLINE_A2F4F819
SOUNDCHARTS_API_KEY=d8e39c775adc8797
```

## Testing
- [x] Verified Scout agent loads with real artist data
- [x] Confirmed artist search works with correct data
- [x] Validated error handling for metrics not in free tier
- [x] Tested Supervisor agent fixes
- [x] Added API test script

## API Quota
Current usage: 188/200 calls remaining

## Screenshots
*Attach screenshots of the updated Scout agent UI*

## Reviewer Notes
- The Soundcharts free tier is limited to 200 API calls per month
- Local caching is implemented to conserve quota
- The "Coming soon" placeholders are by design for metrics not in our plan 