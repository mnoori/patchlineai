# Spotify Integration Deployment Script for Windows

Write-Host "Musicos App - Spotify Integration Deployment Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
$vercelInstalled = $null
try {
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
} catch {
    # Command doesn't exist
}

if ($null -eq $vercelInstalled) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Verify environment variables
Write-Host "Checking for Spotify credentials..." -ForegroundColor Green

# Prompt for Spotify credentials if not already set
if (-not $env:SPOTIFY_CLIENT_ID) {
    $spotify_client_id = Read-Host "Enter your Spotify Client ID"
    $env:SPOTIFY_CLIENT_ID = $spotify_client_id
    
    # Save to .env.local
    if (Test-Path .env.local) {
        $envContent = Get-Content .env.local
        $envContent = $envContent | Where-Object { -not $_.StartsWith("SPOTIFY_CLIENT_ID=") }
        $envContent += "SPOTIFY_CLIENT_ID=$spotify_client_id"
        $envContent | Set-Content .env.local
    } else {
        "SPOTIFY_CLIENT_ID=$spotify_client_id" | Set-Content .env.local
    }
    
    Write-Host "Spotify Client ID set for this session and saved to .env.local" -ForegroundColor Green
} else {
    Write-Host "Using existing Spotify Client ID from environment" -ForegroundColor Green
}

if (-not $env:SPOTIFY_CLIENT_SECRET) {
    $spotify_client_secret = Read-Host "Enter your Spotify Client Secret"
    $env:SPOTIFY_CLIENT_SECRET = $spotify_client_secret
    
    # Save to .env.local
    if (Test-Path .env.local) {
        $envContent = Get-Content .env.local
        $envContent = $envContent | Where-Object { -not $_.StartsWith("SPOTIFY_CLIENT_SECRET=") }
        $envContent += "SPOTIFY_CLIENT_SECRET=$spotify_client_secret"
        $envContent | Set-Content .env.local
    } else {
        "SPOTIFY_CLIENT_SECRET=$spotify_client_secret" | Set-Content .env.local
    }
    
    Write-Host "Spotify Client Secret set for this session and saved to .env.local" -ForegroundColor Green
} else {
    Write-Host "Using existing Spotify Client Secret from environment" -ForegroundColor Green
}

# Build the application
Write-Host ""
Write-Host "Building application..." -ForegroundColor Cyan
npm run build

# Deploy to Vercel
Write-Host ""
Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
Write-Host "IMPORTANT: When prompted, confirm that you want to add the environment variables" -ForegroundColor Yellow
Write-Host ""

vercel deploy --prod --env SPOTIFY_CLIENT_ID=$env:SPOTIFY_CLIENT_ID --env SPOTIFY_CLIENT_SECRET=$env:SPOTIFY_CLIENT_SECRET

Write-Host ""
Write-Host "Deployment complete. Check the Vercel dashboard for the deployment status." -ForegroundColor Green
Write-Host "If Spotify integration is not working, please verify your credentials in the Vercel project settings." -ForegroundColor Yellow
