'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
  sizes,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Generate sizes if not provided
  const imageSizes = sizes || (fill ? '100vw' : undefined)

  // Fallback for error state
  if (error) {
    return (
      <div 
        className={cn(
          'bg-muted flex items-center justify-center',
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={imageSizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        )}
        onLoad={() => {
          setIsLoading(false)
          onLoad?.()
        }}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}

// Export a static version for hero images
export function HeroImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} priority={true} quality={90} />
}

// Export a lazy version for below-the-fold images
export function LazyImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} priority={false} quality={75} />
} 