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
    <GradientBackground variant="hero" className={cn('min-h-[100vh] flex items-center justify-center', className)}>
      <GradientOrbs />
      
      <div className="container relative z-10 px-6 py-20">
        <div className="text-center space-y-12">
          {/* Logo */}
          {showLogo && (
            <div className="flex justify-center">
              <Logo size={logoSize} showText background="gradient" />
            </div>
          )}
          
          {/* Title */}
          {title && (
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
              {title}
            </h1>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          
          {/* Feature Cards */}
          {features && features.length > 0 && (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  glowColor="cyan"
                  className="backdrop-blur-md"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </GradientBackground>
  )
} 