import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  'rounded-2xl transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-card border border-border',
        glass: 'glass-effect',
        gradient: 'gradient-border card-gradient',
        outlined: 'border-2 border-brand-cyan/30 bg-transparent',
        elevated: 'bg-card shadow-xl hover:shadow-2xl',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1',
        glow: 'hover:border-brand-cyan/50 hover:shadow-[0_0_20px_rgba(0,230,226,0.2)]',
        brighten: 'hover:bg-card/80',
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
    },
  }
)

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, children, ...props }, ref) => {
    // Add extra padding for gradient variant to account for border spacing
    const effectivePadding = variant === 'gradient' && padding !== 'none' 
      ? padding === 'sm' ? 'md' 
      : padding === 'md' ? 'lg'
      : padding === 'lg' ? 'xl'
      : padding
      : padding;
      
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding: effectivePadding, hover }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card subcomponents
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-1.5', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-6', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-6', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants } 