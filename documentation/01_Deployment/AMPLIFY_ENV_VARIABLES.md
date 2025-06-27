# Amplify Environment Variables Configuration

## Required Environment Variables for Production

Add these environment variables in the Amplify Console under App Settings > Environment Variables:

### Core AWS Configuration
```
AWS_REGION=us-east-1
ACCESS_KEY_ID=<your-access-key>
SECRET_ACCESS_KEY=<your-secret-key>
```

### Cognito Authentication (Required)
```
NEXT_PUBLIC_USER_POOL_ID=us-east-1_GR9FnEy6A
NEXT_PUBLIC_USER_POOL_CLIENT_ID=3fvlab6j9ioag5ce7r90fkjm78
NEXT_PUBLIC_IDENTITY_POOL_ID=<your-identity-pool-id>
```

### Bedrock Agent IDs (Optional - will fallback to chat mode if not set)
```
# Gmail Agent
BEDROCK_GMAIL_AGENT_ID=2X5IXYPR9C
BEDROCK_GMAIL_AGENT_ALIAS_ID=9W9I1MFHAE

# Legal Agent
BEDROCK_LEGAL_AGENT_ID=IFG9MC5ORA
BEDROCK_LEGAL_AGENT_ALIAS_ID=ED2AJTY2HF

# Supervisor Agent
BEDROCK_SUPERVISOR_AGENT_ID=RH5QK3WOWU
BEDROCK_SUPERVISOR_AGENT_ALIAS_ID=ILHZGPX3JJ

# Blockchain Agent
BEDROCK_BLOCKCHAIN_AGENT_ID=OO7395LRBY
BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID=4756GPGRAJ

# Scout Agent
BEDROCK_SCOUT_AGENT_ID=1R8VKEVBK2
BEDROCK_SCOUT_AGENT_ALIAS_ID=PFSXQHBTUJ

# Legacy support (optional)
BEDROCK_AGENT_ID=<any-default-agent-id>
BEDROCK_AGENT_ALIAS_ID=<any-default-alias-id>
```

### DynamoDB Tables
```
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging
PLATFORM_CONNECTIONS_TABLE=PlatformConnections-staging
```

### Platform Integrations
```
# Spotify
SPOTIFY_CLIENT_ID=1c3ef44bdb494a4c90c591f56fd4bc37
SPOTIFY_CLIENT_SECRET=<your-spotify-secret>
SPOTIFY_REDIRECT_URI=https://www.patchline.ai/api/oauth/spotify/callback

# Gmail
GMAIL_CLIENT_ID=106321540840-ms24e2kmgk1ebp7tf0217aq45ccb1ep4.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=<your-gmail-secret>
GMAIL_REDIRECT_URI=https://www.patchline.ai/api/auth/gmail/callback
```

### Other Configuration
```
NEXT_PUBLIC_APP_URL=https://www.patchline.ai
NODE_ENV=production
LAMBDA_EXEC_ROLE_ARN=arn:aws:iam::366218382497:role/amplify
```

## Important Notes

1. **Agent IDs**: If any Bedrock agent IDs are missing or invalid, the system will automatically fallback to chat mode using the base Bedrock model.

2. **Cognito**: The User Pool ID and Client ID are REQUIRED for authentication to work. Without these, users cannot log in.

3. **AWS Credentials**: Ensure the AWS credentials have permissions for:
   - Bedrock (InvokeAgent, InvokeModel)
   - DynamoDB (Read/Write to the tables)
   - Lambda (if using Lambda functions)
   - Secrets Manager (for OAuth secrets)

4. **Gmail Token Expiry**: If users see "Token has been expired or revoked" errors, they need to re-authenticate their Gmail account in Settings.

## Verifying Configuration

After setting environment variables, you can verify them by:

1. Check the build logs in Amplify for any missing variable warnings
2. Visit `/api/health` endpoint to see system status
3. Try logging in to verify Cognito is working
4. Test agent mode to see if agents are properly configured

## Troubleshooting

### "Auth UserPool not configured"
- Add the three NEXT_PUBLIC Cognito variables listed above

### "Failed to retrieve resource because it doesn't exist"
- The agent IDs are incorrect or the agents don't exist in your AWS account
- System will fallback to chat mode automatically

### "Token has been expired or revoked" (Gmail)
- User needs to re-authenticate Gmail in Settings
- Check that Gmail OAuth app is still active in Google Cloud Console 