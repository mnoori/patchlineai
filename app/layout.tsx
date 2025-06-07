'use client'

import './globals.css'
import '@/lib/amplify-config'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Web3Provider } from "@/components/web3/web3-provider"
import { TierPersistence } from "@/components/tier-persistence"
import { ThemeProvider } from '@/components/theme-provider'
import { SendCryptoModal } from '@/components/web3/send-crypto-modal'
import { ReceiveCryptoModal } from '@/components/web3/receive-crypto-modal'

const inter = Inter({ subsets: ['latin'] })

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
            {children}
            <SendCryptoModal />
            <ReceiveCryptoModal />
            <Toaster position="top-right" richColors closeButton />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
