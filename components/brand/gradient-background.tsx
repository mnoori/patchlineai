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
    hero: createGradient(135, [
      COLORS.gradient.end,
      COLORS.primary.deepBlue,
      COLORS.primary.brightBlue,
      COLORS.primary.cyan
    ]),
    section: createGradient(180, [
      'rgba(1, 1, 2, 0.9)',
      'rgba(0, 39, 114, 0.5)',
      'rgba(0, 104, 255, 0.2)'
    ]),
    card: createGradient(45, [
      'rgba(0, 39, 114, 0.2)',
      'rgba(0, 104, 255, 0.1)',
      'rgba(0, 230, 226, 0.1)'
    ]),
    subtle: createGradient(90, [
      'rgba(9, 0, 48, 0.5)',
      'rgba(42, 9, 204, 0.2)',
      'rgba(112, 247, 234, 0.1)'
    ])
  }

  return (
    <div 
      className={cn('relative', className)}
      style={{ 
        background: gradients[variant],
        minHeight: variant === 'hero' ? '100vh' : undefined
      }}
    >
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
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
export function GradientOrbs({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Large cyan orb */}
      <div 
        className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${COLORS.primary.cyan} 0%, transparent 70%)`,
          filter: 'blur(100px)',
          animation: 'float 20s ease-in-out infinite'
        }}
      />
      
      {/* Medium blue orb */}
      <div 
        className="absolute top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${COLORS.primary.brightBlue} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          animation: 'float 15s ease-in-out infinite reverse'
        }}
      />
      
      {/* Small gradient orb */}
      <div 
        className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full opacity-25"
        style={{
          background: `radial-gradient(circle, ${COLORS.gradient.middle} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'float 25s ease-in-out infinite'
        }}
      />
    </div>
  )
} 