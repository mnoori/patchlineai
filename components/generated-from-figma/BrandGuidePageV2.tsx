// Static component - all assets pre-loaded
// Generated for optimal performance

'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface BrandGuidePageV2Props {
  className?: string
  width?: number
  variant?: 'cover' | 'contain' | 'original'
}

export function BrandGuidePageV2({ 
  className, 
  width,
  variant = 'original' 
}: BrandGuidePageV2Props) {
  const originalWidth = 1704
  const originalHeight = 958
  const scale = width ? width / originalWidth : 1
  const height = originalHeight * scale
  
  // Responsive container
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState<number | undefined>(width)
  
  React.useEffect(() => {
    if (!width) {
      const updateWidth = () => {
        if (containerRef.current) {
          const newWidth = containerRef.current.offsetWidth
          setContainerWidth(newWidth)
        }
      }
      
      updateWidth()
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
  }, [width])
  
  const actualWidth = containerWidth || originalWidth
  const actualScale = actualWidth / originalWidth
  const actualHeight = originalHeight * actualScale

  // Background styles based on variant
  const getBackgroundStyle = () => {
    const baseStyle = {
      backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/859b6797-d87c-4a9b-8acd-7beeb6c02464)',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: 0.8
    }
    
    switch (variant) {
      case 'cover':
        return { ...baseStyle, backgroundSize: 'cover' }
      case 'contain':
        return { ...baseStyle, backgroundSize: 'contain' }
      case 'original':
      default:
        return { 
          ...baseStyle, 
          backgroundSize: `${originalWidth}px ${originalHeight}px`,
          backgroundPosition: 'center center'
        }
    }
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "figma-page-container relative overflow-hidden",
        className
      )}
      style={{
        width: actualWidth,
        height: actualHeight,
        backgroundColor: '#121212'
      }}
    >
      {/* Background Layer with proper sizing */}
      <div 
        className="absolute inset-0"
        style={getBackgroundStyle()}
      />
      
      {/* Content Container - maintains original proportions */}
      <div 
        className="absolute inset-0"
        style={{
          width: originalWidth,
          height: originalHeight,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${actualScale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Logo - positioned exactly as in Figma */}
        <div 
          className="absolute"
          style={{
            left: 756,
            top: 412,
            width: 192,
            height: 134,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Image 
            src="/Brandmark/Brandmark Light.svg" 
            alt="Patchline Logo" 
            width={192}
            height={134}
            style={{ objectFit: 'contain' }} 
            priority
          />
        </div>

        {/* Website Text - positioned exactly as in Figma */}
        <div 
          className="absolute"
          style={{
            left: 852, // Centered based on original design
            top: 829,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-white font-medium text-[18px] tracking-[0.05em]">
            www.patchline.ai
          </div>
        </div>
      </div>

      {/* Optional gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
    </div>
  )
}

export default BrandGuidePageV2 