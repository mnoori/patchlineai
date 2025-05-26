# ===================================================================
# PatchlineAI - New Environment Setup Script (PowerShell)
# ===================================================================
# This script helps set up a new development environment for PatchlineAI
# Run this script from the project root directory in PowerShell

$ErrorActionPreference = "Stop"

Write-Host "🚀 PatchlineAI Environment Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found package.json - we're in the right directory" -ForegroundColor Green

# Check for required tools
Write-Host ""
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version $nodeVersion is too old. Please install Node.js 18+ first." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm $pnpmVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm is not installed. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✅ pnpm installed" -ForegroundColor Green
}

# Check AWS CLI
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $($awsVersion.Split(' ')[0])" -ForegroundColor Green
} catch {
    Write-Host "⚠️  AWS CLI not found. You may need to install it for some operations." -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "backend/app"
pnpm install
Set-Location "../.."

Write-Host "📦 Installing infrastructure dependencies..." -ForegroundColor Yellow
Set-Location "backend/infra"
pnpm install
Set-Location "../.."

# Create environment file if it doesn't exist
Write-Host ""
Write-Host "🔧 Setting up environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item "backend/env-template.txt" ".env.local"
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: You need to edit .env.local with your AWS credentials!" -ForegroundColor Red
    Write-Host "   1. Open .env.local in your editor" -ForegroundColor White
    Write-Host "   2. Replace 'your_access_key_here' with your actual AWS Access Key ID" -ForegroundColor White
    Write-Host "   3. Replace 'your_secret_key_here' with your actual AWS Secret Access Key" -ForegroundColor White
    Write-Host "   4. Save the file and restart your development server" -ForegroundColor White
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Check if Amplify is configured
Write-Host ""
Write-Host "🔍 Checking Amplify configuration..." -ForegroundColor Yellow

if (-not (Test-Path "amplify")) {
    Write-Host "⚠️  Amplify not configured. You may need to run:" -ForegroundColor Yellow
    Write-Host "   amplify pull --appId d40rmftf5h7p7 --envName staging" -ForegroundColor White
    Write-Host "   OR" -ForegroundColor White
    Write-Host "   amplify init (for a new project)" -ForegroundColor White
} else {
    Write-Host "✅ Amplify configuration found" -ForegroundColor Green
}

# Final instructions
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================="
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local with your AWS credentials (if you haven't already)" -ForegroundColor White
Write-Host "2. Restart your development server: pnpm dev" -ForegroundColor White
Write-Host "3. Test AWS connectivity: node check-aws-credentials.mjs" -ForegroundColor White
Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For backend development:" -ForegroundColor Cyan
Write-Host "- Start backend server: cd backend/app && pnpm dev" -ForegroundColor White
Write-Host "- Backend will run on http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Complete setup guide: backend/COMPLETE_SETUP_GUIDE.md" -ForegroundColor White
Write-Host "- Development guide: DEVELOPMENT.md" -ForegroundColor White
Write-Host "- Bedrock setup: BEDROCK-SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "🆘 Need help? Check the documentation files or run health checks!" -ForegroundColor Yellow 