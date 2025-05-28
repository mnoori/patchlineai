#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')

// Read current .env.local
let envContent = ''
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Check current demo mode status
const currentDemoMode = envContent.includes('NEXT_PUBLIC_DEMO_MODE=true')

if (currentDemoMode) {
  // Turn off demo mode
  envContent = envContent.replace(/NEXT_PUBLIC_DEMO_MODE=true/g, 'NEXT_PUBLIC_DEMO_MODE=false')
  console.log('🔴 Demo mode DISABLED - Real AI responses and logs will be shown')
} else {
  // Turn on demo mode
  if (envContent.includes('NEXT_PUBLIC_DEMO_MODE=false')) {
    envContent = envContent.replace(/NEXT_PUBLIC_DEMO_MODE=false/g, 'NEXT_PUBLIC_DEMO_MODE=true')
  } else {
    // Add demo mode if it doesn't exist
    envContent += '\n# Demo Mode for Investor Presentations\nNEXT_PUBLIC_DEMO_MODE=true\n'
  }
  console.log('🟢 Demo mode ENABLED - Mock responses and logs will be shown for investor presentations')
}

// Write back to .env.local
fs.writeFileSync(envPath, envContent)

console.log('\n💡 Restart your development server for changes to take effect:')
console.log('   npm run dev')
console.log('\n📋 Demo mode features:')
console.log('   • Agent mode shows mock "Summer Vibes" catalog analysis')
console.log('   • Sidebar shows simulated logs with fake processing steps')
console.log('   • Perfect for investor presentations and demos')
console.log('\n🔧 Real mode features:')
console.log('   • Agent mode calls actual Bedrock Agent with Gmail integration')
console.log('   • Sidebar shows real console logs from API calls')
console.log('   • Chat mode uses direct Nova Micro model calls') 