/**
 * Test Figma Assets
 * Let's see what we can actually get from the Figma API
 */

import { FigmaClient } from '../lib/figma/client'
import { getFigmaConfig } from '../lib/figma'
import { writeFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testAssets() {
  const config = getFigmaConfig()
  const fileId = "PbzhWQIGJF68IPYo8Bheck"
  const client = new FigmaClient(config.accessToken!)

  console.log('🔍 Testing Figma Asset Capabilities...\n')

  const exportableAssets = [
    { id: "2001:378", name: "Logo Light" },
    { id: "2001:427", name: "Brandmark Dark" },
    { id: "2005:2", name: "Brandmark Blue" },
    { id: "113:16", name: "PatchlineAI_Brand Guide" }
  ]

  // 1. Test exporting known exportable assets
  console.log('1️⃣ Testing image export for assets...')
  
  for (const asset of exportableAssets) {
    try {
      console.log(`   Exporting ${asset.name}...`)
      const exports = await client.exportAssets(fileId, [asset.id], 'png', 2)
      console.log(`   ✅ ${asset.name}: ${exports[asset.id]}`)
    } catch (error: any) {
      console.log(`   ❌ ${asset.name} failed:`, error.message)
    }
  }

  // 2. Get the actual file to find the right nodes
  console.log('\n2️⃣ Finding gradient backgrounds...')
  const file = await client.getFile(fileId)
  
  // Look for frames with gradient fills
  const framesWithGradients: any[] = []
  
  const findGradients = (node: any, path: string = '') => {
    if (node.fills && Array.isArray(node.fills)) {
      const gradientFills = node.fills.filter((fill: any) => 
        fill.type && fill.type.includes('GRADIENT')
      )
      
      if (gradientFills.length > 0) {
        framesWithGradients.push({
          id: node.id,
          name: node.name,
          type: node.type,
          path: path || node.name,
          gradients: gradientFills.map((g: any) => ({
            type: g.type,
            stops: g.gradientStops?.length || 0
          }))
        })
      }
    }
    
    if (node.children) {
      node.children.forEach((child: any) => 
        findGradients(child, path ? `${path} > ${node.name}` : node.name)
      )
    }
  }
  
  file.document.children.forEach((page: any) => findGradients(page))
  
  console.log(`✅ Found ${framesWithGradients.length} frames with gradients`)
  framesWithGradients.slice(0, 5).forEach(frame => {
    console.log(`   - ${frame.name} (${frame.type})`)
    console.log(`     ID: ${frame.id}`)
    frame.gradients.forEach((g: any) => {
      console.log(`     Gradient: ${g.type} with ${g.stops} stops`)
    })
  })

  // 3. Test color styles
  console.log('\n3️⃣ Checking color styles...')
  const styles = await client.getStyles(fileId)
  console.log(`✅ Found ${styles.length} styles`)
  
  styles.filter(s => s.type === 'FILL').slice(0, 5).forEach(style => {
    console.log(`   - ${style.name || 'Unnamed'} (${style.id})`)
  })

  // Save detailed report
  const report = {
    exportableAssets: exportableAssets,
    gradientsFound: framesWithGradients,
    styles: styles.map(s => ({ id: s.id, name: s.name, type: s.type }))
  }
  
  writeFileSync('figma-capabilities-test.json', JSON.stringify(report, null, 2))
  console.log('\n📄 Detailed report saved: figma-capabilities-test.json')
}

testAssets().catch(console.error) 