"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This component ensures users always have the latest version
export function CacheBuster() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return
    
    // Get the current build ID from the page
    const getBuildId = () => {
      // Next.js includes build ID in the script tags
      const scripts = document.querySelectorAll('script[src*="/_next/static/"]')
      if (scripts.length > 0) {
        const src = scripts[0].getAttribute('src') || ''
        const match = src.match(/\/_next\/static\/([^\/]+)\//)
        return match ? match[1] : null
      }
      return null
    }
    
    const currentBuildId = getBuildId()
    const storedBuildId = localStorage.getItem('patchline-build-id')
    
    // If build IDs don't match, we have a new deployment
    if (currentBuildId && storedBuildId && currentBuildId !== storedBuildId) {
      console.log('🔄 New version detected, clearing cache...')
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
          })
        })
      }
      
      // Update stored build ID
      localStorage.setItem('patchline-build-id', currentBuildId)
      
      // Force a hard reload to get fresh content
      window.location.reload()
    } else if (currentBuildId && !storedBuildId) {
      // First visit, store the build ID
      localStorage.setItem('patchline-build-id', currentBuildId)
    }
    
    // Also check for navigation issues
    const checkNavigation = () => {
      // If we're on a page that shows old cached content, force refresh
      const currentPath = window.location.pathname
      const lastPath = sessionStorage.getItem('patchline-last-path')
      
      if (lastPath && lastPath === currentPath) {
        // User navigated to the same page, might be cached
        const navCount = parseInt(sessionStorage.getItem('patchline-nav-count') || '0')
        if (navCount > 2) {
          // Multiple navigations to same page, likely cached
          console.log('🔄 Detected potential cache issue, refreshing...')
          sessionStorage.removeItem('patchline-nav-count')
          window.location.reload()
        } else {
          sessionStorage.setItem('patchline-nav-count', (navCount + 1).toString())
        }
      } else {
        sessionStorage.setItem('patchline-last-path', currentPath)
        sessionStorage.setItem('patchline-nav-count', '0')
      }
    }
    
    // Check on route changes
    checkNavigation()
    
  }, [router])
  
  return null
} 