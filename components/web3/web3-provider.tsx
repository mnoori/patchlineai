'use client'

import { useEffect, useState } from 'react'
import { useWeb3Store } from '@/lib/web3-store'

/*
 Web3Provider – wraps Dynamic + Solana Wallet Adapter providers only when
 the user has enabled Web3 in settings.  This prevents unnecessary bundle
 weight for users who never touch crypto features.
*/

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { settings } = useWeb3Store()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR safety - render children without Web3 until mounted
  if (!mounted || !settings.enabled) {
    return <>{children}</>
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
    console.warn('Dynamic Environment ID is not set. Web3 features will work with limited functionality.')
    // Still render children but without Dynamic provider
    return <>{children}</>
  }

  // Client-side only Web3 provider wrapper
  return <Web3ProviderInner>{children}</Web3ProviderInner>
}

function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  // Lazy load providers only when actually needed
  const [providers, setProviders] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function loadProviders() {
      try {
        // Only load the essential providers for better performance
        const [
          { DynamicContextProvider },
          { SolanaWalletConnectors },
          { ConnectionProvider, WalletProvider },
          { WalletModalProvider },
          { PhantomWalletAdapter },
          { clusterApiUrl }
        ] = await Promise.all([
          import('@dynamic-labs/sdk-react'),
          import('@dynamic-labs/solana'),
          import('@solana/wallet-adapter-react'),
          import('@solana/wallet-adapter-react-ui'),
          import('@solana/wallet-adapter-wallets'),
          import('@solana/web3.js')
        ])

        if (!isMounted) return

        const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta')
        
        // Only load essential wallets to reduce bundle size
        const wallets = [
          new PhantomWalletAdapter(),
        ]

        setProviders({
          DynamicContextProvider,
          ConnectionProvider,
          WalletProvider,
          WalletModalProvider,
          endpoint,
          wallets,
          connectors: [SolanaWalletConnectors] // Only Solana for now
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
    // Loading state - render children without Web3 context
    return <>{children}</>
  }

  const {
    DynamicContextProvider,
    ConnectionProvider,
    WalletProvider,
    WalletModalProvider,
    endpoint,
    wallets,
    connectors
  } = providers

  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: connectors,
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
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </DynamicContextProvider>
  )
} 