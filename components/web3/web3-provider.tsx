'use client'

import { useEffect, useState } from 'react'
import { useWeb3Store } from '@/lib/web3-store'

/*
 Web3Provider – wraps Dynamic + Solana Wallet Adapter providers only when
 the user has enabled Web3 in settings AND the environment flag is enabled.
 This prevents unnecessary bundle weight for users who never touch crypto features.
*/

// Check environment flag at module level
const isWeb3EnabledInEnv = process.env.NEXT_PUBLIC_ENABLE_WEB3 === 'true'

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { settings } = useWeb3Store()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // If Web3 is disabled in environment, always render children without Web3
  if (!isWeb3EnabledInEnv) {
    return <>{children}</>
  }

  // SSR safety - render children without Web3 until mounted
  if (!mounted || !settings.enabled) {
    return <>{children}</>
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
    console.warn('Dynamic Environment ID is not set. Web3 features will work with limited functionality.')
    return <>{children}</>
  }

  // Client-side only Web3 provider wrapper
  return <Web3ProviderInner>{children}</Web3ProviderInner>
}

function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  const [providers, setProviders] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function loadProviders() {
      try {
        console.log('Loading Web3 providers...')
        
        // Try to load Dynamic SDK first
        const dynamicModule = await import('@dynamic-labs/sdk-react').catch((err) => {
          console.warn('Dynamic SDK not available:', err.message)
          return null
        })
        
        if (!dynamicModule) {
          console.warn('Dynamic SDK not available, skipping Web3 initialization')
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        if (!isMounted) return

        const { DynamicContextProvider } = dynamicModule

        // For now, just use basic Dynamic setup without Solana
        // This avoids the missing Solana dependencies issue
        console.log('Setting up basic Dynamic provider (Solana disabled)')
        setProviders({
          DynamicContextProvider,
          hasSolana: false
        })

      } catch (error) {
        console.error('Failed to load Web3 providers:', error)
        if (isMounted) {
          setError('Failed to load Web3 providers')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Add a small delay to prevent blocking the main thread
    const timeoutId = setTimeout(loadProviders, 100)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  if (error) {
    console.error('Web3Provider error:', error)
    return <>{children}</>
  }

  if (loading || !providers) {
    return <>{children}</>
  }

  const { DynamicContextProvider } = providers

  // Basic Dynamic setup without Solana (for now)
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        eventsCallbacks: {
          onAuthSuccess: (args: any) => {
            console.log('Dynamic auth success:', args)
          },
          onAuthFailure: (error: any) => {
            console.error('Dynamic auth failure:', error)
          }
        }
      }}
    >
      {children}
    </DynamicContextProvider>
  )
} 