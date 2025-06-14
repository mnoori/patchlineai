# PowerShell script to organize documentation files
Write-Host "Starting documentation organization..." -ForegroundColor Green

# Create the main documentation directory
New-Item -ItemType Directory -Path "documentation" -Force | Out-Null

# Create subdirectories
$directories = @(
    "documentation/00_Getting_Started",
    "documentation/01_Deployment", 
    "documentation/02_Architecture",
    "documentation/03_Integrations/MCP",
    "documentation/03_Integrations/Revelator",
    "documentation/03_Integrations/Nova_Canvas",
    "documentation/03_Integrations/Soundcharts",
    "documentation/03_Integrations/Spotify",
    "documentation/03_Integrations/Gmail",
    "documentation/04_AWS_and_Bedrock",
    "documentation/05_Web3",
    "documentation/06_Development_Guides",
    "documentation/07_Troubleshooting_and_Fixes",
    "documentation/08_Performance_and_Optimization",
    "documentation/09_Strategy_and_Vision",
    "documentation/10_Archive"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created directory: $dir" -ForegroundColor Yellow
}

# Function to safely move files
function Move-FileIfExists {
    param($Source, $Destination)
    if (Test-Path $Source) {
        Move-Item -Path $Source -Destination $Destination -Force
        Write-Host "Moved: $Source -> $Destination" -ForegroundColor Cyan
    } else {
        Write-Host "File not found: $Source" -ForegroundColor Red
    }
}

# Move files from root directory
Write-Host "`nMoving files from root directory..." -ForegroundColor Green

# Getting Started
Move-FileIfExists "README.md" "documentation/00_Getting_Started/"
Move-FileIfExists "DEVELOPMENT.md" "documentation/00_Getting_Started/"
Move-FileIfExists "setup-local.md" "documentation/00_Getting_Started/"

# Deployment
Move-FileIfExists "DEPLOYMENT.md" "documentation/01_Deployment/"
Move-FileIfExists "PRODUCTION_DEPLOYMENT_CHECKLIST.md" "documentation/01_Deployment/"
Move-FileIfExists "PRODUCTION_FIX_CHECKLIST.md" "documentation/01_Deployment/"
Move-FileIfExists "PRODUCTION.md" "documentation/01_Deployment/"
Move-FileIfExists "amplify.yml" "documentation/01_Deployment/"

# Architecture
Move-FileIfExists "MULTI_AGENT_SYSTEM_DOCS.md" "documentation/02_Architecture/"

# MCP Integration
Move-FileIfExists "AWS_MCP_IMPLEMENTATION_SUMMARY.md" "documentation/03_Integrations/MCP/"
Move-FileIfExists "MCP_IMPLEMENTATION_PLAN.md" "documentation/03_Integrations/MCP/"
Move-FileIfExists "AWS_MCP_ENV_EXAMPLE.md" "documentation/03_Integrations/MCP/"

# Revelator Integration
Move-FileIfExists "REVELATOR_INTEGRATION_SUMMARY.md" "documentation/03_Integrations/Revelator/"
Move-FileIfExists "REVELATOR_IMPLEMENTATION_PLAN.md" "documentation/03_Integrations/Revelator/"

# Nova Canvas Integration
Move-FileIfExists "NOVA_CANVAS_IMPLEMENTATION_SUMMARY.md" "documentation/03_Integrations/Nova_Canvas/"
Move-FileIfExists "NOVA_CANVAS_INTEGRATION_PLAN.md" "documentation/03_Integrations/Nova_Canvas/"
Move-FileIfExists "NOVA_CANVAS_TESTING_GUIDE.md" "documentation/03_Integrations/Nova_Canvas/"
Move-FileIfExists "NOVA_CANVAS_DEMO_INTEGRATION.md" "documentation/03_Integrations/Nova_Canvas/"
Move-FileIfExists "NOVA_CANVAS_COMPLETE_IMPLEMENTATION.md" "documentation/03_Integrations/Nova_Canvas/"

# Spotify Integration
Move-FileIfExists "SPOTIFY_TOKEN_REFRESH_SUMMARY.md" "documentation/03_Integrations/Spotify/"
Move-FileIfExists "SPOTIFY_PROFILE_FIX_SUMMARY.md" "documentation/03_Integrations/Spotify/"
Move-FileIfExists "SPOTIFY_OAUTH_TROUBLESHOOTING.md" "documentation/03_Integrations/Spotify/"

# Gmail Integration
Move-FileIfExists "CHAT_GMAIL_INTEGRATION_SUMMARY.md" "documentation/03_Integrations/Gmail/"

# AWS and Bedrock
Move-FileIfExists "BEDROCK-SETUP.md" "documentation/04_AWS_and_Bedrock/"
Move-FileIfExists "aws-credentials-setup.md" "documentation/04_AWS_and_Bedrock/"
Move-FileIfExists "aws-credential-fix.md" "documentation/04_AWS_and_Bedrock/"

# Web3
Move-FileIfExists "WEB3_IMPLEMENTATION_PLAN.md" "documentation/05_Web3/"
Move-FileIfExists "WEB3_IMPLEMENTATION_STATUS.md" "documentation/05_Web3/"
Move-FileIfExists "WEB3_PORTAL_IMPLEMENTATION.md" "documentation/05_Web3/"
Move-FileIfExists "WEB3_FIXES_SUMMARY.md" "documentation/05_Web3/"

# Development Guides
Move-FileIfExists "AGENT_MANAGEMENT_GUIDE.md" "documentation/06_Development_Guides/"
Move-FileIfExists "PLATFORM_INTEGRATION_GUIDE.md" "documentation/06_Development_Guides/"
Move-FileIfExists "ENVIRONMENT_VARIABLES.md" "documentation/06_Development_Guides/"

# Troubleshooting and Fixes
Move-FileIfExists "TROUBLESHOOTING.md" "documentation/07_Troubleshooting_and_Fixes/"
Move-FileIfExists "FIXES_SUMMARY.md" "documentation/07_Troubleshooting_and_Fixes/"
Move-FileIfExists "AGENT_MODE_FIX.md" "documentation/07_Troubleshooting_and_Fixes/"
Move-FileIfExists "EMERGENCY_FIX.md" "documentation/07_Troubleshooting_and_Fixes/"
Move-FileIfExists "BLOCKCHAIN_FIXES_SUMMARY.md" "documentation/07_Troubleshooting_and_Fixes/"

# Performance and Optimization
Move-FileIfExists "PERFORMANCE_OPTIMIZATIONS.md" "documentation/08_Performance_and_Optimization/"
Move-FileIfExists "PERFORMANCE_OPTIMIZATIONS_SUMMARY.md" "documentation/08_Performance_and_Optimization/"
Move-FileIfExists "LOCAL_OPTIMIZATION_SUMMARY.md" "documentation/08_Performance_and_Optimization/"
Move-FileIfExists "TURBO_MODE_SETUP.md" "documentation/08_Performance_and_Optimization/"

# Archive (older or redundant files)
Move-FileIfExists "SOCIAL_MEDIA_UI_IMPROVEMENTS.md" "documentation/10_Archive/"
Move-FileIfExists "SOCIAL_MEDIA_UI_IMPROVEMENTS_V2.md" "documentation/10_Archive/"
Move-FileIfExists "SOCIAL_MEDIA_CREATOR_FINAL_IMPLEMENTATION.md" "documentation/10_Archive/"
Move-FileIfExists "SOCIAL_MEDIA_USER_JOURNEY_TEST.md" "documentation/10_Archive/"
Move-FileIfExists "CHANGELOG.md" "documentation/10_Archive/"
Move-FileIfExists "BACKLOG.md" "documentation/10_Archive/"

# Move files from docs directory
Write-Host "`nMoving files from docs directory..." -ForegroundColor Green

if (Test-Path "docs") {
    # Move soundcharts-api directory
    if (Test-Path "docs/soundcharts-api") {
        Move-Item -Path "docs/soundcharts-api" -Destination "documentation/03_Integrations/Soundcharts/" -Force
        Write-Host "Moved: docs/soundcharts-api -> documentation/03_Integrations/Soundcharts/" -ForegroundColor Cyan
    }
    
    # Move other docs files to archive
    Move-FileIfExists "docs/REBRAND_SUMMARY.md" "documentation/10_Archive/"
    Move-FileIfExists "docs/AGENT_CONFIGURATION.md" "documentation/06_Development_Guides/"
    Move-FileIfExists "docs/SCOUT_AGENT_IMPROVEMENTS.md" "documentation/10_Archive/"
    Move-FileIfExists "docs/api-integrations.md" "documentation/06_Development_Guides/"
    Move-FileIfExists "docs/PATCHLINE_REBUILD_JOURNEY.md" "documentation/10_Archive/"
    Move-FileIfExists "docs/SOUNDCHARTS_INTEGRATION.md" "documentation/03_Integrations/Soundcharts/"
    Move-FileIfExists "docs/BUILD_SCRIPTS.md" "documentation/06_Development_Guides/"
    Move-FileIfExists "docs/AGENT_COLLABORATION_STRUCTURE.md" "documentation/06_Development_Guides/"
    Move-FileIfExists "docs/AI_REBUILDING_AI_ARCHITECTURE.md" "documentation/02_Architecture/"
    Move-FileIfExists "docs/AGENT_COLLABORATION_COMPLETE_GUIDE.md" "documentation/06_Development_Guides/"
}

# Move files from backend directory
Write-Host "`nMoving files from backend directory..." -ForegroundColor Green

Move-FileIfExists "backend/AGENT_MODEL_MIGRATION.md" "documentation/10_Archive/"
Move-FileIfExists "backend/BEDROCK_AGENT_SETUP.md" "documentation/04_AWS_and_Bedrock/"
Move-FileIfExists "backend/bedrock-agent-gmail-integration.md" "documentation/03_Integrations/Gmail/"
Move-FileIfExists "backend/aws-bedrock-integration-guide.md" "documentation/04_AWS_and_Bedrock/"
Move-FileIfExists "backend/DEVELOPER_CONTEXT.md" "documentation/00_Getting_Started/"
Move-FileIfExists "backend/README.md" "documentation/00_Getting_Started/Backend_README.md"
Move-FileIfExists "backend/COMPLETE_SETUP_GUIDE.md" "documentation/00_Getting_Started/Backend_Setup_Guide.md"
Move-FileIfExists "backend/API_DOCUMENTATION.md" "documentation/06_Development_Guides/"
Move-FileIfExists "backend/AGENT_CONFIGURATION.md" "documentation/06_Development_Guides/Backend_Agent_Configuration.md"

# Move files from backend/docs/strategy
Write-Host "`nMoving files from backend/docs/strategy..." -ForegroundColor Green

if (Test-Path "backend/docs/strategy") {
    $strategyFiles = Get-ChildItem "backend/docs/strategy" -Filter "*.md"
    foreach ($file in $strategyFiles) {
        Move-Item -Path $file.FullName -Destination "documentation/09_Strategy_and_Vision/" -Force
        Write-Host "Moved: $($file.FullName) -> documentation/09_Strategy_and_Vision/" -ForegroundColor Cyan
    }
}

# Move files from backend/docs/developer context
Write-Host "`nMoving files from backend/docs/developer context..." -ForegroundColor Green

if (Test-Path "backend/docs/developer context") {
    $devContextFiles = Get-ChildItem "backend/docs/developer context" -Filter "*.md"
    foreach ($file in $devContextFiles) {
        Move-Item -Path $file.FullName -Destination "documentation/10_Archive/" -Force
        Write-Host "Moved: $($file.FullName) -> documentation/10_Archive/" -ForegroundColor Cyan
    }
}

# Move remaining backend/docs files
if (Test-Path "backend/docs") {
    Move-FileIfExists "backend/docs/lambda-management.md" "documentation/06_Development_Guides/"
    Move-FileIfExists "backend/docs/dynamodb-table-env.md" "documentation/04_AWS_and_Bedrock/"
    Move-FileIfExists "backend/docs/agent-system.md" "documentation/02_Architecture/"
    Move-FileIfExists "backend/docs/BACKLOG.md" "documentation/10_Archive/Backend_Backlog.md"
    Move-FileIfExists "backend/docs/ARCHITECTURE_VISION.md" "documentation/02_Architecture/"
}

# Clean up empty directories
Write-Host "`nCleaning up empty directories..." -ForegroundColor Green

$emptyDirs = @("docs", "backend/docs/strategy", "backend/docs/developer context", "backend/docs")
foreach ($dir in $emptyDirs) {
    if (Test-Path $dir) {
        $items = Get-ChildItem $dir -ErrorAction SilentlyContinue
        if ($items.Count -eq 0) {
            Remove-Item $dir -Force
            Write-Host "Removed empty directory: $dir" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nDocumentation organization complete!" -ForegroundColor Green
Write-Host "All files have been moved to the new documentation structure." -ForegroundColor Green 