'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, AlertCircle } from 'lucide-react'
import { useWeb3Store } from '@/lib/web3-store'
import { toast } from 'sonner'

export function SendCryptoModal() {
  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const { getActiveWallet } = useWeb3Store()

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-send-modal', handleOpen)
    return () => window.removeEventListener('open-send-modal', handleOpen)
  }, [])

  const handleSend = async () => {
    if (!recipient || !amount) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate Solana address (base58, 32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient)) {
      toast.error('Invalid Solana address')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount')
      return
    }

    setLoading(true)
    try {
      // Get Phantom provider
      const win = window as any
      if (!win.phantom?.solana) {
        throw new Error('Phantom wallet not connected')
      }

      // In production, this would:
      // 1. Create a transaction to send USDC
      // 2. Sign it with Phantom
      // 3. Submit to Solana network
      
      // For now, we'll simulate
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Sent ${amount} USDC to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`)
      setOpen(false)
      setRecipient('')
      setAmount('')
    } catch (error: any) {
      console.error('Send error:', error)
      toast.error(error.message || 'Failed to send transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send USDC
          </DialogTitle>
          <DialogDescription>
            Send USDC to any Solana wallet address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
                step="0.01"
                min="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                USDC
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-500">
                <p className="font-medium">Test Mode</p>
                <p className="text-xs opacity-80">
                  This is a demo. In production, this would send real USDC on Solana.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !recipient || !amount}
            className="flex-1 bg-purple-500 hover:bg-purple-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send USDC
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 