/**
 * Utility functions for Figma to React conversion
 */

/**
 * Convert RGB values to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert RGBA to CSS rgba string
 */
export function rgbaToString(r: number, g: number, b: number, a: number = 1): string {
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
}

/**
 * Generate a valid CSS/JS class name from a Figma layer name
 */
export function generateClassName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
    .replace(/^(\d)/, '_$1') // Prefix with _ if starts with number
    .replace(/([A-Z])/g, (match, p1, offset) => {
      // Convert to camelCase
      return offset > 0 ? match : match.toLowerCase()
    })
}

/**
 * Convert Figma's transform matrix to CSS transform
 */
export function matrixToTransform(matrix: number[][]): string {
  if (!matrix || matrix.length !== 2) return ''
  
  const [[a, c, tx], [b, d, ty]] = matrix
  
  // Identity matrix - no transform needed
  if (a === 1 && b === 0 && c === 0 && d === 1 && tx === 0 && ty === 0) {
    return ''
  }
  
  return `matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`
}

/**
 * Extract text styles from Figma text node
 */
export function extractTextStyles(textNode: any): Record<string, any> {
  const styles: Record<string, any> = {}
  
  if (textNode.style) {
    const { fontSize, fontFamily, fontWeight, lineHeightPx, letterSpacing, textAlignHorizontal } = textNode.style
    
    if (fontSize) styles.fontSize = `${fontSize}px`
    if (fontFamily) styles.fontFamily = fontFamily
    if (fontWeight) styles.fontWeight = fontWeight
    if (lineHeightPx) styles.lineHeight = `${lineHeightPx}px`
    if (letterSpacing) styles.letterSpacing = `${letterSpacing}px`
    
    if (textAlignHorizontal) {
      const alignMap: Record<string, string> = {
        'LEFT': 'left',
        'CENTER': 'center',
        'RIGHT': 'right',
        'JUSTIFIED': 'justify'
      }
      styles.textAlign = alignMap[textAlignHorizontal] || 'left'
    }
  }
  
  return styles
}

/**
 * Convert Figma gradient to CSS gradient
 */
export function gradientToCSS(gradient: any): string {
  if (!gradient.gradientStops) return ''
  
  const stops = gradient.gradientStops.map((stop: any) => {
    const { r, g, b, a = 1 } = stop.color
    const color = rgbaToString(r, g, b, a * (stop.opacity || 1))
    const position = `${(stop.position * 100).toFixed(1)}%`
    return `${color} ${position}`
  }).join(', ')
  
  if (gradient.type === 'GRADIENT_LINEAR') {
    // Calculate angle from gradient transform
    let angle = 180 // Default top to bottom
    if (gradient.gradientTransform) {
      const [[a, b]] = gradient.gradientTransform
      angle = Math.round(Math.atan2(b, a) * 180 / Math.PI + 90)
    }
    return `linear-gradient(${angle}deg, ${stops})`
  } else if (gradient.type === 'GRADIENT_RADIAL') {
    return `radial-gradient(circle, ${stops})`
  } else if (gradient.type === 'GRADIENT_ANGULAR') {
    return `conic-gradient(from 0deg, ${stops})`
  }
  
  return ''
}

/**
 * Convert Figma shadow effect to CSS box-shadow
 */
export function shadowToCSS(shadow: any): string {
  const { offset, radius, spread = 0, color } = shadow
  const { r, g, b, a = 1 } = color
  const colorStr = rgbaToString(r, g, b, a)
  const inset = shadow.type === 'INNER_SHADOW' ? 'inset ' : ''
  
  return `${inset}${offset.x}px ${offset.y}px ${radius}px ${spread}px ${colorStr}`
}

/**
 * Sanitize component name for React
 */
export function sanitizeComponentName(name: string): string {
  // Remove special characters and spaces
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, '')
  
  // Ensure it starts with a letter
  if (!/^[a-zA-Z]/.test(sanitized)) {
    sanitized = 'Component' + sanitized
  }
  
  // Convert to PascalCase
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1)
}

/**
 * Check if a layer should be exported as an image
 */
export function shouldExportAsImage(layer: any): boolean {
  // Export complex vectors, images, or layers with effects
  return (
    layer.type === 'VECTOR' ||
    (layer.fills && layer.fills.some((fill: any) => fill.type === 'IMAGE')) ||
    (layer.effects && layer.effects.length > 2) ||
    layer.exportSettings?.length > 0
  )
}

/**
 * Get Tailwind config for custom values
 */
export function generateTailwindExtend(figmaStyles: any): Record<string, any> {
  const extend: Record<string, any> = {
    colors: {},
    fontSize: {},
    fontFamily: {},
    spacing: {},
    borderRadius: {}
  }
  
  // Process color styles
  if (figmaStyles.colors) {
    Object.entries(figmaStyles.colors).forEach(([name, value]: [string, any]) => {
      const key = generateClassName(name)
      extend.colors[key] = value
    })
  }
  
  // Process text styles
  if (figmaStyles.textStyles) {
    Object.entries(figmaStyles.textStyles).forEach(([name, style]: [string, any]) => {
      const key = generateClassName(name)
      if (style.fontSize) {
        extend.fontSize[key] = [`${style.fontSize}px`, style.lineHeight || '1.5']
      }
    })
  }
  
  return extend
}

/**
 * Map Figma blend modes to CSS
 */
export function blendModeToCSS(blendMode: string): string {
  const blendModeMap: Record<string, string> = {
    'NORMAL': 'normal',
    'DARKEN': 'darken',
    'MULTIPLY': 'multiply',
    'COLOR_BURN': 'color-burn',
    'LIGHTEN': 'lighten',
    'SCREEN': 'screen',
    'COLOR_DODGE': 'color-dodge',
    'OVERLAY': 'overlay',
    'SOFT_LIGHT': 'soft-light',
    'HARD_LIGHT': 'hard-light',
    'DIFFERENCE': 'difference',
    'EXCLUSION': 'exclusion',
    'HUE': 'hue',
    'SATURATION': 'saturation',
    'COLOR': 'color',
    'LUMINOSITY': 'luminosity'
  }
  
  return blendModeMap[blendMode] || 'normal'
}

/**
 * Extract component props from Figma component properties
 */
export function extractComponentProps(properties: Record<string, any>): Record<string, any> {
  const props: Record<string, any> = {}
  
  Object.entries(properties).forEach(([key, value]: [string, any]) => {
    const propName = generateClassName(key)
    
    if (value.type === 'BOOLEAN') {
      props[propName] = {
        type: 'boolean',
        default: value.defaultValue || false
      }
    } else if (value.type === 'TEXT') {
      props[propName] = {
        type: 'string',
        default: value.defaultValue || ''
      }
    } else if (value.type === 'INSTANCE_SWAP') {
      props[propName] = {
        type: 'component',
        default: value.defaultValue
      }
    }
  })
  
  return props
} 