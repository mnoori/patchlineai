# AWS Credentials Fix Guide

## The Problem

Your application is encountering a `CredentialsProviderError` with the message:
```
Error fetching user data for 14287408-6011-70b3-5ac6-089f0cafdc10: Error [CredentialsProviderError]: Could not load credentials from any providers
```

This means the AWS SDK cannot find valid credentials to authenticate with DynamoDB.

## Step 1: Create a .env.local file

Create a file named exactly `.env.local` in your project root directory (C:\Users\mehdi\code\patchlinerepo) with the following content:

```
# AWS Region (matching your DynamoDB tables)
AWS_REGION=us-east-1

# AWS Credentials - Replace with your actual keys
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY_HERE

# Optional: Session token if using AWS SSO or temporary credentials
# AWS_SESSION_TOKEN=YOUR_SESSION_TOKEN_HERE

# DynamoDB Table Names
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging
```

Replace `YOUR_ACCESS_KEY_ID_HERE` and `YOUR_SECRET_ACCESS_KEY_HERE` with your actual AWS credentials.

## Step 2: Restart the Development Server

Next.js only loads environment variables at startup, so you must restart your development server:

1. Stop the server (press Ctrl+C in your terminal)
2. Run `pnpm dev` to start it again

## Step 3: Test with the Credential Checker

Run the AWS credentials checker script to validate your AWS setup:

```
node check-aws-credentials.mjs
```

This will:
- Verify your credentials are properly loaded
- Test connectivity to AWS DynamoDB
- Check if your required tables exist

## Step 4: Troubleshooting

If you still get the credential error after following these steps:

1. **Credential Validity**: Make sure your credentials are valid and not expired
   - Try using the AWS CLI command: `aws sts get-caller-identity`
   - If this fails, your credentials are invalid or expired

2. **IAM Permissions**: Ensure your AWS user has permissions for DynamoDB
   - The user needs at least these permissions: `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:Query`
   - Consider attaching the `AmazonDynamoDBFullAccess` policy for testing

3. **Table Existence**: Confirm your tables exist in the specified region
   - Check the AWS Console or run: `aws dynamodb list-tables --region us-east-1`
   - Tables needed: `Users-staging`, `Embeds-staging`, `BlogPosts-staging`, `ContentDrafts-staging`

4. **Local AWS Configuration**: If you're using the AWS CLI, check your local AWS config:
   - Look at `~/.aws/credentials` and `~/.aws/config`
   - Make sure the default profile or the profile you're using has valid credentials

5. **Alternative Approach**: As a backup option, you can set AWS credentials directly in your code:
   ```javascript
   const ddbClient = new DynamoDBClient({ 
     region: "us-east-1",
     credentials: {
       accessKeyId: "YOUR_ACCESS_KEY_ID",
       secretAccessKey: "YOUR_SECRET_ACCESS_KEY"
     }
   });
   ```
   Note: This is less secure and should only be used temporarily for debugging.

## Important Security Note

Never commit your `.env.local` file to Git. It contains sensitive credentials and should remain private to your development environment. 