# Fix Bedrock Agents - Recreate with correct instructions
# PowerShell script for Windows

Write-Host "🚀 Patchline Agent Fix Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:"
Write-Host "1. Delete all existing agents"
Write-Host "2. Recreate each agent with the correct instructions"
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  WARNING: This will delete and recreate all Bedrock agents!" -ForegroundColor Yellow
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Aborted."
    exit 0
}

# Save current directory
$originalDir = Get-Location

# Initialize hashtable to store agent IDs
$agentIds = @{}

# Set environment variable for UTF-8 encoding
$env:PYTHONIOENCODING = "utf-8"

# Navigate to backend scripts directory
Set-Location backend\scripts

Write-Host ""
Write-Host "Step 1: Creating Gmail Agent" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
$env:PATCHLINE_AGENT_TYPE = "GMAIL"
$output = "y" | python create-bedrock-agent.py 2>&1 | Out-String
Write-Host $output
if ($output -match "Agent ID: ([A-Z0-9]+)") {
    $agentIds["GMAIL"] = $matches[1]
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create Gmail agent" -ForegroundColor Red
    Set-Location $originalDir
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating Legal Agent" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
$env:PATCHLINE_AGENT_TYPE = "LEGAL"
$output = "y" | python create-bedrock-agent.py 2>&1 | Out-String
Write-Host $output
if ($output -match "Agent ID: ([A-Z0-9]+)") {
    $agentIds["LEGAL"] = $matches[1]
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create Legal agent" -ForegroundColor Red
    Set-Location $originalDir
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating Blockchain Agent" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
$env:PATCHLINE_AGENT_TYPE = "BLOCKCHAIN"
$output = "y" | python create-bedrock-agent.py 2>&1 | Out-String
Write-Host $output
if ($output -match "Agent ID: ([A-Z0-9]+)") {
    $agentIds["BLOCKCHAIN"] = $matches[1]
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create Blockchain agent" -ForegroundColor Red
    Set-Location $originalDir
    exit 1
}

Write-Host ""
Write-Host "Step 4: Creating Scout Agent" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
$env:PATCHLINE_AGENT_TYPE = "SCOUT"
$output = "y" | python create-bedrock-agent.py 2>&1 | Out-String
Write-Host $output
if ($output -match "Agent ID: ([A-Z0-9]+)") {
    $agentIds["SCOUT"] = $matches[1]
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create Scout agent" -ForegroundColor Red
    Set-Location $originalDir
    exit 1
}

Write-Host ""
Write-Host "Step 5: Creating Supervisor Agent" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
$env:PATCHLINE_AGENT_TYPE = "SUPERVISOR"
$output = "y" | python create-bedrock-agent.py 2>&1 | Out-String
Write-Host $output
if ($output -match "Agent ID: ([A-Z0-9]+)") {
    $agentIds["SUPERVISOR"] = $matches[1]
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create Supervisor agent" -ForegroundColor Red
    Set-Location $originalDir
    exit 1
}

# Return to original directory
Set-Location $originalDir

Write-Host ""
Write-Host "✅ All agents created!" -ForegroundColor Green
Write-Host ""
Write-Host "Agent IDs Created:" -ForegroundColor Cyan
foreach ($agent in $agentIds.Keys) {
    Write-Host "  $agent : $($agentIds[$agent])" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env.local with the new agent IDs"
Write-Host "2. For the Supervisor agent ($($agentIds["SUPERVISOR"])), add collaborators in AWS Console:"
Write-Host "   - Gmail Agent: $($agentIds["GMAIL"])"
Write-Host "   - Legal Agent: $($agentIds["LEGAL"])"
Write-Host "   - Scout Agent: $($agentIds["SCOUT"])"
Write-Host "   - Blockchain Agent: $($agentIds["BLOCKCHAIN"])"
Write-Host "3. Go to: https://console.aws.amazon.com/bedrock/home#/agents/$($agentIds["SUPERVISOR"])"
Write-Host "4. Click 'Edit in Agent Builder'"
Write-Host "5. Go to 'Agent Collaboration' section"
Write-Host "6. Add all four agents as collaborators"
Write-Host "7. Save and prepare the agent"
Write-Host ""
Write-Host "8. Test each agent to ensure they have the correct instructions" 