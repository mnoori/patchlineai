import type { Metadata } from 'next'
import './globals.css'
import './fonts.css'
import { Toaster } from 'sonner'
import { TierPersistence } from "@/components/tier-persistence"
import { ThemeProvider } from '@/components/theme-provider'
import { PersistentShell } from '@/components/persistent-shell'
import { RoutePrewarmer } from '@/components/route-prewarmer'
import { PerformanceDashboard } from '@/components/performance-dashboard'
import dynamic from 'next/dynamic'



// Conditionally import Web3 components only if enabled
const isWeb3Enabled = process.env.NEXT_PUBLIC_ENABLE_WEB3 === 'true'

// Use stub provider when Web3 is disabled to avoid module resolution issues
const Web3Provider = isWeb3Enabled
  ? dynamic(() => import('@/components/web3/web3-provider').then(mod => mod.Web3Provider), { 
      ssr: false,
      loading: () => <div style={{ display: 'contents' }}>{null}</div>
    })
  : dynamic(() => import('@/components/web3/web3-provider-stub').then(mod => mod.Web3Provider), { 
      ssr: false 
    })

const SendCryptoModal = isWeb3Enabled
  ? dynamic(() => import('@/components/web3/send-crypto-modal').then(mod => mod.SendCryptoModal), { ssr: false })
  : () => null

const ReceiveCryptoModal = isWeb3Enabled
  ? dynamic(() => import('@/components/web3/receive-crypto-modal').then(mod => mod.ReceiveCryptoModal), { ssr: false })
  : () => null

// Lazy Amplify bootstrap (client-side only)
const AmplifyBootstrap = dynamic(() => import('@/components/amplify-bootstrap').then(m => m.AmplifyBootstrap), { ssr: false })

export const metadata: Metadata = {
  title: 'Patchline AI - Orchestrate Your Music Business',
  description: 'AI-powered platform for music professionals. Automate workflows, manage releases, and grow your music business.',
  icons: {
    icon: '/Brandmark/favicon.svg',
    shortcut: '/Brandmark/favicon.svg',
    apple: '/Brandmark/Brandmark Light.png', // Apple touch icons don't support SVG media queries, so we default to the light one for better visibility on dark backgrounds.
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://imagedelivery.net" />
        <link rel="preconnect" href="https://soundcharts.com" />
        {/* DNS prefetch for APIs */}
        <link rel="dns-prefetch" href="https://api.spotify.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        {/* Performance optimizations */}
        <link rel="preload" href="/Brandmark/Brandmark Dark.svg" as="image" />
        <link rel="preload" href="/Brandmark/Brandmark Light.svg" as="image" />
        <link rel="preload" href="/headshot.jpg" as="image" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Initialise Amplify client-side only */}
          <AmplifyBootstrap />
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
