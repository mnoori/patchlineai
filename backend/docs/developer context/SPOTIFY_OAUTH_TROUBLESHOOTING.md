# Spotify OAuth Troubleshooting Guide

This guide helps resolve Spotify OAuth connection issues in PatchlineAI.

## 🚨 Current Issue: Client Secret Not Loading

**Error in CloudWatch logs:**
```
[OAuth spotify Init] Client Secret: NOT SET
[OAuth spotify Init] WARNING: Spotify client secret not set - OAuth callback will fail
```

## 🔍 Root Cause Analysis

The issue occurs because:
1. Environment variables are not properly loaded in the production environment
2. Amplify environment variables may not be mapped correctly
3. The configuration system needs to handle both local and production environments

## 🛠️ Solution Steps

### Step 1: Check Environment Variables in Amplify

In your Amplify console, verify these environment variables are set:

```bash
SPOTIFY_CLIENT_ID=1c3ef44bdb494a4c90c591f56fd4bc37
SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://www.patchline.ai/api/oauth/spotify/callback
```

**Note:** You mentioned you have these set, but let's verify the exact names match.

### Step 2: Local Development Setup

1. **Run the setup script:**
   ```bash
   pnpm setup-env
   ```

2. **Or manually create `.env.local`:**
   ```bash
   # Copy the template
   cp env-template.txt .env.local
   
   # Edit with your actual Spotify client secret
   # Replace 'your_spotify_client_secret_here' with the real value
   ```

3. **Verify environment variables:**
   ```bash
   pnpm check-env
   ```

### Step 3: Test Locally

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Check the logs for environment variable loading:**
   - Open browser console
   - Navigate to: `http://localhost:3000/api/auth/spotify`
   - Check server logs for environment variable status

3. **Expected output:**
   ```
   [OAuth spotify Init] Environment: development
   [OAuth spotify Init] Available env vars: {
     SPOTIFY_CLIENT_ID: true,
     SPOTIFY_CLIENT_SECRET: true,
     SPOTIFY_REDIRECT_URI: true,
     NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
   }
   [OAuth spotify Init] Client ID: SET
   [OAuth spotify Init] Client Secret: SET
   ```

### Step 4: Production Deployment

1. **Verify Amplify environment variables:**
   - Go to Amplify Console → Your App → Environment variables
   - Ensure all variables are set without the `@` prefix
   - Redeploy if you made changes

2. **Check build logs:**
   - Look for environment variable loading during build
   - Verify no errors in the deployment process

## 🔧 Configuration Details

### Environment Variable Mapping

The app looks for these environment variables in this order:

1. **Spotify Client Secret:**
   - `SPOTIFY_CLIENT_SECRET` (primary)

2. **Spotify Redirect URI:**
   - `SPOTIFY_REDIRECT_URI` (explicit)
   - `SPOTIFY_LOCAL_REDIRECT_URI` (local development)
   - Auto-generated from `NEXT_PUBLIC_APP_URL` (fallback)

### Redirect URI Logic

The system automatically handles different environments:

- **Production:** Uses `https://www.patchline.ai/api/oauth/spotify/callback`
- **Development:** Uses `http://127.0.0.1:3000/api/oauth/spotify/callback`

### Spotify App Configuration

Ensure your Spotify app has these redirect URIs:
- `https://www.patchline.ai/api/oauth/spotify/callback`
- `https://master.d40rmftf5h7p7.amplifyapp.com/api/oauth/spotify/callback`
- `http://127.0.0.1:3000/api/oauth/spotify/callback`

## 🧪 Testing Checklist

### Local Development
- [ ] `.env.local` file exists
- [ ] `SPOTIFY_CLIENT_SECRET` is set in `.env.local`
- [ ] `pnpm check-env` shows all Spotify variables as SET
- [ ] OAuth flow starts without errors
- [ ] Callback completes successfully

### Production
- [ ] Amplify environment variables are set
- [ ] Build completes without errors
- [ ] CloudWatch logs show "Client Secret: SET"
- [ ] OAuth flow works end-to-end

## 🐛 Common Issues & Solutions

### Issue: "Client Secret: NOT SET" in production

**Cause:** Environment variable not properly set in Amplify

**Solution:**
1. Check Amplify Console → Environment variables
2. Ensure `SPOTIFY_CLIENT_SECRET` is set (no `@` prefix)
3. Redeploy the application
4. Check CloudWatch logs after deployment

### Issue: "Invalid redirect URI" error

**Cause:** Redirect URI mismatch between app and Spotify app settings

**Solution:**
1. Check your Spotify app settings
2. Ensure all redirect URIs are added
3. Use exact URLs (no trailing slashes)

### Issue: OAuth works locally but fails in production

**Cause:** Environment differences

**Solution:**
1. Compare local `.env.local` with Amplify environment variables
2. Ensure production URLs are correct
3. Check CloudWatch logs for detailed error messages

## 📋 Debug Commands

```bash
# Check environment setup
pnpm check-env

# Setup environment variables
pnpm setup-env

# Start development server with debug logs
pnpm dev

# Test OAuth endpoint directly
curl http://localhost:3000/api/auth/spotify
```

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use Amplify environment variables for production secrets
- Rotate client secrets if they've been exposed
- Monitor CloudWatch logs for security issues

## 📞 Getting Help

If issues persist:

1. **Check CloudWatch logs** for detailed error messages
2. **Verify Spotify app settings** in Spotify Developer Dashboard
3. **Test locally first** before deploying to production
4. **Compare working vs. non-working configurations**

## 🎯 Quick Fix for Current Issue

Based on your current setup, try this immediate fix:

1. **In Amplify Console:**
   - Verify `SPOTIFY_CLIENT_SECRET` environment variable
   - Ensure it has the actual secret value (not placeholder text)
   - Redeploy the application

2. **Check the deployment:**
   - Monitor CloudWatch logs during deployment
   - Look for the OAuth initialization logs
   - Verify "Client Secret: SET" appears in logs

3. **Test the OAuth flow:**
   - Go to your production site
   - Navigate to Settings → Platforms
   - Try connecting Spotify
   - Check for success/error messages 