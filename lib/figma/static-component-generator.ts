/**
 * Static Component Generator
 * Generates React components from Figma with all assets pre-loaded
 */

import { FigmaNode } from './types'
import { ComponentGenerator } from './component-generator'
import fs from 'fs/promises'
import path from 'path'

interface StaticGenerationOptions {
  componentName: string
  outputDir?: string
  assetDir?: string
  useLocalAssets?: boolean
}

export class StaticComponentGenerator extends ComponentGenerator {
  private assetMap: Map<string, string> = new Map()
  
  async generateStaticComponent(
    node: FigmaNode,
    options: StaticGenerationOptions
  ): Promise<{
    componentPath: string
    assets: string[]
  }> {
    const outputDir = options.outputDir || 'components/generated-from-figma'
    const assetDir = options.assetDir || 'public/figma-assets'
    
    // Generate the base component
    const { component } = this.generateComponent(node, options.componentName)
    
    // Replace Figma URLs with local assets
    let processedComponent = component
    if (options.useLocalAssets !== false) {
      processedComponent = await this.replaceWithLocalAssets(component, node, assetDir)
    }
    
    // Add static optimization
    processedComponent = this.addStaticOptimization(processedComponent, options.componentName)
    
    // Write component file
    const componentPath = path.join(outputDir, `${options.componentName}.tsx`)
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(componentPath, processedComponent, 'utf-8')
    
    return {
      componentPath,
      assets: Array.from(this.assetMap.values())
    }
  }
  
  private async replaceWithLocalAssets(
    component: string,
    node: FigmaNode,
    assetDir: string
  ): Promise<string> {
    let processed = component
    
    // Replace Figma API URLs with local assets
    const figmaUrlPattern = /https:\/\/figma-alpha-api\.s3\.us-west-2\.amazonaws\.com\/images\/[a-zA-Z0-9-]+/g
    const matches = component.match(figmaUrlPattern) || []
    
    for (const url of matches) {
      const assetName = this.getAssetNameFromUrl(url)
      const localPath = `/figma-assets/${assetName}`
      processed = processed.replace(url, localPath)
      this.assetMap.set(url, localPath)
    }
    
    // Replace dynamic logo fetching with static import
    processed = processed.replace(
      /const \[logoUrl, setLogoUrl\] = useState.*?\n.*?useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/gm,
      ''
    )
    
    return processed
  }
  
  private addStaticOptimization(component: string, componentName: string): string {
    // Add performance optimizations
    const optimizations = `
// Static component - all assets pre-loaded
// Generated at: ${new Date().toISOString()}

'use client'
`
    
    // Add responsive container
    const responsiveWrapper = `
  // Responsive wrapper
  const [containerWidth, setContainerWidth] = React.useState<number | undefined>(undefined)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])
`
    
    // Insert optimizations
    let optimized = component
    optimized = optimizations + optimized
    
    // Add responsive logic if needed
    if (component.includes('width={width}')) {
      optimized = optimized.replace(
        'export function',
        responsiveWrapper + '\n\nexport function'
      )
      optimized = optimized.replace(
        'return (',
        'return (\n    <div ref={containerRef} className="w-full">'
      )
      optimized = optimized.replace(
        /(\s*\)[\s\n]*}[\s\n]*$)/,
        '\n    </div>$1'
      )
    }
    
    return optimized
  }
  
  private getAssetNameFromUrl(url: string): string {
    const parts = url.split('/')
    const filename = parts[parts.length - 1]
    return `${filename}.png`
  }
}

/**
 * Generate a static component from Figma node ID
 */
export async function generateStaticFigmaComponent(
  nodeId: string,
  componentName: string,
  options?: Partial<StaticGenerationOptions>
): Promise<{ success: boolean; componentPath?: string; error?: string }> {
  try {
    const { getFigmaConfig, FigmaClient, LayerExtractor } = await import('./index')
    const config = getFigmaConfig()
    
    if (!config.accessToken || !config.fileId) {
      return { success: false, error: 'Missing Figma configuration' }
    }
    
    // Fetch the node data
    const client = new FigmaClient(config.accessToken)
    const extractor = new LayerExtractor(client)
    const layer = await extractor.getLayerInfo(config.fileId, nodeId)
    
    if (!layer) {
      return { success: false, error: `Node ${nodeId} not found` }
    }
    
    // Generate static component
    const generator = new StaticComponentGenerator()
    const result = await generator.generateStaticComponent(layer as any, {
      componentName,
      ...options
    })
    
    return { success: true, componentPath: result.componentPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
} 