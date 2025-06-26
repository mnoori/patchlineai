/**
 * Brand Polish Components
 * Apple-quality animations and refinements
 */

import { cn } from '@/lib/utils'

interface SmoothRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function SmoothReveal({ children, className, delay = 0 }: SmoothRevealProps) {
  return (
    <div 
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-4',
        'duration-700 ease-out',
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards'
      }}
    >
      {children}
    </div>
  )
}

interface FloatingElementProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'normal' | 'strong'
}

export function FloatingElement({ 
  children, 
  className, 
  intensity = 'normal' 
}: FloatingElementProps) {
  const intensityClasses = {
    subtle: 'hover:translate-y-[-2px]',
    normal: 'hover:translate-y-[-4px]',
    strong: 'hover:translate-y-[-8px]'
  }

  return (
    <div 
      className={cn(
        'transition-all duration-500 ease-out',
        'hover:shadow-xl',
        intensityClasses[intensity],
        className
      )}
    >
      {children}
    </div>
  )
}

interface GlowTextProps {
  children: React.ReactNode
  className?: string
  color?: 'cyan' | 'blue' | 'white'
}

export function GlowText({ children, className, color = 'cyan' }: GlowTextProps) {
  const glowClasses = {
    cyan: 'text-brand-cyan drop-shadow-[0_0_10px_rgba(0,230,228,0.5)]',
    blue: 'text-brand-bright-blue drop-shadow-[0_0_10px_rgba(0,104,255,0.5)]',
    white: 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
  }

  return (
    <span className={cn(glowClasses[color], className)}>
      {children}
    </span>
  )
} 