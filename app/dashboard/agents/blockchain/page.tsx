"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  Send, 
  Shield, 
  Activity, 
  DollarSign, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { AgentHeader } from "@/components/agents/agent-header"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

interface WalletBalance {
  balance: string
  balanceUSD: string
  solPrice: number
}

interface Transaction {
  signature: string
  slot: number
  blockTime: number
  status: string
  memo: string
}

export default function BlockchainAgentPage() {
  const { toast } = useToast()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [sendAmount, setSendAmount] = useState("")
  const [sendAddress, setSendAddress] = useState("")
  const [sendMemo, setSendMemo] = useState("")

  // Load wallet data when connected
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData()
    }
  }, [connected, publicKey])

  const loadWalletData = async () => {
    if (!publicKey) return
    
    setLoading(true)
    try {
      // Load balance
      const balanceResponse = await fetch(`/api/web3/balance?address=${publicKey.toString()}`)
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        setBalance(balanceData)
      }

      // Load transactions
      const txResponse = await fetch('/api/web3/agent-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_transaction_history',
          wallet_address: publicKey.toString(),
          limit: 10
        })
      })
      
      if (txResponse.ok) {
        const txData = await txResponse.json()
        setTransactions(txData.transactions || [])
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSendToCoinbase = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Phantom wallet first",
        variant: "destructive"
      })
      return
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to send",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/web3/agent-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: 'coinbase',
          amount: sendAmount,
          memo: sendMemo || 'Agent transfer to Coinbase',
          userAddress: publicKey.toString()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Trigger the Web3 transaction modal
        window.dispatchEvent(new CustomEvent('agent-transaction', {
          detail: data.transactionData
        }))
        
        toast({
          title: "Transaction Initiated",
          description: data.instructions.message
        })
        
        // Clear form
        setSendAmount("")
        setSendMemo("")
      } else {
        throw new Error(data.error || 'Transaction failed')
      }
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard"
    })
  }

  return (
    <div className="space-y-6">
      <AgentHeader
        agentName="Blockchain"
        title="Blockchain Agent"
        description="Secure Web3 transactions and Solana wallet management with AI assistance."
      />

      {/* Wallet Connection Status */}
      <Card className="glass-effect border-cosmic-teal/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-cosmic-teal" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAddress(publicKey?.toString() || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
            <WalletMultiButton className="!bg-cosmic-teal !text-black hover:!bg-cosmic-teal/90" />
          </div>
        </CardContent>
      </Card>

      {connected && (
        <Tabs defaultValue="balance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="send">Quick Send</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="balance">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Wallet Balance
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadWalletData}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balance ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-cosmic-teal">
                        {parseFloat(balance.balance).toFixed(4)} SOL
                      </div>
                      <div className="text-xl text-muted-foreground">
                        ${parseFloat(balance.balanceUSD).toFixed(2)} USD
                      </div>
                      <div className="text-sm text-muted-foreground">
                        1 SOL = ${balance.solPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading balance...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-cosmic-teal" />
                  Quick Send to Coinbase
                </CardTitle>
                <CardDescription>
                  Send SOL directly to your configured Coinbase address with one click
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (SOL)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    min="0"
                    max="10"
                    placeholder="0.1"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum: 10 SOL per transaction</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memo">Memo (Optional)</Label>
                  <Input
                    id="memo"
                    placeholder="Transfer description..."
                    value={sendMemo}
                    onChange={(e) => setSendMemo(e.target.value)}
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-500">Security Notice</p>
                      <p className="text-amber-600 dark:text-amber-400">
                        This will send SOL to your configured Coinbase address. You'll need to confirm the transaction in your Phantom wallet.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleQuickSendToCoinbase}
                  disabled={loading || !sendAmount}
                  className="w-full bg-cosmic-teal text-black hover:bg-cosmic-teal/90"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to Coinbase
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cosmic-teal" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.signature}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs">
                              {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                            </code>
                            <Badge
                              variant={tx.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {tx.status}
                            </Badge>
                          </div>
                          {tx.memo && (
                            <p className="text-sm text-muted-foreground mt-1">{tx.memo}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://solscan.io/tx/${tx.signature}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cosmic-teal" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium text-green-500">Address Validation</h4>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      All addresses are validated before transactions
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium text-green-500">Amount Limits</h4>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Maximum 10 SOL per transaction for security
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium text-green-500">Wallet Confirmation</h4>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      All transactions require Phantom wallet confirmation
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium text-green-500">Transaction Logging</h4>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      All activities are logged for audit purposes
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-500 mb-2">AI Agent Integration</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    The Blockchain Agent can process natural language commands like "Send 0.1 SOL to my Coinbase address" 
                    and automatically prepare secure transactions for your approval.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 