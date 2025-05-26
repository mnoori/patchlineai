# PatchlineAI Platform Integration Guide

This guide will help you connect your music platforms (Spotify, Gmail, SoundCloud, Instagram) to PatchlineAI.

## Overview

PatchlineAI uses OAuth 2.0 to securely connect to your platforms. This means:
- You never share your passwords with PatchlineAI
- You can revoke access at any time
- Connections are secure and encrypted

## Current Implementation Status

### ✅ Infrastructure Ready
- OAuth authentication routes (`/api/auth/[provider]`)
- OAuth callback handlers (`/api/oauth/[provider]/callback`)
- Token storage in AWS DynamoDB
- Settings page integration

### 🚧 Platform Setup Required

## Platform-Specific Setup Instructions

### 1. Spotify Integration

**Status**: Ready to connect (credentials configured)

**What you can do once connected:**
- Sync your music catalog
- Track streaming analytics
- Manage playlists
- Upload new releases

**To Connect:**
1. Go to Settings → Platforms in your dashboard
2. Click "Connect" next to Spotify
3. Log in with your Spotify account
4. Authorize PatchlineAI

**Developer Setup (already done):**
- App created in Spotify Developer Dashboard
- Client ID: `1c3ef44bdb494a4c90c591f56fd4bc37`
- Redirect URI: `http://localhost:3000/api/oauth/spotify/callback`

### 2. Google/Gmail Integration

**Status**: Requires Google Cloud setup

**What you can do once connected:**
- Send automated emails
- Sync calendar events
- Manage contacts
- Schedule releases

**Setup Required:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/oauth/google/callback`
6. Add your email as a test user

**To Connect:**
1. Add Google credentials to your `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
2. Restart your app
3. Go to Settings → Platforms
4. Click "Connect" next to Gmail

### 3. SoundCloud Integration

**Status**: Requires SoundCloud app registration

**What you can do once connected:**
- Sync your tracks
- Track plays and likes
- Upload new content
- Manage your profile

**Setup Required:**
1. Go to [SoundCloud Apps](https://soundcloud.com/you/apps)
2. Register a new app
3. Add redirect URI: `http://localhost:3000/api/oauth/soundcloud/callback`
4. Get your Client ID and Secret

**To Connect:**
1. Add SoundCloud credentials to your `.env.local`:
   ```
   SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
   SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
   ```
2. Restart your app
3. Go to Settings → Platforms
4. Click "Connect" next to SoundCloud

### 4. Instagram Integration

**Status**: Requires Meta app setup

**What you can do once connected:**
- Post content
- Track engagement
- Schedule posts
- Analyze insights

**Setup Required:**
1. Convert your Instagram to a Business account
2. Link a Facebook Page
3. Go to [Meta Developers](https://developers.facebook.com)
4. Create a new app
5. Add Instagram Basic Display and Instagram Graph API
6. Add redirect URI: `http://localhost:3000/api/oauth/instagram/callback`

**To Connect:**
1. Add Instagram credentials to your `.env.local`:
   ```
   INSTAGRAM_CLIENT_ID=your_instagram_app_id
   INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
   ```
2. Restart your app
3. Go to Settings → Platforms
4. Click "Connect" next to Instagram

## Environment Variables Summary

Add these to your `.env.local` file:

```bash
# Spotify (already configured)
SPOTIFY_CLIENT_ID=1c3ef44bdb494a4c90c591f56fd4bc37
SPOTIFY_CLIENT_SECRET=776872529edd4a79b615ac4c32eca36e
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/oauth/spotify/callback

# Google/Gmail (needs setup)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# SoundCloud (needs setup)
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret
SOUNDCLOUD_REDIRECT_URI=http://localhost:3000/api/oauth/soundcloud/callback

# Instagram (needs setup)
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/oauth/instagram/callback
```

## Testing the Connections

1. **Start your app**:
   ```bash
   pnpm dev
   ```

2. **Navigate to Settings**:
   - Go to `http://localhost:3000/dashboard/settings`
   - Click on the "Platforms" tab

3. **Connect a Platform**:
   - Click "Connect" next to any platform
   - You'll be redirected to the platform's login
   - Authorize PatchlineAI
   - You'll be redirected back with a success message

## Token Storage

All OAuth tokens are securely stored in AWS DynamoDB:
- Table: `PlatformConnections-staging`
- Encrypted at rest
- Automatic token refresh (where supported)

## Troubleshooting

### "Platform not configured" error
- Ensure you've added the client ID and secret to `.env.local`
- Restart your development server

### "Invalid redirect URI" error
- Make sure the redirect URI in your platform app matches exactly
- For local development: `http://localhost:3000/api/oauth/[platform]/callback`
- For production: Update to your production URL

### "Access denied" error
- For Google: Add your email as a test user
- For Instagram: Ensure your account is a Business account
- Check that all required APIs are enabled

## Security Notes

1. **Never commit credentials**: Keep your `.env.local` file out of version control
2. **Use environment variables**: All secrets should be in environment variables
3. **Rotate secrets regularly**: Change your client secrets periodically
4. **Monitor access**: Review connected apps in each platform's settings

## Next Steps

Once platforms are connected, you can:
1. View analytics in the Insights dashboard
2. Schedule content across platforms
3. Sync your music catalog
4. Automate your workflow with AI agents

For production deployment, update all redirect URIs to your production domain. 