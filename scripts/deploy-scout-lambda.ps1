# Deploy Scout Lambda Function
Write-Host "🚀 Creating and Deploying Scout Lambda Function..." -ForegroundColor Green

# Navigate to Lambda directory
Set-Location backend/lambda

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Remove-Item -Path scout-action-handler.zip -ErrorAction SilentlyContinue

# Install dependencies
pip install -r requirements.txt -t package/ --quiet

# Copy Lambda handler
Copy-Item scout-action-handler.py package/

# Create zip
Set-Location package
Compress-Archive -Path * -DestinationPath ../scout-action-handler.zip -Force
Set-Location ..

# Clean up package directory
Remove-Item -Path package -Recurse -Force

# Create Lambda function (if it doesn't exist)
Write-Host "⬆️ Creating Scout Lambda function..." -ForegroundColor Yellow

$functionExists = aws lambda get-function --function-name scout-action-handler --region us-east-1 2>$null

if ($LASTEXITCODE -ne 0) {
    # Function doesn't exist, create it
    Write-Host "Creating new Lambda function..." -ForegroundColor Yellow
    
    # Get the Lambda execution role ARN
    $roleArn = aws iam get-role --role-name BedrockAgentLambdaRole --query 'Role.Arn' --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: BedrockAgentLambdaRole not found. Please create it first." -ForegroundColor Red
        exit 1
    }
    
    aws lambda create-function `
        --function-name scout-action-handler `
        --runtime python3.11 `
        --role $roleArn `
        --handler scout-action-handler.lambda_handler `
        --zip-file fileb://scout-action-handler.zip `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={SOUNDCHARTS_APP_ID=$env:SOUNDCHARTS_APP_ID,SOUNDCHARTS_API_KEY=$env:SOUNDCHARTS_API_KEY,SCOUT_WATCHLIST_TABLE=ScoutWatchlist}" `
        --region us-east-1
} else {
    # Function exists, update it
    Write-Host "Updating existing Lambda function..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name scout-action-handler `
        --zip-file fileb://scout-action-handler.zip `
        --region us-east-1
    
    # Update environment variables
    aws lambda update-function-configuration `
        --function-name scout-action-handler `
        --environment "Variables={SOUNDCHARTS_APP_ID=$env:SOUNDCHARTS_APP_ID,SOUNDCHARTS_API_KEY=$env:SOUNDCHARTS_API_KEY,SCOUT_WATCHLIST_TABLE=ScoutWatchlist}" `
        --region us-east-1
}

# Clean up
Remove-Item -Path scout-action-handler.zip

Write-Host "✅ Scout Lambda deployed successfully!" -ForegroundColor Green

# Return to original directory
Set-Location ../.. 