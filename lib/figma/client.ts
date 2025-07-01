/**
 * Figma API Client
 * Handles authentication and API requests to Figma
 */

import { FigmaFile, FigmaComponent, FigmaStyle, FigmaNode, FigmaColor } from './types'

export class FigmaClient {
  private accessToken: string
  private baseUrl = 'https://api.figma.com/v1'
  
  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Fetch a Figma file by ID
   */
  async getFile(fileId: string): Promise<FigmaFile> {
    const response = await this.request(`/files/${fileId}`)
    return response
  }

  /**
   * Get all components from a file
   */
  async getComponents(fileId: string): Promise<FigmaComponent[]> {
    const response = await this.request(`/files/${fileId}/components`)
    return response.meta.components
  }

  /**
   * Get all styles (colors, text, effects) from a file
   */
  async getStyles(fileId: string): Promise<FigmaStyle[]> {
    const file = await this.getFile(fileId)
    return this.extractStyles(file)
  }

  /**
   * Get specific nodes by IDs
   */
  async getNodes(fileId: string, nodeIds: string[]): Promise<Record<string, FigmaNode>> {
    const ids = nodeIds.join(',')
    const response = await this.request(`/files/${fileId}/nodes?ids=${ids}`)
    return response.nodes
  }

  /**
   * Export assets as SVG/PNG
   */
  async exportAssets(
    fileId: string, 
    nodeIds: string[], 
    format: 'svg' | 'png' = 'svg',
    scale: number = 1
  ): Promise<Record<string, string>> {
    const ids = nodeIds.join(',')
    const response = await this.request(
      `/images/${fileId}?ids=${ids}&format=${format}&scale=${scale}`
    )
    return response.images
  }

  /**
   * Extract design tokens from file
   */
  async getDesignTokens(fileId: string): Promise<{
    colors: Record<string, string>
    typography: Record<string, any>
    spacing: Record<string, string>
    effects: Record<string, any>
  }> {
    const file = await this.getFile(fileId)
    return this.extractDesignTokens(file)
  }

  /**
   * Make authenticated request to Figma API
   */
  private async request(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-Figma-Token': this.accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Extract styles from Figma file
   */
  private extractStyles(file: FigmaFile): FigmaStyle[] {
    const styles: FigmaStyle[] = []
    
    // Traverse document tree to find styles
    const traverse = (node: any) => {
      if (node.styles) {
        Object.entries(node.styles).forEach(([type, styleId]) => {
          styles.push({
            id: styleId as string,
            type: type as any,
            name: node.name,
            node,
          })
        })
      }
      
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    
    traverse(file.document)
    return styles
  }

  /**
   * Extract design tokens from Figma file
   */
  private extractDesignTokens(file: FigmaFile): {
    colors: Record<string, string>
    typography: Record<string, any>
    spacing: Record<string, string>
    effects: Record<string, any>
  } {
    const tokens = {
      colors: {} as Record<string, string>,
      typography: {} as Record<string, any>,
      spacing: {} as Record<string, string>,
      effects: {} as Record<string, any>,
    }

    // Extract color styles
    if (file.styles) {
      Object.entries(file.styles).forEach(([id, style]) => {
        if (style.styleType === 'FILL' && style.name) {
          // Convert Figma color to hex
          const color = this.figmaColorToHex(style)
          if (color) {
            tokens.colors[this.tokenizeName(style.name)] = color
          }
        } else if (style.styleType === 'TEXT' && style.name) {
          tokens.typography[this.tokenizeName(style.name)] = style
        } else if (style.styleType === 'EFFECT' && style.name) {
          tokens.effects[this.tokenizeName(style.name)] = style
        }
      })
    }

    return tokens
  }

  /**
   * Convert Figma color to hex
   */
  private figmaColorToHex(style: any): string | null {
    // Implementation depends on Figma's color format
    // This is a simplified version
    if (style.fills && style.fills[0] && style.fills[0].color) {
      const { r, g, b, a } = style.fills[0].color
      const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }
    return null
  }

  /**
   * Convert name to token format (camelCase)
   */
  private tokenizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^\w/, (char) => char.toLowerCase())
  }
}

/**
 * Create OAuth URL for Figma authentication
 */
export function createFigmaOAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'file_read',
    state,
    response_type: 'code',
  })
  
  return `https://www.figma.com/oauth?${params.toString()}`
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeFigmaToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const response = await fetch('https://www.figma.com/api/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  return response.json()
} 