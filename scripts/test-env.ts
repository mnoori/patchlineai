import dotenv from 'dotenv'
import { getFigmaConfig } from '../lib/figma'

// Load environment variables
dotenv.config({ path: '.env.local' })

console.log('Testing environment variables...\n')

// Check individual env vars
console.log('Direct env vars:')
console.log('  FIGMA_ACCESS_TOKEN:', process.env.FIGMA_ACCESS_TOKEN ? '✅ Set' : '❌ Not set')
console.log('  FIGMA_FILE_ID:', process.env.FIGMA_FILE_ID ? '✅ Set' : '❌ Not set')
console.log('  FIGMA_Client_ID:', process.env.FIGMA_Client_ID ? '✅ Set' : '❌ Not set')
console.log('  FIGMA_Client_Secret:', process.env.FIGMA_Client_Secret ? '✅ Set' : '❌ Not set')

console.log('\nUsing getFigmaConfig():')
const config = getFigmaConfig()
console.log('  accessToken:', config.accessToken ? '✅ Available' : '❌ Not available')
console.log('  fileId:', config.fileId ? `✅ ${config.fileId}` : '❌ Not available')
console.log('  clientId:', config.clientId ? '✅ Available' : '❌ Not available')
console.log('  clientSecret:', config.clientSecret ? '✅ Available' : '❌ Not available') 