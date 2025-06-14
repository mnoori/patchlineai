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
   \`\`\`typescript
   const ddbClient = new DynamoDBClient({ 
     region: process.env.AWS_REGION || "us-east-1",
     credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
       ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
     } : undefined
   });
   \`\`\`

3. Important notes:
   - Amplify SSR environment does not automatically use the service role for credentials
   - The credential provider chain works differently in SSR context
   - Logging env variable presence (not values) helps diagnose issues 

## AWS Bedrock Integration

### Setup

1. Ensure your AWS user/role has permissions for Amazon Bedrock:
   - Required permissions: `bedrock:InvokeModel`
   - Model access must be granted in the Bedrock console

2. Add environment variables:
   \`\`\`
   # AWS Bedrock Configuration
   BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
   \`\`\`

3. Available Bedrock models:
   - `anthropic.claude-3-haiku-20240307-v1:0` (fastest, lowest cost)
   - `anthropic.claude-3-sonnet-20240229-v1:0` (higher quality)
   - `amazon.titan-text-lite-v1:0` (Amazon's model)
   - `amazon.nova-microns-v0:0` (Very small model)
   - `cohere.command-text-v14:0` (Cohere's model)

### Usage

The content generation API now uses Bedrock to generate high-quality content. When a user:

1. Enters a topic and options in the content creator form
2. Clicks "Generate Content"
3. The app will:
   - Create a draft record in DynamoDB
   - Send the prompt to Amazon Bedrock
   - Update the draft with the generated content

If Bedrock is unavailable or fails, the system will fall back to mock content generation.

### Cost Considerations

AWS Bedrock is billed based on tokens processed:
- Input tokens: ~$0.50-$1.50 per million tokens
- Output tokens: ~$1.50-$5.00 per million tokens

For typical blog posts:
- Claude Haiku: ~$0.01-$0.05 per generation
- Claude Sonnet: ~$0.05-$0.15 per generation
