'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { QrCode, Send, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useWeb3Store } from '@/lib/web3-store'

interface USDCPaymentProps {
  recipientWallet?: string
  defaultAmount?: number
  onPaymentComplete?: (reference: string) => void
}

export function USDCPayment({ 
  recipientWallet = '', 
  defaultAmount = 0,
  onPaymentComplete 
}: USDCPaymentProps) {
  const { settings, getActiveWallet } = useWeb3Store()
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    paymentUrl: string
    reference: string
    qrCodeData: string
  } | null>(null)
  const [verified, setVerified] = useState(false)
  
  const [formData, setFormData] = useState({
    recipient: recipientWallet,
    amount: defaultAmount || '',
    description: ''
  })

  const senderWallet = getActiveWallet()

  if (!settings.enabled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Web3 features are not enabled. Enable them in Settings → Billing.
          </p>
        </CardContent>
      </Card>
    )
  }

  const generatePayment = async () => {
    if (!formData.recipient || !formData.amount) {
      toast.error('Please fill in recipient wallet and amount')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/web3/usdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-payment-request',
          recipientWallet: formData.recipient,
          amount: formData.amount,
          description: formData.description,
          userId: 'demo-user'
        })
      })

      const result = await response.json()

      if (result.success) {
        setPaymentData(result)
        toast.success('Payment request created! Use your Solana wallet to scan and pay.')
      } else {
        toast.error(result.error || 'Failed to create payment request')
      }
    } catch (error) {
      console.error('Payment generation error:', error)
      toast.error('Failed to generate payment request')
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async () => {
    if (!paymentData) return

    setLoading(true)
    try {
      const response = await fetch('/api/web3/usdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-payment',
          reference: paymentData.reference
        })
      })

      const result = await response.json()

      if (result.verified) {
        setVerified(true)
        toast.success('Payment verified!')
        onPaymentComplete?.(paymentData.reference)
      } else {
        toast.info(result.message || 'Payment not yet confirmed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast.error('Failed to verify payment')
    } finally {
      setLoading(false)
    }
  }

  const resetPayment = () => {
    setPaymentData(null)
    setVerified(false)
    setFormData({
      recipient: recipientWallet,
      amount: defaultAmount || '',
      description: ''
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-purple-500" />
          USDC Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!paymentData ? (
          // Payment form
          <>
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Wallet</Label>
              <Input
                id="recipient"
                placeholder="Solana wallet address"
                value={formData.recipient}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Payment for..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {senderWallet && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                <strong>From:</strong> {senderWallet.slice(0, 8)}...{senderWallet.slice(-8)}
              </div>
            )}

            <Button 
              onClick={generatePayment} 
              disabled={loading || !formData.recipient || !formData.amount}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Generate Payment Request
            </Button>
          </>
        ) : verified ? (
          // Payment verified
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600">Payment Verified!</h3>
              <p className="text-sm text-muted-foreground">
                {formData.amount} USDC successfully sent
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://solscan.io/tx/${paymentData.reference}`, '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Solscan
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetPayment}
                className="w-full"
              >
                Make Another Payment
              </Button>
            </div>
          </div>
        ) : (
          // Payment pending
          <div className="text-center space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg border-2 border-dashed">
              <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">QR Code Placeholder</p>
              <p className="text-xs text-muted-foreground mt-1">
                In production, this would show a QR code for: {paymentData.qrCodeData}
              </p>
            </div>
            
            <div className="text-sm space-y-1">
              <p><strong>Amount:</strong> {formData.amount} USDC</p>
              <p><strong>To:</strong> {formData.recipient.slice(0, 8)}...{formData.recipient.slice(-8)}</p>
              <p><strong>Reference:</strong> {paymentData.reference}</p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={verifyPayment}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Check Payment Status
              </Button>
              
              <Button 
                onClick={resetPayment}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-500/10 p-2 rounded">
              💡 <strong>How to pay:</strong> Open your Solana wallet (Phantom, etc.), scan this QR code, and confirm the transaction.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 