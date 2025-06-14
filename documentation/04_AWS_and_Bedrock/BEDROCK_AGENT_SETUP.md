# Patchline Bedrock Agent Setup Guide

## Overview

This document provides a complete guide for setting up and deploying a Bedrock Agent with Gmail integration for the Patchline project. The agent can search emails, create drafts, send emails, and provide intelligent email management assistance.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Bedrock Agent   │    │ Lambda Functions│
│                 │◄──►│                  │◄──►│                 │
│ /api/bedrock    │    │ PatchlineEmail   │    │ gmail-action-   │
│                 │    │ Agent            │    │ handler         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
                                │               ┌─────────────────┐
                                │               │   Gmail API     │
                                │               │                 │
                                │               │ OAuth + Actions │
                                │               └─────────────────┘
                                ▼
                       ┌─────────────────┐
                       │   S3 Buckets    │
                       │                 │
                       │ - API Schema    │
                       │ - Knowledge Base│
                       └─────────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Google Cloud Project** with Gmail API enabled
3. **Environment Variables** configured in `.env.local`
4. **Python 3.11+** for deployment scripts
5. **Node.js** for the Next.js application

## Environment Variables

Add these to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Google OAuth Configuration
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# IAM Role (Optional - if you have an existing role)
AGENT_ROLE_ARN=arn:aws:iam::account:role/your-role
LAMBDA_EXEC_ROLE_ARN=arn:aws:iam::account:role/your-lambda-role

# Bedrock Agent (Added after deployment)
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS_ID=your_alias_id
```

## Deployment Process

### Step 1: Deploy Lambda Functions

```bash
cd backend/scripts
python deploy-lambda-functions.py
```

**What this does:**
- Creates IAM execution role for Lambda functions
- Packages Python dependencies from `requirements.txt`
- Deploys `gmail-auth-handler` and `gmail-action-handler` functions
- Creates DynamoDB table for OAuth tokens
- Creates S3 bucket for knowledge base
- Stores Gmail OAuth credentials in Secrets Manager

**Key Files:**
- `backend/lambda/gmail-auth-handler.py` - Handles Gmail OAuth flow
- `backend/lambda/gmail-action-handler.py` - Processes Gmail actions from Bedrock
- `backend/lambda/requirements.txt` - Python dependencies
- `backend/lambda/gmail-actions-openapi.json` - API schema for Bedrock

### Step 2: Create Bedrock Agent

```bash
cd backend/scripts
python create-bedrock-agent.py
```

**What this does:**
- Creates/reuses IAM role for Bedrock Agent
- Uploads OpenAPI schema to S3
- Creates Bedrock Agent with Claude 3 Sonnet model
- Creates action group linking to Lambda function
- Prepares agent for use
- Creates production alias

**Critical IAM Permissions:**
The agent role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": ["arn:aws:lambda:*:*:function:gmail-action-handler"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::patchline-agent-schemas/*",
        "arn:aws:s3:::patchline-email-knowledge-base/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::patchline-agent-schemas",
        "arn:aws:s3:::patchline-email-knowledge-base"
      ]
    }
  ]
}
```

**Trust Relationship:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Step 3: Test the Agent

```bash
cd backend/scripts
python test-bedrock-agent.py
```

## OpenAPI Schema Requirements

The OpenAPI schema for Bedrock has specific requirements:

### Required Fields
- `openapi: "3.0.0"` (exact version)
- `operationId` must be unique and use snake_case or camelCase
- `description` fields are crucial for agent understanding
- `responses` must include proper schema definitions

### Special Bedrock Extensions
- `x-requireConfirmation: "ENABLED"` - Requires user confirmation for sensitive actions
- Must be placed at the method level, not in properties

### Example Structure
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Gmail Actions API",
    "version": "1.0.0"
  },
  "paths": {
    "/search-emails": {
      "post": {
        "operationId": "search_emails",
        "description": "Search through user's Gmail inbox",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["query"],
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "Gmail search query"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "emails": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {"type": "string"},
                          "subject": {"type": "string"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Lambda Function Structure

### Input Event Format
```python
{
    "messageVersion": "1.0",
    "agent": {
        "name": "PatchlineEmailAgent",
        "id": "AGENT_ID",
        "alias": "ALIAS_ID",
        "version": "DRAFT"
    },
    "inputText": "user input",
    "sessionId": "session-id",
    "actionGroup": "GmailActions",
    "apiPath": "/search-emails",
    "httpMethod": "POST",
    "parameters": [],
    "requestBody": {
        "content": {
            "application/json": {
                "properties": [
                    {
                        "name": "query",
                        "type": "string",
                        "value": "from:john@example.com"
                    }
                ]
            }
        }
    }
}
```

### Response Format
```python
{
    "messageVersion": "1.0",
    "response": {
        "actionGroup": "GmailActions",
        "apiPath": "/search-emails",
        "httpMethod": "POST",
        "httpStatusCode": 200,
        "responseBody": {
            "application/json": {
                "body": json.dumps({
                    "emails": [...],
                    "totalResults": 5
                })
            }
        }
    }
}
```

## Common Issues and Solutions

### 1. "Failed to create OpenAPI 3 model" Error

**Causes:**
- IAM role missing `s3:GetObject` or `s3:ListBucket` permissions
- Trust relationship doesn't include `bedrock.amazonaws.com`
- Invalid OpenAPI schema format

**Solutions:**
- Verify IAM permissions (both bucket and object level)
- Check trust relationship
- Validate schema with `openapi-spec-validator`

### 2. Lambda Function Not Found

**Cause:** Lambda function not deployed or wrong region

**Solution:**
```bash
# Redeploy Lambda functions
python deploy-lambda-functions.py
```

### 3. Agent Preparation Timeout

**Cause:** Large schema or AWS service delays

**Solution:** The script includes retry logic with 30 attempts

### 4. OAuth Flow Issues

**Causes:**
- Incorrect redirect URI
- Missing Google API credentials
- Secrets Manager access issues

**Solutions:**
- Verify Google Cloud Console settings
- Check environment variables
- Ensure Lambda has Secrets Manager permissions

## Testing

### Basic Agent Test
```python
import boto3

bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name='us-east-1')

response = bedrock_runtime.invoke_agent(
    agentId='YOUR_AGENT_ID',
    agentAliasId='YOUR_ALIAS_ID',
    sessionId='test-session',
    inputText="Hello! Can you help me with my emails?"
)

# Process streaming response
for event in response['completion']:
    if 'chunk' in event:
        chunk = event['chunk']
        if 'bytes' in chunk:
            print(chunk['bytes'].decode('utf-8'))
```

### With Trace (Debug Mode)
```python
response = bedrock_runtime.invoke_agent(
    agentId='YOUR_AGENT_ID',
    agentAliasId='YOUR_ALIAS_ID',
    sessionId='test-session',
    inputText="Search for emails about contracts",
    enableTrace=True
)

# Process both response and trace
for event in response['completion']:
    if 'chunk' in event:
        # Handle response
        pass
    elif 'trace' in event:
        # Handle trace for debugging
        print(f"Trace: {event['trace']}")
```

## Integration with Next.js

### API Route Structure
```typescript
// pages/api/bedrock/chat.ts
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = new BedrockAgentRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new InvokeAgentCommand({
    agentId: process.env.BEDROCK_AGENT_ID,
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
    sessionId: req.body.sessionId,
    inputText: req.body.message,
  });

  const response = await client.send(command);
  
  // Handle streaming response
  // ... implementation
}
```

## Available Gmail Actions

1. **search_emails** - Search through Gmail inbox
2. **read_email** - Get full email content by ID
3. **draft_email** - Create email draft
4. **send_email** - Send email (requires confirmation)
5. **list_labels** - Get Gmail labels
6. **get_email_stats** - Get inbox statistics

## Security Considerations

1. **OAuth Tokens** - Stored securely in DynamoDB with encryption
2. **User Confirmation** - Required for sending emails
3. **IAM Permissions** - Principle of least privilege
4. **Session Management** - Unique session IDs for each conversation
5. **Error Handling** - No sensitive data in error messages

## Monitoring and Logging

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/gmail-action-handler`
- Agent traces available through Bedrock console

### Metrics to Monitor
- Lambda invocation count and errors
- Agent response times
- Gmail API rate limits
- OAuth token refresh rates

## Scaling Considerations

1. **Lambda Concurrency** - Default limits apply
2. **Gmail API Quotas** - 1 billion quota units per day
3. **Bedrock Limits** - Model-specific rate limits
4. **DynamoDB** - On-demand billing scales automatically

## Troubleshooting Commands

```bash
# Check Lambda function status
aws lambda get-function --function-name gmail-action-handler

# Check agent status
aws bedrock-agent get-agent --agent-id YOUR_AGENT_ID

# Test Lambda directly
aws lambda invoke --function-name gmail-action-handler --payload '{}' response.json

# Check S3 schema
aws s3 cp s3://patchline-agent-schemas/gmail-actions-openapi.json -

# Validate OpenAPI schema
python -c "import json; from openapi_spec_validator import validate_spec; validate_spec(json.load(open('backend/lambda/gmail-actions-openapi.json'))); print('Valid')"
```

## Next Steps

1. **Knowledge Base Integration** - Add email content to vector database
2. **Advanced Prompting** - Customize agent instructions
3. **Multi-user Support** - Implement user-specific OAuth tokens
4. **Email Templates** - Pre-defined email templates
5. **Calendar Integration** - Extend to Google Calendar
6. **Analytics** - Email interaction analytics

## File Structure

```
backend/
├── lambda/
│   ├── gmail-auth-handler.py
│   ├── gmail-action-handler.py
│   ├── gmail-actions-openapi.json
│   └── requirements.txt
├── scripts/
│   ├── deploy-lambda-functions.py
│   ├── create-bedrock-agent.py
│   ├── test-bedrock-agent.py
│   └── deploy-all.py
└── BEDROCK_AGENT_SETUP.md
```

## Support

For issues:
1. Check CloudWatch logs
2. Verify environment variables
3. Test individual components
4. Review IAM permissions
5. Check AWS service quotas

---

*Last updated: January 2025* 