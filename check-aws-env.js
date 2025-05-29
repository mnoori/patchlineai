#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

console.log('🔍 AWS CREDENTIALS CHECK')
console.log('========================\n')

console.log('📋 Standard AWS Environment Variables:')
console.log(`AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`)
console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ MISSING'}`)
console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ MISSING'}`)
console.log(`AWS_SESSION_TOKEN: ${process.env.AWS_SESSION_TOKEN ? '✅ SET' : 'NOT SET (optional)'}`)

console.log('\n📋 Alternative AWS Environment Variables (your project uses):')
console.log(`REGION_AWS: ${process.env.REGION_AWS || 'NOT SET'}`)
console.log(`ACCESS_KEY_ID: ${process.env.ACCESS_KEY_ID ? '✅ SET' : '❌ MISSING'}`)
console.log(`SECRET_ACCESS_KEY: ${process.env.SECRET_ACCESS_KEY ? '✅ SET' : '❌ MISSING'}`)

console.log('\n🎯 Required for Supervisor Agent:')
console.log('Your .env.local needs one of these patterns:')
console.log('')
console.log('Option 1 (Standard AWS):')
console.log('AWS_REGION=us-east-1')
console.log('AWS_ACCESS_KEY_ID=your_access_key')
console.log('AWS_SECRET_ACCESS_KEY=your_secret_key')
console.log('')
console.log('Option 2 (Your project pattern):')
console.log('REGION_AWS=us-east-1')
console.log('ACCESS_KEY_ID=your_access_key')
console.log('SECRET_ACCESS_KEY=your_secret_key')
console.log('')
console.log('💡 The Supervisor Agent needs AWS credentials to invoke other agents!') 