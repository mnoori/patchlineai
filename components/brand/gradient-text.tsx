import { cn } from '@/lib/utils'
import { createGradient } from '@/lib/brand'

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
      gradientStyle = createGradient(direction, ['var(--brand-cyan)', 'var(--brand-bright-blue)'])
      break
    case 'blue':
      gradientStyle = createGradient(direction, ['var(--brand-bright-blue)', 'var(--brand-deep-blue)'])
      break
    case 'custom':
      gradientStyle = customColors ? createGradient(direction, customColors) : ''
      break
    case 'brand':
    default:
      gradientStyle = createGradient(direction, ['var(--brand-gradient-start)', 'var(--brand-gradient-middle)'])
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