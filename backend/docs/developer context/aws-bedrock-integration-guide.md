# AWS Bedrock Integration Guide

This guide provides detailed instructions for integrating AWS Bedrock AI services into your application, based on the implementation pattern from the Within application.

## Architecture Overview

The solution uses the following AWS components:

- **AWS Bedrock**: AI service for LLM inference
- **AWS Lambda**: Serverless compute for request processing
- **API Gateway**: API endpoint management
- **DynamoDB**: NoSQL database for chat log storage
- **Amazon Aurora (PostgreSQL)**: Relational database for structured data
- **Cognito**: User authentication (optional)

## Implementation Steps

### 1. Set Up AWS Infrastructure

#### a) Create Required AWS Resources

You'll need to create:
- An AWS Bedrock model endpoint configuration
- Lambda function for handling requests
- API Gateway for exposing endpoints
- DynamoDB table for chat logs
- RDS/Aurora instance for relational data (optional)
- Cognito user pool (if authentication is required)

This can be done using AWS CDK, CloudFormation, Terraform, or manually through the AWS Console.

#### b) Sample CDK Stack

\`\`\`typescript
import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as path from "path"

export class BedrockChatStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // DynamoDB chat log table
    const chatTable = new dynamodb.Table(this, "ChatLogTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "ts", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // Chat lambda
    const chatFn = new lambda.Function(this, "ChatFn", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "chat.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      environment: {
        CHAT_LOG_TABLE: chatTable.tableName,
        REGION: cdk.Stack.of(this).region,
        BEDROCK_MODEL_ID: "amazon.nova-micro-v1:0",  // Or your preferred model
        SYSTEM_PROMPT: "You are a helpful assistant...",
      },
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
    })

    chatTable.grantWriteData(chatFn)

    // Grant Bedrock invoke permission
    chatFn.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],  // Consider scoping to specific models
      }),
    )

    // API Gateway
    const api = new apigw.RestApi(this, "ChatApi", {
      restApiName: "BedrockChatApi",
    })

    // /chat resource
    const chatRes = api.root.addResource("chat")
    chatRes.addMethod("POST", new apigw.LambdaIntegration(chatFn))

    // Output values
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url })
  }
}
\`\`\`

### 2. Lambda Function Implementation

Create a Python Lambda function to handle chat requests and interact with Bedrock.

#### a) Lambda Handler (chat.py)

\`\`\`python
import os, json, boto3, logging, time
from datetime import datetime
from typing import Any, Dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock = boto3.client("bedrock-runtime")
dynamodb = boto3.resource("dynamodb")

def truncate_for_log(obj: Any, max_len: int = 500) -> str:
    """Safely truncate objects for logging."""
    text = str(obj)
    if len(text) > max_len:
        return text[:max_len] + "..."
    return text

def handler(event, context):
    try:
        # Handle CORS preflight
        if event.get("httpMethod") == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                "body": "",
            }

        # Config & Validation
        model_id = os.getenv("BEDROCK_MODEL_ID", "")
        if not model_id:
            logger.error("BEDROCK_MODEL_ID env var is missing")
            return _resp(500, {"error": "Server mis-config: no model id"})

        is_nova = model_id.startswith("amazon.nova")
        logger.info("Using Bedrock model ID: %s", model_id)

        # Parse Input
        body_raw = event.get("body")
        try:
            parsed = json.loads(body_raw) if isinstance(body_raw, str) else body_raw or event
        except json.JSONDecodeError:
            parsed = body_raw  # treat as plain string

        message = parsed if isinstance(parsed, str) else parsed.get("message") if parsed else None
        if not message:
            return _resp(400, {"error": "Message is required"})

        # Add system prompt
        system_prompt = os.getenv(
            "SYSTEM_PROMPT",
            "You are a helpful assistant. Provide clear, concise responses."
        )

        # Call Bedrock
        request_body = (
            {
                "inferenceConfig": {"max_new_tokens": 1000},
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": message
                            }
                        ],
                    }
                ],
            }
            if is_nova
            else {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
            }
        )

        logger.info("Bedrock request: %s", truncate_for_log(request_body))

        try:
            br_resp = bedrock.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body).encode("utf-8"),
            )
            payload = json.loads(br_resp["body"].read())
            logger.info("Bedrock response: %s", truncate_for_log(payload))
        except Exception as exc:
            logger.exception("Bedrock API error")
            return _resp(500, {"error": str(exc)})

        ai_response = (
            payload.get("output", {})
            .get("message", {})
            .get("content", [{}])[0]
            .get("text", "No text")
            if is_nova
            else payload.get("content", [{}])[0].get("text", "No text")
        )

        logger.info("Extracted response: %s", truncate_for_log(ai_response))

        # Store in DynamoDB
        ts = int(time.time() * 1000)
        user_id = (
            event.get("requestContext", {})
            .get("authorizer", {})
            .get("claims", {})
            .get("sub", "anonymous")
        )

        # DynamoDB
        table_name = os.getenv("CHAT_LOG_TABLE")
        if table_name:
            try:
                table = dynamodb.Table(table_name)
                table.put_item(
                    Item={
                        "userId": user_id,
                        "ts": ts,
                        "message": message,
                        "response": ai_response,
                    }
                )
                logger.info("Stored in DynamoDB")
            except Exception as exc:
                logger.exception("DynamoDB put_item failed")

        return _resp(200, {"response": ai_response})

    except Exception as exc:
        logger.exception("Unhandled error in handler")
        return _resp(500, {"error": f"Internal error: {str(exc)}"})


def _resp(status: int, body_dict: Dict) -> Dict:
    """Helper to build HTTP response."""
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body_dict),
    }
\`\`\`

### 3. Set Up the AWS CLI and Local Development

#### a) Install Dependencies

\`\`\`bash
# Install AWS CLI
pip install awscli boto3

# Configure AWS credentials
aws configure
\`\`\`

#### b) Required IAM Permissions

Your deployment/development user and Lambda execution role need:

- `bedrock:InvokeModel`
- `dynamodb:PutItem` (for the chat logs table)
- Additional permissions if using RDS or other services

### 4. API Integration in Your Application

#### a) JavaScript/TypeScript Client Example

\`\`\`javascript
async function sendChatMessage(message) {
  const apiUrl = 'https://your-api-gateway-url.amazonaws.com/chat';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}
\`\`\`

#### b) Python Client Example

\`\`\`python
import requests

def send_chat_message(message):
    api_url = 'https://your-api-gateway-url.amazonaws.com/chat'
    
    try:
        response = requests.post(
            api_url,
            json={'message': message},
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return response.json()['response']
    except Exception as e:
        print(f"Error sending chat message: {str(e)}")
        raise
\`\`\`

### 5. AWS Bedrock Model Selection

AWS Bedrock offers various models. Choose based on your needs:

- **Amazon Titan**: Amazon's general-purpose text models
- **Anthropic Claude**: Strong reasoning and dialogue capabilities
- **Amazon Nova**: Lower cost with good performance
- **AI21 Jurassic**: Strong for specific tasks like summarization
- **Mistral AI**: Open source models with good performance

Set the `BEDROCK_MODEL_ID` environment variable in your Lambda function to specify your chosen model.

### 6. Response Handling and Payload Structures

Different models require different API formats and return different response structures. The provided Lambda code handles both Amazon Nova and Anthropic Claude formats.

#### Nova Request Format

\`\`\`json
{
  "inferenceConfig": {"max_new_tokens": 1000},
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "text": "Your message here"
        }
      ]
    }
  ]
}
\`\`\`

#### Claude Request Format

\`\`\`json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 1000,
  "messages": [
    {"role": "system", "content": "System prompt here"},
    {"role": "user", "content": "User message here"}
  ]
}
\`\`\`

### 7. Error Handling and Logging

Implement proper error handling and logging:

1. Set up CloudWatch Logs for Lambda monitoring
2. Use structured logging with appropriate log levels
3. Handle API timeouts and errors gracefully
4. Implement client-side retry logic for transient failures

### 8. Security Considerations

1. **Authentication**: Add Cognito or other authentication methods to protect your API
2. **Input Validation**: Validate user input to prevent injection attacks
3. **IAM Permissions**: Use least privilege principle for Lambda IAM roles
4. **Model Content Safety**: Consider implementing content filtering

### 9. Optimization Tips

1. **Lambda Configuration**: Adjust memory and timeout settings based on usage
2. **Caching**: Consider implementing a response cache for common queries
3. **Cold Start**: Use provisioned concurrency for latency-sensitive applications
4. **Cost Management**: Monitor Bedrock usage and implement quotas/limits

## Conclusion

This guide provides a comprehensive approach to integrating AWS Bedrock into your application. The implementation follows best practices for serverless architecture and AWS service integration.

For production deployments, consider additional factors like high availability, monitoring, and cost optimization strategies.
