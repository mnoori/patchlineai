/**
 * Extract Gradient Details from Figma
 * This shows what gradient information we can actually use
 */

import { FigmaClient } from '../lib/figma/client'
import { getFigmaConfig } from '../lib/figma'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function extractGradient() {
  const config = getFigmaConfig()
  const fileId = "PbzhWQIGJF68IPYo8Bheck"
  const client = new FigmaClient(config.accessToken!)

  console.log('🎨 Extracting Gradient Details...\n')

  // Get the full file to find a good gradient example
  const file = await client.getFile(fileId)
  
  // Let's look for the PatchlineAI_Brand Guide (113:16) which likely has the gradient you want
  const findNode = (node: any, targetId: string): any => {
    if (node.id === targetId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, targetId)
        if (found) return found
      }
    }
    return null
  }

  // First, let's look at the main brand guide
  const brandGuideNode = findNode(file.document, "113:16")
  
  if (brandGuideNode) {
    console.log('📄 Found Brand Guide Node:', brandGuideNode.name)
    console.log('   Type:', brandGuideNode.type)
    
    // Check for background
    if (brandGuideNode.background && brandGuideNode.background.length > 0) {
      console.log('\n🎨 Background Fills:')
      brandGuideNode.background.forEach((fill: any, index: number) => {
        console.log(`   Fill ${index + 1}:`)
        console.log(`   - Type: ${fill.type}`)
        if (fill.type === 'SOLID') {
          console.log(`   - Color: rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a || 1})`)
        } else if (fill.type && fill.type.includes('GRADIENT')) {
          console.log(`   - Gradient Stops:`)
          fill.gradientStops?.forEach((stop: any, i: number) => {
            const color = stop.color
            console.log(`     Stop ${i + 1}: rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a || 1}) at ${(stop.position * 100).toFixed(0)}%`)
          })
        }
      })
    }

    // Check fills on the node itself
    if (brandGuideNode.fills && brandGuideNode.fills.length > 0) {
      console.log('\n🎨 Node Fills:')
      brandGuideNode.fills.forEach((fill: any, index: number) => {
        console.log(`   Fill ${index + 1}:`)
        console.log(`   - Type: ${fill.type}`)
        
        if (fill.type === 'SOLID') {
          console.log(`   - Color: rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a || 1})`)
        } else if (fill.type && fill.type.includes('GRADIENT')) {
          console.log(`   - Gradient Type: ${fill.type}`)
          
          // Generate CSS
          let css = ''
          if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
            const stops = fill.gradientStops.map((stop: any) => {
              const color = stop.color
              const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a || 1})`
              return `${rgba} ${(stop.position * 100).toFixed(0)}%`
            }).join(', ')
            
            // Calculate angle from gradient transform if available
            let angle = 90 // default
            if (fill.gradientTransform) {
              // This is a 2x2 matrix transform, calculate angle
              const [[a, b], [c, d]] = fill.gradientTransform
              angle = Math.round(Math.atan2(b, a) * 180 / Math.PI)
            }
            
            css = `background: linear-gradient(${angle}deg, ${stops});`
          }
          
          console.log(`   - Gradient Stops:`)
          fill.gradientStops?.forEach((stop: any, i: number) => {
            const color = stop.color
            console.log(`     Stop ${i + 1}: rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a || 1}) at ${(stop.position * 100).toFixed(0)}%`)
          })
          
          if (css) {
            console.log(`\n   💻 CSS Output:`)
            console.log(`   ${css}`)
          }
        }
      })
    }

    // Look for child frames that might have the gradient
    if (brandGuideNode.children && brandGuideNode.children.length > 0) {
      console.log('\n🔍 Checking child elements...')
      
      brandGuideNode.children.forEach((child: any) => {
        if (child.fills && child.fills.some((f: any) => f.type && f.type.includes('GRADIENT'))) {
          console.log(`\n   📦 Child "${child.name}" has gradient:`)
          const gradientFill = child.fills.find((f: any) => f.type && f.type.includes('GRADIENT'))
          
          if (gradientFill && gradientFill.gradientStops) {
            const stops = gradientFill.gradientStops.map((stop: any) => {
              const color = stop.color
              const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a || 1})`
              return `${rgba} ${(stop.position * 100).toFixed(0)}%`
            }).join(', ')
            
            console.log(`   Type: ${gradientFill.type}`)
            console.log(`   CSS: background: linear-gradient(90deg, ${stops});`)
          }
        }
      })
    }

    // Export the frame as an image
    console.log('\n📸 Exporting as image...')
    try {
      const exports = await client.exportAssets(fileId, ["113:16"], 'png', 2)
      console.log('✅ Export URL:', exports["113:16"])
    } catch (error: any) {
      console.log('❌ Export failed:', error.message)
    }
  }
}

extractGradient().catch(console.error) 