'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Send, QrCode, RefreshCw, DollarSign } from 'lucide-react'
import { useWeb3Store } from '@/lib/web3-store'
import { toast } from 'sonner'

interface TokenBalance {
  symbol: string
  amount: number
  usdValue: number
  mint?: string
}

export function WalletBalance() {
  const { getActiveWallet } = useWeb3Store()
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [totalUsdValue, setTotalUsdValue] = useState(0)
  
  const address = getActiveWallet()

  useEffect(() => {
    if (address) {
      fetchBalances()
    }
  }, [address])

  const fetchBalances = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      // In production, this would fetch from Solana RPC
      // For now, we'll show mock data
      const mockBalances: TokenBalance[] = [
        {
          symbol: 'SOL',
          amount: 2.5,
          usdValue: 250.00 // Assuming $100/SOL
        },
        {
          symbol: 'USDC',
          amount: 150.00,
          usdValue: 150.00,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        }
      ]
      
      setBalances(mockBalances)
      setTotalUsdValue(mockBalances.reduce((sum, b) => sum + b.usdValue, 0))
    } catch (error) {
      console.error('Failed to fetch balances:', error)
      toast.error('Failed to load wallet balance')
    } finally {
      setLoading(false)
    }
  }

  if (!address) return null

  return (
    <Card className="glass-effect border-purple-500/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Wallet Balance</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchBalances}
          disabled={loading}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Total Balance */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold">${totalUsdValue.toFixed(2)}</p>
            </div>

            {/* Token List */}
            <div className="space-y-2">
              {balances.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">{token.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {token.amount.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${token.usdValue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Open send modal
                  const event = new CustomEvent('open-send-modal')
                  window.dispatchEvent(event)
                }}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Open receive modal
                  const event = new CustomEvent('open-receive-modal')
                  window.dispatchEvent(event)
                }}
              >
                <QrCode className="h-4 w-4" />
                Receive
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 