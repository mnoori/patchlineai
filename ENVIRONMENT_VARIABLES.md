# Environment Variables Documentation

## AWS Amplify Production Environment Variables

This document lists all environment variables required for production deployment on AWS Amplify.

### Core AWS Configuration
- `ACCESS_KEY_ID`: `<set-in-amplify>`
- `SECRET_ACCESS_KEY`: `<set-in-amplify>`
- `REGION_AWS`: `us-east-1`

### AWS Services
- `BEDROCK_AGENT_ID`: `TG2C910JGY`
- `BEDROCK_AGENT_ALIAS_ID`: `HSMSCJ23TU`
- `LAMBDA_EXEC_ROLE_ARN`: `arn:aws:iam::366218382497:role/amplify`

### DynamoDB Tables
- `BLOG_POSTS_TABLE`: `BlogPosts-staging`
- `CONTENT_DRAFTS_TABLE`: `ContentDrafts-staging`
- `EMBEDS_TABLE`: `Embeds-staging`
- `PLATFORM_CONNECTIONS_TABLE`: `PlatformConnections-staging` (Note: This needs to be added to Amplify)

### Application URLs
- `NEXT_PUBLIC_APP_URL`: `https://www.patchline.ai`

### OAuth Integrations

#### Gmail/Google
- `GMAIL_CLIENT_ID`: `<set-in-amplify>`
- `GMAIL_CLIENT_SECRET`: `<set-in-amplify>`
- `GMAIL_REDIRECT_URI`: `http://www.patchline.ai/api/auth/gmail/callback`

#### Spotify
- `SPOTIFY_CLIENT_ID`: `1c3ef44bdb494a4c90c591f56fd4bc37`
- `SPOTIFY_CLIENT_SECRET`: `<set-in-amplify>`
- `SPOTIFY_REDIRECT_URI`: `https://www.patchline.ai/api/oauth/spotify/callback`