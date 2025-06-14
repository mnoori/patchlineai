# Lambda Management for Patchline

This document describes the workflow for deploying and managing AWS Lambda functions used by Patchline agents.

## Overview

Patchline uses AWS Lambda functions for handling agent action groups:

- **Gmail Agent**: Requires `gmail-auth-handler` and `gmail-action-handler` Lambdas
- **Legal Agent**: Requires `legal-contract-handler` Lambda

The Lambda functions need proper permissions to interact with AWS Bedrock. Common issues with Lambdas include:

1. Permissions not correctly configured for Bedrock
2. Code updates not properly deployed
3. Dependencies not included in deployment package

## Lambda Management Script

We've created an enhanced Lambda management script (`backend/scripts/manage-lambda-functions.py`) to solve these issues:

```bash
# View current Lambda configurations
python backend/scripts/manage-lambda-functions.py --check

# Recreate all Lambdas (delete and redeploy)
python backend/scripts/manage-lambda-functions.py --recreate

# Deploy only Legal agent Lambda
python backend/scripts/manage-lambda-functions.py --agent=legal

# Deploy a specific Lambda function
python backend/scripts/manage-lambda-functions.py --function=gmail-action-handler

# Verify Lambda permissions after deployment
python backend/scripts/manage-lambda-functions.py --verify
```

## Common Issues and Solutions

### Lambda Permission Issues

If an agent cannot invoke its Lambda function, the most likely cause is permissions:

```bash
# Fix permissions for all Lambdas
python backend/scripts/manage-lambda-functions.py --verify

# If permissions are missing, recreate the specific Lambda
python backend/scripts/manage-lambda-functions.py --recreate --function=gmail-action-handler
```

### Code Updates Not Reflected

When updating Lambda code, sometimes the changes don't appear to be applied:

```bash
# Completely recreate the Lambda with the latest code
python backend/scripts/manage-lambda-functions.py --recreate --function=legal-contract-handler
```

### Missing Dependencies

If your Lambda is failing due to missing dependencies:

1. Update `backend/lambda/requirements.txt` with the required packages
2. Recreate the Lambda with the updated dependencies:
   ```bash
   python backend/scripts/manage-lambda-functions.py --recreate --function=gmail-action-handler
   ```

## Development Workflow

For a smooth development workflow when working with AWS Lambdas:

1. Make changes to Lambda source files in `backend/lambda/`
2. Update `requirements.txt` if needed
3. Use `--check` to verify current Lambda configuration
4. Deploy with `--recreate` flag when substantial changes are made
5. Always `--verify` permissions after deployment

## AWS Console Access

While the script handles most cases, sometimes you need to check logs or make manual adjustments:

1. Log into AWS Console
2. Go to Lambda service
3. Select the function (e.g., `gmail-action-handler`)
4. Check CloudWatch logs for any execution errors
5. Verify Permissions in the "Configuration" tab under "Permissions"

## Troubleshooting

If you encounter issues with the Lambda deployment:

1. Check your AWS credentials in `.env.local`
2. Ensure Python environment has `boto3` installed
3. Verify you have permissions to create/update Lambda functions
4. Check CloudWatch logs for execution errors 