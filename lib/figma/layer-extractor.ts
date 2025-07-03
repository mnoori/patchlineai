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
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  constraints?: {
    vertical: string
    horizontal: string
  }
  fills?: any[]
  strokes?: any[]
  strokeWeight?: number
  strokeAlign?: string
  effects?: any[]
  cornerRadius?: number
  rectangleCornerRadii?: number[]
  // Optimized: Don't load children by default
  hasChildren?: boolean
  childrenCount?: number
  children?: EnhancedLayer[]
  // Add metadata for UI
  isExpanded?: boolean
  isLoading?: boolean
  exportSettings?: any[]
  // Component-specific
  componentId?: string
  componentProperties?: Record<string, any>
}

// Cache to store already fetched nodes
const nodeCache = new Map<string, EnhancedLayer>()

export class LayerExtractor {
  private client: FigmaClient

  constructor(client: FigmaClient) {
    this.client = client
  }

  /**
   * Get layer info WITHOUT children for performance
   */
  async getLayerInfo(fileId: string, nodeId: string): Promise<EnhancedLayer | null> {
    const cacheKey = `${fileId}:${nodeId}`
    
    // Check cache first
    if (nodeCache.has(cacheKey)) {
      return nodeCache.get(cacheKey)!
    }

    try {
      const response = await this.client.getNodes(fileId, [nodeId]) as any
      const nodeData = response[nodeId]
      
      if (!nodeData || !nodeData.document) {
        return null
      }

      const node = nodeData.document
      const enhanced: EnhancedLayer = {
        id: node.id,
        name: node.name || 'Unnamed',
        type: node.type,
        visible: node.visible !== false,
        opacity: node.opacity,
        blendMode: node.blendMode,
        absoluteBoundingBox: node.absoluteBoundingBox,
        constraints: node.constraints,
        fills: node.fills,
        strokes: node.strokes,
        strokeWeight: node.strokeWeight,
        strokeAlign: node.strokeAlign,
        effects: node.effects,
        cornerRadius: node.cornerRadius,
        rectangleCornerRadii: node.rectangleCornerRadii,
        hasChildren: node.children && node.children.length > 0,
        childrenCount: node.children ? node.children.length : 0,
        exportSettings: node.exportSettings,
        componentId: node.componentId,
        componentProperties: node.componentProperties,
        // Don't include children
        children: undefined
      }

      // Cache the result
      nodeCache.set(cacheKey, enhanced)
      
      return enhanced
    } catch (error) {
      console.error('Error fetching layer info:', error)
      return null
    }
  }

  /**
   * Get only direct children of a node (one level)
   */
  async getLayerChildren(fileId: string, nodeId: string): Promise<EnhancedLayer[]> {
    try {
      const response = await this.client.getNodes(fileId, [nodeId]) as any
      const nodeData = response[nodeId]
      
      if (!nodeData || !nodeData.document || !nodeData.document.children) {
        return []
      }

      const children = nodeData.document.children
      const enhancedChildren: EnhancedLayer[] = []

      // Only process direct children, not their children
      for (const child of children) {
        enhancedChildren.push({
          id: child.id,
          name: child.name || 'Unnamed',
          type: child.type,
          visible: child.visible !== false,
          opacity: child.opacity,
          blendMode: child.blendMode,
          absoluteBoundingBox: child.absoluteBoundingBox,
          constraints: child.constraints,
          fills: child.fills,
          strokes: child.strokes,
          strokeWeight: child.strokeWeight,
          strokeAlign: child.strokeAlign,
          effects: child.effects,
          cornerRadius: child.cornerRadius,
          rectangleCornerRadii: child.rectangleCornerRadii,
          hasChildren: child.children && child.children.length > 0,
          childrenCount: child.children ? child.children.length : 0,
          exportSettings: child.exportSettings,
          componentId: child.componentId,
          componentProperties: child.componentProperties,
          // Don't include nested children
          children: undefined
        })
      }

      return enhancedChildren
    } catch (error) {
      console.error('Error fetching children:', error)
      return []
    }
  }

  /**
   * Get layer details with option for depth
   * DEPRECATED - Use getLayerInfo and getLayerChildren instead
   */
  async getLayerDetails(fileId: string, nodeId: string, options?: { shallow?: boolean }): Promise<EnhancedLayer | null> {
    if (options?.shallow) {
      return this.getLayerInfo(fileId, nodeId)
    }
    
    // For backward compatibility only - avoid using this
    console.warn('getLayerDetails with deep fetch is deprecated due to performance issues')
    const layer = await this.getLayerInfo(fileId, nodeId)
    if (layer && layer.hasChildren) {
      layer.children = await this.getLayerChildren(fileId, nodeId)
    }
    return layer
  }

  /**
   * Clear the cache
   */
  clearCache() {
    nodeCache.clear()
  }

  /**
   * Get exportable assets from a node
   */
  async getExportableAssets(fileId: string, nodeId: string): Promise<any[]> {
    const layer = await this.getLayerInfo(fileId, nodeId)
    if (!layer || !layer.exportSettings || layer.exportSettings.length === 0) {
      return []
    }

    // Get image URLs for exportable assets
    try {
      const formats = layer.exportSettings.map((setting: any) => setting.format)
      const scales = layer.exportSettings.map((setting: any) => setting.constraint?.value || 1)
      
      const images = await this.client.exportAssets(fileId, [nodeId], formats[0] || 'png', scales[0] || 1)

      return Object.entries(images).map(([id, url]) => ({
        nodeId: id,
        url,
        format: formats[0] || 'png',
        scale: scales[0] || 1
      }))
    } catch (error) {
      console.error('Error getting exportable assets:', error)
      return []
    }
  }
} 