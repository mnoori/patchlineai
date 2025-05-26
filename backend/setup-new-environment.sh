#!/bin/bash

# ===================================================================
# PatchlineAI - New Environment Setup Script
# ===================================================================
# This script helps set up a new development environment for PatchlineAI
# Run this script from the project root directory

set -e  # Exit on any error

echo "🚀 PatchlineAI Environment Setup"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found package.json - we're in the right directory"

# Check for required tools
echo ""
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js $(node --version) found"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version) found"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. You may need to install it for some operations."
else
    echo "✅ AWS CLI $(aws --version | cut -d' ' -f1) found"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

echo "📦 Installing backend dependencies..."
cd backend/app
pnpm install
cd ../..

echo "📦 Installing infrastructure dependencies..."
cd backend/infra
pnpm install
cd ../..

# Create environment file if it doesn't exist
echo ""
echo "🔧 Setting up environment configuration..."

if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp backend/env-template.txt .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit .env.local with your AWS credentials!"
    echo "   1. Open .env.local in your editor"
    echo "   2. Replace 'your_access_key_here' with your actual AWS Access Key ID"
    echo "   3. Replace 'your_secret_key_here' with your actual AWS Secret Access Key"
    echo "   4. Save the file and restart your development server"
else
    echo "✅ .env.local already exists"
fi

# Check if Amplify is configured
echo ""
echo "🔍 Checking Amplify configuration..."

if [ ! -d "amplify" ]; then
    echo "⚠️  Amplify not configured. You may need to run:"
    echo "   amplify pull --appId d40rmftf5h7p7 --envName staging"
    echo "   OR"
    echo "   amplify init (for a new project)"
else
    echo "✅ Amplify configuration found"
fi

# Final instructions
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your AWS credentials (if you haven't already)"
echo "2. Restart your development server: pnpm dev"
echo "3. Test AWS connectivity: node check-aws-credentials.mjs"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "For backend development:"
echo "- Start backend server: cd backend/app && pnpm dev"
echo "- Backend will run on http://localhost:3001"
echo ""
echo "📚 Documentation:"
echo "- Complete setup guide: backend/COMPLETE_SETUP_GUIDE.md"
echo "- Development guide: DEVELOPMENT.md"
echo "- Bedrock setup: BEDROCK-SETUP.md"
echo ""
echo "🆘 Need help? Check the documentation files or run health checks!" 