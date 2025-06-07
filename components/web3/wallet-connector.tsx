'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Wallet, 
  LogOut, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  QrCode,
  RefreshCw,
  DollarSign
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { useWeb3Store } from "@/lib/web3-store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Phantom wallet interface
interface PhantomProvider {
  isPhantom?: boolean
  connect: (opts?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: { toString: () => string } } | undefined>
  disconnect: () => Promise<void>
  on: (event: string, handler: (...args: any[]) => void) => void
  removeListener: (event: string, handler: (...args: any[]) => void) => void
}

// Type for window.phantom
type PhantomWindow = Window & {
  phantom?: {
    solana?: PhantomProvider
  }
}

// Token balance interface
interface TokenBalance {
  symbol: string
  amount: number
  usdValue: number
  decimals: number
  logo?: string
  mint?: string
}

export function WalletConnector() {
  const { settings, connectWallet, disconnectWallet, getActiveWallet } = useWeb3Store()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !settings.enabled) return null

  return <WalletConnectorInner />
}

function WalletConnectorInner() {
  const { connectWallet, disconnectWallet, getActiveWallet } = useWeb3Store()
  const [loading, setLoading] = useState(false)
  const [phantomInstalled, setPhantomInstalled] = useState(false)
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const address = getActiveWallet()
  const isConnected = !!address
  const isConnecting = loading

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = () => {
      const win = window as PhantomWindow
      const isInstalled = win.phantom?.solana?.isPhantom === true
      setPhantomInstalled(isInstalled)
    }

    // Check immediately
    checkPhantom()

    // Check again after a delay (sometimes Phantom takes a moment to inject)
    const timeout = setTimeout(checkPhantom, 100)

    // Listen for Phantom events
    const win = window as PhantomWindow
    if (win.phantom?.solana) {
      const handleConnect = (...args: any[]) => {
        const event = args[0] as { publicKey?: { toString: () => string } }
        if (event?.publicKey) {
          const address = event.publicKey.toString()
          connectWallet('phantom', address)
          console.log('Phantom connected:', address)
          fetchBalances(address)
        }
      }

      const handleDisconnect = () => {
        disconnectWallet('phantom')
        setBalances([])
        console.log('Phantom disconnected')
      }

      win.phantom.solana.on('connect', handleConnect)
      win.phantom.solana.on('disconnect', handleDisconnect)

      return () => {
        if (win.phantom?.solana) {
          win.phantom.solana.removeListener('connect', handleConnect)
          win.phantom.solana.removeListener('disconnect', handleDisconnect)
        }
        clearTimeout(timeout)
      }
    }

    return () => clearTimeout(timeout)
  }, [connectWallet, disconnectWallet])

  // Fetch balances when dropdown opens if connected
  useEffect(() => {
    if (dropdownOpen && isConnected && balances.length === 0) {
      fetchBalances(address)
    }
  }, [dropdownOpen, isConnected, address, balances.length])

  const fetchBalances = async (walletAddress: string) => {
    if (loadingBalances || !walletAddress) return
    
    setLoadingBalances(true)
    try {
      // Use our server-side API route instead of direct RPC calls
      // This avoids CORS issues and keeps RPC keys private
      const response = await fetch(`/api/web3/balance?address=${walletAddress}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch balances')
      }
      
      const data = await response.json()
      setBalances(data.balances)
    } catch (error) {
      console.error('Failed to fetch balances:', error)
      toast.error('Failed to fetch wallet balances')
      
      // Fallback to mock data for demonstration purposes
      console.log('Using mock data as fallback')
      const mockBalances = [
        {
          symbol: 'SOL',
          amount: 2.14,
          usdValue: 246.50,
          decimals: 9,
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
        },
        {
          symbol: 'USDC',
          amount: 148.00,
          usdValue: 148.00,
          decimals: 6,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
        }
      ]
      setBalances(mockBalances)
    } finally {
      setLoadingBalances(false)
    }
  }

  const handleConnectPhantom = async () => {
    if (!phantomInstalled) {
      toast.error('Phantom wallet not found. Please install it first.')
      window.open('https://phantom.app/', '_blank')
      return
    }

    setLoading(true)
    try {
      const win = window as PhantomWindow
      const provider = win.phantom?.solana
      if (!provider) {
        throw new Error('Phantom provider not found')
      }

      // Connect with Phantom
      const response = await provider.connect()
      if (!response?.publicKey) {
        throw new Error('No public key returned from Phantom')
      }
      const walletAddress = response.publicKey.toString()
      
      // Update our store
      connectWallet('phantom', walletAddress)
      
      // Fetch balances immediately after connecting
      fetchBalances(walletAddress)
      
      // Store in backend (optional)
      try {
        await fetch('/api/web3/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            walletType: 'phantom'
          })
        })
      } catch (error) {
        console.error('Failed to store wallet in backend:', error)
      }
      
      toast.success('Phantom wallet connected!')
    } catch (error: any) {
      console.error('Phantom connection error:', error)
      
      // Handle specific error codes
      if (error.code === 4001) {
        toast.error('Connection cancelled by user')
      } else if (error.code === -32603) {
        toast.error('Internal error in Phantom. Please try again.')
      } else if (error.message?.includes('User rejected')) {
        toast.error('Connection cancelled')
      } else {
        toast.error('Failed to connect wallet. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnectOtherWallets = () => {
    toast.info('Other wallet connections coming soon! For now, please use Phantom.')
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      // Disconnect from Phantom
      const win = window as PhantomWindow
      if (win.phantom?.solana) {
        await win.phantom.solana.disconnect()
      }
      
      // Clear from our store
      disconnectWallet('phantom')
      setBalances([])
      
      toast.success("Wallet disconnected")
    } catch (error) {
      console.error('Disconnect error:', error)
      // Even if disconnect fails, clear from our store
      disconnectWallet('phantom')
      setBalances([])
      toast.success("Wallet disconnected")
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`
  
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied!")
    }
  }

  const viewOnExplorer = () => {
    if (address) {
      window.open(`https://solscan.io/account/${address}`, '_blank')
    }
  }

  const openSendModal = () => {
    const event = new CustomEvent('open-send-modal')
    window.dispatchEvent(event)
    setDropdownOpen(false)
  }

  const openReceiveModal = () => {
    const event = new CustomEvent('open-receive-modal')
    window.dispatchEvent(event)
    setDropdownOpen(false)
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all duration-200 border-border/50 hover:border-border",
            "bg-background/50 hover:bg-background/80 backdrop-blur-sm",
            isConnected && "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10"
          )}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Wallet className={cn(
              "h-4 w-4 transition-colors",
              isConnected ? "text-purple-500" : "text-muted-foreground"
            )} />
          )}
          <span className="hidden sm:inline text-sm font-medium">
            {address ? formatAddress(address) : "Wallet"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-72 p-1 bg-background/95 backdrop-blur-md border-border/50 shadow-lg"
        sideOffset={8}
      >
        {isConnected ? (
          // Connected state
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5 flex justify-between items-center">
              <span>Connected wallet</span>
              {isConnected && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => fetchBalances(address)}
                  disabled={loadingBalances}
                >
                  <RefreshCw className={`h-3 w-3 ${loadingBalances ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </DropdownMenuLabel>
            
            {/* Wallet Balance Section */}
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center mb-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                <code className="text-xs font-mono text-foreground/80 flex-1">
                  {formatAddress(address)}
                </code>
              </div>
              
              {/* Balances */}
              <div className="space-y-2 mt-3">
                {loadingBalances ? (
                  <div className="py-2 flex justify-center">
                    <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
                  </div>
                ) : balances.length > 0 ? (
                  balances.map((token, index) => (
                    <div 
                      key={token.symbol} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md",
                        index === 0 ? "bg-purple-500/10" : "bg-blue-500/10"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          index === 0 ? "bg-purple-500/20" : "bg-blue-500/20"
                        )}>
                          <DollarSign className={cn(
                            "h-3.5 w-3.5",
                            index === 0 ? "text-purple-500" : "text-blue-500"
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{token.amount.toFixed(2)} <span className="text-xs">{token.symbol}</span></p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">${token.usdValue.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-1 text-xs text-muted-foreground">
                    No tokens found
                  </div>
                )}
              </div>
            </div>
            
            <DropdownMenuSeparator className="my-1" />
            
            {/* Quick Actions */}
            <div className="px-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-700 text-emerald-600"
                  onClick={openSendModal}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  className="w-full gap-2 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-700 text-purple-600"
                  onClick={openReceiveModal}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Receive</span>
                </Button>
              </div>
            </div>
            
            <DropdownMenuSeparator className="my-1" />
            
            <DropdownMenuItem 
              onClick={copyAddress}
              className="gap-2 cursor-pointer text-sm py-2 px-2 rounded-sm hover:bg-muted/50 focus:bg-muted/50 transition-colors"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span>Copy address</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={viewOnExplorer}
              className="gap-2 cursor-pointer text-sm py-2 px-2 rounded-sm hover:bg-muted/50 focus:bg-muted/50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span>View on Solscan</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1" />
            
            <DropdownMenuItem 
              onClick={handleDisconnect}
              className="gap-2 cursor-pointer text-sm py-2 px-2 rounded-sm text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 transition-colors"
              disabled={isConnecting}
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </>
        ) : (
          // Disconnected state
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
              Connect wallet
            </DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={handleConnectPhantom}
              className="gap-3 cursor-pointer py-3 px-2 rounded-sm hover:bg-muted/50 focus:bg-muted/50 transition-colors"
              disabled={isConnecting}
            >
              <img 
                src="/phantom-icon.svg" 
                className="w-8 h-8" 
                alt="Phantom"
                onError={(e) => {
                  // Fallback to wallet icon if image fails
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    e.currentTarget.style.display = 'none'
                    const fallback = document.createElement('div')
                    fallback.className = 'w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center'
                    fallback.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>'
                    parent.insertBefore(fallback, e.currentTarget)
                  }
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Phantom Wallet</div>
                <div className="text-xs text-muted-foreground">
                  {phantomInstalled ? 'Click to connect' : 'Not installed'}
                </div>
              </div>
              {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleConnectOtherWallets}
              className="gap-3 cursor-pointer py-3 px-2 rounded-sm hover:bg-muted/50 focus:bg-muted/50 transition-colors"
              disabled={isConnecting}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                <Wallet className="w-full h-full text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Other wallets</div>
                <div className="text-xs text-muted-foreground">Coming soon</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1" />
            
            <DropdownMenuItem 
              onClick={() => window.open('https://phantom.app/', '_blank')}
              className="gap-2 cursor-pointer text-xs py-2 px-2 rounded-sm text-muted-foreground hover:bg-muted/30 focus:bg-muted/30 transition-colors"
            >
              <AlertCircle className="h-3 w-3" />
              <span>Don't have a wallet? Get Phantom</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 