# Patchline Web3 Portal Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for adding Web3 functionality to Patchline. The feature will add a "Portal to Web 3.0" toggle in the billing settings that, when enabled, displays wallet connection buttons in the dashboard navbar. The implementation focuses on security, modularity, and seamless integration with the existing architecture.

## Architecture Overview

### Core Components

1. **Frontend Layer**
   - Web3 Portal toggle in Settings → Billing tab
   - Wallet connection buttons in dashboard navbar
   - Wallet state management using Zustand
   - Dynamic, Phantom, and Coinbase wallet integration

2. **Backend Layer**
   - API routes for wallet operations
   - DynamoDB tables for wallet data
   - Stripe Crypto API integration
   - NFT minting via Metaplex

3. **Blockchain Layer**
   - Solana mainnet for transactions
   - USDC-SPL for payments
   - NFT ticketing system

## Implementation Steps

### Phase 1: Core Infrastructure Setup (Week 1)

#### 1.1 Install Dependencies

```bash
# Frontend packages
pnpm add @dynamic-labs/sdk-react @dynamic-labs/ethereum @dynamic-labs/solana
pnpm add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
pnpm add @solana/wallet-adapter-phantom @solana/wallet-adapter-coinbase
pnpm add @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults
pnpm add @solana/spl-token @solana/pay

# Types
pnpm add -D @types/react-qrcode-generator
```

#### 1.2 Environment Variables

Add to `.env.local`:
```bash
# Dynamic.xyz
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_env_id
DYNAMIC_BEARER_TOKEN=your_dynamic_api_token

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
SOLANA_PRIVATE_KEY=your_platform_wallet_private_key

# Stripe Crypto
STRIPE_CRYPTO_WEBHOOK_SECRET=your_stripe_crypto_webhook_secret

# Web3 Feature Flag
NEXT_PUBLIC_WEB3_ENABLED=true
```

#### 1.3 Database Schema

Create new DynamoDB tables:
```javascript
// Web3Wallets table
{
  TableName: 'Web3Wallets-staging',
  PartitionKey: 'userId',
  SortKey: 'walletAddress',
  Attributes: {
    userId: 'S',
    walletAddress: 'S',
    walletType: 'S', // 'embedded' | 'phantom' | 'coinbase'
    createdAt: 'S',
    lastUsed: 'S',
    isActive: 'BOOL'
  }
}

// Web3Transactions table
{
  TableName: 'Web3Transactions-staging',
  PartitionKey: 'transactionId',
  Attributes: {
    transactionId: 'S',
    userId: 'S',
    walletAddress: 'S',
    type: 'S', // 'deposit' | 'payout' | 'nft_mint' | 'nft_transfer'
    amount: 'N',
    signature: 'S',
    status: 'S',
    createdAt: 'S'
  }
}

// NFTTickets table
{
  TableName: 'NFTTickets-staging',
  PartitionKey: 'mintAddress',
  Attributes: {
    mintAddress: 'S',
    eventId: 'S',
    userId: 'S',
    metadata: 'M',
    isRedeemed: 'BOOL',
    redemptionDate: 'S'
  }
}
```

### Phase 2: Frontend Implementation (Week 1-2)

#### 2.1 Update Permissions System

Create `lib/web3-permissions.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Web3Settings {
  web3Enabled: boolean
  connectedWallets: {
    embedded?: string
    phantom?: string
    coinbase?: string
  }
  preferredWallet: 'embedded' | 'phantom' | 'coinbase' | null
}

interface Web3Store {
  settings: Web3Settings
  toggleWeb3: (enabled: boolean) => void
  setConnectedWallet: (type: string, address: string | null) => void
  setPreferredWallet: (type: string | null) => void
}

export const useWeb3Store = create<Web3Store>()(
  persist(
    (set) => ({
      settings: {
        web3Enabled: false,
        connectedWallets: {},
        preferredWallet: null
      },
      toggleWeb3: (enabled) => 
        set((state) => ({
          settings: { ...state.settings, web3Enabled: enabled }
        })),
      setConnectedWallet: (type, address) =>
        set((state) => ({
          settings: {
            ...state.settings,
            connectedWallets: {
              ...state.settings.connectedWallets,
              [type]: address
            }
          }
        })),
      setPreferredWallet: (type) =>
        set((state) => ({
          settings: { ...state.settings, preferredWallet: type }
        }))
    }),
    { name: 'patchline-web3' }
  )
)
```

#### 2.2 Add Web3 Portal Toggle to Settings

Update `app/dashboard/settings/page.tsx` billing section:
```typescript
// Add after the Dev Mode Tier Switcher card
<motion.div variants={itemVariants}>
  <Card className="glass-effect border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-purple-400" />
        Portal to Web 3.0
      </CardTitle>
      <CardDescription>
        Enable crypto wallet connections and blockchain features
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="web3-mode">Web3 Features</Label>
          <p className="text-sm text-muted-foreground">
            Connect crypto wallets, receive USDC payments, and mint NFT tickets
          </p>
        </div>
        <Switch
          id="web3-mode"
          checked={web3Settings.web3Enabled}
          onCheckedChange={(checked) => {
            toggleWeb3(checked)
            toast.success(
              checked 
                ? "Web3 features enabled! Check the toolbar for wallet options." 
                : "Web3 features disabled"
            )
          }}
          className="data-[state=checked]:bg-purple-500"
        />
      </div>
      
      {web3Settings.web3Enabled && (
        <div className="mt-4 space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">Active Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span>Crypto Wallet Connections</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span>USDC Payments (Solana)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span>NFT Event Tickets</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span>Automated Payouts</span>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</motion.div>
```

#### 2.3 Create Wallet Connection Component

Create `components/web3/wallet-connector.tsx`:
```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'
import { useDynamicContext } from '@dynamic-labs/sdk-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWeb3Store } from '@/lib/web3-permissions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

export function WalletConnector() {
  const { settings, setConnectedWallet } = useWeb3Store()
  const { primaryWallet, handleLogOut } = useDynamicContext()
  const { publicKey, disconnect, select, wallets } = useWallet()
  
  const connectedAddress = 
    primaryWallet?.address || 
    publicKey?.toBase58() || 
    settings.connectedWallets.embedded ||
    settings.connectedWallets.phantom ||
    settings.connectedWallets.coinbase

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (!settings.web3Enabled) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 border-purple-500/30 hover:border-purple-500/50"
        >
          <Wallet className="h-4 w-4" />
          {connectedAddress ? formatAddress(connectedAddress) : 'Connect Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!connectedAddress ? (
          <>
            <DropdownMenuItem onClick={() => {/* Dynamic connect */}}>
              <img src="/dynamic-logo.svg" className="h-4 w-4 mr-2" />
              Email or Social Login
            </DropdownMenuItem>
            {wallets.map((wallet) => (
              <DropdownMenuItem 
                key={wallet.adapter.name}
                onClick={() => select(wallet.adapter.name)}
              >
                <img src={wallet.adapter.icon} className="h-4 w-4 mr-2" />
                {wallet.adapter.name}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
            <div className="px-2 py-1.5 text-sm font-medium">
              Connected Wallet
            </div>
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {formatAddress(connectedAddress)}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {/* Copy address */}}
              className="text-sm"
            >
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {/* View on explorer */}}
              className="text-sm"
            >
              View on Solscan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                handleLogOut?.()
                disconnect?.()
                setConnectedWallet('all', null)
              }}
              className="text-red-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 2.4 Update Dashboard Navbar

Add wallet connector to `components/dashboard/navbar.tsx`:
```typescript
// Add import
import { WalletConnector } from '@/components/web3/wallet-connector'

// In the navbar, add before the avatar dropdown:
<WalletConnector />
```

### Phase 3: Wallet Providers Setup (Week 2)

#### 3.1 Create Web3 Provider

Create `components/web3/web3-provider.tsx`:
```typescript
import { DynamicContextProvider } from '@dynamic-labs/sdk-react'
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network), 
    [network]
  )

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    [network]
  )

  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
      }}
    >
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </DynamicContextProvider>
  )
}
```

#### 3.2 Update Root Layout

Wrap app with Web3Provider in `app/layout.tsx`:
```typescript
import { Web3Provider } from '@/components/web3/web3-provider'

// Wrap children with Web3Provider
<Web3Provider>
  {children}
</Web3Provider>
```

### Phase 4: Backend API Implementation (Week 2-3)

#### 4.1 Wallet API Routes

Create `app/api/web3/wallet/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION })
const docClient = DynamoDBDocumentClient.from(client)

export async function POST(request: NextRequest) {
  try {
    const { userId, walletAddress, walletType } = await request.json()
    
    // Store wallet connection
    await docClient.send(new PutCommand({
      TableName: 'Web3Wallets-staging',
      Item: {
        userId,
        walletAddress,
        walletType,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        isActive: true
      }
    }))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wallet storage error:', error)
    return NextResponse.json({ error: 'Failed to store wallet' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }
  
  try {
    // Query all wallets for user
    const response = await docClient.send(new QueryCommand({
      TableName: 'Web3Wallets-staging',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }))
    
    return NextResponse.json({ wallets: response.Items || [] })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}
```

#### 4.2 USDC Payment API

Create `app/api/web3/usdc/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()
    
    switch (action) {
      case 'create-payment': {
        // Create Stripe payment intent for USDC
        const paymentIntent = await stripe.paymentIntents.create({
          amount: params.amount,
          currency: 'usdc',
          payment_method_types: ['crypto'],
          metadata: {
            userId: params.userId,
            purpose: params.purpose
          }
        })
        
        return NextResponse.json({ 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        })
      }
      
      case 'verify-deposit': {
        // Verify USDC deposit on Solana
        const signature = params.signature
        const transaction = await connection.getTransaction(signature, {
          commitment: 'confirmed'
        })
        
        // Validate transaction and credit user account
        if (transaction && transaction.meta?.err === null) {
          // Store transaction in database
          await storeTransaction({
            transactionId: signature,
            userId: params.userId,
            type: 'deposit',
            amount: params.amount,
            status: 'confirmed'
          })
          
          return NextResponse.json({ success: true, confirmed: true })
        }
        
        return NextResponse.json({ success: false, confirmed: false })
      }
      
      case 'create-payout': {
        // Create USDC payout via Stripe
        const payout = await stripe.payouts.create({
          amount: params.amount,
          currency: 'usdc',
          destination: params.walletAddress,
          method: 'crypto',
          metadata: {
            userId: params.userId,
            artistId: params.artistId
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          payoutId: payout.id 
        })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('USDC operation error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
```

#### 4.3 NFT Ticketing API

Create `app/api/web3/nft/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { 
  createNft, 
  mplTokenMetadata,
  findMetadataPda
} from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi'
import { createQR } from '@solana/pay'

const umi = createUmi(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!)
  .use(mplTokenMetadata())

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()
    
    switch (action) {
      case 'mint-ticket': {
        // Generate NFT ticket
        const mint = generateSigner(umi)
        
        await createNft(umi, {
          mint,
          name: params.eventName,
          symbol: 'PTKT',
          uri: params.metadataUri,
          sellerFeeBasisPoints: 250, // 2.5% royalty
          creators: [{
            address: params.artistWallet,
            verified: true,
            share: 100
          }]
        }).sendAndConfirm(umi)
        
        // Generate QR code for ticket
        const qrCode = createQR(
          `solana:${mint.publicKey}?label=Event%20Ticket&reference=${params.eventId}`
        )
        
        // Store ticket in database
        await storeNFTTicket({
          mintAddress: mint.publicKey.toString(),
          eventId: params.eventId,
          userId: params.userId,
          metadata: params.metadata
        })
        
        return NextResponse.json({ 
          success: true,
          mintAddress: mint.publicKey.toString(),
          qrCode: qrCode.toString()
        })
      }
      
      case 'verify-ticket': {
        // Verify NFT ownership for event entry
        const { mintAddress, walletAddress } = params
        
        const tokenAccount = await connection.getTokenAccountsByOwner(
          new PublicKey(walletAddress),
          { mint: new PublicKey(mintAddress) }
        )
        
        if (tokenAccount.value.length > 0) {
          // Check if already redeemed
          const ticket = await getTicket(mintAddress)
          
          if (ticket.isRedeemed) {
            return NextResponse.json({ 
              valid: false, 
              reason: 'Already redeemed' 
            })
          }
          
          // Mark as redeemed
          await markTicketRedeemed(mintAddress)
          
          return NextResponse.json({ 
            valid: true,
            eventId: ticket.eventId
          })
        }
        
        return NextResponse.json({ 
          valid: false, 
          reason: 'Ticket not found' 
        })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('NFT operation error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
```

### Phase 5: Advanced Features (Week 3-4)

#### 5.1 Create USDC Payment Flow

Create `components/web3/usdc-payment.tsx`:
```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createQR } from '@solana/pay'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'

export function USDCPayment({ artistWallet, amount }: { 
  artistWallet: string
  amount: number 
}) {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string>()
  
  const generatePaymentQR = async () => {
    try {
      setLoading(true)
      
      // Create Solana Pay transfer request
      const recipient = new PublicKey(artistWallet)
      const reference = new PublicKey(generateReference())
      
      const url = new URL('solana:')
      url.searchParams.append('recipient', recipient.toBase58())
      url.searchParams.append('amount', amount.toString())
      url.searchParams.append('spl-token', USDC_MINT.toBase58())
      url.searchParams.append('reference', reference.toBase58())
      url.searchParams.append('label', 'Patchline Payment')
      url.searchParams.append('message', 'Payment for music services')
      
      const qr = createQR(url.toString())
      setQrCode(qr.toDataURL())
      
      // Monitor for payment
      monitorPayment(reference)
    } catch (error) {
      console.error('QR generation failed:', error)
      toast.error('Failed to generate payment QR')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with USDC</CardTitle>
      </CardHeader>
      <CardContent>
        {qrCode ? (
          <div className="space-y-4">
            <img src={qrCode} alt="Payment QR" className="mx-auto" />
            <p className="text-sm text-center text-muted-foreground">
              Scan with your Solana wallet to pay {amount} USDC
            </p>
          </div>
        ) : (
          <Button 
            onClick={generatePaymentQR} 
            loading={loading}
            className="w-full"
          >
            Generate Payment QR
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 5.2 NFT Ticket Scanner

Create `components/web3/ticket-scanner.tsx`:
```typescript
import { useState } from 'react'
import { QrReader } from 'react-qr-reader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export function TicketScanner({ eventId }: { eventId: string }) {
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<{
    valid: boolean
    message: string
  }>()
  
  const handleScan = async (data: string | null) => {
    if (!data || !scanning) return
    
    try {
      setScanning(false)
      
      // Parse Solana Pay URL
      const url = new URL(data)
      const mintAddress = url.pathname.replace('solana:', '')
      
      // Verify ticket
      const response = await fetch('/api/web3/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-ticket',
          mintAddress,
          walletAddress: url.searchParams.get('owner')
        })
      })
      
      const result = await response.json()
      
      setResult({
        valid: result.valid,
        message: result.valid 
          ? 'Ticket valid! Welcome to the event.' 
          : `Invalid ticket: ${result.reason}`
      })
      
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Failed to verify ticket')
      setScanning(true)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan NFT Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="text-center space-y-4">
            {result.valid ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
            <p className="text-lg">{result.message}</p>
            <Button onClick={() => {
              setResult(undefined)
              setScanning(true)
            }}>
              Scan Another
            </Button>
          </div>
        ) : (
          <div className="aspect-square">
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              className="w-full h-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Phase 6: Security & Testing (Week 4-5)

#### 6.1 Security Measures

1. **Private Key Management**
   - Never store private keys in code
   - Use AWS Secrets Manager for platform wallet
   - Implement key rotation policy

2. **Transaction Validation**
   - Verify all transactions on-chain
   - Implement rate limiting
   - Add transaction monitoring

3. **Access Control**
   - Validate wallet ownership
   - Implement RBAC for API endpoints
   - Add request signing

#### 6.2 Testing Strategy

Create `tests/web3/wallet-integration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletConnector } from '@/components/web3/wallet-connector'

describe('Web3 Integration', () => {
  it('should show wallet connector when Web3 enabled', () => {
    // Set Web3 enabled in store
    useWeb3Store.setState({
      settings: { web3Enabled: true, connectedWallets: {}, preferredWallet: null }
    })
    
    render(<WalletConnector />)
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })
  
  it('should connect phantom wallet', async () => {
    // Mock Phantom wallet
    window.phantom = {
      solana: {
        connect: vi.fn().mockResolvedValue({
          publicKey: { toBase58: () => 'test-wallet-address' }
        })
      }
    }
    
    render(<WalletConnector />)
    fireEvent.click(screen.getByText('Connect Wallet'))
    fireEvent.click(screen.getByText('Phantom'))
    
    await waitFor(() => {
      expect(screen.getByText('test...ress')).toBeInTheDocument()
    })
  })
})
```

### Phase 7: Deployment (Week 5)

#### 7.1 Infrastructure Updates

Update `backend/infra/lib/patchline-stack.ts`:
```typescript
// Add Web3 tables
const web3WalletsTable = new dynamodb.Table(this, 'Web3Wallets', {
  tableName: `Web3Wallets-${props.envName}`,
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'walletAddress', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
})

const web3TransactionsTable = new dynamodb.Table(this, 'Web3Transactions', {
  tableName: `Web3Transactions-${props.envName}`,
  partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
})

const nftTicketsTable = new dynamodb.Table(this, 'NFTTickets', {
  tableName: `NFTTickets-${props.envName}`,
  partitionKey: { name: 'mintAddress', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
})
```

#### 7.2 Environment Setup

1. **Dynamic.xyz Setup**
   - Create account at app.dynamic.xyz
   - Configure Solana chain
   - Set up embedded wallets
   - Get environment ID

2. **Stripe Crypto Setup**
   - Enable crypto payouts in Stripe dashboard
   - Configure webhook endpoints
   - Set up USDC payouts

3. **Solana Wallet Setup**
   - Create platform wallet
   - Fund with SOL for fees
   - Store private key in AWS Secrets

### Monitoring & Analytics

#### Track Web3 Metrics

Create `lib/web3-analytics.ts`:
```typescript
export const trackWeb3Event = (event: string, properties?: any) => {
  // Send to analytics service
  analytics.track(event, {
    ...properties,
    web3Enabled: true,
    network: 'solana',
    timestamp: new Date().toISOString()
  })
}

// Usage examples:
trackWeb3Event('wallet_connected', { 
  walletType: 'phantom',
  address: walletAddress 
})

trackWeb3Event('usdc_payment_initiated', { 
  amount: 100,
  currency: 'USDC'
})

trackWeb3Event('nft_ticket_minted', { 
  eventId: 'event-123',
  price: 50
})
```

## Success Metrics

1. **Adoption Rate**
   - % of users enabling Web3 features
   - Number of connected wallets
   - Active wallet usage

2. **Transaction Metrics**
   - USDC payment volume
   - NFT tickets minted
   - Successful redemptions

3. **Technical Performance**
   - Transaction success rate
   - API response times
   - Wallet connection speed

## Rollout Plan

1. **Phase 1**: Internal testing with team
2. **Phase 2**: Beta with selected users
3. **Phase 3**: Gradual rollout to all tiers
4. **Phase 4**: Marketing launch

## Support Documentation

Create comprehensive docs for:
- Wallet connection guide
- USDC payment tutorial
- NFT ticket creation
- Troubleshooting guide

## Conclusion

This implementation provides a secure, modular Web3 integration that enhances Patchline's capabilities while maintaining the existing user experience. The feature can be toggled on/off per user and scales with the platform's growth. 