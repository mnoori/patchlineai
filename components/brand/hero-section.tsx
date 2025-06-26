import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { GradientBackground, GradientOrbs } from './gradient-background'
import { FeatureCard } from './feature-card'

interface HeroSectionProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  features?: Array<{
    title: string
    description: string
  }>
  className?: string
  showLogo?: boolean
  logoSize?: 'sm' | 'md' | 'lg' | 'xl'
}

export function HeroSection({ 
  title,
  subtitle,
  features,
  className,
  showLogo = true,
  logoSize = 'xl'
}: HeroSectionProps) {
  return (
    <GradientBackground variant="hero" className={cn('flex items-center justify-center', className)}>
      <GradientOrbs />
      
      <div className="container relative z-10 py-20">
        <div className="text-center space-y-8">
          {/* Logo */}
          {showLogo && (
            <div className="flex justify-center mb-12">
              <Logo size={logoSize} showText background="gradient" />
            </div>
          )}
          
          {/* Title */}
          {title && (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              {title}
            </h1>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
          
          {/* Feature Cards */}
          {features && features.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  glowColor={index === 0 ? 'cyan' : index === 1 ? 'blue' : 'gradient'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </GradientBackground>
  )
} 