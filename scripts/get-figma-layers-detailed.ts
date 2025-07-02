/**
 * Get Detailed Figma Layers
 * Extract all layers within a frame including their properties, fills, and relationships
 */

import { FigmaClient } from '../lib/figma/client'
import { getFigmaConfig } from '../lib/figma'
import { writeFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface LayerDetail {
  id: string
  name: string
  type: string
  visible: boolean
  opacity?: number
  blendMode?: string
  fills?: any[]
  effects?: any[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  constraints?: any
  layoutAlign?: string
  layoutGrow?: number
  children?: LayerDetail[]
  exportSettings?: any[]
  // Additional properties for specific types
  characters?: string // for TEXT nodes
  style?: any // for TEXT nodes
  cornerRadius?: number // for RECTANGLE nodes
  strokeWeight?: number
  strokes?: any[]
}

async function getDetailedLayers() {
  try {
    console.log('🔍 Getting detailed layer information...\n')
    
    const config = getFigmaConfig()
    const fileId = "PbzhWQIGJF68IPYo8Bheck"
    
    if (!config.accessToken) {
      console.error('❌ Missing FIGMA_ACCESS_TOKEN')
      process.exit(1)
    }
    
    const client = new FigmaClient(config.accessToken!)
    
    // Get specific node details using the nodes endpoint
    const targetNodeId = "113:11" // PatchlineAI_Brand Guide_Simple
    
    console.log('📄 Fetching node details...')
    const nodesResponse = await client.getNodes(fileId, [targetNodeId]) as any
    const targetNodeData = nodesResponse[targetNodeId]
    
    if (!targetNodeData || !targetNodeData.document) {
      console.error('❌ Node not found')
      return
    }
    
    const targetNode = targetNodeData.document
    
    console.log(`✅ Found node: ${targetNode.name}`)
    console.log(`   Type: ${targetNode.type}`)
    console.log(`   Children: ${targetNode.children?.length || 0}\n`)
    
    // Extract detailed information from the node and all children
    const extractLayerDetails = (node: any): LayerDetail => {
      const detail: LayerDetail = {
        id: node.id,
        name: node.name,
        type: node.type,
        visible: node.visible !== false,
        opacity: node.opacity,
        blendMode: node.blendMode,
        fills: node.fills,
        effects: node.effects,
        absoluteBoundingBox: node.absoluteBoundingBox,
        constraints: node.constraints,
        layoutAlign: node.layoutAlign,
        layoutGrow: node.layoutGrow,
        exportSettings: node.exportSettings,
        cornerRadius: node.cornerRadius,
        strokeWeight: node.strokeWeight,
        strokes: node.strokes
      }
      
      // Add type-specific properties
      if (node.type === 'TEXT') {
        detail.characters = node.characters
        detail.style = node.style
      }
      
      // Process children recursively
      if (node.children && node.children.length > 0) {
        detail.children = node.children.map(extractLayerDetails)
      }
      
      return detail
    }
    
    const layerTree = extractLayerDetails(targetNode)
    
    // Print layer tree
    const printLayerTree = (layer: LayerDetail, indent = '') => {
      console.log(`${indent}📦 ${layer.name} (${layer.type})`)
      console.log(`${indent}   ID: ${layer.id}`)
      
      if (layer.fills && layer.fills.length > 0) {
        console.log(`${indent}   Fills:`)
        layer.fills.forEach((fill, i) => {
          if (fill.type === 'SOLID') {
            const hex = `#${Math.round(fill.color.r * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.g * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.b * 255).toString(16).padStart(2, '0')}`
            console.log(`${indent}     ${i + 1}. Solid: ${hex} (opacity: ${fill.opacity || 1})`)
          } else if (fill.type === 'IMAGE') {
            console.log(`${indent}     ${i + 1}. Image: ${fill.imageRef || 'embedded'}`)
          } else if (fill.type && fill.type.includes('GRADIENT')) {
            console.log(`${indent}     ${i + 1}. ${fill.type}`)
            if (fill.gradientStops) {
              fill.gradientStops.forEach((stop: any, j: number) => {
                const hex = `#${Math.round(stop.color.r * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.g * 255).toString(16).padStart(2, '0')}${Math.round(stop.color.b * 255).toString(16).padStart(2, '0')}`
                console.log(`${indent}        Stop ${j + 1}: ${hex} at ${(stop.position * 100).toFixed(0)}%`)
              })
            }
          }
        })
      }
      
      if (layer.absoluteBoundingBox) {
        console.log(`${indent}   Position: (${layer.absoluteBoundingBox.x.toFixed(0)}, ${layer.absoluteBoundingBox.y.toFixed(0)})`)
        console.log(`${indent}   Size: ${layer.absoluteBoundingBox.width.toFixed(0)} × ${layer.absoluteBoundingBox.height.toFixed(0)}`)
      }
      
      if (layer.opacity !== undefined && layer.opacity < 1) {
        console.log(`${indent}   Opacity: ${(layer.opacity * 100).toFixed(0)}%`)
      }
      
      if (layer.blendMode && layer.blendMode !== 'NORMAL') {
        console.log(`${indent}   Blend Mode: ${layer.blendMode}`)
      }
      
      console.log()
      
      // Print children
      if (layer.children) {
        layer.children.forEach(child => {
          printLayerTree(child, indent + '  ')
        })
      }
    }
    
    console.log('📊 Layer Tree:')
    console.log('=' * 80)
    printLayerTree(layerTree)
    
    // Find specific layers like "74"
    const findLayerByName = (layer: LayerDetail, name: string): LayerDetail | null => {
      if (layer.name === name) return layer
      if (layer.children) {
        for (const child of layer.children) {
          const found = findLayerByName(child, name)
          if (found) return found
        }
      }
      return null
    }
    
    const layer74 = findLayerByName(layerTree, '74')
    if (layer74) {
      console.log('\n🎯 Found layer "74":')
      console.log(JSON.stringify(layer74, null, 2))
    }
    
    // Export individual layers
    console.log('\n📥 Exporting individual layers...')
    const exportLayers = async (layer: LayerDetail) => {
      if (layer.type === 'RECTANGLE' || layer.type === 'FRAME' || layer.type === 'COMPONENT') {
        try {
          const exports = await client.exportAssets(fileId, [layer.id], 'png', 2)
          if (exports[layer.id]) {
            console.log(`✅ Exported ${layer.name}: ${exports[layer.id]}`)
          }
        } catch (e) {
          console.log(`⚠️ Could not export ${layer.name} (${layer.id})`)
        }
      }
      
      if (layer.children) {
        for (const child of layer.children) {
          await exportLayers(child)
        }
      }
    }
    
    await exportLayers(layerTree)
    
    // Save detailed report
    const reportPath = join(process.cwd(), `figma-layers-detailed-${targetNodeId.replace(':', '-')}.json`)
    writeFileSync(reportPath, JSON.stringify(layerTree, null, 2))
    console.log(`\n📄 Detailed report saved: ${reportPath}`)
    
    // Generate CSS for recreating the layers
    console.log('\n🎨 CSS for recreating this design:')
    console.log('```css')
    console.log('.brand-guide-container {')
    console.log('  position: relative;')
    console.log('  width: 1704px;')
    console.log('  height: 958px;')
    console.log('  background: #121212;')
    console.log('  overflow: hidden;')
    console.log('}')
    
    if (layerTree.children) {
      layerTree.children.forEach((child, i) => {
        console.log(`\n.layer-${i} {`)
        console.log('  position: absolute;')
        if (child.absoluteBoundingBox && layerTree.absoluteBoundingBox) {
          console.log(`  left: ${(child.absoluteBoundingBox.x - layerTree.absoluteBoundingBox.x).toFixed(0)}px;`)
          console.log(`  top: ${(child.absoluteBoundingBox.y - layerTree.absoluteBoundingBox.y).toFixed(0)}px;`)
          console.log(`  width: ${child.absoluteBoundingBox.width.toFixed(0)}px;`)
          console.log(`  height: ${child.absoluteBoundingBox.height.toFixed(0)}px;`)
        }
        if (child.fills && child.fills[0]) {
          const fill = child.fills[0]
          if (fill.type === 'SOLID') {
            const hex = `#${Math.round(fill.color.r * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.g * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.b * 255).toString(16).padStart(2, '0')}`
            console.log(`  background: ${hex};`)
          }
        }
        console.log('}')
      })
    }
    console.log('```')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error('Response:', await error.response.text())
    }
  }
}

getDetailedLayers().catch(console.error) 