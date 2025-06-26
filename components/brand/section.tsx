import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { GradientBackground } from './gradient-background'

const sectionVariants = cva(
  'relative w-full',
  {
    variants: {
      padding: {
        none: '',
        sm: 'py-8',
        md: 'py-12 md:py-16',
        lg: 'py-16 md:py-20',
        xl: 'py-20 md:py-24',
      },
      background: {
        none: '',
        default: 'bg-background',
        muted: 'bg-muted/5',
        gradient: '',
        dots: 'bg-dot-pattern',
      },
    },
    defaultVariants: {
      padding: 'md',
      background: 'none',
    },
  }
)

export interface SectionProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: 'section' | 'div' | 'article'
  container?: boolean
  gradientVariant?: 'hero' | 'section' | 'card' | 'subtle'
}

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ 
    className, 
    padding, 
    background, 
    as: Component = 'section',
    container = true,
    gradientVariant,
    children,
    ...props 
  }, ref) => {
    const content = container ? (
      <div className="container relative z-10">
        {children}
      </div>
    ) : children

    if (background === 'gradient' && gradientVariant) {
      return (
        <GradientBackground 
          variant={gradientVariant} 
          className={cn(sectionVariants({ padding }), className)}
        >
          {content}
        </GradientBackground>
      )
    }

    return (
      <Component
        ref={ref as any}
        className={cn(sectionVariants({ padding, background }), className)}
        {...props}
      >
        {content}
      </Component>
    )
  }
)

Section.displayName = 'Section'

export { Section, sectionVariants } 