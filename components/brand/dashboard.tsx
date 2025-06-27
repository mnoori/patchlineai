import React from 'react'
import { cn } from '@/lib/utils'
import { COLORS } from '@/lib/brand'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Brand-Consistent Dashboard Components
 * Apple-quality design system for dashboard layouts
 */

// Dashboard Section Wrapper
interface DashboardSectionProps {
  children: React.ReactNode
  className?: string
  background?: 'default' | 'gradient' | 'glass'
}

export function DashboardSection({ children, className, background = 'default' }: DashboardSectionProps) {
  const backgroundClasses = {
    default: 'bg-background',
    gradient: 'bg-gradient-to-br from-brand-black to-brand-deep-blue/20',
    glass: 'bg-background/50 backdrop-blur-xl border border-white/10'
  }

  return (
    <div className={cn(backgroundClasses[background], 'rounded-xl p-6', className)}>
      {children}
    </div>
  )
}

// Brand-Consistent Dashboard Tabs
interface DashboardTabsProps {
  tabs: Array<{
    value: string
    label: string
    content: React.ReactNode
    badge?: string | number
  }>
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

export function DashboardTabs({ 
  tabs, 
  defaultValue, 
  onValueChange, 
  className,
  variant = 'default'
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value)

  const handleValueChange = (value: string) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  const tabVariants = {
    default: 'bg-background/50 border border-white/10',
    pills: 'bg-background/30 rounded-full',
    underline: 'bg-transparent border-b border-white/10'
  }

  const triggerVariants = {
    default: 'data-[state=active]:bg-brand-bright-blue data-[state=active]:text-white',
    pills: 'data-[state=active]:bg-brand-bright-blue data-[state=active]:text-white rounded-full',
    underline: 'data-[state=active]:border-b-2 data-[state=active]:border-brand-cyan data-[state=active]:text-brand-cyan rounded-none'
  }

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleValueChange} 
      className={cn('w-full', className)}
    >
      <div className="relative">
        <TabsList className={cn(tabVariants[variant], 'mb-6')}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'relative transition-all duration-200',
                triggerVariants[variant]
              )}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.badge && (
                  <Badge 
                    variant="secondary" 
                    className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Animated indicator for underline variant */}
        {variant === 'underline' && (
          <motion.div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-brand-cyan to-brand-bright-blue"
            layoutId="tab-indicator"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab.content}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

// Dashboard Card with Brand Styling
interface DashboardCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'gradient' | 'glow'
  hover?: boolean
}

export function DashboardCard({ 
  title, 
  description, 
  children, 
  className,
  variant = 'default',
  hover = true
}: DashboardCardProps) {
  const cardVariants = {
    default: 'bg-card border border-border',
    glass: 'bg-background/30 backdrop-blur-xl border border-white/10',
    gradient: 'bg-gradient-to-br from-brand-bright-blue/5 to-brand-cyan/5 border border-brand-cyan/20',
    glow: 'bg-card border border-brand-cyan/30 shadow-lg shadow-brand-cyan/10'
  }

  const hoverClasses = hover ? 'hover:shadow-lg hover:shadow-brand-cyan/20 hover:border-brand-cyan/50 transition-all duration-300' : ''

  return (
    <Card className={cn(cardVariants[variant], hoverClasses, className)}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="text-foreground font-heading">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Dashboard Header
interface DashboardHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function DashboardHeader({ title, description, children, className }: DashboardHeaderProps) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8', className)}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-lg">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}

// Dashboard Grid
interface DashboardGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DashboardGrid({ children, cols = 3, gap = 'md', className }: DashboardGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-12'
  }

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  }

  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

// Dashboard Stat Card
interface DashboardStatProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
  }
  icon?: React.ReactNode
  className?: string
}

export function DashboardStat({ title, value, change, icon, className }: DashboardStatProps) {
  return (
    <DashboardCard variant="glass" className={className}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {value}
          </p>
          {change && (
            <p className={cn(
              'text-xs flex items-center gap-1',
              change.value > 0 ? 'text-green-400' : 'text-red-400'
            )}>
              <span>{change.value > 0 ? '↗' : '↘'}</span>
              {Math.abs(change.value)}% {change.period}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-brand-bright-blue/10 rounded-lg text-brand-bright-blue">
            {icon}
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

// Dashboard Alert/Notification
interface DashboardAlertProps {
  title: string
  description?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  className?: string
  children?: React.ReactNode
}

export function DashboardAlert({ title, description, variant = 'info', className, children }: DashboardAlertProps) {
  const variantClasses = {
    info: 'border-brand-bright-blue/30 bg-brand-bright-blue/5 text-brand-bright-blue',
    success: 'border-green-500/30 bg-green-500/5 text-green-400',
    warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    error: 'border-red-500/30 bg-red-500/5 text-red-400'
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 space-y-2',
      variantClasses[variant],
      className
    )}>
      <h4 className="font-semibold">{title}</h4>
      {description && (
        <p className="text-sm opacity-80">{description}</p>
      )}
      {children}
    </div>
  )
} 