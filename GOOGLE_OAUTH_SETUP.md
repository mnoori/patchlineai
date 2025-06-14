# Google OAuth Setup Instructions

To enable Google Drive authentication in your application, you need to set up OAuth 2.0 credentials in Google Cloud Console.

## Steps to Configure Google OAuth

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" for user type
   - Fill in the required fields (app name, support email, etc.)
   - Add your domain to authorized domains
   - Add the following scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

4. For the OAuth client:
   - Application type: "Web application"
   - Name: "Patchline Music Platform"
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

### 3. Add Environment Variables
Add the following to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Zapier MCP Configuration (already added)
ZAPIER_MCP_URL=https://mcp.zapier.com/api/mcp/s/•••••••/mcp
ZAPIER_OAUTH_URL=https://mcp.zapier.com/api/mcp/a/23317446/mcp?serverId=e8c2648d-ea7a-4415-8db7-f411a83396eb
```

### 4. Test the Integration
1. Start your development server: `npm run dev`
2. Navigate to Settings > Platforms
3. Find Google Drive and click "Connect Google Drive"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## Security Notes
- Never commit your client secret to version control
- Use environment variables for all sensitive credentials
- In production, ensure all redirect URIs use HTTPS
- Regularly rotate your client secrets

## Troubleshooting
- If you get a redirect URI mismatch error, ensure the URI in Google Console exactly matches your app's callback URL
- Make sure the Google Drive API is enabled in your project
- Check that all required scopes are added to your OAuth consent screen 