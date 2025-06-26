'use client'

import { useEffect, useState } from 'react'
import { useWeb3Store } from '@/lib/web3-store'

/*
 Web3Provider – Web3 portal UI is enabled but Dynamic.xyz wallet integration 
 is disabled for production to avoid loading performance issues.
 The portal shows Web3 features but wallet connections are temporarily disabled.
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
  if (!mounted) {
    return <>{children}</>
  }

  // PRODUCTION: Dynamic.xyz wallet integration is disabled for performance
  // The Web3 portal UI is available but wallet connections are temporarily disabled
  console.log('Web3 portal enabled, but wallet integrations disabled for production performance')
  return <>{children}</>

  // COMMENTED OUT: Dynamic.xyz integration disabled for production
  // This was causing heavy loading on every page due to Dynamic.xyz SDK
  // Will be re-enabled in future when we optimize the loading strategy
  
  // // Check for required environment variables
  // if (!process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
  //   console.warn('Dynamic Environment ID is not set. Web3 features will work with limited functionality.')
  //   return <>{children}</>
  // }

  // // Client-side only Web3 provider wrapper
  // return <Web3ProviderInner>{children}</Web3ProviderInner>
}

// COMMENTED OUT: Dynamic.xyz provider disabled for production performance
// function Web3ProviderInner({ children }: { children: React.ReactNode }) {
//   const [providers, setProviders] = useState<any>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [loading, setLoading] = useState(true)
//   
//   useEffect(() => {
//     let isMounted = true
//     
//     async function loadProviders() {
//       try {
//         console.log('Loading Web3 providers...')
//         
//         // Try to load Dynamic SDK first
//         const dynamicModule = await import('@dynamic-labs/sdk-react').catch((err) => {
//           console.warn('Dynamic SDK not available:', err.message)
//           return null
//         })
//         
//         if (!dynamicModule) {
//           console.warn('Dynamic SDK not available, skipping Web3 initialization')
//           if (isMounted) {
//             setLoading(false)
//           }
//           return
//         }

//         if (!isMounted) return

//         const { DynamicContextProvider } = dynamicModule

//         // For now, just use basic Dynamic setup without Solana
//         // This avoids the missing Solana dependencies issue
//         console.log('Setting up basic Dynamic provider (Solana disabled)')
//         setProviders({
//           DynamicContextProvider,
//           hasSolana: false
//         })

//       } catch (error) {
//         console.error('Failed to load Web3 providers:', error)
//         if (isMounted) {
//           setError('Failed to load Web3 providers')
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false)
//         }
//       }
//     }

//     // Add a small delay to prevent blocking the main thread
//     const timeoutId = setTimeout(loadProviders, 100)

//     return () => {
//       isMounted = false
//       clearTimeout(timeoutId)
//     }
//   }, [])

//   if (error) {
//     console.error('Web3Provider error:', error)
//     return <>{children}</>
//   }

//   if (loading || !providers) {
//     return <>{children}</>
//   }

//   const { DynamicContextProvider } = providers

//   // Basic Dynamic setup without Solana (for now)
//   return (
//     <DynamicContextProvider
//       settings={{
//         environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
//         eventsCallbacks: {
//           onAuthSuccess: (args: any) => {
//             console.log('Dynamic auth success:', args)
//           },
//           onAuthFailure: (error: any) => {
//             console.error('Dynamic auth failure:', error)
//           }
//         }
//       }}
//     >
//       {children}
//     </DynamicContextProvider>
//   )
// } 