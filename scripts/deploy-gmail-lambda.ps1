# Deploy Gmail Lambda Function
Write-Host "🚀 Deploying Gmail Lambda Function..." -ForegroundColor Green

# Navigate to Lambda directory
Set-Location backend/lambda

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Remove-Item -Path gmail-action-handler.zip -ErrorAction SilentlyContinue

# Install dependencies
pip install -r requirements.txt -t package/ --quiet

# Copy Lambda handler
Copy-Item gmail-action-handler.py package/

# Create zip
Set-Location package
Compress-Archive -Path * -DestinationPath ../gmail-action-handler.zip -Force
Set-Location ..

# Clean up package directory
Remove-Item -Path package -Recurse -Force

# Update Lambda function
Write-Host "⬆️ Uploading to AWS Lambda..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name gmail-action-handler `
    --zip-file fileb://gmail-action-handler.zip `
    --region us-east-1

# Clean up
Remove-Item -Path gmail-action-handler.zip

Write-Host "✅ Gmail Lambda deployed successfully!" -ForegroundColor Green

# Return to original directory
Set-Location ../.. 