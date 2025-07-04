import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'

interface LogoProps {
  variant?: 'primary' | 'white' | 'black' | 'color'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  background?: 'gradient' | 'black' | 'neutral' | 'image' | 'transparent'
}

const sizes = {
  sm: { width: 24, height: 24, text: 'text-lg' },
  md: { width: 32, height: 32, text: 'text-xl' },
  lg: { width: 40, height: 40, text: 'text-2xl' },
  xl: { width: 48, height: 48, text: 'text-3xl' },
}

// Figma SVG Logo Component
function PatchlineLogo({ color = 'white', width = 32, height = 32, className }: { 
  color?: 'white' | 'black' | 'cyan' 
  width?: number 
  height?: number 
  className?: string 
}) {
  const fillColor = color === 'white' ? '#FFFFFF' : 
                   color === 'black' ? '#010103' : 
                   color === 'cyan' ? '#00E6E4' : '#FFFFFF'
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 248 248" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M91.5685 101.724C91.8001 95.4905 92.8805 89.2959 92.7262 83.0624C92.1473 60.6346 73.0597 40.2457 50.9237 38.3756C28.7877 36.5055 6.6131 53.3881 2.30423 75.3873C-2.00464 97.3865 12.1181 121.516 33.2766 128.333C42.9233 131.437 53.3161 131.242 63.1686 133.593C84.7901 138.749 102.746 157.125 107.556 179.02C108.894 185.124 109.331 191.552 112.148 197.123C119.094 210.85 139.108 213.993 149.359 202.448C152.896 198.461 155.34 193.643 158.337 189.24C170.517 171.306 192.538 160.709 214.005 162.436C219.484 162.878 225.028 164.06 230.404 162.969C242.109 160.592 249.582 145.969 244.733 134.957C239.884 123.944 224.114 119.775 214.532 126.97C209.773 130.541 206.866 136.009 203.368 140.84C187.933 162.202 158.157 171.696 133.371 163.137C108.585 154.579 90.7839 128.671 91.5428 102.243C91.5428 102.075 91.5428 101.906 91.5557 101.724H91.5685Z" 
        fill={fillColor}
      />
    </svg>
  )
}

export function Logo({ 
  variant = 'primary', 
  size = 'md', 
  className,
  showText = false,
  background = 'transparent'
}: LogoProps) {
  const sizeConfig = sizes[size]
  
  // Determine logo color based on variant and background
  const getLogoColor = () => {
    if (variant === 'white' || background === 'gradient' || background === 'black' || background === 'image') {
      return 'white'
    } else if (variant === 'black') {
      return 'black'
    } else if (variant === 'color') {
      return 'cyan'
    }
    // Default based on background
    return background === 'neutral' ? 'black' : 'white'
  }
  
  const logoColor = getLogoColor()
  const textColor = logoColor === 'white' ? 'text-white' : 
                   logoColor === 'black' ? 'text-black' : 
                   'text-brand-cyan'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <PatchlineLogo 
        color={logoColor}
        width={sizeConfig.width}
        height={sizeConfig.height}
      />
      {showText && (
        <span className={cn('font-heading font-normal', sizeConfig.text, textColor)}>
          {BRAND.name}
          <sup className="text-xs font-normal ml-0.5">AI</sup>
        </span>
      )}
    </div>
  )
} 