import React from 'react'
import { cn } from '@/lib/utils'
import { TYPOGRAPHY } from './constants'

/**
 * Typography system for consistent text styling across the app
 * Based on Patchline AI brand guidelines
 */

// Heading styles - single source of truth
export const headingStyles = {
  h1: cn(
    'font-normal tracking-tight text-white',
    'text-3xl md:text-4xl lg:text-5xl'
  ),
  h2: cn(
    'font-semibold text-white',
    'text-3xl md:text-4xl'
  ),
  h3: cn(
    'font-semibold text-white',
    'text-xl md:text-2xl'
  ),
  h4: cn(
    'font-semibold text-white',
    'text-lg md:text-xl'
  ),
  h5: cn(
    'font-semibold text-white',
    'text-base md:text-lg'
  ),
} as const

// Body text styles
export const textStyles = {
  body: cn(
    'text-base text-muted-foreground'
  ),
  bodyLarge: cn(
    'text-lg text-muted-foreground'
  ),
  bodySmall: cn(
    'text-sm text-muted-foreground'
  ),
  lead: cn(
    'text-lg md:text-xl text-muted-foreground'
  ),
} as const

// Utility function to get heading class
export function getHeadingClass(level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5', className?: string) {
  return cn(headingStyles[level], className)
}

// Utility function to get text class
export function getTextClass(variant: keyof typeof textStyles, className?: string) {
  return cn(textStyles[variant], className)
}

// Typography component props
export interface TypographyProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'body' | 'bodyLarge' | 'bodySmall' | 'lead'
  className?: string
  children: React.ReactNode
}

// Typography component for consistent text rendering
export function Typography({ 
  as = 'p', 
  variant = 'body', 
  className, 
  children 
}: TypographyProps) {
  const Component = as
  const isHeading = variant.startsWith('h')
  const styles = isHeading ? headingStyles[variant as keyof typeof headingStyles] : textStyles[variant as keyof typeof textStyles]
  
  return (
    <Component className={cn(styles, className)}>
      {children}
    </Component>
  )
} 