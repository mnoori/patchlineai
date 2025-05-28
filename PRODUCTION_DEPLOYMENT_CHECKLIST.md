# Production Deployment Checklist

## Pre-Deployment Steps Completed ✓

### 1. Code Changes
- [x] Set `IS_DEVELOPMENT_MODE = false` in `lib/config.ts`
- [x] Set `DEVELOPMENT_MODE = false` in `lib/config.ts`
- [x] Set `DEMO_MODE = false` in `lib/config.ts`
- [x] Removed unused Amplify authentication imports
- [x] Build passes successfully with `npm run build`

### 2. Environment Variables Added to Amplify
- [x] `PLATFORM_CONNECTIONS_TABLE`: `PlatformConnections-staging`
- [x] All existing environment variables from `ENVIRONMENT_VARIABLES.md`

## Deployment Steps

### 1. Update OAuth Redirect URIs in Provider Consoles

#### Google (Gmail)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Update redirect URI to: `https://www.patchline.ai/api/auth/gmail/callback`

#### Spotify
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Update redirect URI to: `https://www.patchline.ai/api/oauth/spotify/callback`

### 2. Generate Production Secrets
```bash
# Generate these locally and add to Amplify environment variables
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
```

### 3. Add Missing Environment Variables to Amplify
- `NODE_ENV`: `production`
- `NEXTAUTH_URL`: `https://www.patchline.ai`
- `NEXTAUTH_SECRET`: (generated above)
- `JWT_SECRET`: (generated above)

### 4. Force Push to Master
```bash
git add -A
git commit -m "Production deployment: Disable development mode and fix build issues"
git push origin v2-production-ready:master --force
```

### 5. Monitor Deployment
1. Watch Amplify Console for build progress
2. Check for any build errors
3. Verify deployment completes successfully

## Post-Deployment Verification

### 1. Test Core Functionality
- [ ] User can sign up/login
- [ ] Gmail connection works
- [ ] Spotify connection works
- [ ] Instagram embed displays correctly
- [ ] All agent pages load
- [ ] Dashboard displays correct platform connection status

### 2. Fix Platform Connection Display
The issue with platform connections showing incorrectly needs to be addressed:
- Gmail shows as disconnected even when connected
- Instagram shows as disconnected even when connected
- Count shows "4 out of 9" but may be incorrect

**Root Cause**: The platform connections are stored under different keys:
- Gmail auth stores as `google` in the database
- Frontend expects `gmail` for Gmail and `google` for Google Calendar

### 3. Database Considerations
Currently using `-staging` suffix for all tables. Consider:
- Keep using staging tables for now
- Plan migration to production tables in future release

## Known Issues to Address Post-Deployment

1. **Platform Connection Mapping**
   - Need to update the platform connection logic to properly map:
     - `google` → both Gmail and Google Calendar
     - Or store Gmail separately as `gmail`

2. **Content Draft Functions**
   - Warning about missing exports in `@/lib/blog-db`
   - Non-critical but should be fixed in next release

3. **TypeScript Errors**
   - Various type errors in `app/dashboard/agents/fan/page.tsx`
   - Should be addressed but don't block functionality

## Rollback Plan

If issues occur after deployment:
1. Revert to previous commit in Amplify Console
2. Set development mode flags back to `true` if needed
3. Investigate and fix issues
4. Re-deploy when ready

## Next Steps After Successful Deployment

1. Update DNS if needed
2. Enable CloudWatch monitoring
3. Set up error tracking (Sentry)
4. Configure backup strategy
5. Plan for fixing the platform connection display issue 