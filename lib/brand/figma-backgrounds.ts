/**
 * Figma Background Utilities
 * Extracted from BrandGuidePage component for reuse across the application
 */

export const FIGMA_BACKGROUNDS = {
  // Brand Guide Simple background
  brandGuide: {
    color: '#010102',
    image: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/859b6797-d87c-4a9b-8acd-7beeb6c02464',
    opacity: 0.8,
    // CSS style object
    style: {
      backgroundColor: '#010102',
      backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/859b6797-d87c-4a9b-8acd-7beeb6c02464)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
} as const

/**
 * Get Figma background as CSS style object
 * @param backgroundKey - Key from FIGMA_BACKGROUNDS
 * @param withImage - Whether to include the background image
 * @returns CSS style object
 */
export function getFigmaBackground(
  backgroundKey: keyof typeof FIGMA_BACKGROUNDS,
  withImage: boolean = true
): React.CSSProperties {
  const bg = FIGMA_BACKGROUNDS[backgroundKey]
  
  if (!withImage) {
    return {
      backgroundColor: bg.color
    }
  }
  
  return bg.style
}

/**
 * Get Figma background as CSS classes (for Tailwind)
 * @param backgroundKey - Key from FIGMA_BACKGROUNDS
 * @returns Object with className and style properties
 */
export function getFigmaBackgroundClasses(
  backgroundKey: keyof typeof FIGMA_BACKGROUNDS
): {
  className: string
  style: React.CSSProperties
} {
  const bg = FIGMA_BACKGROUNDS[backgroundKey]
  
  return {
    className: "bg-cover bg-center bg-no-repeat",
    style: {
      backgroundColor: bg.color,
      backgroundImage: `url(${bg.image})`
    }
  }
}

/**
 * Create a hero section with Figma background
 * @param backgroundKey - Key from FIGMA_BACKGROUNDS
 * @param overlay - Whether to add gradient overlay for text readability
 * @returns Style object for hero section
 */
export function createFigmaHeroSection(
  backgroundKey: keyof typeof FIGMA_BACKGROUNDS,
  overlay: boolean = true
): {
  containerStyle: React.CSSProperties
  overlayStyle?: React.CSSProperties
} {
  const bg = FIGMA_BACKGROUNDS[backgroundKey]
  
  const result = {
    containerStyle: {
      ...bg.style,
      minHeight: '100vh',
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }
  
  if (overlay) {
    return {
      ...result,
      overlayStyle: {
        position: 'absolute' as const,
        inset: 0,
        background: 'linear-gradient(to bottom, transparent, transparent, rgba(0,0,0,0.4))',
        pointerEvents: 'none' as const
      }
    }
  }
  
  return result
} 