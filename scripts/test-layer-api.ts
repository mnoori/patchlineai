/**
 * Test Layer API
 * Quick test to see what data the layer extractor returns
 */

import { FigmaClient, LayerExtractor } from '../lib/figma'
import { getFigmaConfig } from '../lib/figma'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testLayerAPI() {
  try {
    const config = getFigmaConfig()
    
    if (!config.accessToken || !config.fileId) {
      console.error('❌ Missing required environment variables')
      process.exit(1)
    }
    
    console.log('🔍 Testing Layer API...\n')
    
    const client = new FigmaClient(config.accessToken!)
    const extractor = new LayerExtractor(client)
    
    // Test with Brand Guide page ID
    const pageId = '113:2'
    console.log(`📄 Fetching layers for page: ${pageId}`)
    
    const layer = await extractor.getLayerDetails(config.fileId!, pageId)
    
    if (!layer) {
      console.log('❌ No layer data returned')
      return
    }
    
    console.log('\n✅ Layer data received:')
    console.log(`   Name: ${layer.name}`)
    console.log(`   Type: ${layer.type}`)
    console.log(`   ID: ${layer.id}`)
    console.log(`   Visible: ${layer.visible}`)
    console.log(`   Children: ${layer.children?.length || 0}`)
    
    if (layer.children && layer.children.length > 0) {
      console.log('\n📦 First 5 children:')
      layer.children.slice(0, 5).forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.name} (${child.type})`)
      })
    }
    
    // Save to file for inspection
    const fs = require('fs')
    fs.writeFileSync('layer-test-output.json', JSON.stringify(layer, null, 2))
    console.log('\n💾 Full layer data saved to: layer-test-output.json')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testLayerAPI() 