/**
 * Figma Component Generator
 * Generates React components from Figma components
 */

import { FigmaNode, FigmaComponent, FigmaPaint } from './types'
import { TokenTransformer } from './token-transformer'

export interface ComponentGenerationOptions {
  typescript?: boolean
  styling?: 'tailwind' | 'css-in-js' | 'styled-components'
  componentPath?: string
  includeStorybook?: boolean
}

export class ComponentGenerator {
  private transformer: TokenTransformer
  private options: ComponentGenerationOptions

  constructor(options: ComponentGenerationOptions = {}) {
    this.transformer = new TokenTransformer()
    this.options = {
      typescript: true,
      styling: 'tailwind',
      componentPath: 'components/generated',
      includeStorybook: true,
      ...options,
    }
  }

  /**
   * Generate React component from Figma node
   */
  generateComponent(node: FigmaNode, componentName: string): {
    component: string
    styles?: string
    story?: string
  } {
    const props = this.extractProps(node)
    const jsx = this.nodeToJSX(node, 0)
    const styles = this.extractStyles(node)

    const component = this.createComponentFile(componentName, jsx, props, styles)
    const story = this.options.includeStorybook 
      ? this.createStorybookFile(componentName, props) 
      : undefined

    return { component, styles, story }
  }

  /**
   * Extract props from component variants
   */
  private extractProps(node: FigmaNode): Record<string, any> {
    const props: Record<string, any> = {}

    // Extract variant properties if it's a component set
    if (node.type === 'COMPONENT_SET' && (node as any).componentPropertyDefinitions) {
      const defs = (node as any).componentPropertyDefinitions
      Object.entries(defs).forEach(([key, def]: [string, any]) => {
        props[key] = {
          type: def.type,
          defaultValue: def.defaultValue,
          variantValues: def.variantOptions || [],
        }
      })
    }

    return props
  }

  /**
   * Convert Figma node to JSX
   */
  private nodeToJSX(node: FigmaNode, depth: number): string {
    const indent = '  '.repeat(depth)
    const className = this.nodeToClassName(node)
    const style = this.nodeToInlineStyle(node)

    switch (node.type) {
      case 'FRAME':
      case 'GROUP':
      case 'COMPONENT':
      case 'INSTANCE':
        return this.frameToJSX(node, className, style, depth)

      case 'TEXT':
        return this.textToJSX(node, className, style, indent)

      case 'RECTANGLE':
      case 'ELLIPSE':
        return this.shapeToJSX(node, className, style, indent)

      case 'VECTOR':
        return `${indent}<div className="${className}" style={${JSON.stringify(style)}} />`

      default:
        return `${indent}{/* ${node.type} not supported */}`
    }
  }

  /**
   * Convert frame/group to JSX
   */
  private frameToJSX(
    node: FigmaNode, 
    className: string, 
    style: any, 
    depth: number
  ): string {
    const indent = '  '.repeat(depth)
    const children = node.children
      ?.map(child => this.nodeToJSX(child, depth + 1))
      .join('\n') || ''

    if (!children) {
      return `${indent}<div className="${className}" style={${JSON.stringify(style)}} />`
    }

    return `${indent}<div className="${className}" style={${JSON.stringify(style)}}>
${children}
${indent}</div>`
  }

  /**
   * Convert text node to JSX
   */
  private textToJSX(
    node: any, 
    className: string, 
    style: any, 
    indent: string
  ): string {
    const text = node.characters || ''
    const Tag = this.getTextTag(node)
    
    return `${indent}<${Tag} className="${className}" style={${JSON.stringify(style)}}>
${indent}  ${text}
${indent}</${Tag}>`
  }

  /**
   * Convert shape to JSX
   */
  private shapeToJSX(
    node: FigmaNode, 
    className: string, 
    style: any, 
    indent: string
  ): string {
    // For shapes, we'll use divs with appropriate styling
    return `${indent}<div className="${className}" style={${JSON.stringify(style)}} />`
  }

  /**
   * Generate Tailwind classes from node properties
   */
  private nodeToClassName(node: FigmaNode): string {
    const classes: string[] = []

    // Layout classes
    if ((node as any).layoutMode === 'HORIZONTAL') {
      classes.push('flex', 'flex-row')
    } else if ((node as any).layoutMode === 'VERTICAL') {
      classes.push('flex', 'flex-col')
    }

    // Spacing classes
    if ((node as any).itemSpacing) {
      const spacing = this.pixelToTailwind((node as any).itemSpacing, 'gap')
      if (spacing) classes.push(spacing)
    }

    // Padding classes
    if ((node as any).paddingLeft) {
      const padding = this.pixelToTailwind((node as any).paddingLeft, 'p')
      if (padding) classes.push(padding)
    }

    // Size classes
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox
      
      // Common widths
      if (width === 1920) classes.push('w-full')
      else if (width % 4 === 0) {
        const twWidth = Math.round(width / 4)
        if (twWidth <= 96) classes.push(`w-${twWidth}`)
      }
    }

    // Visual classes
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0]
      if (fill.type === 'SOLID') {
        const colorClass = this.colorToTailwind(fill.color)
        if (colorClass) classes.push(colorClass)
      }
    }

    return classes.join(' ')
  }

  /**
   * Generate inline styles for properties not covered by Tailwind
   */
  private nodeToInlineStyle(node: FigmaNode): any {
    const style: any = {}

    // Border radius
    if ((node as any).cornerRadius) {
      style.borderRadius = `${(node as any).cornerRadius}px`
    }

    // Exact dimensions if needed
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox
      if (!this.isStandardTailwindSize(width)) {
        style.width = `${width}px`
      }
      if (!this.isStandardTailwindSize(height)) {
        style.height = `${height}px`
      }
    }

    // Gradients
    if (node.fills) {
      const gradientFill = node.fills.find(f => f.type.includes('GRADIENT'))
      if (gradientFill) {
        style.background = this.gradientToCSS(gradientFill as any)
      }
    }

    return Object.keys(style).length > 0 ? style : undefined
  }

  /**
   * Extract reusable styles from node
   */
  private extractStyles(node: FigmaNode): string {
    // For CSS-in-JS or styled-components
    if (this.options.styling !== 'tailwind') {
      return `
const styles = {
  container: {
    // Extracted styles
  }
}`
    }
    return ''
  }

  /**
   * Create component file content
   */
  private createComponentFile(
    name: string, 
    jsx: string, 
    props: Record<string, any>,
    styles: string
  ): string {
    const hasProps = Object.keys(props).length > 0
    const propsInterface = hasProps ? this.generatePropsInterface(name, props) : ''
    const propsParam = hasProps ? `{ ${Object.keys(props).join(', ')} }: ${name}Props` : ''

    return `${this.options.typescript ? '// @ts-nocheck\n' : ''}
import React from 'react'
${this.options.styling === 'styled-components' ? "import styled from 'styled-components'" : ''}

${propsInterface}

export const ${name} = (${propsParam}) => {
  return (
${jsx}
  )
}

${styles}

export default ${name}`
  }

  /**
   * Generate TypeScript props interface
   */
  private generatePropsInterface(name: string, props: Record<string, any>): string {
    if (!this.options.typescript) return ''

    const propsTypes = Object.entries(props)
      .map(([key, prop]) => {
        const type = prop.type === 'BOOLEAN' ? 'boolean' : 'string'
        const optional = prop.defaultValue !== undefined ? '?' : ''
        return `  ${key}${optional}: ${type}`
      })
      .join('\n')

    return `interface ${name}Props {
${propsTypes}
}`
  }

  /**
   * Create Storybook story file
   */
  private createStorybookFile(name: string, props: Record<string, any>): string {
    return `import type { Meta, StoryObj } from '@storybook/react'
import { ${name} } from './${name}'

const meta: Meta<typeof ${name}> = {
  title: 'Generated/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    ${Object.entries(props)
      .map(([key, prop]) => `${key}: ${JSON.stringify(prop.defaultValue)}`)
      .join(',\n    ')}
  },
}`
  }

  /**
   * Utility: Convert pixel value to Tailwind class
   */
  private pixelToTailwind(px: number, prefix: string): string | null {
    const spacing = {
      0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32,
      9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
    }

    const entry = Object.entries(spacing).find(([_, val]) => val === px)
    return entry ? `${prefix}-${entry[0]}` : null
  }

  /**
   * Utility: Check if size is standard Tailwind size
   */
  private isStandardTailwindSize(px: number): boolean {
    return px % 4 === 0 && px <= 384
  }

  /**
   * Utility: Convert Figma color to Tailwind class
   */
  private colorToTailwind(color: any): string | null {
    // This would map to your brand colors
    // For now, return null to use inline styles
    return null
  }

  /**
   * Utility: Convert gradient to CSS
   */
  private gradientToCSS(gradient: any): string {
    if (!gradient.gradientStops) return ''
    
    const stops = gradient.gradientStops
      .map((stop: any) => {
        const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`
        return `${color} ${Math.round(stop.position * 100)}%`
      })
      .join(', ')

    const type = gradient.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear'
    const angle = type === 'linear' ? '180deg, ' : ''
    
    return `${type}-gradient(${angle}${stops})`
  }

  /**
   * Utility: Get appropriate text tag
   */
  private getTextTag(node: any): string {
    const fontSize = node.style?.fontSize || 16
    if (fontSize >= 48) return 'h1'
    if (fontSize >= 36) return 'h2'
    if (fontSize >= 24) return 'h3'
    if (fontSize >= 20) return 'h4'
    if (fontSize >= 18) return 'h5'
    if (fontSize >= 16) return 'h6'
    return 'p'
  }
} 