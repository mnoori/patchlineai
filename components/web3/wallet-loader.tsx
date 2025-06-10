'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const WalletConnector = dynamic(
  () => import('./wallet-connector').then(mod => mod.WalletConnector),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-10 w-40 rounded-md" />
  }
)

export function WalletLoader() {
  return <WalletConnector />
} 