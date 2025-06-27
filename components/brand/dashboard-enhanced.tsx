import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Card as BaseCard } from '@/components/ui/card'
import { Button as BaseButton } from '@/components/ui/button'
import { COLORS } from '@/lib/brand'

/**
 * Enhanced Dashboard Components
 * Apple-quality design with dramatic brand application
 */

// Enhanced Card with gradient options
interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'glow'
  hover?: 'none' | 'lift' | 'glow' | 'scale'
}

export function EnhancedCard({ 
  children, 
  className, 
  variant = 'default',
  hover = 'lift',
  ...props 
}: EnhancedCardProps) {
  const variants = {
    default: 'bg-card/50 backdrop-blur-xl border-brand-cyan/10',
    gradient: 'bg-gradient-to-br from-brand-black/90 via-brand-black/80 to-brand-purple/20 backdrop-blur-xl border-brand-cyan/20',
    glass: 'bg-white/5 backdrop-blur-xl border-white/10',
    glow: 'bg-brand-black/90 backdrop-blur-xl border-brand-cyan/30 shadow-lg shadow-brand-cyan/10'
  }
  
  const hoverEffects = {
    none: '',
    lift: 'hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-cyan/20',
    glow: 'hover:shadow-2xl hover:shadow-brand-cyan/30 hover:border-brand-cyan/50',
    scale: 'hover:scale-[1.02]'
  }
  
  return (
    <motion.div
      whileHover={hover !== 'none' ? { y: hover === 'lift' ? -4 : 0 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <BaseCard 
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          variants[variant],
          hoverEffects[hover],
          className
        )}
        {...props}
      >
        {/* Gradient overlay for extra polish */}
        {variant === 'gradient' && (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-bright-blue/5 pointer-events-none" />
        )}
        {children}
      </BaseCard>
    </motion.div>
  )
}

// Time Capsule Card Enhancement
export function TimeCapsuleCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <EnhancedCard 
      variant="gradient" 
      hover="glow"
      className={cn(
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-brand-cyan/10 before:via-transparent before:to-brand-bright-blue/10",
        "after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-brand-cyan after:to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </EnhancedCard>
  )
}

// Enhanced Button with brand styling
interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'gradient' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function EnhancedButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  ...props 
}: EnhancedButtonProps) {
  const variants = {
    default: 'bg-brand-cyan text-black hover:bg-brand-cyan/90 font-bold',
    gradient: 'bg-gradient-to-r from-brand-cyan to-brand-bright-blue text-white hover:shadow-lg hover:shadow-brand-cyan/30 font-bold',
    outline: 'border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan/50',
    ghost: 'text-brand-cyan hover:bg-brand-cyan/10'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <BaseButton
      className={cn(
        'rounded-lg transition-all duration-200 font-medium transform hover:scale-[1.02] active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </BaseButton>
  )
}

// Dashboard Stats Card
interface DashboardStatProps {
  label: string
  value: string | number
  change?: number
  icon?: React.ReactNode
}

export function DashboardStat({ label, value, change, icon }: DashboardStatProps) {
  return (
    <EnhancedCard variant="gradient" hover="glow" className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-white to-brand-cyan bg-clip-text text-transparent">
            {value}
          </p>
          {change !== undefined && (
            <p className={cn(
              "text-sm font-medium",
              change >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {change >= 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-brand-cyan/10 text-brand-cyan">
            {icon}
          </div>
        )}
      </div>
    </EnhancedCard>
  )
}

// Section Header with brand styling
interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-brand-cyan bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// Activity Item with brand styling
interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  agent: string
  action?: {
    label: string
    onClick?: () => void
  }
}

export function ActivityItem({ icon, title, description, time, agent, action }: ActivityItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-start gap-4 p-4 rounded-lg hover:bg-brand-cyan/5 transition-all duration-200"
    >
      <div className="p-3 rounded-lg bg-gradient-to-br from-brand-cyan/20 to-brand-bright-blue/10 text-brand-cyan">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="font-bold text-white group-hover:text-brand-cyan transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-brand-cyan/70 font-medium">{agent}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
          {action && (
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="ml-auto"
            >
              {action.label}
            </EnhancedButton>
          )}
        </div>
      </div>
    </motion.div>
  )
} 