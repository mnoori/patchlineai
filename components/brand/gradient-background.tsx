import { cn } from '@/lib/utils'
import { createGradient, COLORS } from '@/lib/brand'

interface GradientBackgroundProps {
  className?: string
  variant?: 'hero' | 'section' | 'card' | 'subtle'
  children?: React.ReactNode
  overlay?: boolean
}

export function GradientBackground({ 
  className, 
  variant = 'hero',
  children,
  overlay = true 
}: GradientBackgroundProps) {
  const gradients = {
    hero: `linear-gradient(180deg, #010102 0%, #010102 100%)`, // Pure black base for hero, orbs will handle the gradient
    section: `linear-gradient(180deg, #010102 0%, #010102 100%)`, // Pure black, orbs add color
    card: `linear-gradient(180deg, rgba(0, 230, 228, 0.02) 0%, rgba(0, 230, 228, 0.05) 30%, #010102 100%)`,
    subtle: `linear-gradient(180deg, rgba(0, 230, 228, 0.01) 0%, #010102 50%)`
  }

  return (
    <div 
      className={cn('relative', className)}
      style={{ 
        background: gradients[variant],
        minHeight: variant === 'hero' ? '100vh' : undefined
      }}
    >
      {overlay && variant === 'hero' && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none" />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}

// Animated gradient orbs for background effects - Much brighter to match the image
export function GradientOrbs({ 
  className,
  variant = 'default'
}: { 
  className?: string
  variant?: 'default' | 'subtle' | 'vibrant' | 'dispersed' | 'subtle-bottom' | 'dispersed-bottom' | 'edge-left' | 'edge-right' | 'transition'
}) {
  if (variant === 'subtle') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Much brighter subtle variant */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 90% 10%, 
              rgba(0, 230, 228, 0.6) 0%, 
              rgba(0, 230, 228, 0.4) 20%, 
              rgba(0, 184, 181, 0.25) 35%,
              rgba(0, 75, 85, 0.15) 50%,
              #010102 65%)`,
            opacity: 0.9,
          }}
        />
      </div>
    )
  }

  if (variant === 'vibrant') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Even brighter vibrant: strong cyan glow with maximum visibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 130% at 50% -30%, 
              rgba(0, 230, 228, 0.9) 0%, 
              rgba(0, 230, 228, 0.75) 18%, 
              rgba(0, 230, 228, 0.55) 28%, 
              rgba(0, 184, 181, 0.35) 38%,
              rgba(0, 75, 85, 0.2) 48%, 
              #010102 58%)`,
            opacity: 0.95,
          }}
        />
      </div>
    )
  }

  if (variant === 'dispersed') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Much brighter dispersed */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 95% 95% at 10% -10%, 
              rgba(0, 230, 228, 0.7) 0%, 
              rgba(0, 230, 228, 0.5) 18%, 
              rgba(0, 184, 181, 0.3) 32%,
              rgba(0, 75, 85, 0.15) 45%,
              #010102 60%)`,
            opacity: 0.9,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 75% 75% at 85% -5%, 
              rgba(0, 230, 228, 0.6) 0%, 
              rgba(0, 230, 228, 0.4) 22%, 
              rgba(0, 184, 181, 0.2) 40%, 
              transparent 60%)`,
            opacity: 0.8,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 65% 85% at 50% -15%, 
              rgba(0, 230, 228, 0.5) 0%, 
              rgba(0, 230, 228, 0.3) 8%, 
              transparent 30%)`,
            opacity: 0.7,
          }}
        />
      </div>
    )
  }

  if (variant === 'subtle-bottom') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Brighter bottom glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 90% 110%, 
              rgba(0, 230, 228, 0.6) 0%, 
              rgba(0, 230, 228, 0.4) 20%, 
              rgba(0, 184, 181, 0.25) 35%,
              rgba(0, 75, 85, 0.15) 50%,
              #010102 65%)`,
            opacity: 0.8,
          }}
        />
      </div>
    )
  }

  if (variant === 'dispersed-bottom') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Brighter bottom dispersed */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 90% 90% at 10% 110%, 
              rgba(0, 230, 228, 0.6) 0%, 
              rgba(0, 230, 228, 0.4) 18%, 
              rgba(0, 184, 181, 0.25) 32%,
              rgba(0, 75, 85, 0.15) 45%,
              #010102 60%)`,
            opacity: 0.7,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 70% at 85% 105%, 
              rgba(0, 230, 228, 0.5) 0%, 
              rgba(0, 230, 228, 0.3) 22%, 
              rgba(0, 184, 181, 0.15) 40%, 
              transparent 60%)`,
            opacity: 0.6,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 50% 115%, 
              rgba(0, 230, 228, 0.4) 0%, 
              rgba(0, 230, 228, 0.25) 8%, 
              transparent 30%)`,
            opacity: 0.5,
          }}
        />
      </div>
    )
  }

  if (variant === 'edge-left') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Brighter cyan edge glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 35% 30% at -5% 50%, 
              rgba(0, 230, 228, 0.7) 0%, 
              rgba(0, 230, 228, 0.5) 20%, 
              rgba(0, 230, 228, 0.3) 30%,
              rgba(0, 184, 181, 0.15) 40%,
              #010102 50%)`
          }}
        />
      </div>
    )
  }

  if (variant === 'edge-right') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Corrected: Forcing a fade to pure black to avoid color blending */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 40% 60% at 105% 50%,
              rgba(0, 230, 228, 0.25) 0%,
              rgba(0, 230, 228, 0.1) 40%,
              rgba(1, 1, 2, 0) 70%,
              #010102 75%)`
          }}
        />
      </div>
    )
  }

  if (variant === 'transition') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Fixed transition: pure black background with brighter cyan */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 30% at 50% 50%, 
              rgba(0, 230, 228, 0.25) 0%, 
              rgba(0, 230, 228, 0.18) 25%,
              rgba(0, 230, 228, 0.12) 45%,
              rgba(0, 184, 181, 0.08) 60%,
              #010102 75%)`,
            opacity: 0.85,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 30% at 0% 50%, 
                rgba(0, 230, 228, 0.2) 0%, 
                rgba(0, 230, 228, 0.1) 20%,
                #010102 45%),
              radial-gradient(ellipse 90% 30% at 100% 50%, 
                rgba(0, 230, 228, 0.2) 0%, 
                rgba(0, 230, 228, 0.1) 20%,
                #010102 45%)
            `,
            opacity: 0.7,
          }}
        />
      </div>
    )
  }

  // Default variant - Even brighter with more cyan visibility
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 120% at 50% -20%, 
            rgba(0, 230, 228, 0.8) 0%, 
            rgba(0, 230, 228, 0.65) 15%, 
            rgba(0, 230, 228, 0.45) 25%, 
            rgba(0, 184, 181, 0.25) 35%,
            rgba(0, 75, 85, 0.15) 45%, 
            #010102 55%)`,
          opacity: 0.9,
        }}
      />
    </div>
  )
} 