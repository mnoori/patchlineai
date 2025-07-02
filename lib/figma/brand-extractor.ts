/**
 * Figma Brand Extractor
 * Extracts universal brand elements (colors, fonts, components) from Figma
 */

import { FigmaClient } from './client'
import { FigmaFile } from './types'

export interface BrandColors {
  primary: Record<string, string>
  secondary: Record<string, string>
  neutral: Record<string, string>
  gradients: Record<string, string>
}

export interface BrandTypography {
  fontFamilies: string[]
  headings: Record<string, any>
  body: Record<string, any>
  special: Record<string, any>
}

export interface BrandComponents {
  backgrounds: ComponentStyle[]
  buttons: ComponentStyle[]
  cards: ComponentStyle[]
  sections: ComponentStyle[]
}

export interface ComponentStyle {
  name: string
  className: string
  css: string
  usage: string
}

export interface UniversalBrandSystem {
  colors: BrandColors
  typography: BrandTypography
  components: BrandComponents
  effects: Record<string, any>
  spacing: Record<string, string>
  animations: Record<string, string>
}

export class BrandExtractor {
  private client: FigmaClient

  constructor(client: FigmaClient) {
    this.client = client
  }

  /**
   * Extract complete brand system from Figma file
   */
  async extractBrandSystem(fileId: string): Promise<UniversalBrandSystem> {
    const file = await this.client.getFile(fileId)
    
    // Extract different brand elements
    const colors = await this.extractColors(file)
    const typography = await this.extractTypography(file)
    const components = await this.extractComponents(file, fileId)
    const effects = await this.extractEffects(file)
    const spacing = await this.extractSpacing(file)
    const animations = this.generateAnimations()

    return {
      colors,
      typography,
      components,
      effects,
      spacing,
      animations
    }
  }

  /**
   * Extract color system including gradients
   */
  private async extractColors(file: FigmaFile): Promise<BrandColors> {
    const colors: BrandColors = {
      primary: {},
      secondary: {},
      neutral: {},
      gradients: {}
    }

    // Extract from styles
    if (file.styles) {
      Object.entries(file.styles).forEach(([id, style]: [string, any]) => {
        if (style.styleType === 'FILL' && style.name) {
          const colorValue = this.extractColorValue(style)
          if (colorValue) {
            // Categorize colors based on name
            const name = this.formatColorName(style.name)
            if (style.name.toLowerCase().includes('primary') || 
                style.name.toLowerCase().includes('cyan') ||
                style.name.toLowerCase().includes('magenta')) {
              colors.primary[name] = colorValue
            } else if (style.name.toLowerCase().includes('secondary') ||
                      style.name.toLowerCase().includes('accent')) {
              colors.secondary[name] = colorValue
            } else if (style.name.toLowerCase().includes('gray') ||
                      style.name.toLowerCase().includes('grey') ||
                      style.name.toLowerCase().includes('neutral')) {
              colors.neutral[name] = colorValue
            }
          }
        }
      })
    }

    // Find gradient examples from the document
    const gradients = this.findGradients(file.document)
    gradients.forEach((gradient, index) => {
      colors.gradients[`gradient${index + 1}`] = gradient
    })

    // Add default Patchline gradients if not found
    if (Object.keys(colors.gradients).length === 0) {
      colors.gradients = {
        primary: 'linear-gradient(135deg, #00E6E4 0%, #8600FF 100%)',
        secondary: 'linear-gradient(135deg, #FF006E 0%, #8600FF 100%)',
        dark: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }
    }

    return colors
  }

  /**
   * Extract typography system
   */
  private async extractTypography(file: FigmaFile): Promise<BrandTypography> {
    const typography: BrandTypography = {
      fontFamilies: [],
      headings: {},
      body: {},
      special: {}
    }

    const fontSet = new Set<string>()

    if (file.styles) {
      Object.entries(file.styles).forEach(([id, style]: [string, any]) => {
        if (style.styleType === 'TEXT' && style.name) {
          const textStyle = this.extractTextStyle(style)
          if (textStyle) {
            fontSet.add(textStyle.fontFamily)
            
            const name = this.formatStyleName(style.name)
            if (style.name.toLowerCase().includes('heading') ||
                style.name.toLowerCase().includes('h1') ||
                style.name.toLowerCase().includes('h2') ||
                style.name.toLowerCase().includes('h3')) {
              typography.headings[name] = textStyle
            } else if (style.name.toLowerCase().includes('body') ||
                      style.name.toLowerCase().includes('paragraph')) {
              typography.body[name] = textStyle
            } else {
              typography.special[name] = textStyle
            }
          }
        }
      })
    }

    typography.fontFamilies = Array.from(fontSet)

    // Add defaults if needed
    if (typography.fontFamilies.length === 0) {
      typography.fontFamilies = ['Inter', 'system-ui']
    }

    return typography
  }

  /**
   * Extract reusable component styles
   */
  private async extractComponents(file: FigmaFile, fileId: string): Promise<BrandComponents> {
    const components: BrandComponents = {
      backgrounds: [],
      buttons: [],
      cards: [],
      sections: []
    }

    // Find common patterns in the file
    const patterns = this.findComponentPatterns(file.document)
    
    // Generate background styles
    components.backgrounds = [
      {
        name: 'Dark Gradient',
        className: 'bg-brand-dark',
        css: `background: #121212;`,
        usage: 'Main dark background'
      },
      {
        name: 'Primary Gradient',
        className: 'bg-brand-gradient',
        css: `background: linear-gradient(135deg, #00E6E4 0%, #8600FF 100%);`,
        usage: 'Hero sections and highlights'
      },
      {
        name: 'Mesh Gradient',
        className: 'bg-brand-mesh',
        css: `
          background: #121212;
          position: relative;
          &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: 
              radial-gradient(circle at 20% 50%, rgba(0, 230, 228, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(134, 0, 255, 0.2) 0%, transparent 50%);
          }
        `,
        usage: 'Complex background effects'
      }
    ]

    // Extract button styles from components
    if (file.components) {
      Object.entries(file.components).forEach(([id, component]) => {
        if (component.name.toLowerCase().includes('button')) {
          components.buttons.push({
            name: component.name,
            className: `btn-${this.formatClassName(component.name)}`,
            css: this.generateButtonCSS(component),
            usage: component.description || 'Button component'
          })
        } else if (component.name.toLowerCase().includes('card')) {
          components.cards.push({
            name: component.name,
            className: `card-${this.formatClassName(component.name)}`,
            css: this.generateCardCSS(component),
            usage: component.description || 'Card component'
          })
        }
      })
    }

    return components
  }

  /**
   * Extract effects (shadows, blurs, etc.)
   */
  private async extractEffects(file: FigmaFile): Promise<Record<string, any>> {
    const effects: Record<string, any> = {}

    if (file.styles) {
      Object.entries(file.styles).forEach(([id, style]: [string, any]) => {
        if (style.styleType === 'EFFECT' && style.name) {
          const effectValue = this.extractEffectValue(style)
          if (effectValue) {
            effects[this.formatStyleName(style.name)] = effectValue
          }
        }
      })
    }

    // Add default effects
    if (Object.keys(effects).length === 0) {
      effects.shadowSm = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      effects.shadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      effects.shadowLg = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      effects.glow = '0 0 20px rgba(0, 230, 228, 0.5)'
    }

    return effects
  }

  /**
   * Extract spacing system
   */
  private async extractSpacing(file: FigmaFile): Promise<Record<string, string>> {
    const spacing: Record<string, string> = {}
    const spacingValues = new Set<number>()

    // Find auto-layout frames to extract spacing
    const findSpacing = (node: any) => {
      if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
        if (node.itemSpacing) spacingValues.add(node.itemSpacing)
        if (node.paddingLeft) spacingValues.add(node.paddingLeft)
        if (node.paddingRight) spacingValues.add(node.paddingRight)
        if (node.paddingTop) spacingValues.add(node.paddingTop)
        if (node.paddingBottom) spacingValues.add(node.paddingBottom)
      }
      if (node.children) {
        node.children.forEach(findSpacing)
      }
    }

    file.document.children.forEach(page => findSpacing(page))

    // Convert to spacing scale
    Array.from(spacingValues)
      .sort((a, b) => a - b)
      .forEach((value, index) => {
        if (value <= 4) spacing.xs = `${value}px`
        else if (value <= 8) spacing.sm = `${value}px`
        else if (value <= 16) spacing.md = `${value}px`
        else if (value <= 24) spacing.lg = `${value}px`
        else if (value <= 32) spacing.xl = `${value}px`
        else if (value <= 48) spacing['2xl'] = `${value}px`
        else if (value <= 64) spacing['3xl'] = `${value}px`
        else spacing['4xl'] = `${value}px`
      })

    return spacing
  }

  /**
   * Generate animation presets
   */
  private generateAnimations(): Record<string, string> {
    return {
      fadeIn: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
      slideUp: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,
      glow: `
        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(0, 230, 228, 0.5); }
          50% { box-shadow: 0 0 20px rgba(0, 230, 228, 0.8); }
          100% { box-shadow: 0 0 5px rgba(0, 230, 228, 0.5); }
        }
      `,
      gradient: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `
    }
  }

  // Helper methods
  private extractColorValue(style: any): string | null {
    if (style.fills && style.fills[0]) {
      const fill = style.fills[0]
      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b, a = 1 } = fill.color
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
      }
    }
    return null
  }

  private findGradients(node: any): string[] {
    const gradients: string[] = []
    
    const traverse = (n: any) => {
      if (n.fills) {
        n.fills.forEach((fill: any) => {
          if (fill.type && fill.type.includes('GRADIENT') && fill.gradientStops) {
            const css = this.gradientToCSS(fill)
            if (css) gradients.push(css)
          }
        })
      }
      if (n.children) {
        n.children.forEach(traverse)
      }
    }
    
    traverse(node)
    return [...new Set(gradients)] // Remove duplicates
  }

  private gradientToCSS(fill: any): string | null {
    if (!fill.gradientStops) return null
    
    const stops = fill.gradientStops.map((stop: any) => {
      const { r, g, b, a = 1 } = stop.color
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${(stop.position * 100).toFixed(0)}%`
    }).join(', ')
    
    if (fill.type === 'GRADIENT_LINEAR') {
      return `linear-gradient(135deg, ${stops})`
    } else if (fill.type === 'GRADIENT_RADIAL') {
      return `radial-gradient(circle, ${stops})`
    }
    
    return null
  }

  private extractTextStyle(style: any): any {
    // Extract text properties
    return {
      fontFamily: style.fontFamily || 'Inter',
      fontSize: style.fontSize || 16,
      fontWeight: style.fontWeight || 400,
      lineHeight: style.lineHeightPx || style.fontSize * 1.5,
      letterSpacing: style.letterSpacing || 0
    }
  }

  private extractEffectValue(style: any): string | null {
    // Convert Figma effects to CSS
    if (style.effects && style.effects[0]) {
      const effect = style.effects[0]
      if (effect.type === 'DROP_SHADOW') {
        const { color, offset, radius } = effect
        return `${offset.x}px ${offset.y}px ${radius}px rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`
      }
    }
    return null
  }

  private findComponentPatterns(node: any): any {
    // Find reusable patterns in the design
    const patterns: any = {}
    // Implementation would analyze the node tree for patterns
    return patterns
  }

  private generateButtonCSS(component: any): string {
    return `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: all 0.2s;
    `
  }

  private generateCardCSS(component: any): string {
    return `
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem;
    `
  }

  private formatColorName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
  }

  private formatStyleName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .charAt(0).toLowerCase() + name.slice(1)
  }

  private formatClassName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
  }
} 