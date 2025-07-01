/**
 * Find Gradient Slide in Figma
 * This will help us locate the actual gradient background you want
 */

import { FigmaClient } from '../lib/figma/client'
import { getFigmaConfig } from '../lib/figma'
import { writeFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function findGradientSlide() {
  const config = getFigmaConfig()
  const fileId = "PbzhWQIGJF68IPYo8Bheck"
  const client = new FigmaClient(config.accessToken!)

  console.log('🔍 Searching for gradient slides...\n')

  const file = await client.getFile(fileId)
  
  // Find all frames with gradients that look like slides
  const gradientSlides: any[] = []
  
  const findSlides = (node: any, path: string = '') => {
    // Look for frames that could be slides (large frames with gradients)
    if (node.type === 'FRAME' && node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox
      
      // Check if it's slide-sized (wider than tall, reasonably large)
      if (width > 800 && height > 400 && width > height) {
        // Check for gradient fills
        const hasGradient = node.fills?.some((fill: any) => 
          fill.type && fill.type.includes('GRADIENT')
        )
        
        if (hasGradient) {
          const gradientFill = node.fills.find((f: any) => f.type && f.type.includes('GRADIENT'))
          
          gradientSlides.push({
            id: node.id,
            name: node.name,
            path: path || node.name,
            dimensions: `${Math.round(width)}x${Math.round(height)}`,
            gradient: gradientFill,
            exportSettings: node.exportSettings?.length > 0
          })
        }
      }
    }
    
    if (node.children) {
      node.children.forEach((child: any) => 
        findSlides(child, path ? `${path} > ${node.name}` : node.name)
      )
    }
  }
  
  file.document.children.forEach((page: any) => findSlides(page))
  
  console.log(`✅ Found ${gradientSlides.length} potential gradient slides\n`)
  
  // Show the most promising ones
  const topSlides = gradientSlides.slice(0, 10)
  
  for (const slide of topSlides) {
    console.log(`📊 ${slide.name}`)
    console.log(`   ID: ${slide.id}`)
    console.log(`   Size: ${slide.dimensions}`)
    console.log(`   Path: ${slide.path}`)
    
    if (slide.gradient && slide.gradient.gradientStops) {
      console.log(`   Gradient: ${slide.gradient.type}`)
      console.log('   Colors:')
      slide.gradient.gradientStops.forEach((stop: any, i: number) => {
        const { r, g, b, a } = stop.color
        const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`
        console.log(`     - ${hex} at ${(stop.position * 100).toFixed(0)}%`)
      })
      
      // Generate CSS
      const stops = slide.gradient.gradientStops.map((stop: any) => {
        const { r, g, b, a } = stop.color
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a || 1}) ${(stop.position * 100).toFixed(0)}%`
      }).join(', ')
      
      console.log(`   CSS: background: linear-gradient(90deg, ${stops});`)
    }
    
    console.log(`   Exportable: ${slide.exportSettings ? '✅ Yes' : '❌ No'}`)
    
    // Export the first few as examples
    if (slide.exportSettings && topSlides.indexOf(slide) < 3) {
      try {
        const exports = await client.exportAssets(fileId, [slide.id], 'png', 2)
        console.log(`   Export URL: ${exports[slide.id]}`)
      } catch (error) {
        console.log(`   Export failed: ${error}`)
      }
    }
    
    console.log('')
  }
  
  // Save full report
  writeFileSync('gradient-slides-report.json', JSON.stringify(gradientSlides, null, 2))
  console.log('📄 Full report saved: gradient-slides-report.json')
  
  // Also search for frames with "gradient" or "background" in the name
  console.log('\n🔍 Also checking frames with gradient-related names...\n')
  
  const namedFrames: any[] = []
  
  const findNamedFrames = (node: any, path: string = '') => {
    if (node.type === 'FRAME' && node.name) {
      const nameLower = node.name.toLowerCase()
      if (nameLower.includes('gradient') || nameLower.includes('background') || nameLower.includes('slide')) {
        namedFrames.push({
          id: node.id,
          name: node.name,
          path: path || node.name,
          hasFills: node.fills?.length > 0
        })
      }
    }
    
    if (node.children) {
      node.children.forEach((child: any) => 
        findNamedFrames(child, path ? `${path} > ${node.name}` : node.name)
      )
    }
  }
  
  file.document.children.forEach((page: any) => findNamedFrames(page))
  
  namedFrames.slice(0, 5).forEach(frame => {
    console.log(`- ${frame.name} (${frame.id})`)
    console.log(`  Path: ${frame.path}`)
  })
}

findGradientSlide().catch(console.error) 