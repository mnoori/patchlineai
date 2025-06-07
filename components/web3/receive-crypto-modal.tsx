'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle2, QrCode } from 'lucide-react'
import { useWeb3Store } from '@/lib/web3-store'
import { toast } from 'sonner'
import QRCode from 'qrcode'

export function ReceiveCryptoModal() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const { getActiveWallet } = useWeb3Store()
  
  const address = getActiveWallet()

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-receive-modal', handleOpen)
    return () => window.removeEventListener('open-receive-modal', handleOpen)
  }, [])

  useEffect(() => {
    if (address && open) {
      // Generate QR code
      QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#8B5CF6',
          light: '#FFFFFF'
        }
      }).then(setQrCodeUrl).catch(console.error)
    }
  }, [address, open])

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success('Address copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Receive Crypto
          </DialogTitle>
          <DialogDescription>
            Share your wallet address to receive SOL, USDC, or any Solana token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* QR Code */}
          <div className="flex justify-center">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Wallet QR Code" 
                className="rounded-lg border border-border"
              />
            ) : (
              <div className="w-64 h-64 rounded-lg border border-border bg-muted animate-pulse" />
            )}
          </div>

          {/* Address Display */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Your Solana Address</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <code className="text-xs font-mono flex-1 break-all">
                {address}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyAddress}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
            <p className="text-sm text-purple-500">
              <strong>Supported tokens:</strong> SOL, USDC, and all SPL tokens
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Make sure to send tokens on the Solana network only
            </p>
          </div>
        </div>

        <Button
          onClick={() => setOpen(false)}
          className="w-full"
          variant="outline"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
} 