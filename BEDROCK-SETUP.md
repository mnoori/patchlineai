# AWS Bedrock Setup Guide

This guide explains how to set up AWS Bedrock for content generation in this application.

## 1. AWS Bedrock Access

1. Log in to the AWS Console and navigate to the Amazon Bedrock service
2. Click on "Model access" in the left navigation
3. Click "Manage model access"
4. Select the models you want to use:
   - **Amazon Nova Micro** (default model used by the application)
   - Claude 3 Haiku (requires additional approval)
   - Claude 3 Sonnet (higher quality but more expensive)
   - Amazon Titan
   - Cohere Command
5. Click "Request model access" and wait for approval (usually immediate for Amazon models)

## 2. IAM Permissions

Ensure your AWS user/role has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:GetModelInvocationLoggingConfiguration",
        "bedrock:GetFoundationModelAvailability"
      ],
      "Resource": "*"
    }
  ]
}
```

You may also need AWS Marketplace permissions to access certain models:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:Subscribe",
        "aws-marketplace:Unsubscribe",
        "aws-marketplace:ViewSubscriptions"
      ],
      "Resource": "*"
    }
  ]
}
```

## 3. Environment Variables

Add these variables to your `.env.local` file for local development:

```
# AWS Credentials (same as used for DynamoDB)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# AWS Bedrock Configuration
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
```

In Amplify, add the `BEDROCK_MODEL_ID` to your environment variables alongside your AWS credentials.

## 4. Testing Bedrock

After configuration, you can test Bedrock by:

1. Navigate to the Content Creator page
2. Enter a topic (e.g., "The Future of AI")
3. Add some keywords and select options
4. Click "Generate Content"

The system will use Bedrock to generate the content, with a fallback to a simple mock generator if there are any issues.

## Model IDs Reference

| Model Name | Model ID | Best For | Access |
|------------|----------|----------|--------|
| Amazon Nova Micro | `amazon.nova-micro-v1:0` | Fast, simple content | Default, easiest to access |
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | Better quality, more expensive | Requires explicit approval |
| Claude 3 Sonnet | `anthropic.claude-3-sonnet-20240229-v1:0` | Highest quality, most expensive | Requires explicit approval |
| Amazon Titan | `amazon.titan-text-lite-v1:0` | Amazon's general model | Easy to access |
| Cohere Command | `cohere.command-text-v14:0` | Alternative option | Requires approval |

## Troubleshooting

If you encounter issues:

1. Check AWS credentials are correctly set
2. Verify model access is approved in the Bedrock console
3. Check IAM permissions include both `bedrock:InvokeModel` and marketplace permissions
4. Look for errors in the Amplify logs, particularly the `[Bedrock]` prefixed messages 