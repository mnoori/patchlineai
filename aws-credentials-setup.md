# AWS Credentials Setup Guide

## Error Diagnosis
You're experiencing a `CredentialsProviderError` which means your Next.js app cannot find AWS credentials to authenticate with DynamoDB.

## Solution: Create a .env.local file

1. Create a file named exactly `.env.local` in the root of your project
2. Add the following content (replace the placeholder values with your actual AWS credentials):

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACTUAL_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_ACTUAL_SECRET_ACCESS_KEY
# Optional if you're using temporary credentials from AWS SSO or similar
# AWS_SESSION_TOKEN=YOUR_SESSION_TOKEN

# DynamoDB table names (these should match your AWS environment)
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging
```

3. **IMPORTANT**: After creating this file, you MUST restart your Next.js development server:
   - Stop the server with Ctrl+C
   - Run `pnpm dev` to start it again

## Troubleshooting

If you still get credential errors after creating `.env.local` and restarting:

1. **Check credential validity**: Make sure your AWS credentials are valid and have permissions to access DynamoDB in the us-east-1 region
2. **Check table names**: Verify the table names match exactly what's in your AWS account
3. **Debug the credentials**: Add this code to the top of your API route to check if the environment variables are being loaded properly:

```typescript
// Add to app/api/user/route.ts at the start of your GET function
console.log("--- AWS Credentials Check ---");
console.log("AWS_REGION:", process.env.AWS_REGION || "NOT SET");
console.log("AWS_ACCESS_KEY_ID exists:", process.env.AWS_ACCESS_KEY_ID ? "YES" : "NO");
console.log("AWS_SECRET_ACCESS_KEY exists:", process.env.AWS_SECRET_ACCESS_KEY ? "YES" : "NO");
console.log("AWS_SESSION_TOKEN exists:", process.env.AWS_SESSION_TOKEN ? "YES" : "NO");
console.log("--- End Credentials Check ---");
```

## Security Note
Never commit your `.env.local` file to version control. It should already be in your `.gitignore` file. 