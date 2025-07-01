/**
 * Figma Background Component
 * Uses the exact background extracted from PatchlineAI_Brand Guide_Simple layer
 */

import { cn } from '@/lib/utils'

interface FigmaBackgroundProps {
  children?: React.ReactNode
  className?: string
  variant?: 'full' | 'section' | 'card'
}

export function FigmaBackground({ 
  children, 
  className,
  variant = 'section' 
}: FigmaBackgroundProps) {
  const baseClasses = "relative"
  
  const variantClasses = {
    full: "min-h-screen w-full",
    section: "w-full py-16 px-8",
    card: "rounded-lg p-6"
  }
  
  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        // Exact background from Figma layer: PatchlineAI_Brand Guide_Simple
        background: '#121212'
      }}
    >
      {children}
    </div>
  )
}

/**
 * Figma Section - Ready-to-use section with the Figma background
 */
export function FigmaSection({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <FigmaBackground variant="section" className={className}>
      <div className="max-w-7xl mx-auto text-white">
        {children}
      </div>
    </FigmaBackground>
  )
}

/**
 * Figma Card - Card component with the Figma background
 */
export function FigmaCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <FigmaBackground variant="card" className={className}>
      <div className="text-white">
        {children}
      </div>
    </FigmaBackground>
  )
} 