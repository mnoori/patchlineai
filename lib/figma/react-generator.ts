/**
 * Figma to React Component Generator
 * Converts Figma designs to production-ready React components
 */

import { EnhancedLayer } from './layer-extractor'
import { rgbToHex, generateClassName } from './utils'

export interface GeneratorOptions {
  componentName: string
  useTailwind?: boolean
  useTypeScript?: boolean
  framework?: 'next' | 'react'
  outputPath?: string
  includeAnimations?: boolean
  responsiveBreakpoints?: boolean
}

export interface GeneratedComponent {
  code: string
  styles?: string
  imports: string[]
  assets: Array<{ url: string; filename: string }>
}

export class ReactGenerator {
  private options: GeneratorOptions
  private usedClassNames: Set<string> = new Set()
  private assets: Array<{ url: string; filename: string }> = []
  private customStyles: Map<string, string> = new Map()

  constructor(options: GeneratorOptions) {
    this.options = {
      useTailwind: true,
      useTypeScript: true,
      framework: 'react',
      includeAnimations: true,
      responsiveBreakpoints: true,
      ...options
    }
  }

  /**
   * Generate a complete React component from a Figma layer
   */
  async generateComponent(layer: EnhancedLayer): Promise<GeneratedComponent> {
    const imports = this.generateImports()
    const jsx = await this.layerToJSX(layer, 0)
    const componentCode = this.wrapInComponent(jsx)
    
    // Generate CSS module if not using Tailwind
    const styles = this.options.useTailwind ? undefined : this.generateStyleSheet()

    return {
      code: `${imports.join('\n')}\n\n${componentCode}`,
      styles,
      imports: Array.from(new Set(imports)),
      assets: this.assets
    }
  }

  /**
   * Generate import statements
   */
  private generateImports(): string[] {
    const imports: string[] = []
    
    if (this.options.useTypeScript) {
      imports.push("import React from 'react'")
    } else {
      imports.push("import React from 'react'")
    }

    if (this.options.framework === 'next') {
      imports.push("import Image from 'next/image'")
    }

    if (!this.options.useTailwind) {
      imports.push(`import styles from './${this.options.componentName}.module.css'`)
    }

    if (this.options.includeAnimations) {
      imports.push("import { motion } from 'framer-motion'")
    }

    imports.push("import { cn } from '@/lib/utils'")

    return imports
  }

  /**
   * Convert a Figma layer to JSX
   */
  private async layerToJSX(layer: EnhancedLayer, depth: number): Promise<string> {
    const indent = '  '.repeat(depth)
    
    // Skip invisible layers
    if (!layer.visible) return ''

    // Handle different layer types
    switch (layer.type) {
      case 'TEXT':
        return this.generateText(layer, indent)
      case 'RECTANGLE':
      case 'ELLIPSE':
        return this.generateShape(layer, indent)
      case 'FRAME':
      case 'GROUP':
        return this.generateContainer(layer, indent)
      case 'INSTANCE':
      case 'COMPONENT':
        return this.generateComponent(layer, indent)
      case 'VECTOR':
        return this.generateVector(layer, indent)
      default:
        return this.generateGenericElement(layer, indent)
    }
  }

  /**
   * Generate text element
   */
  private generateText(layer: EnhancedLayer, indent: string): string {
    const className = this.generateTailwindClasses(layer)
    const tag = this.getTextTag(layer)
    
    return `${indent}<${tag} className="${className}">\n${indent}  {/* ${layer.name} */}\n${indent}  Text content here\n${indent}</${tag}>`
  }

  /**
   * Generate shape element
   */
  private generateShape(layer: EnhancedLayer, indent: string): string {
    const className = this.generateTailwindClasses(layer)
    const hasImage = layer.fills?.some(fill => fill.type === 'IMAGE')
    
    if (hasImage && layer.exportSettings?.length) {
      // Handle image fills
      const imageName = `${generateClassName(layer.name)}.png`
      this.assets.push({ url: '', filename: imageName })
      
      if (this.options.framework === 'next') {
        return `${indent}<div className="relative ${className}">\n${indent}  <Image src="/${imageName}" alt="${layer.name}" fill className="object-cover" />\n${indent}</div>`
      } else {
        return `${indent}<div className="${className}" style={{ backgroundImage: 'url(/${imageName})' }} />`
      }
    }

    return `${indent}<div className="${className}" />`
  }

  /**
   * Generate container element
   */
  private async generateContainer(layer: EnhancedLayer, indent: string): Promise<string> {
    const className = this.generateTailwindClasses(layer)
    const tag = this.options.includeAnimations && layer.type === 'FRAME' ? 'motion.div' : 'div'
    
    let children = ''
    if (layer.children) {
      const childrenJSX = await Promise.all(
        layer.children.map(child => this.layerToJSX(child, 1))
      )
      children = childrenJSX.filter(Boolean).join('\n')
    }

    const animationProps = this.options.includeAnimations ? this.generateAnimationProps(layer) : ''

    return `${indent}<${tag} className="${className}"${animationProps}>\n${children}\n${indent}</${tag}>`
  }

  /**
   * Generate component instance
   */
  private generateComponent(layer: EnhancedLayer, indent: string): string {
    const componentName = generateClassName(layer.name)
    const className = this.generateTailwindClasses(layer)
    
    // Generate props from component properties
    const props = layer.componentProperties 
      ? Object.entries(layer.componentProperties)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')
      : ''

    return `${indent}<${componentName} className="${className}" ${props} />`
  }

  /**
   * Generate vector/SVG element
   */
  private generateVector(layer: EnhancedLayer, indent: string): string {
    const className = this.generateTailwindClasses(layer)
    
    // For now, use a placeholder - in production, we'd export the SVG
    return `${indent}<div className="${className}">\n${indent}  {/* SVG: ${layer.name} */}\n${indent}</div>`
  }

  /**
   * Generate generic element
   */
  private generateGenericElement(layer: EnhancedLayer, indent: string): string {
    const className = this.generateTailwindClasses(layer)
    return `${indent}<div className="${className}">\n${indent}  {/* ${layer.type}: ${layer.name} */}\n${indent}</div>`
  }

  /**
   * Generate Tailwind classes from layer properties
   */
  private generateTailwindClasses(layer: EnhancedLayer): string {
    const classes: string[] = []

    // Position and layout
    if (layer.absoluteBoundingBox) {
      classes.push('relative')
      
      // Size
      const { width, height } = layer.absoluteBoundingBox
      classes.push(this.getWidthClass(width))
      classes.push(this.getHeightClass(height))
    }

    // Background and fills
    if (layer.fills && layer.fills.length > 0) {
      const fill = layer.fills[0]
      if (fill.type === 'SOLID' && fill.visible !== false) {
        const colorClass = this.getColorClass(fill.color)
        classes.push(colorClass)
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        classes.push('bg-gradient-to-r') // Simplified - would need custom CSS for complex gradients
      }
    }

    // Border radius
    if (layer.cornerRadius) {
      classes.push(this.getBorderRadiusClass(layer.cornerRadius))
    } else if (layer.rectangleCornerRadii) {
      // Handle individual corner radii
      classes.push('rounded-[custom]')
    }

    // Effects (shadows, blur, etc.)
    if (layer.effects) {
      layer.effects.forEach(effect => {
        if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
          classes.push(this.getShadowClass(effect))
        } else if (effect.type === 'INNER_SHADOW') {
          classes.push('shadow-inner')
        } else if (effect.type === 'LAYER_BLUR') {
          classes.push(`blur-${Math.round(effect.radius / 4)}`)
        }
      })
    }

    // Opacity
    if (layer.opacity !== undefined && layer.opacity < 1) {
      classes.push(`opacity-${Math.round(layer.opacity * 100)}`)
    }

    // Strokes
    if (layer.strokes && layer.strokes.length > 0) {
      const stroke = layer.strokes[0]
      if (stroke.visible !== false) {
        classes.push('border')
        classes.push(this.getStrokeClass(stroke, layer.strokeWeight))
      }
    }

    // Layout constraints for responsive design
    if (layer.constraints && this.options.responsiveBreakpoints) {
      this.addResponsiveClasses(classes, layer.constraints)
    }

    return classes.join(' ')
  }

  /**
   * Get width class
   */
  private getWidthClass(width: number): string {
    // Common widths
    const widthMap: Record<number, string> = {
      16: 'w-4',
      24: 'w-6',
      32: 'w-8',
      48: 'w-12',
      64: 'w-16',
      96: 'w-24',
      128: 'w-32',
      256: 'w-64',
      384: 'w-96',
      768: 'w-screen-md',
      1024: 'w-screen-lg',
      1280: 'w-screen-xl'
    }

    return widthMap[width] || `w-[${width}px]`
  }

  /**
   * Get height class
   */
  private getHeightClass(height: number): string {
    // Common heights
    const heightMap: Record<number, string> = {
      16: 'h-4',
      24: 'h-6',
      32: 'h-8',
      48: 'h-12',
      64: 'h-16',
      96: 'h-24',
      128: 'h-32',
      256: 'h-64',
      384: 'h-96',
      512: 'h-[512px]',
      768: 'h-screen'
    }

    return heightMap[height] || `h-[${height}px]`
  }

  /**
   * Get color class from Figma color
   */
  private getColorClass(color: any): string {
    // Check if it matches brand colors
    const { r, g, b } = color
    const hex = rgbToHex(r * 255, g * 255, b * 255)
    
    // Map to Tailwind colors or use arbitrary value
    const colorMap: Record<string, string> = {
      '#000000': 'bg-black',
      '#FFFFFF': 'bg-white',
      '#EF4444': 'bg-red-500',
      '#3B82F6': 'bg-blue-500',
      '#10B981': 'bg-green-500',
      // Add brand colors here
    }

    return colorMap[hex.toUpperCase()] || `bg-[${hex}]`
  }

  /**
   * Get border radius class
   */
  private getBorderRadiusClass(radius: number): string {
    const radiusMap: Record<number, string> = {
      0: 'rounded-none',
      2: 'rounded-sm',
      4: 'rounded',
      6: 'rounded-md',
      8: 'rounded-lg',
      12: 'rounded-xl',
      16: 'rounded-2xl',
      24: 'rounded-3xl',
      9999: 'rounded-full'
    }

    return radiusMap[radius] || `rounded-[${radius}px]`
  }

  /**
   * Get shadow class
   */
  private getShadowClass(shadow: any): string {
    const { offset, radius, color } = shadow
    const { r, g, b, a } = color
    
    // Simplified shadow mapping
    if (radius <= 2) return 'shadow-sm'
    if (radius <= 4) return 'shadow'
    if (radius <= 8) return 'shadow-md'
    if (radius <= 16) return 'shadow-lg'
    if (radius <= 24) return 'shadow-xl'
    return 'shadow-2xl'
  }

  /**
   * Get stroke class
   */
  private getStrokeClass(stroke: any, weight?: number): string {
    const classes: string[] = []
    
    if (weight) {
      const weightMap: Record<number, string> = {
        1: 'border',
        2: 'border-2',
        4: 'border-4',
        8: 'border-8'
      }
      classes.push(weightMap[weight] || `border-[${weight}px]`)
    }

    if (stroke.color) {
      const { r, g, b } = stroke.color
      const hex = rgbToHex(r * 255, g * 255, b * 255)
      classes.push(`border-[${hex}]`)
    }

    return classes.join(' ')
  }

  /**
   * Add responsive classes based on constraints
   */
  private addResponsiveClasses(classes: string[], constraints: any): void {
    if (constraints.horizontal === 'CENTER') {
      classes.push('mx-auto')
    } else if (constraints.horizontal === 'LEFT') {
      classes.push('mr-auto')
    } else if (constraints.horizontal === 'RIGHT') {
      classes.push('ml-auto')
    } else if (constraints.horizontal === 'SCALE') {
      classes.push('w-full')
    }

    if (constraints.vertical === 'CENTER') {
      classes.push('my-auto')
    } else if (constraints.vertical === 'TOP') {
      classes.push('mb-auto')
    } else if (constraints.vertical === 'BOTTOM') {
      classes.push('mt-auto')
    }
  }

  /**
   * Generate animation props for Framer Motion
   */
  private generateAnimationProps(layer: EnhancedLayer): string {
    if (!this.options.includeAnimations) return ''

    const props: string[] = []
    
    // Simple fade-in animation
    props.push(`
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    `)

    return ' ' + props.join(' ')
  }

  /**
   * Get appropriate text tag based on layer properties
   */
  private getTextTag(layer: EnhancedLayer): string {
    // Simple heuristic - could be improved with actual text style data
    if (layer.name.toLowerCase().includes('heading') || layer.name.toLowerCase().includes('title')) {
      return 'h2'
    }
    return 'p'
  }

  /**
   * Wrap JSX in component
   */
  private wrapInComponent(jsx: string): string {
    const { componentName, useTypeScript } = this.options
    
    if (useTypeScript) {
      return `interface ${componentName}Props {
  className?: string
}

export function ${componentName}({ className }: ${componentName}Props) {
  return (
${jsx}
  )
}`
    } else {
      return `export function ${componentName}({ className }) {
  return (
${jsx}
  )
}`
    }
  }

  /**
   * Generate CSS module stylesheet
   */
  private generateStyleSheet(): string {
    let css = ''
    
    for (const [className, styles] of this.customStyles) {
      css += `.${className} {\n${styles}\n}\n\n`
    }

    return css
  }
} 