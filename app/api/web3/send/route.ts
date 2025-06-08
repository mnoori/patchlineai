import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token'

// RPC Configuration with fallbacks (same as balance route)
const getRPCEndpoint = () => {
  // Check for custom RPC URL first (works with any provider)
  if (process.env.RPC_URL) {
    console.log('Using custom RPC provider')
    return process.env.RPC_URL
  }
  
  // Priority order: Helius > Alchemy > QuickNode > Public RPC
  if (process.env.RPC_KEY_ID || process.env.HELIUS_API_KEY) {
    const apiKey = process.env.RPC_KEY_ID || process.env.HELIUS_API_KEY
    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
  }
  if (process.env.ALCHEMY_API_KEY) {
    return `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  }
  if (process.env.QUICKNODE_API_KEY) {
    return `https://solana-mainnet.quiknode.pro/${process.env.QUICKNODE_API_KEY}`
  }
  // Fallback to public RPC (rate limited)
  return process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
}

interface SendTransactionRequest {
  fromAddress: string
  toAddress: string
  amount: number
  token: 'SOL' | 'USDC'
  signedTransaction?: string // Base64 encoded signed transaction
}

export async function POST(req: NextRequest) {
  try {
    const body: SendTransactionRequest = await req.json()
    const { fromAddress, toAddress, amount, token, signedTransaction } = body

    // Validate required fields
    if (!fromAddress || !toAddress || !amount || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAddress, toAddress, amount, token' },
        { status: 400 }
      )
    }

    // Validate addresses
    try {
      new PublicKey(fromAddress)
      new PublicKey(toAddress)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0 || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Validate token
    if (!['SOL', 'USDC'].includes(token)) {
      return NextResponse.json(
        { error: 'Unsupported token. Only SOL and USDC are supported.' },
        { status: 400 }
      )
    }

    const endpoint = getRPCEndpoint()
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    })

    console.log('Send API using RPC:', endpoint.includes('helius') ? 'Helius' : 
                                      endpoint.includes('alchemy') ? 'Alchemy' : 
                                      endpoint.includes('quiknode') ? 'QuickNode' : 'Public')

    if (signedTransaction) {
      // Submit pre-signed transaction
      try {
        const txBuffer = Buffer.from(signedTransaction, 'base64')
        const signature = await connection.sendRawTransaction(txBuffer, {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        })

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')
        
        if (confirmation.value.err) {
          return NextResponse.json(
            { error: 'Transaction failed', details: confirmation.value.err },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          signature,
          explorerUrl: `https://solscan.io/tx/${signature}`
        })
      } catch (error: any) {
        console.error('Transaction submission error:', error)
        
        // Handle specific RPC errors
        if (error.message?.includes('403') || error.message?.includes('forbidden')) {
          return NextResponse.json(
            { 
              error: 'RPC rate limit exceeded',
              details: 'Please configure a premium RPC provider (Helius recommended) in your environment variables.',
              suggestion: 'Add HELIUS_API_KEY to .env.local for reliable transactions'
            },
            { status: 503 }
          )
        }
        
        return NextResponse.json(
          { error: 'Failed to submit transaction', details: error.message },
          { status: 500 }
        )
      }
    } else {
      // Create unsigned transaction for client to sign
      try {
        const fromPubkey = new PublicKey(fromAddress)
        const toPubkey = new PublicKey(toAddress)
        
        let transaction: Transaction = new Transaction()

        if (token === 'SOL') {
          // Create SOL transfer transaction
          const lamports = Math.round(amount * LAMPORTS_PER_SOL)
          
          // Check sender balance
          const balance = await connection.getBalance(fromPubkey)
          if (balance < lamports + 5000) { // 5000 lamports for fees
            return NextResponse.json(
              { error: 'Insufficient SOL balance for transaction and fees' },
              { status: 400 }
            )
          }
          
          transaction.add(
            SystemProgram.transfer({
              fromPubkey,
              toPubkey,
              lamports,
            })
          )
        } else if (token === 'USDC') {
          // Create USDC transfer transaction
          const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
          const decimals = 6 // USDC has 6 decimals
          const transferAmount = Math.round(amount * Math.pow(10, decimals))

          // Get associated token addresses
          const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, fromPubkey)
          const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, toPubkey)

          // Check sender USDC balance
          try {
            const fromAccountInfo = await connection.getTokenAccountBalance(fromTokenAccount)
            const senderBalance = Number(fromAccountInfo.value.amount)
            
            if (senderBalance < transferAmount) {
              return NextResponse.json(
                { error: 'Insufficient USDC balance' },
                { status: 400 }
              )
            }
          } catch (error) {
            return NextResponse.json(
              { error: 'Sender does not have a USDC token account' },
              { status: 400 }
            )
          }

          // Check if recipient has USDC token account
          const toAccountInfo = await connection.getAccountInfo(toTokenAccount)

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

        // Get recent blockhash with retry logic
        let blockhash, lastValidBlockHeight
        try {
          const blockInfo = await connection.getLatestBlockhash()
          blockhash = blockInfo.blockhash
          lastValidBlockHeight = blockInfo.lastValidBlockHeight
        } catch (error: any) {
          if (error.message?.includes('403') || error.message?.includes('forbidden')) {
            return NextResponse.json(
              { 
                error: 'RPC rate limit exceeded while fetching blockhash',
                details: 'Please configure a premium RPC provider for reliable service.',
                suggestion: 'Sign up for a free Helius account at https://helius.dev'
              },
              { status: 503 }
            )
          }
          throw error
        }

        transaction.recentBlockhash = blockhash
        transaction.feePayer = fromPubkey

        // Serialize transaction for client to sign
        const serializedTransaction = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false
        })

        return NextResponse.json({
          success: true,
          transaction: serializedTransaction.toString('base64'),
          blockhash,
          lastValidBlockHeight,
          message: `Transaction created for ${amount} ${token} transfer`
        })
      } catch (error: any) {
        console.error('Transaction creation error:', error)
        
        // Handle specific RPC errors
        if (error.message?.includes('403') || error.message?.includes('forbidden')) {
          return NextResponse.json(
            { 
              error: 'RPC rate limit exceeded',
              details: 'The public Solana RPC has rate limits. Please use a premium provider.',
              suggestion: 'Get a free API key from Helius: https://helius.dev'
            },
            { status: 503 }
          )
        }
        
        return NextResponse.json(
          { error: 'Failed to create transaction', details: error.message },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Send API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 