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
    cyan: 'hover:border-brand-cyan/60 hover:shadow-[0_0_40px_rgba(0,230,228,0.4)]',
    blue: 'hover:border-brand-bright-blue/60 hover:shadow-[0_0_40px_rgba(0,104,255,0.4)]',
    gradient: 'hover:shadow-[0_0_40px_rgba(0,230,228,0.3)]'
  }

  return (
    <Card 
      variant="outlined" 
      padding="xl"
      className={cn(
        'bg-black/20 backdrop-blur-md border-2',
        'border-brand-cyan/30',
        'transition-all duration-700 ease-out',
        'hover:bg-black/30',
        'hover:scale-105',
        'group',
        glowStyles[glowColor],
        className
      )}
    >
      <h3 className="text-xl font-bold mb-4 text-brand-cyan transition-colors duration-300">
        {title}
      </h3>
      <p className="text-white/80 transition-colors duration-300 leading-relaxed">
        {description}
      </p>
    </Card>
  )
} 