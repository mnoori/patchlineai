import { cn } from '../utils'

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