import { cn } from '@/lib/utils'
import { Card } from './card'

interface FeatureCardProps {
  title: string
  description: string
  className?: string
  glowColor?: 'cyan' | 'blue' | 'gradient'
}

export function FeatureCard({ 
  title, 
  description, 
  className,
  glowColor = 'cyan'
}: FeatureCardProps) {
  const glowStyles = {
    cyan: 'hover:border-brand-cyan/50 hover:shadow-[0_0_30px_rgba(0,230,226,0.3)]',
    blue: 'hover:border-brand-bright-blue/50 hover:shadow-[0_0_30px_rgba(0,104,255,0.3)]',
    gradient: 'hover:shadow-[0_0_30px_rgba(112,247,234,0.2)]'
  }

  return (
    <Card 
      variant="outlined" 
      padding="lg"
      className={cn(
        'bg-transparent backdrop-blur-sm',
        'border-brand-cyan/20',
        'transition-all duration-500',
        glowStyles[glowColor],
        className
      )}
    >
      <h3 className="text-xl font-bold mb-3 text-brand-cyan">
        {title}
      </h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </Card>
  )
} 