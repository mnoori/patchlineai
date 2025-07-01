/**
 * Figma Integration Example
 * Demonstrates how to use the Figma integration
 */

import { createFigmaIntegration } from '../lib/figma'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  try {
    console.log('🎨 Figma Integration Example\n')
    
    // Initialize Figma integration
    const figma = createFigmaIntegration()
    const fileId = process.env.FIGMA_FILE_ID!
    
    // Example 1: Sync Design Tokens
    console.log('1️⃣ Syncing design tokens...')
    const { brandConstants, tokens, file } = await figma.syncDesignTokens(fileId)
    
    console.log(`   ✅ Synced from: ${file.name}`)
    console.log(`   📊 Token counts:`)
    console.log(`      - Colors: ${Object.keys(tokens.colors).length}`)
    console.log(`      - Typography: ${Object.keys(tokens.typography).length}`)
    console.log(`      - Spacing: ${Object.keys(tokens.spacing).length}`)
    
    // Save token report
    const reportPath = join(process.cwd(), 'figma-tokens-example.json')
    writeFileSync(reportPath, JSON.stringify({ tokens, brandConstants }, null, 2))
    console.log(`   📄 Token report saved to: figma-tokens-example.json\n`)
    
    // Example 2: Generate Components (if component IDs are provided)
    const componentIds = process.env.FIGMA_COMPONENT_IDS?.split(',') || []
    
    if (componentIds.length > 0) {
      console.log('2️⃣ Generating React components...')
      const components = await figma.generateComponents(fileId, componentIds)
      
      // Create output directory
      const outputDir = join(process.cwd(), 'components/generated-example')
      mkdirSync(outputDir, { recursive: true })
      
      // Save each component
      for (const component of components) {
        const componentPath = join(outputDir, `${component.name}.tsx`)
        writeFileSync(componentPath, component.component)
        console.log(`   ✅ Generated: ${component.name}`)
        
        if (component.story) {
          const storyPath = join(outputDir, `${component.name}.stories.tsx`)
          writeFileSync(storyPath, component.story)
        }
      }
      console.log(`   📁 Components saved to: components/generated-example/\n`)
    }
    
    // Example 3: Export Assets (if node IDs are provided)
    const assetNodeIds = process.env.FIGMA_ASSET_NODE_IDS?.split(',') || []
    
    if (assetNodeIds.length > 0) {
      console.log('3️⃣ Exporting assets...')
      const assets = await figma.exportAssets(fileId, assetNodeIds, 'svg')
      
      console.log(`   📦 Exported ${assets.length} assets:`)
      for (const asset of assets) {
        console.log(`      - ${asset.name}: ${asset.url}`)
      }
      
      // Save asset manifest
      const manifestPath = join(process.cwd(), 'figma-assets-example.json')
      writeFileSync(manifestPath, JSON.stringify(assets, null, 2))
      console.log(`   📄 Asset manifest saved to: figma-assets-example.json\n`)
    }
    
    console.log('✅ Figma integration example completed!')
    console.log('\n💡 Tips:')
    console.log('   - Add FIGMA_COMPONENT_IDS to generate specific components')
    console.log('   - Add FIGMA_ASSET_NODE_IDS to export specific assets')
    console.log('   - Check the generated files for results')
    console.log('   - Run "pnpm tsx scripts/sync-figma-tokens.ts" for production sync')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the example
main() 