'use client'

import React from 'react'
import Image from 'next/image'

interface FigmaLayer {
  id: string
  name: string
  type: string
  visible: boolean
  opacity?: number
  blendMode?: string
  fills?: any[]
  effects?: any[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  children?: FigmaLayer[]
  exportUrl?: string
}

interface FigmaLayerRendererProps {
  layer: FigmaLayer
  parentBounds?: { x: number; y: number; width: number; height: number }
  scale?: number
  hiddenLayers?: Set<string>
}

export function FigmaLayerRenderer({ 
  layer, 
  parentBounds,
  scale = 1,
  hiddenLayers = new Set()
}: FigmaLayerRendererProps) {
  // Check if layer should be hidden
  if (!layer.visible || hiddenLayers.has(layer.id)) return null

  const bounds = layer.absoluteBoundingBox
  if (!bounds) return null

  // Calculate relative position if parent bounds provided
  const relativeX = parentBounds ? bounds.x - parentBounds.x : bounds.x
  const relativeY = parentBounds ? bounds.y - parentBounds.y : bounds.y

  // Build styles based on layer properties
  const layerStyles: React.CSSProperties = {
    position: 'absolute',
    left: relativeX * scale,
    top: relativeY * scale,
    width: bounds.width * scale,
    height: bounds.height * scale,
    opacity: layer.opacity,
  }

  // Apply blend mode
  if (layer.blendMode && layer.blendMode !== 'PASS_THROUGH' && layer.blendMode !== 'NORMAL') {
    layerStyles.mixBlendMode = layer.blendMode.toLowerCase().replace('_', '-') as any
  }

  // Apply fills
  if (layer.fills && layer.fills.length > 0) {
    const fill = layer.fills[0] // Use first fill for now
    
    if (fill.type === 'SOLID' && fill.visible !== false) {
      const { r, g, b, a = 1 } = fill.color
      layerStyles.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a * (fill.opacity || 1)})`
    } else if (fill.type === 'IMAGE' && layer.exportUrl) {
      // For image fills, we'll render an img element
      return (
        <div
          className="figma-layer"
          style={layerStyles}
          data-layer-id={layer.id}
          data-layer-name={layer.name}
        >
          <Image
            src={layer.exportUrl}
            alt={layer.name}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      )
    } else if (fill.type && fill.type.includes('GRADIENT') && fill.gradientStops) {
      // Handle gradients
      const stops = fill.gradientStops.map((stop: any) => {
        const { r, g, b, a = 1 } = stop.color
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${(stop.position * 100).toFixed(0)}%`
      }).join(', ')
      
      if (fill.type === 'GRADIENT_LINEAR') {
        layerStyles.background = `linear-gradient(90deg, ${stops})`
      } else if (fill.type === 'GRADIENT_RADIAL') {
        layerStyles.background = `radial-gradient(circle, ${stops})`
      }
    }
  }

  // Apply effects (shadows, etc.)
  if (layer.effects && layer.effects.length > 0) {
    const shadows = layer.effects
      .filter((effect: any) => effect.type === 'DROP_SHADOW' && effect.visible !== false)
      .map((shadow: any) => {
        const { r, g, b, a = 1 } = shadow.color
        return `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
      })
      .join(', ')
    
    if (shadows) {
      layerStyles.boxShadow = shadows
    }
  }

  return (
    <div
      className="figma-layer"
      style={layerStyles}
      data-layer-id={layer.id}
      data-layer-name={layer.name}
    >
      {/* Render children recursively */}
      {layer.children && layer.children.map((child) => (
        <FigmaLayerRenderer
          key={child.id}
          layer={child}
          parentBounds={bounds}
          scale={scale}
          hiddenLayers={hiddenLayers}
        />
      ))}
    </div>
  )
}

// Composite component for rendering entire Figma frames
interface FigmaFrameRendererProps {
  frameData: FigmaLayer
  width?: number
  className?: string
  hiddenLayers?: Set<string>
}

export function FigmaFrameRenderer({ 
  frameData, 
  width,
  className = '',
  hiddenLayers = new Set()
}: FigmaFrameRendererProps) {
  const bounds = frameData.absoluteBoundingBox
  if (!bounds) return null

  // Calculate scale based on desired width
  const scale = width ? width / bounds.width : 1
  const height = bounds.height * scale

  return (
    <div 
      className={`figma-frame-container relative overflow-hidden ${className}`}
      style={{
        width: width || bounds.width,
        height: height,
      }}
    >
      <FigmaLayerRenderer 
        layer={frameData} 
        scale={scale}
        hiddenLayers={hiddenLayers}
      />
    </div>
  )
} 