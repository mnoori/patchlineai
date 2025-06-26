"use client"

import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/brand"

interface PageGradientProps {
  variant?: 'hero' | 'section' | 'subtle' | 'vibrant'
  className?: string
  children?: React.ReactNode
}

export function PageGradient({ variant = 'hero', className, children }: PageGradientProps) {
  const gradients = {
    hero: `radial-gradient(ellipse 80% 80% at 50% -20%, ${COLORS.gradient.darkMiddle}33, transparent), radial-gradient(ellipse 60% 50% at 80% 20%, ${COLORS.primary.deepBlue}22, transparent), radial-gradient(ellipse 70% 70% at 20% 30%, ${COLORS.gradient.darkStart}33, transparent)`,
    section: `radial-gradient(ellipse 100% 50% at 50% 0%, ${COLORS.gradient.darkMiddle}11, transparent), linear-gradient(180deg, transparent 0%, ${COLORS.ui.background}99 100%)`,
    subtle: `radial-gradient(ellipse 150% 100% at 50% -50%, ${COLORS.primary.deepBlue}11, transparent)`,
    vibrant: `radial-gradient(ellipse 80% 60% at 70% -10%, ${COLORS.primary.cyan}11, transparent), radial-gradient(ellipse 60% 40% at 30% 10%, ${COLORS.primary.brightBlue}08, transparent)`
  }

  return (
    <div 
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ background: gradients[variant] }}
    >
      {children}
    </div>
  )
}

// Animated gradient orbs for hero sections
export function AnimatedGradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${COLORS.primary.cyan}44, transparent)`,
          filter: 'blur(40px)',
          animation: 'float 20s ease-in-out infinite'
        }}
      />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
        style={{
          background: `radial-gradient(circle, ${COLORS.primary.brightBlue}44, transparent)`,
          filter: 'blur(60px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }}
      />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, ${COLORS.gradient.middle}44, transparent)`,
          filter: 'blur(50px)',
          animation: 'pulse 15s ease-in-out infinite',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  )
}

// Mesh gradient for sections
export function MeshGradient({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0", className)}>
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 27% 37%, ${COLORS.gradient.darkMiddle} 0px, transparent 50%),
            radial-gradient(at 97% 21%, ${COLORS.primary.deepBlue} 0px, transparent 50%),
            radial-gradient(at 52% 99%, ${COLORS.gradient.darkStart} 0px, transparent 50%),
            radial-gradient(at 10% 29%, ${COLORS.primary.deepBlue} 0px, transparent 50%),
            radial-gradient(at 97% 96%, ${COLORS.gradient.darkMiddle} 0px, transparent 50%),
            radial-gradient(at 33% 50%, ${COLORS.primary.cyan}11 0px, transparent 50%),
            radial-gradient(at 79% 53%, ${COLORS.primary.brightBlue}08 0px, transparent 50%)
          `,
          filter: 'blur(100px) saturate(150%)',
        }}
      />
    </div>
  )
} 