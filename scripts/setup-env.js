#!/usr/bin/env node

/**
 * Environment Setup Script for PatchlineAI
 * 
 * This script helps set up environment variables for local development
 * and provides guidance for production deployment.
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🎵 PatchlineAI Environment Setup')
  console.log('================================\n')

  const envPath = path.join(process.cwd(), '.env.local')
  const templatePath = path.join(process.cwd(), 'env-template.txt')

  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('Setting up environment variables for local development...\n')

  // Read template
  let template = ''
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf8')
  } else {
    // Fallback template
    template = `# AWS Configuration
REGION_AWS=us-east-1
ACCESS_KEY_ID=your_aws_access_key_here
SECRET_ACCESS_KEY=your_aws_secret_key_here

# DynamoDB Tables
USERS_TABLE=Users-staging
EMBEDS_TABLE=Embeds-staging
BLOG_POSTS_TABLE=BlogPosts-staging
CONTENT_DRAFTS_TABLE=ContentDrafts-staging

# Platform Integrations
SPOTIFY_CLIENT_ID=1c3ef44bdb494a4c90c591f56fd4bc37
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/oauth/spotify/callback

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=development-jwt-secret-key
ENV=development
NODE_ENV=development

# AI Configuration
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
`
  }

  // Get Spotify credentials
  console.log('🎧 Spotify Configuration')
  console.log('------------------------')
  const spotifySecret = await question('Enter your Spotify Client Secret (or press Enter to skip): ')
  
  if (spotifySecret) {
    template = template.replace('your_spotify_client_secret_here', spotifySecret)
    console.log('✅ Spotify credentials configured')
  } else {
    console.log('⚠️  Spotify Client Secret not set - OAuth will fail')
  }

  // Get AWS credentials
  console.log('\n☁️  AWS Configuration')
  console.log('---------------------')
  const awsAccessKey = await question('Enter your AWS Access Key ID (or press Enter to skip): ')
  const awsSecretKey = await question('Enter your AWS Secret Access Key (or press Enter to skip): ')
  
  if (awsAccessKey && awsSecretKey) {
    template = template.replace('your_aws_access_key_here', awsAccessKey)
    template = template.replace('your_aws_secret_key_here', awsSecretKey)
    console.log('✅ AWS credentials configured')
  } else {
    console.log('⚠️  AWS credentials not set - some features may not work')
  }

  // Write .env.local
  fs.writeFileSync(envPath, template)
  console.log(`\n✅ Environment file created: ${envPath}`)

  console.log('\n📋 Next Steps:')
  console.log('1. Review and update .env.local with your actual credentials')
  console.log('2. Run: pnpm dev')
  console.log('3. Test Spotify connection at: http://localhost:3000/dashboard/settings')

  console.log('\n🔒 Security Notes:')
  console.log('- .env.local is already in .gitignore')
  console.log('- Never commit secrets to version control')
  console.log('- Use Amplify environment variables for production')

  rl.close()
}

main().catch(console.error) 