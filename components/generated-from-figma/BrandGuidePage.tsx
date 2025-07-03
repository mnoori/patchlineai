'use client'
import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface BrandGuidePageProps {
  className?: string
  width?: number
}

export function BrandGuidePage({ className, width }: BrandGuidePageProps) {
  const originalWidth = 1704
  const originalHeight = 958
  const scale = width ? width / originalWidth : 1
  const height = originalHeight * scale
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch('/api/figma/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: 'PbzhWQIGJF68IPYo8Bheck',
            nodeIds: ['113:14'],
            format: 'png',
            scale: 2
          })
        })
        if (!res.ok) return
        const data = await res.json()
        const url = data.images?.['113:14']
        if (url) setLogoUrl(url)
      } catch (e) {
        console.error('Failed to fetch logo export', e)
      }
    }
    fetchLogo()
  }, [])

  return (
    <div 
      className={cn(
        "figma-page-container relative overflow-hidden rounded-lg",
        className
      )}
      style={{
        width: width || originalWidth,
        height: height,
        backgroundColor: '#121212'
      }}
    >
      {/* Background Image Layer (Layer 74) */}
      <div 
        className="absolute"
        style={{
          left: `${(-348 / originalWidth) * 100}%`,
          top: `${(-187 / originalHeight) * 100}%`,
          width: `${(2612 / originalWidth) * 100}%`,
          height: `${(1469 / originalHeight) * 100}%`,
        }}
      >
        <Image 
          src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/859b6797-d87c-4a9b-8acd-7beeb6c02464"
          alt="Brand Guide Background"
          fill
          style={{ objectFit: 'cover' }}
          className="opacity-80"
        />
      </div>

      {/* Logo/Vector Group - Let's try to export the actual vector */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: `${(756 / originalWidth) * 100}%`,
          top: `${(412 / originalHeight) * 100}%`,
          width: `${(192 / originalWidth) * 100}%`,
          height: `${(134 / originalHeight) * 100}%`,
        }}
      >
        {/* Try to show the actual vector as an image export */}
        {logoUrl ? (
          <Image src={logoUrl} alt="Patchline Logo" fill style={{objectFit:'contain'}} />
        ) : (
          <div className="flex items-center justify-center h-full text-white font-bold">PATCHLINE</div>
        )}
      </div>

      {/* Website Text */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: `${(706 / originalWidth) * 100}%`,
          top: `${(829 / originalHeight) * 100}%`,
          width: `${(292 / originalWidth) * 100}%`,
          height: `${(30 / originalHeight) * 100}%`,
        }}
      >
        <div className="text-white font-medium text-sm">
          www.patchline.ai
        </div>
      </div>

      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
    </div>
  )
}