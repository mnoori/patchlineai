#!/bin/bash

# Deploy Gmail Lambda Function
echo "🚀 Deploying Gmail Lambda Function..."

# Navigate to Lambda directory
cd backend/lambda

# Create deployment package
echo "📦 Creating deployment package..."
rm -f gmail-action-handler.zip
pip install -r requirements.txt -t package/
cp gmail-action-handler.py package/
cd package
zip -r ../gmail-action-handler.zip .
cd ..
rm -rf package

# Update Lambda function
echo "⬆️ Uploading to AWS Lambda..."
aws lambda update-function-code \
    --function-name gmail-action-handler \
    --zip-file fileb://gmail-action-handler.zip \
    --region us-east-1

# Clean up
rm gmail-action-handler.zip

echo "✅ Gmail Lambda deployed successfully!" 