/**
 * Patchline AI Brand Constants
 * Centralized brand configuration based on official brand guide
 */

// Brand Identity
export const BRAND = {
  name: 'Patchline',
  fullName: 'Patchline AI',
  tagline: 'AI-powered music platform',
  domain: 'patchline.ai',
  copyright: `© ${new Date().getFullYear()} Patchline AI. All rights reserved.`,
} as const

// Typography
export const TYPOGRAPHY = {
  // Primary brand typeface from brand guide
  fontFamily: {
    primary: 'Helvetica Neue, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Helvetica Neue, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  // Font weights as specified in brand guide
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  // Type scale
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },
} as const

// Brand Colors from the style guide
export const COLORS = {
  // Primary colors
  primary: {
    black: '#010102',      // Primary black
    deepBlue: '#002772',   // Deep blue
    brightBlue: '#0068FF', // Bright blue
    cyan: '#00E6E2',       // Cyan accent
  },
  // Gradient colors
  gradient: {
    start: '#70F7EA',      // Cyan gradient start
    middle: '#2A09CC',     // Blue gradient middle
    end: '#090030',        // Dark gradient end
  },
  // UI colors (maintaining existing dark theme)
  ui: {
    background: '#010102',
    foreground: '#FAFAFA',
    card: '#1A1A1B',
    border: '#262626',
    muted: '#525252',
    accent: '#0068FF',
  },
  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const

// Spacing system
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
} as const

// Border radius
export const RADIUS = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

// Shadows
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  glow: '0 0 20px rgba(0, 104, 255, 0.3)',
} as const

// Animation
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const

// Logo paths
export const LOGO = {
  primary: '/logo.png',
  transparent: '/logo_transparent_background.png',
  icon: '/favicon.png',
  // Phantom assets (if we're transitioning)
  phantom: {
    black: '/Phantom-Integration-Assets/Logos/Phantom-Logo-Black.svg',
    white: '/Phantom-Integration-Assets/Logos/Phantom-Logo-White.svg',
    purple: '/Phantom-Integration-Assets/Logos/Phantom-Logo-Purple.svg',
  },
} as const

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const 