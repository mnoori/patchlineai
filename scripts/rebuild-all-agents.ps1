# PowerShell script to rebuild all agents with proper models and collaborations
Write-Host "=== Patchline Agent Rebuild Script ===" -ForegroundColor Cyan
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Delete all existing Bedrock agents" -ForegroundColor Yellow
Write-Host "2. Recreate them with correct Claude 4 models" -ForegroundColor Yellow
Write-Host "3. Automatically set up collaborations" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "agents.yaml")) {
    Write-Host "ERROR: agents.yaml not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Confirm with user
$response = Read-Host "Are you sure you want to continue? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# Run the clean and rebuild script
Write-Host "`n--- Running clean and rebuild script ---" -ForegroundColor Cyan
python scripts/clean-and-rebuild-agents.py

# Check if the rebuild was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Agent rebuild failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All agents have been recreated with proper models and collaborations!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server to load the new agent IDs" -ForegroundColor Yellow
Write-Host "2. Test the supervisor agent to ensure it can delegate to other agents" -ForegroundColor Yellow
Write-Host "3. Test individual agents to ensure they have the correct instructions" -ForegroundColor Yellow 