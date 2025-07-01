/**
 * Figma Token Transformer
 * Converts Figma design tokens to match Patchline brand system format
 */

import { FigmaDesignTokens, FigmaFile, FigmaNode, FigmaPaint } from './types'
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/lib/brand/constants'

export class TokenTransformer {
  /**
   * Transform Figma tokens to brand constants format
   */
  transformToBrandConstants(tokens: FigmaDesignTokens): {
    colors: any
    typography: any
    spacing: any
    radius: any
    shadows: any
  } {
    return {
      colors: this.transformColors(tokens.colors),
      typography: this.transformTypography(tokens.typography),
      spacing: this.transformSpacing(tokens.spacing),
      radius: this.transformBorderRadius(tokens.borderRadius || {}),
      shadows: this.transformShadows(tokens.shadows || {}),
    }
  }

  /**
   * Transform color tokens to match brand format
   */
  private transformColors(figmaColors: Record<string, any>): any {
    const colors: any = {
      primary: {},
      gradient: {},
      ui: {},
      semantic: {},
    }

    Object.entries(figmaColors).forEach(([key, value]) => {
      const colorValue = typeof value === 'string' ? value : value.value
      
      // Map to appropriate category based on name
      if (key.toLowerCase().includes('gradient')) {
        colors.gradient[key] = colorValue
      } else if (key.toLowerCase().includes('error') || 
                 key.toLowerCase().includes('warning') || 
                 key.toLowerCase().includes('success') ||
                 key.toLowerCase().includes('info')) {
        colors.semantic[key] = colorValue
      } else if (key.toLowerCase().includes('background') || 
                 key.toLowerCase().includes('foreground') ||
                 key.toLowerCase().includes('border') ||
                 key.toLowerCase().includes('muted')) {
        colors.ui[key] = colorValue
      } else {
        colors.primary[key] = colorValue
      }
    })

    // Ensure required brand colors are present
    return {
      primary: {
        black: colors.primary.black || COLORS.primary.black,
        deepBlue: colors.primary.deepBlue || COLORS.primary.deepBlue,
        brightBlue: colors.primary.brightBlue || COLORS.primary.brightBlue,
        cyan: colors.primary.cyan || COLORS.primary.cyan,
        ...colors.primary,
      },
      gradient: {
        start: colors.gradient.start || COLORS.gradient.start,
        middle: colors.gradient.middle || COLORS.gradient.middle,
        end: colors.gradient.end || COLORS.gradient.end,
        darkStart: colors.gradient.darkStart || COLORS.gradient.darkStart,
        darkMiddle: colors.gradient.darkMiddle || COLORS.gradient.darkMiddle,
        darkEnd: colors.gradient.darkEnd || COLORS.gradient.darkEnd,
        ...colors.gradient,
      },
      ui: {
        background: colors.ui.background || COLORS.ui.background,
        foreground: colors.ui.foreground || COLORS.ui.foreground,
        card: colors.ui.card || COLORS.ui.card,
        border: colors.ui.border || COLORS.ui.border,
        muted: colors.ui.muted || COLORS.ui.muted,
        accent: colors.ui.accent || COLORS.ui.accent,
        ...colors.ui,
      },
      semantic: {
        success: colors.semantic.success || COLORS.semantic.success,
        warning: colors.semantic.warning || COLORS.semantic.warning,
        error: colors.semantic.error || COLORS.semantic.error,
        info: colors.semantic.info || COLORS.semantic.info,
        ...colors.semantic,
      },
    }
  }

  /**
   * Transform typography tokens
   */
  private transformTypography(figmaTypography: Record<string, any>): any {
    const fontFamilies: Record<string, string> = {}
    const fontWeights: Record<string, string> = {}
    const fontSizes: Record<string, string> = {}

    Object.entries(figmaTypography).forEach(([key, value]) => {
      if (key.toLowerCase().includes('family')) {
        fontFamilies[key] = value.fontFamily || value
      } else if (key.toLowerCase().includes('weight')) {
        fontWeights[key] = String(value.fontWeight || value)
      } else if (key.toLowerCase().includes('size')) {
        fontSizes[key] = this.pixelToRem(value.fontSize || value)
      }
    })

    return {
      fontFamily: {
        primary: fontFamilies.primary || TYPOGRAPHY.fontFamily.primary,
        heading: fontFamilies.heading || TYPOGRAPHY.fontFamily.heading,
        mono: fontFamilies.mono || TYPOGRAPHY.fontFamily.mono,
        ...fontFamilies,
      },
      fontWeight: {
        regular: fontWeights.regular || TYPOGRAPHY.fontWeight.regular,
        medium: fontWeights.medium || TYPOGRAPHY.fontWeight.medium,
        semibold: fontWeights.semibold || TYPOGRAPHY.fontWeight.semibold,
        bold: fontWeights.bold || TYPOGRAPHY.fontWeight.bold,
        extrabold: fontWeights.extrabold || TYPOGRAPHY.fontWeight.extrabold,
        ...fontWeights,
      },
      fontSize: {
        xs: fontSizes.xs || TYPOGRAPHY.fontSize.xs,
        sm: fontSizes.sm || TYPOGRAPHY.fontSize.sm,
        base: fontSizes.base || TYPOGRAPHY.fontSize.base,
        lg: fontSizes.lg || TYPOGRAPHY.fontSize.lg,
        xl: fontSizes.xl || TYPOGRAPHY.fontSize.xl,
        '2xl': fontSizes['2xl'] || TYPOGRAPHY.fontSize['2xl'],
        '3xl': fontSizes['3xl'] || TYPOGRAPHY.fontSize['3xl'],
        '4xl': fontSizes['4xl'] || TYPOGRAPHY.fontSize['4xl'],
        '5xl': fontSizes['5xl'] || TYPOGRAPHY.fontSize['5xl'],
        '6xl': fontSizes['6xl'] || TYPOGRAPHY.fontSize['6xl'],
        '7xl': fontSizes['7xl'] || TYPOGRAPHY.fontSize['7xl'],
        ...fontSizes,
      },
    }
  }

  /**
   * Transform spacing tokens
   */
  private transformSpacing(figmaSpacing: Record<string, any>): any {
    const spacing: Record<string, string> = {}

    Object.entries(figmaSpacing).forEach(([key, value]) => {
      spacing[key] = this.pixelToRem(value.pixel || value)
    })

    return {
      xs: spacing.xs || SPACING.xs,
      sm: spacing.sm || SPACING.sm,
      md: spacing.md || SPACING.md,
      lg: spacing.lg || SPACING.lg,
      xl: spacing.xl || SPACING.xl,
      '2xl': spacing['2xl'] || SPACING['2xl'],
      '3xl': spacing['3xl'] || SPACING['3xl'],
      '4xl': spacing['4xl'] || SPACING['4xl'],
      ...spacing,
    }
  }

  /**
   * Transform border radius tokens
   */
  private transformBorderRadius(figmaRadius: Record<string, any>): any {
    const radius: Record<string, string> = {}

    Object.entries(figmaRadius).forEach(([key, value]) => {
      radius[key] = typeof value === 'number' ? `${value}px` : value
    })

    return {
      none: radius.none || RADIUS.none,
      sm: radius.sm || RADIUS.sm,
      md: radius.md || RADIUS.md,
      lg: radius.lg || RADIUS.lg,
      xl: radius.xl || RADIUS.xl,
      '2xl': radius['2xl'] || RADIUS['2xl'],
      full: radius.full || RADIUS.full,
      ...radius,
    }
  }

  /**
   * Transform shadow tokens
   */
  private transformShadows(figmaShadows: Record<string, any>): any {
    const shadows: Record<string, string> = {}

    Object.entries(figmaShadows).forEach(([key, value]) => {
      if (typeof value === 'string') {
        shadows[key] = value
      } else if (value.effects) {
        // Convert Figma effect to CSS shadow
        shadows[key] = this.effectToShadow(value.effects)
      }
    })

    return {
      sm: shadows.sm || SHADOWS.sm,
      md: shadows.md || SHADOWS.md,
      lg: shadows.lg || SHADOWS.lg,
      xl: shadows.xl || SHADOWS.xl,
      glow: shadows.glow || SHADOWS.glow,
      ...shadows,
    }
  }

  /**
   * Extract design tokens from Figma file
   */
  extractTokensFromFile(file: FigmaFile): FigmaDesignTokens {
    const tokens: FigmaDesignTokens = {
      colors: {},
      typography: {},
      spacing: {},
      shadows: {},
      borderRadius: {},
    }

    // Extract from styles
    if (file.styles) {
      Object.entries(file.styles).forEach(([id, style]: [string, any]) => {
        if (style.styleType === 'FILL') {
          tokens.colors[this.tokenizeName(style.name)] = {
            name: style.name,
            value: this.extractColorFromStyle(style),
            description: style.description,
          }
        } else if (style.styleType === 'TEXT') {
          tokens.typography[this.tokenizeName(style.name)] = this.extractTypographyFromStyle(style)
        } else if (style.styleType === 'EFFECT') {
          tokens.shadows[this.tokenizeName(style.name)] = this.extractShadowFromStyle(style)
        }
      })
    }

    // Extract spacing from component instances
    this.extractSpacingFromNodes(file.document, tokens.spacing)

    return tokens
  }

  /**
   * Extract color value from style
   */
  private extractColorFromStyle(style: any): string {
    if (style.fills && style.fills[0]) {
      const fill = style.fills[0]
      if (fill.type === 'SOLID' && fill.color) {
        return this.rgbToHex(fill.color)
      } else if (fill.type.includes('GRADIENT')) {
        // Return first color of gradient
        if (fill.gradientStops && fill.gradientStops[0]) {
          return this.rgbToHex(fill.gradientStops[0].color)
        }
      }
    }
    return '#000000'
  }

  /**
   * Extract typography from style
   */
  private extractTypographyFromStyle(style: any): any {
    return {
      fontFamily: style.fontFamily || 'Helvetica Neue',
      fontSize: `${style.fontSize}px`,
      fontWeight: String(style.fontWeight || 400),
      lineHeight: `${style.lineHeightPx}px`,
      letterSpacing: `${style.letterSpacing}px`,
    }
  }

  /**
   * Extract shadow from style
   */
  private extractShadowFromStyle(style: any): string {
    if (style.effects && style.effects[0]) {
      return this.effectToShadow(style.effects)
    }
    return 'none'
  }

  /**
   * Extract spacing from nodes
   */
  private extractSpacingFromNodes(node: FigmaNode, spacing: Record<string, any>): void {
    // Look for auto-layout frames to extract spacing
    if (node.type === 'FRAME' && (node as any).layoutMode) {
      const frame = node as any
      if (frame.itemSpacing) {
        spacing[`spacing-${frame.itemSpacing}`] = {
          name: `Spacing ${frame.itemSpacing}`,
          value: `${frame.itemSpacing}px`,
          pixel: frame.itemSpacing,
        }
      }
      if (frame.paddingLeft) {
        spacing[`padding-${frame.paddingLeft}`] = {
          name: `Padding ${frame.paddingLeft}`,
          value: `${frame.paddingLeft}px`,
          pixel: frame.paddingLeft,
        }
      }
    }

    // Recurse through children
    if (node.children) {
      node.children.forEach(child => this.extractSpacingFromNodes(child, spacing))
    }
  }

  /**
   * Convert RGB to hex color
   */
  private rgbToHex(color: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
  }

  /**
   * Convert Figma effect to CSS shadow
   */
  private effectToShadow(effects: any[]): string {
    const shadows = effects
      .filter(e => e.type === 'DROP_SHADOW' && e.visible !== false)
      .map(e => {
        const x = e.offset?.x || 0
        const y = e.offset?.y || 0
        const blur = e.radius || 0
        const spread = e.spread || 0
        const color = e.color ? this.rgbaToString(e.color) : 'rgba(0,0,0,0.1)'
        return `${x}px ${y}px ${blur}px ${spread}px ${color}`
      })
    
    return shadows.join(', ') || 'none'
  }

  /**
   * Convert RGBA to CSS string
   */
  private rgbaToString(color: { r: number; g: number; b: number; a: number }): string {
    return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`
  }

  /**
   * Convert pixel value to rem
   */
  private pixelToRem(px: number | string): string {
    const pixels = typeof px === 'string' ? parseFloat(px) : px
    return `${pixels / 16}rem`
  }

  /**
   * Convert name to token format
   */
  private tokenizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^\w/, char => char.toLowerCase())
  }
} 