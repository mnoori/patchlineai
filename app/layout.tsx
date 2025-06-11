'use client'

import './globals.css'
import '@/lib/amplify-config'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { TierPersistence } from "@/components/tier-persistence"
import { ThemeProvider } from '@/components/theme-provider'
import { PersistentShell } from '@/components/persistent-shell'
import { RoutePrewarmer } from '@/components/route-prewarmer'
import { PerformanceDashboard } from '@/components/performance-dashboard'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Conditionally import Web3 components only if enabled
const isWeb3Enabled = process.env.NEXT_PUBLIC_ENABLE_WEB3 === 'true'

const Web3Provider = isWeb3Enabled
  ? dynamic(() => import('@/components/web3/web3-provider').then(mod => mod.Web3Provider), { ssr: false })
  : ({ children }: { children: React.ReactNode }) => <>{children}</>

const SendCryptoModal = isWeb3Enabled
  ? dynamic(() => import('@/components/web3/send-crypto-modal').then(mod => mod.SendCryptoModal), { ssr: false })
  : () => null

const ReceiveCryptoModal = isWeb3Enabled
  ? dynamic(() => import('@/components/web3/receive-crypto-modal').then(mod => mod.ReceiveCryptoModal), { ssr: false })
  : () => null

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Web3Provider>
            <TierPersistence />
            <RoutePrewarmer />
            <PersistentShell>
              {children}
            </PersistentShell>
            {isWeb3Enabled && (
              <>
                <SendCryptoModal />
                <ReceiveCryptoModal />
              </>
            )}
            <Toaster position="bottom-right" richColors closeButton />
            <PerformanceDashboard />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
