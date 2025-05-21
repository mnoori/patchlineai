# Development Guide

## AWS Credentials in Amplify SSR Environment

### Problem
When using AWS SDK v3 with Next.js in an Amplify SSR environment, you might encounter `CredentialsProviderError: Could not load credentials from any providers` despite having correctly set up environment variables.

### Solution
For AWS SDK v3 in Amplify SSR, ensure credentials are explicitly provided:

1. Set these environment variables in Amplify:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   
2. When initializing DynamoDB clients, use explicit credentials:
   ```typescript
   const ddbClient = new DynamoDBClient({ 
     region: process.env.AWS_REGION || "us-east-1",
     credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
       ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
     } : undefined
   });
   ```

3. Important notes:
   - Amplify SSR environment does not automatically use the service role for credentials
   - The credential provider chain works differently in SSR context
   - Logging env variable presence (not values) helps diagnose issues 