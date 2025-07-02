/**
 * Figma Layer Extractor
 * Enhanced utilities for extracting and processing individual Figma layers
 */

import { FigmaClient } from './client'
import { FigmaNode } from './types'

export interface EnhancedLayer {
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
  children?: EnhancedLayer[]
  exportUrl?: string
  imageRef?: string
  cssStyles?: {
    background?: string
    boxShadow?: string
    borderRadius?: string
    transform?: string
  }
}

export class LayerExtractor {
  private client: FigmaClient

  constructor(client: FigmaClient) {
    this.client = client
  }

  /**
   * Get detailed layer information including all children
   */
  async getLayerDetails(fileId: string, nodeId: string): Promise<EnhancedLayer | null> {
    try {
      const nodesResponse = await this.client.getNodes(fileId, [nodeId]) as any
      const nodeData = nodesResponse[nodeId]
      
      if (!nodeData || !nodeData.document) {
        return null
      }

      const node = nodeData.document
      const enhancedLayer = await this.enhanceLayer(fileId, node)
      
      return enhancedLayer
    } catch (error) {
      console.error('Error fetching layer details:', error)
      return null
    }
  }

  /**
   * Enhance a layer with additional processing
   */
  private async enhanceLayer(fileId: string, node: any): Promise<EnhancedLayer> {
    const layer: EnhancedLayer = {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible !== false,
      opacity: node.opacity,
      blendMode: node.blendMode,
      fills: node.fills,
      effects: node.effects,
      absoluteBoundingBox: node.absoluteBoundingBox,
      cssStyles: {}
    }

    // Extract image references from fills
    if (node.fills) {
      for (const fill of node.fills) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          layer.imageRef = fill.imageRef
        }
      }
    }

    // Try to export the layer
    if (this.isExportable(node.type)) {
      try {
        const exports = await this.client.exportAssets(fileId, [node.id], 'png', 2)
        if (exports[node.id]) {
          layer.exportUrl = exports[node.id]
        }
      } catch (e) {
        // Silent fail - not all layers are exportable
      }
    }

    // Generate CSS styles
    layer.cssStyles = this.generateCSSStyles(node)

    // Process children recursively
    if (node.children && node.children.length > 0) {
      layer.children = await Promise.all(
        node.children.map((child: any) => this.enhanceLayer(fileId, child))
      )
    }

    return layer
  }

  /**
   * Check if a node type is exportable
   */
  private isExportable(type: string): boolean {
    const exportableTypes = [
      'FRAME', 'GROUP', 'COMPONENT', 'INSTANCE',
      'RECTANGLE', 'ELLIPSE', 'VECTOR', 'TEXT'
    ]
    return exportableTypes.includes(type)
  }

  /**
   * Generate CSS styles from node properties
   */
  private generateCSSStyles(node: any): EnhancedLayer['cssStyles'] {
    const styles: EnhancedLayer['cssStyles'] = {}

    // Background from fills
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0]
      
      if (fill.type === 'SOLID' && fill.visible !== false) {
        const { r, g, b, a = 1 } = fill.color
        styles.background = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a * (fill.opacity || 1)})`
      } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
        const stops = fill.gradientStops.map((stop: any) => {
          const { r, g, b, a = 1 } = stop.color
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${(stop.position * 100).toFixed(0)}%`
        }).join(', ')
        
        // Calculate angle from gradient transform
        let angle = 90
        if (fill.gradientTransform) {
          const [[a, b]] = fill.gradientTransform
          angle = Math.round(Math.atan2(b, a) * 180 / Math.PI)
        }
        
        styles.background = `linear-gradient(${angle}deg, ${stops})`
      } else if (fill.type === 'GRADIENT_RADIAL' && fill.gradientStops) {
        const stops = fill.gradientStops.map((stop: any) => {
          const { r, g, b, a = 1 } = stop.color
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${(stop.position * 100).toFixed(0)}%`
        }).join(', ')
        
        styles.background = `radial-gradient(circle, ${stops})`
      }
    }

    // Box shadow from effects
    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects
        .filter((effect: any) => effect.type === 'DROP_SHADOW' && effect.visible !== false)
        .map((shadow: any) => {
          const { r, g, b, a = 1 } = shadow.color
          return `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
        })
        .join(', ')
      
      if (shadows) {
        styles.boxShadow = shadows
      }
    }

    // Border radius
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`
    }

    // Transform
    if (node.relativeTransform) {
      const [[a, c, tx], [b, d, ty]] = node.relativeTransform
      if (a !== 1 || b !== 0 || c !== 0 || d !== 1) {
        styles.transform = `matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`
      }
    }

    return styles
  }

  /**
   * Extract specific layer by name from a node tree
   */
  findLayerByName(layer: EnhancedLayer, name: string): EnhancedLayer | null {
    if (layer.name === name) return layer
    
    if (layer.children) {
      for (const child of layer.children) {
        const found = this.findLayerByName(child, name)
        if (found) return found
      }
    }
    
    return null
  }

  /**
   * Extract all layers of a specific type
   */
  findLayersByType(layer: EnhancedLayer, type: string): EnhancedLayer[] {
    const results: EnhancedLayer[] = []
    
    if (layer.type === type) {
      results.push(layer)
    }
    
    if (layer.children) {
      for (const child of layer.children) {
        results.push(...this.findLayersByType(child, type))
      }
    }
    
    return results
  }

  /**
   * Generate React component code from layer
   */
  generateReactComponent(layer: EnhancedLayer, componentName: string): string {
    const imports = new Set<string>()
    imports.add("import React from 'react'")
    
    if (this.hasImageLayers(layer)) {
      imports.add("import Image from 'next/image'")
    }

    const jsx = this.layerToJSX(layer, 0)
    
    return `${Array.from(imports).join('\n')}

export function ${componentName}() {
  return (
${jsx}
  )
}`
  }

  private hasImageLayers(layer: EnhancedLayer): boolean {
    if (layer.imageRef || layer.exportUrl) return true
    if (layer.children) {
      return layer.children.some(child => this.hasImageLayers(child))
    }
    return false
  }

  private layerToJSX(layer: EnhancedLayer, indent: number): string {
    const spaces = '    '.repeat(indent)
    const styles: any = {}
    
    if (layer.absoluteBoundingBox) {
      styles.width = layer.absoluteBoundingBox.width
      styles.height = layer.absoluteBoundingBox.height
    }
    
    if (layer.cssStyles?.background) {
      styles.background = layer.cssStyles.background
    }
    
    if (layer.opacity !== undefined && layer.opacity < 1) {
      styles.opacity = layer.opacity
    }

    const styleStr = Object.entries(styles)
      .map(([key, value]) => `${key}: ${typeof value === 'number' ? value : `'${value}'`}`)
      .join(', ')

    if (layer.type === 'TEXT') {
      return `${spaces}<span style={{ ${styleStr} }}>{/* ${layer.name} */}</span>`
    }

    if (layer.imageRef && layer.exportUrl) {
      return `${spaces}<div style={{ position: 'relative', ${styleStr} }}>
${spaces}  <Image src="${layer.exportUrl}" alt="${layer.name}" fill style={{ objectFit: 'cover' }} />
${spaces}</div>`
    }

    const children = layer.children
      ?.map(child => this.layerToJSX(child, indent + 1))
      .join('\n')

    return `${spaces}<div style={{ ${styleStr} }}>
${children || `${spaces}  {/* ${layer.name} */}`}
${spaces}</div>`
  }
} 