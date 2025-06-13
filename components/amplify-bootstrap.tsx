'use client'

import { useEffect } from 'react'

export function AmplifyBootstrap() {
  // Load Amplify configuration only in the browser after hydration
  useEffect(() => {
    // Dynamic import so it is excluded from the initial JS bundle & SSR
    import('@/lib/amplify-config').catch((err) => {
      console.error('[Amplify] Failed to initialise:', err)
    })
  }, [])

  return null
} 