'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface BrandGuidePageProps {
  className?: string
  width?: number
}

export function BrandGuidePage({ className, width }: BrandGuidePageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const actualWidth = width || dimensions.width
  const actualHeight = dimensions.height

  // Brighter Figma-accurate gradient - more cyan visibility
  const figmaGradient = `
    linear-gradient(
      135deg,
      #010102 0%,
      #003A45 20%,
      #00E6E4 40%,
      #00B8B5 60%,
      #002A35 80%,
      #010102 100%
    )
  `

  return (
    <div 
      ref={containerRef}
      className={cn(
        "figma-page-container relative overflow-hidden",
        className
      )}
      style={{
        width: actualWidth || '100%',
        height: actualHeight || '100%',
        backgroundColor: '#010102'
      }}
    >
      {/* Brighter CSS Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: figmaGradient,
          opacity: 1
        }}
      />

      {/* Logo - Centered */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '140px',
        }}
      >
        <Image 
          src="/Brandmark/Brandmark Light.svg" 
          alt="Patchline Logo" 
          width={200}
          height={140}
          style={{objectFit:'contain'}} 
          priority
        />
      </div>

      {/* Website Text */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: '50%',
          bottom: '15%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '40px',
        }}
      >
        <div className="text-white font-medium text-lg tracking-[0.2em]">
          www.patchline.ai
        </div>
      </div>

      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none" />
    </div>
  )
}