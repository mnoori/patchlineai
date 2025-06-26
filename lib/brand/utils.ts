/**
 * Brand utility functions
 */

import { COLORS, TYPOGRAPHY } from './constants'

/**
 * Generate CSS variables from brand colors
 */
export function generateCSSVariables() {
  const vars: Record<string, string> = {}
  
  // Primary colors
  Object.entries(COLORS.primary).forEach(([key, value]) => {
    vars[`--brand-${key}`] = value
  })
  
  // Gradient colors
  Object.entries(COLORS.gradient).forEach(([key, value]) => {
    vars[`--brand-gradient-${key}`] = value
  })
  
  // UI colors
  Object.entries(COLORS.ui).forEach(([key, value]) => {
    vars[`--brand-ui-${key}`] = value
  })
  
  // Semantic colors
  Object.entries(COLORS.semantic).forEach(([key, value]) => {
    vars[`--brand-${key}`] = value
  })
  
  return vars
}

/**
 * Create gradient CSS string
 */
export function createGradient(
  direction: 'to right' | 'to left' | 'to bottom' | 'to top' | number = 'to right',
  colors: string[] = [COLORS.gradient.start, COLORS.gradient.middle, COLORS.gradient.end]
) {
  const gradientDirection = typeof direction === 'number' ? `${direction}deg` : direction
  return `linear-gradient(${gradientDirection}, ${colors.join(', ')})`
}

/**
 * Convert hex to RGB
 */
export function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

/**
 * Convert hex to HSL
 */
export function hexToHSL(hex: string): string {
  const { r, g, b } = hexToRGB(hex)
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6
        break
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6
        break
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6
        break
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Generate Tailwind-compatible color object
 */
export function generateTailwindColors() {
  return {
    brand: {
      black: COLORS.primary.black,
      'deep-blue': COLORS.primary.deepBlue,
      'bright-blue': COLORS.primary.brightBlue,
      cyan: COLORS.primary.cyan,
    },
    gradient: {
      start: COLORS.gradient.start,
      middle: COLORS.gradient.middle,
      end: COLORS.gradient.end,
    },
  }
}

/**
 * Get brand font stack
 */
export function getFontStack(type: 'primary' | 'heading' | 'mono' = 'primary') {
  return TYPOGRAPHY.fontFamily[type]
} 