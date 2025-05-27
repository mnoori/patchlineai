#!/usr/bin/env node

/**
 * Environment Check Script for PatchlineAI
 * 
 * This script validates environment variables and provides
 * helpful feedback for configuration issues.
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

function checkEnvVar(name, required = false, description = '') {
  const value = process.env[name]
  const status = value ? '✅' : (required ? '❌' : '⚠️ ')
  const statusText = value ? 'SET' : (required ? 'MISSING (REQUIRED)' : 'NOT SET')
  
  console.log(`${status} ${name}: ${statusText}`)
  if (description) {
    console.log(`   ${description}`)
  }
  
  return !!value
}

function main() {
  console.log('🎵 PatchlineAI Environment Check')
  console.log('=================================\n')

  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found')
    console.log('   Run: pnpm setup-env to create it\n')
  } else {
    console.log('✅ .env.local file found\n')
  }

  console.log('🔧 Core Configuration:')
  console.log('----------------------')
  checkEnvVar('NODE_ENV', false, 'Should be "development" for local dev')
  checkEnvVar('NEXT_PUBLIC_APP_URL', false, 'Base URL for the application')
  checkEnvVar('JWT_SECRET', false, 'Secret for JWT token signing')
  console.log()

  console.log('☁️  AWS Configuration:')
  console.log('----------------------')
  const hasAwsKey = checkEnvVar('ACCESS_KEY_ID', false, 'AWS Access Key ID')
  const hasAwsSecret = checkEnvVar('SECRET_ACCESS_KEY', false, 'AWS Secret Access Key')
  checkEnvVar('REGION_AWS', false, 'AWS Region (defaults to us-east-1)')
  
  if (hasAwsKey && hasAwsSecret) {
    console.log('✅ AWS credentials configured')
  } else {
    console.log('⚠️  AWS credentials incomplete - some features may not work')
  }
  console.log()

  console.log('🗄️  DynamoDB Tables:')
  console.log('--------------------')
  checkEnvVar('USERS_TABLE', false, 'User data storage')
  checkEnvVar('EMBEDS_TABLE', false, 'Platform embeds storage')
  checkEnvVar('BLOG_POSTS_TABLE', false, 'Blog posts storage')
  checkEnvVar('CONTENT_DRAFTS_TABLE', false, 'AI content drafts storage')
  console.log()

  console.log('🎧 Spotify Integration:')
  console.log('-----------------------')
  const hasSpotifyId = checkEnvVar('SPOTIFY_CLIENT_ID', true, 'Spotify App Client ID')
  const hasSpotifySecret = checkEnvVar('SPOTIFY_CLIENT_SECRET', true, 'Spotify App Client Secret')
  checkEnvVar('SPOTIFY_REDIRECT_URI', false, 'OAuth callback URL')
  checkEnvVar('SPOTIFY_LOCAL_REDIRECT_URI', false, 'Local development callback URL')
  
  if (hasSpotifyId && hasSpotifySecret) {
    console.log('✅ Spotify OAuth should work')
  } else {
    console.log('❌ Spotify OAuth will fail - missing credentials')
  }
  console.log()

  console.log('🔗 Other Platform Integrations:')
  console.log('-------------------------------')
  checkEnvVar('GOOGLE_CLIENT_ID', false, 'Google/Gmail integration')
  checkEnvVar('GOOGLE_CLIENT_SECRET', false, 'Google/Gmail integration')
  checkEnvVar('SOUNDCLOUD_CLIENT_ID', false, 'SoundCloud integration')
  checkEnvVar('SOUNDCLOUD_CLIENT_SECRET', false, 'SoundCloud integration')
  checkEnvVar('INSTAGRAM_CLIENT_ID', false, 'Instagram integration')
  checkEnvVar('INSTAGRAM_CLIENT_SECRET', false, 'Instagram integration')
  console.log()

  console.log('🤖 AI Configuration:')
  console.log('--------------------')
  checkEnvVar('BEDROCK_MODEL_ID', false, 'AWS Bedrock AI model')
  console.log()

  // Environment-specific guidance
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isProduction) {
    console.log('🚀 Production Environment Detected')
    console.log('----------------------------------')
    console.log('- Ensure all secrets are set in Amplify environment variables')
    console.log('- Verify redirect URIs match your production domain')
    console.log('- Check that AWS credentials have proper permissions')
  } else if (isDevelopment) {
    console.log('🛠️  Development Environment Detected')
    console.log('------------------------------------')
    console.log('- Use 127.0.0.1 instead of localhost for Spotify')
    console.log('- Ensure .env.local is in .gitignore')
    console.log('- Test OAuth flows locally before deploying')
  } else {
    console.log('⚠️  Environment not explicitly set')
    console.log('----------------------------------')
    console.log('- Set NODE_ENV=development for local development')
    console.log('- Set NODE_ENV=production for production deployment')
  }

  console.log('\n📋 Next Steps:')
  if (!fs.existsSync(envPath)) {
    console.log('1. Run: pnpm setup-env')
    console.log('2. Add your actual credentials to .env.local')
  } else {
    console.log('1. Update missing credentials in .env.local')
  }
  console.log('2. Run: pnpm dev')
  console.log('3. Test at: http://localhost:3000/dashboard/settings')
}

main() 