/**
 * Figma Page to Component Converter
 * Automatically converts any Figma page into a React component
 */

import { FigmaClient } from './client'
import { LayerExtractor, EnhancedLayer } from './layer-extractor'
import { FigmaFile } from './types'

export interface FigmaPageConfig {
  pageName: string
  componentName: string
  route?: string
  isBackbonePage?: boolean
}

export interface FigmaPageComponent {
  name: string
  code: string
  styles: string
  pageData: EnhancedLayer
  exportedAssets: Record<string, string>
}

export class PageToComponentConverter {
  private client: FigmaClient
  private extractor: LayerExtractor

  constructor(accessToken: string) {
    this.client = new FigmaClient(accessToken)
    this.extractor = new LayerExtractor(this.client)
  }

  /**
   * Get all pages from a Figma file
   */
  async getAllPages(fileId: string): Promise<Array<{ id: string; name: string }>> {
    const file = await this.client.getFile(fileId)
    return file.document.children.map(page => ({
      id: page.id,
      name: page.name
    }))
  }

  /**
   * Convert a specific Figma page to a React component
   */
  async convertPageToComponent(
    fileId: string,
    pageName: string,
    componentName?: string
  ): Promise<FigmaPageComponent> {
    // Find the page
    const file = await this.client.getFile(fileId)
    const page = file.document.children.find(p => p.name === pageName)
    
    if (!page) {
      throw new Error(`Page "${pageName}" not found in Figma file`)
    }

    // Get detailed layer information
    const pageData = await this.extractor.getLayerDetails(fileId, page.id)
    if (!pageData) {
      throw new Error(`Could not extract layer details for page "${pageName}"`)
    }

    // Export all exportable assets
    const exportedAssets = await this.exportAllAssets(fileId, pageData)

    // Generate component name
    const finalComponentName = componentName || this.pageNameToComponentName(pageName)

    // Generate component code
    const code = this.generateComponentCode(pageData, finalComponentName, exportedAssets)
    
    // Generate styles
    const styles = this.generateStyles(pageData)

    return {
      name: finalComponentName,
      code,
      styles,
      pageData,
      exportedAssets
    }
  }

  /**
   * Convert multiple pages based on configuration
   */
  async convertPages(
    fileId: string,
    configs: FigmaPageConfig[]
  ): Promise<FigmaPageComponent[]> {
    const results: FigmaPageComponent[] = []

    for (const config of configs) {
      try {
        const component = await this.convertPageToComponent(
          fileId,
          config.pageName,
          config.componentName
        )
        results.push(component)
      } catch (error) {
        console.error(`Failed to convert page "${config.pageName}":`, error)
      }
    }

    return results
  }

  /**
   * Export all assets from a page
   */
  private async exportAllAssets(
    fileId: string,
    layer: EnhancedLayer
  ): Promise<Record<string, string>> {
    const assets: Record<string, string> = {}

    const collectExportableNodes = (node: EnhancedLayer): void => {
      // Add the node's export URL if it exists
      if (node.exportUrl) {
        assets[node.id] = node.exportUrl
      }

      // Check if we should try to export this node
      if (!node.exportUrl && this.shouldExport(node)) {
        // We'll collect these for batch export
        assets[node.id] = 'pending'
      }

      // Recurse through children
      if (node.children) {
        node.children.forEach(collectExportableNodes)
      }
    }

    collectExportableNodes(layer)

    // Batch export pending nodes
    const pendingNodes = Object.entries(assets)
      .filter(([_, url]) => url === 'pending')
      .map(([id]) => id)

    if (pendingNodes.length > 0) {
      try {
        const exports = await this.client.exportAssets(fileId, pendingNodes, 'png', 2)
        Object.entries(exports).forEach(([id, url]) => {
          assets[id] = url
        })
      } catch (error) {
        console.warn('Failed to export some assets:', error)
      }
    }

    return assets
  }

  /**
   * Determine if a node should be exported
   */
  private shouldExport(node: EnhancedLayer): boolean {
    // Export images, complex graphics, and named assets
    const exportableTypes = ['RECTANGLE', 'ELLIPSE', 'VECTOR', 'FRAME', 'GROUP']
    const hasImageFill = node.fills?.some(fill => fill.type === 'IMAGE')
    const hasComplexEffects = node.effects && node.effects.length > 0
    const isNamedAsset = node.name.toLowerCase().includes('icon') ||
                        node.name.toLowerCase().includes('logo') ||
                        node.name.toLowerCase().includes('image') ||
                        node.name.toLowerCase().includes('asset')

    return exportableTypes.includes(node.type) && 
           (hasImageFill || hasComplexEffects || isNamedAsset)
  }

  /**
   * Generate React component code
   */
  private generateComponentCode(
    layer: EnhancedLayer,
    componentName: string,
    assets: Record<string, string>
  ): string {
    const imports = new Set<string>([
      `'use client'`,
      `import React from 'react'`,
      `import { cn } from '@/lib/utils'`
    ])

    // Check if we need Image component
    if (Object.keys(assets).length > 0) {
      imports.add(`import Image from 'next/image'`)
    }

    // Generate the JSX
    const jsx = this.layerToJSX(layer, assets, 1)

    return `${Array.from(imports).join('\n')}

interface ${componentName}Props {
  className?: string
  width?: number
}

export function ${componentName}({ className, width }: ${componentName}Props) {
  const originalWidth = ${layer.absoluteBoundingBox?.width || 1920}
  const originalHeight = ${layer.absoluteBoundingBox?.height || 1080}
  const scale = width ? width / originalWidth : 1
  const height = originalHeight * scale

  return (
    <div 
      className={cn(
        "figma-page-container relative overflow-hidden",
        className
      )}
      style={{
        width: width || originalWidth,
        height: height,
        backgroundColor: '${layer.cssStyles?.background || '#000000'}'
      }}
    >
${jsx}
    </div>
  )
}`
  }

  /**
   * Convert layer to JSX with proper positioning
   */
  private layerToJSX(
    layer: EnhancedLayer,
    assets: Record<string, string>,
    indent: number
  ): string {
    const spaces = '  '.repeat(indent)
    
    // Skip invisible layers
    if (!layer.visible) return ''

    // Calculate relative position
    const bounds = layer.absoluteBoundingBox
    if (!bounds) return ''

    const styles: Record<string, any> = {
      position: 'absolute',
      left: `${(bounds.x / (layer.absoluteBoundingBox?.width || 1920) * 100).toFixed(2)}%`,
      top: `${(bounds.y / (layer.absoluteBoundingBox?.height || 1080) * 100).toFixed(2)}%`,
      width: `${(bounds.width / (layer.absoluteBoundingBox?.width || 1920) * 100).toFixed(2)}%`,
      height: `${(bounds.height / (layer.absoluteBoundingBox?.height || 1080) * 100).toFixed(2)}%`,
    }

    // Apply styles from layer
    if (layer.cssStyles?.background) {
      styles.background = layer.cssStyles.background
    }
    if (layer.cssStyles?.boxShadow) {
      styles.boxShadow = layer.cssStyles.boxShadow
    }
    if (layer.cssStyles?.borderRadius) {
      styles.borderRadius = layer.cssStyles.borderRadius
    }
    if (layer.opacity !== undefined && layer.opacity < 1) {
      styles.opacity = layer.opacity
    }

    // Handle different layer types
    if (assets[layer.id]) {
      return `${spaces}<div 
${spaces}  className="figma-layer"
${spaces}  style={{
${spaces}    position: 'absolute',
${spaces}    left: '${styles.left}',
${spaces}    top: '${styles.top}',
${spaces}    width: '${styles.width}',
${spaces}    height: '${styles.height}'
${spaces}  }}
${spaces}>
${spaces}  <Image 
${spaces}    src="${assets[layer.id]}"
${spaces}    alt="${layer.name}"
${spaces}    fill
${spaces}    style={{ objectFit: 'cover' }}
${spaces}  />
${spaces}</div>`
    }

    if (layer.type === 'TEXT') {
      return `${spaces}<div 
${spaces}  className="figma-text"
${spaces}  style={${JSON.stringify(styles, null, 2).split('\n').join('\n' + spaces)}}
${spaces}>
${spaces}  {/* ${layer.name} - Text content would go here */}
${spaces}</div>`
    }

    // Container with children
    const children = layer.children
      ?.map(child => this.layerToJSX(child, assets, indent + 1))
      .filter(Boolean)
      .join('\n')

    if (!children && !layer.fills?.length) {
      return '' // Skip empty containers
    }

    return `${spaces}<div 
${spaces}  className="figma-layer"
${spaces}  data-layer-name="${layer.name}"
${spaces}  style={${JSON.stringify(styles, null, 2).split('\n').join('\n' + spaces)}}
${spaces}>
${children || ''}
${spaces}</div>`
  }

  /**
   * Generate CSS module styles
   */
  private generateStyles(layer: EnhancedLayer): string {
    const styles: string[] = []

    const collectStyles = (node: EnhancedLayer, prefix = '') => {
      const className = this.layerNameToClassName(node.name)
      const selector = prefix ? `${prefix} .${className}` : `.${className}`

      if (node.cssStyles) {
        const cssRules = Object.entries(node.cssStyles)
          .map(([prop, value]) => `  ${this.camelToKebab(prop)}: ${value};`)
          .join('\n')

        if (cssRules) {
          styles.push(`${selector} {\n${cssRules}\n}`)
        }
      }

      if (node.children) {
        node.children.forEach(child => collectStyles(child, selector))
      }
    }

    collectStyles(layer)

    return styles.join('\n\n')
  }

  /**
   * Convert page name to valid component name
   */
  private pageNameToComponentName(pageName: string): string {
    return pageName
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  /**
   * Convert layer name to valid CSS class name
   */
  private layerNameToClassName(layerName: string): string {
    return layerName
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  }
} 