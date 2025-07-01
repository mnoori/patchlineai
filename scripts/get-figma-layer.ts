/**
 * Get Specific Figma Layer
 * Extract visual properties and background information from specific layers
 */

import { FigmaClient } from '../lib/figma/client'
import { getFigmaConfig } from '../lib/figma'
import { writeFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function getLayerDetails() {
  try {
    console.log('🔍 Searching for specific Figma layer...\n')
    
    const config = getFigmaConfig()
    const fileId = "PbzhWQIGJF68IPYo8Bheck" // Clean file ID
    
    if (!config.accessToken) {
      console.error('❌ Missing FIGMA_ACCESS_TOKEN')
      process.exit(1)
    }
    
    const client = new FigmaClient(config.accessToken!)
    
    // Get the full file
    console.log('📄 Fetching Figma file...')
    const file = await client.getFile(fileId)
    
    // Search for the specific layer
    const targetLayerName = "PatchlineAI_Brand Guide_Simple"
    let foundLayer: any = null
    let layerPath = ""
    
    const searchNodes = (node: any, path: string = '') => {
      const currentPath = path ? `${path} > ${node.name}` : node.name
      
      if (node.name === targetLayerName) {
        foundLayer = node
        layerPath = currentPath
        return true
      }
      
      if (node.children) {
        for (const child of node.children) {
          if (searchNodes(child, currentPath)) {
            return true
          }
        }
      }
      return false
    }
    
    // Search through all pages
    console.log('🔍 Searching for layer:', targetLayerName)
    file.document.children.forEach((page: any) => {
      searchNodes(page)
    })
    
    if (!foundLayer) {
      console.log('❌ Layer not found. Let me show you available layers...\n')
      
      // Show available layers that might be similar
      const similarLayers: any[] = []
      const findSimilar = (node: any, path: string = '') => {
        const currentPath = path ? `${path} > ${node.name}` : node.name
        
        if (node.name.toLowerCase().includes('brand') || 
            node.name.toLowerCase().includes('guide') ||
            node.name.toLowerCase().includes('patchline')) {
          similarLayers.push({
            name: node.name,
            type: node.type,
            path: currentPath,
            id: node.id
          })
        }
        
        if (node.children) {
          node.children.forEach((child: any) => findSimilar(child, currentPath))
        }
      }
      
      file.document.children.forEach((page: any) => {
        findSimilar(page)
      })
      
      console.log('📝 Similar layers found:')
      similarLayers.slice(0, 20).forEach(layer => {
        console.log(`   - ${layer.name} (${layer.type})`)
        console.log(`     Path: ${layer.path}`)
        console.log(`     ID: ${layer.id}\n`)
      })
      
      return
    }
    
    console.log('✅ Found layer!')
    console.log(`   Name: ${foundLayer.name}`)
    console.log(`   Type: ${foundLayer.type}`)
    console.log(`   Path: ${layerPath}`)
    console.log(`   ID: ${foundLayer.id}\n`)
    
    // Extract detailed properties
    console.log('🎨 Extracting visual properties...')
    
    const layerDetails: any = {
      basic: {
        name: foundLayer.name,
        type: foundLayer.type,
        id: foundLayer.id,
        visible: foundLayer.visible
      },
      dimensions: foundLayer.absoluteBoundingBox ? {
        x: foundLayer.absoluteBoundingBox.x,
        y: foundLayer.absoluteBoundingBox.y,
        width: foundLayer.absoluteBoundingBox.width,
        height: foundLayer.absoluteBoundingBox.height
      } : null,
      background: null as any,
      fills: foundLayer.fills || [],
      effects: foundLayer.effects || [],
      strokes: foundLayer.strokes || [],
      cornerRadius: foundLayer.cornerRadius,
      children: foundLayer.children ? foundLayer.children.length : 0
    }
    
    // Extract background information
    if (foundLayer.fills && foundLayer.fills.length > 0) {
      layerDetails.background = foundLayer.fills.map((fill: any) => {
        if (fill.type === 'SOLID') {
          return {
            type: 'solid',
            color: {
              r: Math.round(fill.color.r * 255),
              g: Math.round(fill.color.g * 255),
              b: Math.round(fill.color.b * 255),
              a: fill.color.a || 1
            },
            hex: `#${Math.round(fill.color.r * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.g * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.b * 255).toString(16).padStart(2, '0')}`,
            opacity: fill.opacity || 1
          }
        } else if (fill.type.includes('GRADIENT')) {
          return {
            type: 'gradient',
            gradientType: fill.type,
            stops: fill.gradientStops?.map((stop: any) => ({
              position: stop.position,
              color: {
                r: Math.round(stop.color.r * 255),
                g: Math.round(stop.color.g * 255),
                b: Math.round(stop.color.b * 255),
                a: stop.color.a || 1
              },
              hex: `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`
            })),
            opacity: fill.opacity || 1
          }
        }
        return fill
      })
    }
    
    console.log('📊 Layer Details:')
    console.log('   Dimensions:', layerDetails.dimensions)
    console.log('   Background fills:', layerDetails.fills.length)
    console.log('   Effects:', layerDetails.effects.length)
    console.log('   Corner radius:', layerDetails.cornerRadius)
    console.log('   Children:', layerDetails.children)
    
    if (layerDetails.background) {
      console.log('\n🎨 Background Information:')
      layerDetails.background.forEach((bg: any, i: number) => {
        console.log(`   Fill ${i + 1}:`)
        if (bg.type === 'solid') {
          console.log(`     Type: Solid Color`)
          console.log(`     Color: ${bg.hex}`)
          console.log(`     RGB: rgb(${bg.color.r}, ${bg.color.g}, ${bg.color.b})`)
          console.log(`     Opacity: ${bg.opacity}`)
        } else if (bg.type === 'gradient') {
          console.log(`     Type: ${bg.gradientType}`)
          console.log(`     Stops: ${bg.stops?.length || 0}`)
          bg.stops?.forEach((stop: any, j: number) => {
            console.log(`       ${j + 1}. ${stop.hex} at ${Math.round(stop.position * 100)}%`)
          })
        }
        console.log()
      })
    }
    
    // Try to export the layer as an image
    console.log('📥 Attempting to export layer as image...')
    try {
      const exports = await client.exportAssets(fileId, [foundLayer.id], 'png', 2)
      if (exports[foundLayer.id]) {
        console.log('✅ Export URL:', exports[foundLayer.id])
        layerDetails.exportUrl = exports[foundLayer.id]
      }
    } catch (error) {
      console.log('⚠️ Could not export layer (might need export settings in Figma)')
    }
    
    // Save detailed report
    const reportPath = join(process.cwd(), `figma-layer-${foundLayer.id}.json`)
    writeFileSync(reportPath, JSON.stringify(layerDetails, null, 2))
    console.log(`\n📄 Detailed report saved: figma-layer-${foundLayer.id}.json`)
    
    // Generate CSS for the background
    if (layerDetails.background) {
      console.log('\n🎨 CSS for this background:')
      layerDetails.background.forEach((bg: any, i: number) => {
        if (bg.type === 'solid') {
          console.log(`/* Solid Background ${i + 1} */`)
          console.log(`background: ${bg.hex};`)
          if (bg.opacity < 1) {
            console.log(`opacity: ${bg.opacity};`)
          }
        } else if (bg.type === 'gradient' && bg.stops) {
          console.log(`/* Gradient Background ${i + 1} */`)
          const direction = bg.gradientType === 'GRADIENT_LINEAR' ? 'linear-gradient' : 'radial-gradient'
          const stops = bg.stops.map((stop: any) => `${stop.hex} ${Math.round(stop.position * 100)}%`).join(', ')
          console.log(`background: ${direction}(${stops});`)
        }
        console.log()
      })
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

// Run the script
getLayerDetails() 