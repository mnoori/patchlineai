"use client"

import { useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { prewarmRoutes } from '@/lib/route-prewarming'

export function RoutePrewarmer() {
  const { userId } = useCurrentUser()
  
  useEffect(() => {
    if (userId) {
      // Start pre-warming after a short delay to not block initial render
      const timer = setTimeout(() => {
        prewarmRoutes(userId)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [userId])
  
  return null
} 