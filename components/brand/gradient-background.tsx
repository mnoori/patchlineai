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
    card: `linear-gradient(180deg, rgba(0, 230, 228, 0.02) 0%, rgba(0, 39, 114, 0.1) 30%, #010102 100%)`,
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

// Animated gradient orbs for background effects
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
        {/* From TOP-RIGHT CORNER */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 90% 10%, 
              rgba(0, 230, 228, 0.6) 0%, 
              rgba(0, 230, 228, 0.55) 20%, 
              rgba(0, 104, 255, 0.5) 35%,
              rgba(0, 39, 114, 0.4) 50%, 
              #010102 75%)`,
            opacity: 0.72,
          }}
        />
      </div>
    )
  }

  if (variant === 'vibrant') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Strong vibrant glow from top center - matching the screenshot */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 130% at 50% -30%, 
              rgba(0, 230, 228, 0.75) 0%, 
              rgba(0, 230, 228, 0.7) 18%, 
              rgba(0, 230, 228, 0.6) 28%, 
              rgba(0, 104, 255, 0.5) 38%,
              rgba(0, 39, 114, 0.4) 48%, 
              rgba(0, 20, 60, 0.6) 58%, 
              #010102 68%)`,
            opacity: 0.9,
          }}
        />
      </div>
    )
  }

  if (variant === 'dispersed') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* From TOP-LEFT corner - MORE CYAN and BRIGHTER */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 95% 95% at 10% -10%, 
              rgba(0, 230, 228, 0.7) 0%, 
              rgba(0, 230, 228, 0.65) 18%, 
              rgba(0, 104, 255, 0.45) 32%,
              rgba(0, 39, 114, 0.35) 45%, 
              #010102 60%)`,
            opacity: 0.8,
          }}
        />
        {/* From TOP-RIGHT corner - MORE CYAN and BRIGHTER */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 75% 75% at 85% -5%, 
              rgba(0, 230, 228, 0.65) 0%, 
              rgba(0, 230, 228, 0.55) 22%, 
              rgba(0, 39, 114, 0.35) 40%, 
              transparent 65%)`,
            opacity: 0.7,
          }}
        />
        {/* From TOP center accent - MORE CYAN and BRIGHTER */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 65% 85% at 50% -15%, 
              rgba(0, 230, 228, 0.55) 0%, 
              rgba(0, 230, 228, 0.45) 8%, 
              transparent 35%)`,
            opacity: 0.6,
          }}
        />
      </div>
    )
  }

  if (variant === 'subtle-bottom') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* From BOTTOM-RIGHT CORNER - flipped version of subtle */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 90% 110%, 
              rgba(0, 230, 228, 0.6) 0%, 
              rgba(0, 230, 228, 0.55) 20%, 
              rgba(0, 104, 255, 0.5) 35%,
              rgba(0, 39, 114, 0.4) 50%, 
              #010102 75%)`,
            opacity: 0.6,
          }}
        />
      </div>
    )
  }

  if (variant === 'dispersed-bottom') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* From BOTTOM-LEFT corner */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 90% 90% at 10% 110%, 
              rgba(0, 230, 228, 0.55) 0%, 
              rgba(0, 230, 228, 0.5) 18%, 
              rgba(0, 104, 255, 0.4) 32%,
              rgba(0, 39, 114, 0.3) 45%, 
              #010102 60%)`,
            opacity: 0.5,
          }}
        />
        {/* From BOTTOM-RIGHT corner */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 70% at 85% 105%, 
              rgba(0, 230, 228, 0.5) 0%, 
              rgba(0, 230, 228, 0.45) 22%, 
              rgba(0, 39, 114, 0.3) 40%, 
              transparent 65%)`,
            opacity: 0.4,
          }}
        />
        {/* From BOTTOM center accent */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 50% 115%, 
              rgba(0, 230, 228, 0.4) 0%, 
              rgba(0, 230, 228, 0.35) 8%, 
              transparent 35%)`,
            opacity: 0.3,
          }}
        />
      </div>
    )
  }

  if (variant === 'edge-left') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* From LEFT EDGE - cyan only gradient, constrained vertically */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 60% at -20% 50%, 
              rgba(0, 230, 228, 0.7) 0%, 
              rgba(0, 230, 228, 0.6) 15%, 
              rgba(0, 230, 228, 0.45) 30%,
              rgba(0, 230, 228, 0.3) 45%, 
              rgba(0, 230, 228, 0.15) 60%,
              transparent 80%)`,
            opacity: 0.6,
          }}
        />
        {/* Secondary cyan glow for depth, also constrained vertically */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 40% at -10% 50%, 
              rgba(0, 230, 228, 0.5) 0%, 
              rgba(0, 230, 228, 0.35) 25%, 
              rgba(0, 230, 228, 0.2) 45%, 
              transparent 65%)`,
            opacity: 0.5,
          }}
        />
      </div>
    )
  }

  if (variant === 'edge-right') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* From RIGHT EDGE - cyan only gradient, constrained vertically */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 60% at 120% 50%, 
              rgba(0, 230, 228, 0.7) 0%, 
              rgba(0, 230, 228, 0.6) 15%, 
              rgba(0, 230, 228, 0.45) 30%,
              rgba(0, 230, 228, 0.3) 45%, 
              rgba(0, 230, 228, 0.15) 60%,
              transparent 80%)`,
            opacity: 0.6,
          }}
        />
        {/* Secondary cyan glow for depth, also constrained vertically */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 40% at 110% 50%, 
              rgba(0, 230, 228, 0.5) 0%, 
              rgba(0, 230, 228, 0.35) 25%, 
              rgba(0, 230, 228, 0.2) 45%, 
              transparent 65%)`,
            opacity: 0.5,
          }}
        />
      </div>
    )
  }

  if (variant === 'transition') {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', className)}>
        {/* Soft dispersed glow for seamless transitions */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 40% at 50% 50%, 
              rgba(0, 230, 228, 0.18) 0%, 
              rgba(0, 230, 228, 0.12) 25%,
              rgba(0, 230, 228, 0.06) 50%,
              transparent 70%)`,
            opacity: 0.75,
          }}
        />
        {/* Subtle side glows */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 40% at 0% 50%, 
                rgba(0, 230, 228, 0.1) 0%, 
                transparent 40%),
              radial-gradient(ellipse 90% 40% at 100% 50%, 
                rgba(0, 230, 228, 0.1) 0%, 
                transparent 40%)
            `,
            opacity: 0.55,
          }}
        />
      </div>
    )
  }

  // Default variant - from TOP CENTER (like vibrant orbs example)
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div 
        className="absolute inset-0"
                  style={{
            background: `radial-gradient(ellipse 80% 120% at 50% -20%, 
              rgba(0, 230, 228, 0.7) 0%, 
              rgba(0, 230, 228, 0.65) 15%, 
              rgba(0, 230, 228, 0.5) 25%, 
              rgba(0, 104, 255, 0.4) 35%,
              rgba(0, 39, 114, 0.5) 45%, 
              rgba(0, 20, 60, 0.7) 55%,
              #010102 70%)`,
            opacity: 0.8,
          }}
      />
    </div>
  )
} 