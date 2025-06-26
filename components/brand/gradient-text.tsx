import { cn } from '@/lib/utils'
import { createGradient, COLORS } from '@/lib/brand'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  gradient?: 'brand' | 'cyan' | 'blue' | 'custom'
  customColors?: string[]
  direction?: 'to right' | 'to left' | 'to bottom' | 'to top' | number
}

export function GradientText({ 
  children, 
  className,
  gradient = 'brand',
  customColors,
  direction = 'to right'
}: GradientTextProps) {
  let gradientStyle: string

  switch (gradient) {
    case 'cyan':
      gradientStyle = createGradient(direction, [COLORS.primary.cyan, COLORS.primary.brightBlue])
      break
    case 'blue':
      gradientStyle = createGradient(direction, [COLORS.primary.brightBlue, COLORS.primary.deepBlue])
      break
    case 'custom':
      gradientStyle = customColors ? createGradient(direction, customColors) : ''
      break
    case 'brand':
    default:
      gradientStyle = createGradient(direction, [COLORS.gradient.start, COLORS.gradient.middle])
  }

  return (
    <span 
      className={cn('bg-clip-text text-transparent', className)}
      style={{ backgroundImage: gradientStyle }}
    >
      {children}
    </span>
  )
} 