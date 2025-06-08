import { NextRequest, NextResponse } from 'next/server'

interface AgentSendRequest {
  recipient: string
  amount: string
  memo?: string
  userAddress: string
}

export async function POST(req: NextRequest) {
  try {
    const body: AgentSendRequest = await req.json()
    const { recipient, amount, memo, userAddress } = body

    // Validate required fields
    if (!recipient || !amount || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, amount, userAddress' },
        { status: 400 }
      )
    }

    // Handle Coinbase address resolution
    let resolvedRecipient = recipient
    if (recipient.toLowerCase().includes('coinbase')) {
      const coinbaseAddress = process.env.SOLANA_COINBASE_ADDRESS
      if (!coinbaseAddress) {
        return NextResponse.json(
          { error: 'Coinbase address not configured' },
          { status: 400 }
        )
      }
      resolvedRecipient = coinbaseAddress
    }

    // Validate Solana addresses
    try {
      if (resolvedRecipient.length < 32 || resolvedRecipient.length > 44) {
        throw new Error('Invalid address length')
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      )
    }

    // Validate amount
    const amountNumber = parseFloat(amount)
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Security limits
    if (amountNumber > 10) {
      return NextResponse.json(
        { error: 'Amount exceeds security limit of 10 SOL' },
        { status: 400 }
      )
    }

    // Return transaction data for frontend to process
    return NextResponse.json({
      success: true,
      transactionData: {
        fromAddress: userAddress,
        toAddress: resolvedRecipient,
        amount: amountNumber,
        token: 'SOL',
        memo: memo || `Agent initiated transfer: ${amountNumber} SOL`,
        isAgentInitiated: true,
        skipForm: true, // Skip the form and go directly to confirmation
      },
      instructions: {
        action: 'initiate_phantom_transaction',
        message: `Please confirm the transaction in your Phantom wallet to send ${amountNumber} SOL to ${resolvedRecipient.slice(0, 8)}...${resolvedRecipient.slice(-8)}`
      }
    })

  } catch (error: any) {
    console.error('Agent send API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 