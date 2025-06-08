'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send, AlertCircle, CheckCircle2, ExternalLink, ArrowLeft, Shield } from 'lucide-react'
import { useWeb3Store } from '@/lib/web3-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type TransactionStep = 'input' | 'confirm' | 'processing' | 'success' | 'error'

export function SendCryptoModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<TransactionStep>('input')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('SOL')
  const [loading, setLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [estimatedFee, setEstimatedFee] = useState<number>(0.000005) // ~5000 lamports
  const { getActiveWallet } = useWeb3Store()

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true)
      resetForm()
    }
    window.addEventListener('open-send-modal', handleOpen)
    return () => window.removeEventListener('open-send-modal', handleOpen)
  }, [])

  const resetForm = () => {
    setStep('input')
    setRecipient('')
    setAmount('')
    setToken('SOL')
    setTxSignature(null)
    setError(null)
  }

  const validateInput = () => {
    if (!recipient || !amount) {
      toast.error('Please fill in all fields')
      return false
    }

    // Validate Solana address (base58, 32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient)) {
      toast.error('Invalid Solana address')
      return false
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount')
      return false
    }

    return true
  }

  const handleReviewTransaction = () => {
    if (!validateInput()) return
    setStep('confirm')
  }

  const handleConfirmAndSend = async () => {
    setLoading(true)
    setStep('processing')

    try {
      // Get Phantom provider
      const win = window as any
      if (!win.phantom?.solana) {
        throw new Error('Phantom wallet not connected')
      }

      const provider = win.phantom.solana
      const senderAddress = getActiveWallet()
      
      if (!senderAddress) {
        throw new Error('No wallet connected')
      }

      // Import Solana Web3 dynamically to avoid SSR issues
      const { 
        Connection, 
        PublicKey, 
        Transaction
      } = await import('@solana/web3.js')

      // Get RPC endpoint (prioritize premium providers)
      const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 
        (process.env.NEXT_PUBLIC_HELIUS_API_KEY 
          ? `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
          : process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')

      const connection = new Connection(endpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      })

      const fromPubkey = new PublicKey(senderAddress)
      const toPubkey = new PublicKey(recipient)
      const amountNum = parseFloat(amount)

      let transaction: any

      if (token === 'SOL') {
        // Create SOL transfer transaction
        const { 
          SystemProgram,
          LAMPORTS_PER_SOL 
        } = await import('@solana/web3.js')
        
        const lamports = Math.round(amountNum * LAMPORTS_PER_SOL)
        
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          })
        )
      } else if (token === 'USDC') {
        // Create USDC transfer transaction
        const { 
          getAssociatedTokenAddress, 
          createTransferInstruction,
          createAssociatedTokenAccountInstruction,
          TOKEN_PROGRAM_ID 
        } = await import('@solana/spl-token')

        const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
        const decimals = 6 // USDC has 6 decimals
        const transferAmount = Math.round(amountNum * Math.pow(10, decimals))

        // Get associated token addresses
        const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, fromPubkey)
        const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, toPubkey)

        // Check if recipient has USDC token account
        const toAccountInfo = await connection.getAccountInfo(toTokenAccount)
        
        transaction = new Transaction()

        // If recipient doesn't have USDC account, create it
        if (!toAccountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              fromPubkey, // payer
              toTokenAccount, // associated token account
              toPubkey, // owner
              USDC_MINT // mint
            )
          )
        }

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            fromTokenAccount, // source
            toTokenAccount, // destination
            fromPubkey, // owner
            transferAmount, // amount
            [], // multiSigners
            TOKEN_PROGRAM_ID // programId
          )
        )
      }

      // Get recent blockhash
      let blockhash, lastValidBlockHeight
      try {
        const blockInfo = await connection.getLatestBlockhash()
        blockhash = blockInfo.blockhash
        lastValidBlockHeight = blockInfo.lastValidBlockHeight
      } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('forbidden')) {
          setStep('error')
          setError('The free Solana network is busy. You need a free API key to send transactions reliably.')
          toast.error('Network busy - Click "Try Again" for instructions', {
            description: 'Free API key required (takes 2 minutes)',
            duration: 8000
          })
          return
        }
        throw error
      }

      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      // Sign and send transaction
      const signedTransaction = await provider.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      // Confirm transaction
      toast.loading('Confirming transaction...', { id: 'tx-confirm' })
      
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      if (confirmation.value.err) {
        throw new Error('Transaction failed')
      }

      setTxSignature(signature)
      setStep('success')
      toast.success(`Successfully sent ${amount} ${token}!`, { id: 'tx-confirm' })
      
      // Emit event to refresh wallet balances
      window.dispatchEvent(new CustomEvent('transaction-success'))
      
    } catch (error: any) {
      console.error('Send error:', error)
      toast.dismiss('tx-confirm')
      
      // Handle specific error codes
      if (error.code === 4001) {
        setError('Transaction cancelled by user')
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient funds for this transaction')
      } else if (error.message?.includes('blockhash not found')) {
        setError('Network error. Please try again.')
      } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        setStep('error')
        setError('The free Solana network is busy. You need a free API key to send transactions reliably.')
        return
      } else {
        setError(error.message || 'Failed to send transaction')
      }
      
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    // Reset after animation completes
    setTimeout(resetForm, 300)
  }

  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send {token}
              </DialogTitle>
              <DialogDescription>
                Send {token} to any Solana wallet address
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Select value={token} onValueChange={setToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL (Solana)</SelectItem>
                    <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="amount">Amount ({token})</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                    step={token === 'SOL' ? '0.001' : '0.01'}
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {token}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReviewTransaction}
                disabled={!recipient || !amount}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                Review Transaction
              </Button>
            </div>
          </>
        )

      case 'confirm':
        const amountNum = parseFloat(amount)
        const totalAmount = token === 'SOL' ? amountNum + estimatedFee : amountNum

        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Confirm Transaction
              </DialogTitle>
              <DialogDescription>
                Review the details before sending
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">From</span>
                  <code className="text-sm font-mono">
                    {getActiveWallet()?.slice(0, 8)}...{getActiveWallet()?.slice(-8)}
                  </code>
                </div>
                
                <div className="border-t border-border/50 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">To</span>
                    <code className="text-sm font-mono">
                      {recipient.slice(0, 8)}...{recipient.slice(-8)}
                    </code>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-semibold">{amount} {token}</span>
                  </div>
                  {token === 'SOL' && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Network Fee</span>
                      <span className="text-sm">~{estimatedFee} SOL</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-semibold text-lg">
                      {token === 'SOL' ? totalAmount.toFixed(6) : amount} {token}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-600">
                    <p className="font-medium">Double-check the recipient address</p>
                    <p className="text-xs opacity-80 mt-1">
                      Transactions are irreversible on the blockchain
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleConfirmAndSend}
                disabled={loading}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Confirm & Send
                  </>
                )}
              </Button>
            </div>
          </>
        )

      case 'processing':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Processing Transaction</DialogTitle>
              <DialogDescription>
                Please wait while we process your transaction
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Sending {amount} {token} to {recipient.slice(0, 8)}...
              </p>
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Transaction Successful!
              </DialogTitle>
              <DialogDescription>
                Your transaction has been successfully sent
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {amount} {token} sent successfully
                </p>
                <p className="text-sm text-muted-foreground">
                  To: {recipient.slice(0, 8)}...{recipient.slice(-8)}
                </p>
              </div>

              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <p className="text-sm text-green-600 font-medium mb-2">Transaction ID:</p>
                <code className="text-xs font-mono break-all">
                  {txSignature}
                </code>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://solscan.io/tx/${txSignature}`, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Solscan
                </Button>
                
                <Button
                  onClick={handleClose}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        )

      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Transaction Failed
              </DialogTitle>
              <DialogDescription>
                There was an error processing your transaction
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>

              {(error?.includes('network is busy') || error?.includes('API key')) && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">🔑 Quick Fix (2 minutes):</p>
                    <p className="text-xs text-blue-600/80">The free Solana network has limits. Get a free API key to send transactions reliably.</p>
                  </div>
                  <ol className="text-xs text-blue-600 space-y-1.5 list-decimal list-inside ml-1">
                    <li>
                      Go to <a href="https://helius.dev" target="_blank" className="underline font-medium">helius.dev</a> 
                      <span className="text-blue-600/70"> (free account)</span>
                    </li>
                    <li>Sign up and get your API key from the dashboard</li>
                    <li>Add to your <code className="bg-blue-900/20 px-1 rounded text-[10px]">.env.local</code> file:
                      <div className="mt-1 bg-blue-900/20 p-2 rounded text-[10px] font-mono">
                        NEXT_PUBLIC_HELIUS_API_KEY=your-key-here
                      </div>
                    </li>
                    <li>Restart your app with <code className="bg-blue-900/20 px-1 rounded text-[10px]">pnpm dev</code></li>
                  </ol>
                  <p className="text-[10px] text-blue-600/60 italic">
                    💡 This gives you 100,000 free transactions per month!
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        step === 'processing' && "sm:max-w-sm"
      )}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
} 