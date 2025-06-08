"use client"

import { useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useToast } from "@/hooks/use-toast"

interface AgentTransactionData {
  fromAddress: string
  toAddress: string
  amount: number
  token: 'SOL' | 'USDC'
  memo: string
  isAgentInitiated: boolean
  skipForm: boolean
}

export function AgentTransactionBridge() {
  const { connected, publicKey } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    const handleAgentTransaction = async (event: Event) => {
      const customEvent = event as CustomEvent<AgentTransactionData>
      
      if (!connected || !publicKey) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your Phantom wallet to proceed with the transaction",
          variant: "destructive"
        })
        return
      }

      const transactionData = customEvent.detail

      // Validate that the transaction is from the connected wallet
      if (transactionData.fromAddress !== publicKey.toString()) {
        toast({
          title: "Wallet mismatch",
          description: "The transaction must be from your connected wallet",
          variant: "destructive"
        })
        return
      }

      try {
        // Show processing toast
        toast({
          title: "Processing transaction...",
          description: `Preparing to send ${transactionData.amount} ${transactionData.token} to ${transactionData.toAddress.slice(0, 8)}...${transactionData.toAddress.slice(-8)}`
        })

        // Call the existing Web3 send API
        const response = await fetch('/api/web3/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromAddress: transactionData.fromAddress,
            toAddress: transactionData.toAddress,
            amount: transactionData.amount,
            token: transactionData.token
          })
        })

        const result = await response.json()

        if (result.success && result.transaction) {
          // Trigger the existing transaction modal/flow
          window.dispatchEvent(new CustomEvent('phantom-transaction', {
            detail: {
              transaction: result.transaction,
              fromAddress: transactionData.fromAddress,
              toAddress: transactionData.toAddress,
              amount: transactionData.amount,
              token: transactionData.token,
              memo: transactionData.memo
            }
          }))
        } else {
          throw new Error(result.error || 'Transaction preparation failed')
        }
      } catch (error: any) {
        toast({
          title: "Transaction failed",
          description: error.message || "An error occurred while processing the transaction",
          variant: "destructive"
        })
      }
    }

    // Listen for agent-initiated transactions
    window.addEventListener('agent-transaction', handleAgentTransaction)

    return () => {
      window.removeEventListener('agent-transaction', handleAgentTransaction)
    }
  }, [connected, publicKey, toast])

  // This component doesn't render anything visible
  return null
}

// Helper function to trigger agent transactions from anywhere in the app
export const triggerAgentTransaction = (transactionData: AgentTransactionData) => {
  window.dispatchEvent(new CustomEvent('agent-transaction', {
    detail: transactionData
  }))
}

// Enhanced chat message processor for blockchain agent responses
export const processBlockchainAgentResponse = (response: string, userWalletAddress?: string) => {
  try {
    // Look for JSON response in the agent message
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1])
      
      if (data.action === 'prepare_transaction' && data.transaction_data) {
        const transactionData: AgentTransactionData = {
          fromAddress: userWalletAddress || '',
          toAddress: data.transaction_data.recipient,
          amount: parseFloat(data.transaction_data.amount_sol),
          token: 'SOL',
          memo: data.transaction_data.memo || 'Agent-initiated transaction',
          isAgentInitiated: true,
          skipForm: true
        }
        
        // Trigger the transaction after a short delay to let the user read the confirmation
        setTimeout(() => {
          triggerAgentTransaction(transactionData)
        }, 2000)
        
        return {
          processed: true,
          action: 'transaction_prepared',
          data: transactionData
        }
      }
    }
    
    return { processed: false }
  } catch (error) {
    console.error('Failed to process blockchain agent response:', error)
    return { processed: false }
  }
} 