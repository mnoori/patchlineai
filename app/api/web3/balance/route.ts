import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

// Environment variable or fallback to a reliable RPC
const RPC_ENDPOINT = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'

interface TokenBalance {
  symbol: string
  amount: number
  usdValue: number
  decimals: number
  logo?: string
  mint?: string
}

// In-memory cache for SOL price so we don't call the price API on every request
let cachedSolPrice: { price: number; fetchedAt: number } | null = null

// Fetch current SOL price (USD) from CoinGecko with 5-minute cache
async function getSolPrice(): Promise<number> {
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  const now = Date.now()

  if (cachedSolPrice && now - cachedSolPrice.fetchedAt < CACHE_TTL) {
    return cachedSolPrice.price
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 300 } } // Hint for Next.js ISR / caching layer
    )

    if (!res.ok) throw new Error(`Price API error: ${res.status}`)

    const data = (await res.json()) as { solana?: { usd?: number } }
    const price = data.solana?.usd ?? 0

    if (price > 0) {
      cachedSolPrice = { price, fetchedAt: now }
      return price
    }
    throw new Error('Invalid price received')
  } catch (err) {
    console.warn('[WEB3] Failed to fetch SOL price – falling back to previous/ default', err)
    // Fallback: use cached value if we have one, otherwise a conservative default
    return cachedSolPrice?.price ?? 100
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get address from query parameter
    const searchParams = req.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Create Solana connection and public key
    const connection = new Connection(RPC_ENDPOINT, 'confirmed')
    const publicKey = new PublicKey(address)

    // Fetch SOL balance
    const solBalance = await connection.getBalance(publicKey)
    const solAmount = solBalance / 1e9 // Convert lamports to SOL

    // Get real-time SOL → USD price
    const solPrice = await getSolPrice()

    // Fetch token accounts for SPL tokens (USDC etc)
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }
    )

    const balances: TokenBalance[] = []

    // Add SOL balance
    balances.push({
      symbol: 'SOL',
      amount: solAmount,
      usdValue: solAmount * solPrice,
      decimals: 9,
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    })

    // Process token accounts (looking for USDC and others)
    for (const { account } of tokenAccounts.value) {
      const data = account.data.parsed.info
      const mintAddress = data.mint
      const tokenAmount = data.tokenAmount

      // USDC mint address on mainnet
      if (mintAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
        const amount = Number(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals)
        balances.push({
          symbol: 'USDC',
          amount: amount,
          usdValue: amount, // USDC is 1:1 with USD
          decimals: tokenAmount.decimals,
          mint: mintAddress,
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        })
      }
      // Add more token checks here if needed
    }

    return NextResponse.json({
      balance: solAmount.toString(),
      balanceUSD: (solAmount * solPrice).toFixed(2),
      solPrice,
      balances,
    })
  } catch (error: any) {
    console.error('Failed to fetch balances:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch balances' },
      { status: 500 }
    )
  }
} 