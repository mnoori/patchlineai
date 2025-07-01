/**
 * Figma Integration Module
 * Main entry point for all Figma-related functionality
 */

export * from './types'
export * from './client'
export * from './token-transformer'
export * from './component-generator'

import { FigmaClient } from './client'
import { TokenTransformer } from './token-transformer'
import { ComponentGenerator } from './component-generator'
import { FigmaFile, FigmaComponent, FigmaNode } from './types'

/**
 * High-level Figma integration class
 */
export class FigmaIntegration {
  private client: FigmaClient
  private transformer: TokenTransformer
  private generator: ComponentGenerator

  constructor(accessToken: string) {
    this.client = new FigmaClient(accessToken)
    this.transformer = new TokenTransformer()
    this.generator = new ComponentGenerator()
  }

  /**
   * Sync all design tokens from a Figma file
   */
  async syncDesignTokens(fileId: string) {
    const file = await this.client.getFile(fileId)
    const tokens = this.transformer.extractTokensFromFile(file)
    const brandConstants = this.transformer.transformToBrandConstants(tokens)
    
    return {
      tokens,
      brandConstants,
      file: {
        name: file.name,
        lastModified: file.lastModified,
        version: file.version,
      },
    }
  }

  /**
   * Generate React components from Figma components
   */
  async generateComponents(
    fileId: string, 
    componentIds?: string[]
  ): Promise<Array<{
    id: string
    name: string
    component: string
    story?: string
  }>> {
    // Get all components if no specific IDs provided
    const components = componentIds 
      ? await this.getSpecificComponents(fileId, componentIds)
      : await this.client.getComponents(fileId)

    const results = []

    for (const component of components) {
      const node = await this.client.getNodes(fileId, [component.node_id])
      const componentNode = Object.values(node)[0]
      
      if (componentNode) {
        const componentName = this.sanitizeComponentName(component.name)
        const generated = this.generator.generateComponent(componentNode, componentName)
        
        results.push({
          id: component.key,
          name: componentName,
          ...generated,
        })
      }
    }

    return results
  }

  /**
   * Export assets (icons, images) from Figma
   */
  async exportAssets(
    fileId: string,
    nodeIds: string[],
    format: 'svg' | 'png' = 'svg'
  ): Promise<Array<{
    id: string
    name: string
    url: string
  }>> {
    const nodes = await this.client.getNodes(fileId, nodeIds)
    const exports = await this.client.exportAssets(fileId, nodeIds, format)
    
    return Object.entries(exports).map(([id, url]) => ({
      id,
      name: nodes[id]?.name || id,
      url,
    }))
  }

  /**
   * Get specific components by ID
   */
  private async getSpecificComponents(
    fileId: string,
    componentIds: string[]
  ): Promise<FigmaComponent[]> {
    const allComponents = await this.client.getComponents(fileId)
    return allComponents.filter(c => componentIds.includes(c.key))
  }

  /**
   * Sanitize component name for use as React component
   */
  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^(\d)/, '_$1')
      .replace(/^(.)/g, char => char.toUpperCase())
  }
}

/**
 * Create a Figma integration instance
 */
export function createFigmaIntegration(accessToken?: string): FigmaIntegration {
  const token = accessToken || process.env.FIGMA_ACCESS_TOKEN
  
  if (!token) {
    throw new Error('Figma access token is required')
  }
  
  return new FigmaIntegration(token)
}

/**
 * Get Figma environment configuration
 */
export function getFigmaConfig() {
  return {
    accessToken: process.env.FIGMA_ACCESS_TOKEN,
    fileId: process.env.FIGMA_FILE_ID,
    clientId: process.env.FIGMA_Client_ID || process.env.FIGMA_CLIENT_ID,
    clientSecret: process.env.FIGMA_Client_Secret || process.env.FIGMA_CLIENT_SECRET,
  }
} 