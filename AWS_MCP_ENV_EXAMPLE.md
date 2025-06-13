# AWS MCP Environment Configuration

This document outlines the environment variables needed for AWS MCP integration.

## Core AWS Configuration

```bash
# AWS Region
AWS_REGION=us-east-1

# AWS Credentials (use IAM roles in production)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_SESSION_TOKEN=your-session-token-if-using-temporary-credentials
```

## AWS Service Enablement

```bash
# Enable/disable specific AWS services
ENABLE_BEDROCK=true
ENABLE_S3=true
ENABLE_DYNAMODB=true
ENABLE_CLOUDWATCH=true
ENABLE_RDS=false
```

## Bedrock Configuration

```bash
# Bedrock Knowledge Bases (comma-separated)
BEDROCK_KNOWLEDGE_BASES=kb-music-industry-001,kb-patchline-docs-001

# Bedrock Models (comma-separated)
BEDROCK_MODELS=anthropic.claude-3-sonnet-20240229-v1:0,anthropic.claude-3-haiku-20240307-v1:0
```

## S3 Configuration

```bash
# S3 Buckets for different content types (comma-separated)
S3_BUCKETS=patchline-audio,patchline-artwork,patchline-contracts,patchline-analytics
```

## DynamoDB Configuration

```bash
# DynamoDB Tables (comma-separated)
DYNAMODB_TABLES=artists,releases,analytics,users,contracts
```

## CloudWatch Configuration

```bash
# CloudWatch Log Groups (comma-separated)
CLOUDWATCH_LOG_GROUPS=/aws/lambda/patchline,/patchline/application,/patchline/mcp
```

## RDS Configuration (Optional)

```bash
# RDS Instances (comma-separated, if enabled)
RDS_INSTANCES=patchline-prod-db
```

## MCP Security Configuration

```bash
# Security enforcement mode: 'permissive' or 'enforcing'
MCP_SECURITY_MODE=enforcing

# Rate limiting
MCP_RATE_LIMIT=60
MCP_BURST_LIMIT=10

# IP whitelist (comma-separated, optional)
MCP_IP_WHITELIST=

# Time restrictions (optional)
MCP_TIME_RESTRICTIONS=
MCP_TIMEZONE=UTC
```

## MCP Performance Configuration

```bash
# Maximum concurrent operations
MAX_CONCURRENT_OPERATIONS=10

# Session timeout in milliseconds
MCP_SESSION_TIMEOUT=300000

# Enable load balancing
MCP_ENABLE_LOAD_BALANCING=true
```

## Audit and Monitoring

```bash
# Enable audit logging
ENABLE_MCP_AUDIT_LOGGING=true

# CloudWatch log group for audit logs
MCP_AUDIT_LOG_GROUP=/patchline/mcp/audit

# CloudWatch metrics namespace
MCP_METRICS_NAMESPACE=Patchline/MCP
```

## Development/Testing

```bash
# Demo mode for testing
MCP_DEMO_MODE=false

# Mock AWS services for local development
MCP_MOCK_AWS_SERVICES=false
```

## IAM Roles and Policies

### Required IAM Roles

1. **PatchlineMCPBedrockRole**
   - Permissions: `bedrock:InvokeModel`, `bedrock:Retrieve`, `bedrock:RetrieveAndGenerate`
   - Resources: Specified knowledge bases and models

2. **PatchlineMCPS3Role**
   - Permissions: `s3:GetObject`, `s3:PutObject`, `s3:ListBucket`, `s3:DeleteObject`
   - Resources: Specified S3 buckets

3. **PatchlineMCPDynamoRole**
   - Permissions: `dynamodb:Query`, `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`
   - Resources: Specified DynamoDB tables

4. **PatchlineMCPCloudWatchRole**
   - Permissions: `logs:StartQuery`, `logs:GetQueryResults`, `logs:DescribeLogGroups`, `logs:DescribeLogStreams`
   - Resources: Specified CloudWatch log groups

### Example IAM Policy for Bedrock

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:Retrieve",
        "bedrock:RetrieveAndGenerate"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1:*:knowledge-base/kb-music-industry-001",
        "arn:aws:bedrock:us-east-1:*:model/anthropic.claude-3-sonnet-20240229-v1:0"
      ]
    }
  ]
}
```

## Security Best Practices

1. **Use IAM Roles**: In production, use IAM roles instead of access keys
2. **Least Privilege**: Grant only the minimum required permissions
3. **Resource-Specific**: Limit access to specific resources (buckets, tables, etc.)
4. **Audit Logging**: Enable comprehensive audit logging
5. **Network Security**: Use VPC endpoints where possible
6. **Encryption**: Enable encryption at rest and in transit
7. **Monitoring**: Set up CloudWatch alarms for unusual activity

## Deployment Considerations

### Production Deployment

- Use AWS Secrets Manager for sensitive configuration
- Implement proper IAM role assumption
- Enable CloudTrail for audit logging
- Set up proper monitoring and alerting
- Use VPC endpoints for service communication

### Development Environment

- Use temporary credentials or IAM roles
- Enable mock services for local testing
- Use separate AWS accounts for dev/staging/prod
- Implement proper CI/CD pipelines

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check IAM permissions and credentials
2. **Rate Limiting**: Adjust rate limits or implement backoff strategies
3. **Network Issues**: Verify VPC configuration and security groups
4. **Resource Access**: Ensure proper resource ARNs and permissions

### Debugging

- Enable detailed logging with `MCP_DEBUG=true`
- Check CloudWatch logs for detailed error messages
- Use AWS CLI to test permissions independently
- Monitor CloudTrail for API call details 