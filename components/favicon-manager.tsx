"use client"

import { useEffect } from 'react'

export function FaviconManager() {
  useEffect(() => {
    const updateFavicon = () => {
      // Check if user prefers dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      // Remove all existing favicon links to avoid conflicts
      const existingIcons = document.querySelectorAll('link[rel*="icon"]')
      existingIcons.forEach(icon => icon.remove())
      
      // Create new favicon link
      const favicon = document.createElement('link')
      favicon.rel = 'icon'
      favicon.type = 'image/svg+xml'
      
      // Set the appropriate favicon based on user's preference
      if (prefersDark) {
        // Dark mode browser - use light brandmark (white logo)
        favicon.href = '/Brandmark/Brandmark Light.svg'
      } else {
        // Light mode browser - use dark brandmark (dark logo)
        favicon.href = '/Brandmark/Brandmark Dark.svg'
      }
      
      document.head.appendChild(favicon)
      
      // Also add a PNG fallback for better compatibility
      const pngFavicon = document.createElement('link')
      pngFavicon.rel = 'apple-touch-icon'
      pngFavicon.href = prefersDark 
        ? '/Brandmark/Brandmark Light.png' 
        : '/Brandmark/Brandmark Dark.png'
      document.head.appendChild(pngFavicon)
    }

    // Update favicon on initial load
    updateFavicon()

    // Listen for changes in color scheme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => updateFavicon()
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}