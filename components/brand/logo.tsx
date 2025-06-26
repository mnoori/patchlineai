import Image from 'next/image'
import { cn } from '@/lib/utils'
import { LOGO, BRAND } from '@/lib/brand'

interface LogoProps {
  variant?: 'primary' | 'transparent' | 'icon' | 'white' | 'black' | 'color'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  background?: 'gradient' | 'black' | 'neutral' | 'image' | 'transparent'
}

const sizes = {
  sm: { image: 24, text: 'text-lg' },
  md: { image: 32, text: 'text-xl' },
  lg: { image: 40, text: 'text-2xl' },
  xl: { image: 48, text: 'text-3xl' },
}

export function Logo({ 
  variant = 'primary', 
  size = 'md', 
  className,
  showText = false,
  background = 'transparent'
}: LogoProps) {
  const sizeConfig = sizes[size]
  
  // Determine logo source based on variant
  const logoSrc = variant === 'icon' ? LOGO.icon : 
                  variant === 'transparent' ? LOGO.transparent : 
                  LOGO.primary
  
  // Determine text and logo color based on background
  const getLogoStyle = () => {
    if (background === 'gradient' || background === 'black' || background === 'image') {
      return {
        filter: 'brightness(0) invert(1)', // Makes logo white
        textColor: 'text-white'
      }
    } else if (background === 'neutral') {
      return {
        filter: variant === 'color' ? 'none' : '',
        textColor: variant === 'color' ? 'text-brand-black' : 'text-brand-black'
      }
    }
    return {
      filter: 'none',
      textColor: 'text-foreground'
    }
  }
  
  const { filter, textColor } = getLogoStyle()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image 
        src={logoSrc} 
        alt={`${BRAND.fullName} Logo`} 
        width={sizeConfig.image} 
        height={sizeConfig.image} 
        className="object-contain"
        style={{ filter }}
        priority
      />
      {showText && (
        <span className={cn('font-heading font-bold', sizeConfig.text, textColor)}>
          {BRAND.name}
          <sup className="text-xs font-medium ml-0.5">AI</sup>
        </span>
      )}
    </div>
  )
} 