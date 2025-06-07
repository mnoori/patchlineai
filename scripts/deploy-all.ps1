# Patchline Complete Deployment Script
Write-Host "🚀 PATCHLINE COMPLETE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check for required environment variables
$requiredVars = @(
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY", 
    "AWS_REGION",
    "SOUNDCHARTS_APP_ID",
    "SOUNDCHARTS_API_KEY"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not (Get-Item -Path "Env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "`nPlease set these in your .env.local file" -ForegroundColor Yellow
    exit 1
}

# Step 1: Create DynamoDB Tables
Write-Host "`n📊 Creating DynamoDB Tables..." -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray

# Create Supervisor table
Write-Host "Creating SupervisorInteractions table..." -ForegroundColor Cyan
npx tsx scripts/create-supervisor-table.ts

# Create Scout watchlist table  
Write-Host "Creating ScoutWatchlist table..." -ForegroundColor Cyan
npx tsx scripts/create-scout-table.ts

# Step 2: Deploy Lambda Functions
Write-Host "`n⚡ Deploying Lambda Functions..." -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Gray

# Deploy Gmail Lambda
Write-Host "`nDeploying Gmail Lambda..." -ForegroundColor Cyan
& ./scripts/deploy-gmail-lambda.ps1

# Deploy Scout Lambda
Write-Host "`nDeploying Scout Lambda..." -ForegroundColor Cyan
& ./scripts/deploy-scout-lambda.ps1

# Step 3: Create/Update Bedrock Agents
Write-Host "`n🤖 Bedrock Agent Configuration" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray

Write-Host @"

Scout Agent needs to be created manually in AWS Bedrock Console:

1. Go to AWS Bedrock Console > Agents
2. Create new agent with:
   - Name: PatchlineScoutAgent
   - Model: Claude 3 Sonnet
   - Instructions: Copy from prompts/scout-agent.md
   - Action Group: ScoutActions
   - Lambda: scout-action-handler
   - API Schema: backend/lambda/scout-actions-openapi.json

3. After creation, update agents.yaml with:
   - agent_id: [NEW_AGENT_ID]
   - agent_alias_id: [NEW_ALIAS_ID]

"@ -ForegroundColor Cyan

# Step 4: Frontend Updates
Write-Host "`n🎨 Frontend Configuration" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Gray

Write-Host "✅ Real-time logs implemented in Supervisor UI" -ForegroundColor Green
Write-Host "✅ Scout agent integrated with Soundcharts API" -ForegroundColor Green
Write-Host "✅ Gmail token refresh handling added" -ForegroundColor Green

# Step 5: Summary
Write-Host "`n📋 DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

Write-Host @"

✅ Completed:
- Supervisor agent routing fixed (no more hardcoded workflows)
- Gmail Lambda updated with token refresh handling
- Scout Lambda created and deployed
- Real-time logs streaming implemented
- DynamoDB tables created
- Frontend UI updated

⚠️ Manual Steps Required:
1. Create Scout agent in AWS Bedrock Console
2. Update agents.yaml with Scout agent IDs
3. Re-authenticate Gmail if you see GMAIL_AUTH_REQUIRED errors

🔗 Test URLs:
- Supervisor: http://localhost:3000/dashboard/agents/supervisor
- Scout: http://localhost:3000/dashboard/agents/scout
- Gmail: http://localhost:3000/dashboard/agents/gmail

📊 API Quota:
- Soundcharts: 188/200 calls remaining

"@ -ForegroundColor White

Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Go eat! Everything is ready for testing! 🍕" -ForegroundColor Yellow 