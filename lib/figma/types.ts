/**
 * Figma API Types
 * Type definitions for Figma API responses and data structures
 */

// Basic Figma types
export interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface FigmaVector {
  x: number
  y: number
}

export interface FigmaRectangle {
  x: number
  y: number
  width: number
  height: number
}

// Paint types
export interface FigmaSolidPaint {
  type: 'SOLID'
  visible?: boolean
  opacity?: number
  color: FigmaColor
}

export interface FigmaGradientPaint {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'
  visible?: boolean
  opacity?: number
  gradientStops: Array<{
    position: number
    color: FigmaColor
  }>
}

export type FigmaPaint = FigmaSolidPaint | FigmaGradientPaint

// Style types
export interface FigmaStyle {
  id: string
  key: string
  name: string
  description?: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  type: string
  node?: any
}

export interface FigmaTextStyle {
  fontFamily: string
  fontPostScriptName?: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeightPx: number
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM'
}

// Node types
export interface FigmaNode {
  id: string
  name: string
  type: string
  visible?: boolean
  children?: FigmaNode[]
  backgroundColor?: FigmaColor
  fills?: FigmaPaint[]
  strokes?: FigmaPaint[]
  strokeWeight?: number
  effects?: any[]
  styles?: Record<string, string>
  absoluteBoundingBox?: FigmaRectangle
  constraints?: {
    vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE'
    horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE'
  }
}

// Component types
export interface FigmaComponent {
  key: string
  name: string
  description?: string
  node_id: string
  thumbnail_url?: string
  created_at?: string
  updated_at?: string
  containing_frame?: {
    name?: string
    nodeId?: string
    pageName?: string
    pageId?: string
  }
}

// Document types
export interface FigmaDocument {
  id: string
  name: string
  type: 'DOCUMENT'
  children: FigmaPage[]
}

export interface FigmaPage {
  id: string
  name: string
  type: 'PAGE'
  children: FigmaNode[]
  backgroundColor: FigmaColor
}

// File types
export interface FigmaFile {
  name: string
  lastModified: string
  thumbnailUrl?: string
  version: string
  document: FigmaDocument
  components?: Record<string, FigmaComponent>
  styles?: Record<string, any>
  schemaVersion: number
}

// API Response types
export interface FigmaFilesResponse {
  name: string
  role: string
  lastModified: string
  thumbnailUrl: string
  err?: string
  status?: number
}

export interface FigmaComponentsResponse {
  meta: {
    components: FigmaComponent[]
  }
}

export interface FigmaImagesResponse {
  err?: string
  images: Record<string, string>
  status?: number
}

// Token types for design system
export interface FigmaColorToken {
  name: string
  value: string
  description?: string
}

export interface FigmaTypographyToken {
  name: string
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
}

export interface FigmaSpacingToken {
  name: string
  value: string
  pixel: number
}

export interface FigmaDesignTokens {
  colors: Record<string, FigmaColorToken>
  typography: Record<string, FigmaTypographyToken>
  spacing: Record<string, FigmaSpacingToken>
  shadows?: Record<string, any>
  borderRadius?: Record<string, string>
} 