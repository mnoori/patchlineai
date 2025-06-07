import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand,
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

// Get table name with environment suffix
function getTableName() {
  const suffix = process.env.AWS_BRANCH || 'staging'
  return `Web3Wallets-${suffix}`
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, walletType } = await request.json()
    
    if (!walletAddress || !walletType) {
      return NextResponse.json(
        { error: 'Missing walletAddress or walletType' }, 
        { status: 400 }
      )
    }
    
    // Validate Solana address format (basic check)
    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' }, 
        { status: 400 }
      )
    }
    
    // For now, use a demo userId - in production get from session/auth
    const userId = 'demo-user-' + Date.now()
    
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        userId,
        walletAddress,
        walletType,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        isActive: true
      }
    }))
    
    return NextResponse.json({ 
      success: true,
      message: 'Wallet connected successfully',
      userId // Return for client-side storage
    })
  } catch (error) {
    console.error('Wallet storage error:', error)
    
    // Check if it's a table not found error
    if (error instanceof Error && error.message.includes('ResourceNotFoundException')) {
      return NextResponse.json(
        { error: 'Database table not found. Please contact support.' }, 
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to store wallet connection' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' }, 
        { status: 400 }
      )
    }
    
    const response = await docClient.send(new QueryCommand({
      TableName: getTableName(),
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }))
    
    return NextResponse.json({ 
      wallets: response.Items || [],
      count: response.Count || 0
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallets' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { walletAddress, userId } = await request.json()
    
    if (!walletAddress || !userId) {
      return NextResponse.json(
        { error: 'Missing walletAddress or userId' }, 
        { status: 400 }
      )
    }
    
    await docClient.send(new DeleteCommand({
      TableName: getTableName(),
      Key: {
        userId,
        walletAddress
      }
    }))
    
    return NextResponse.json({ 
      success: true,
      message: 'Wallet disconnected successfully'
    })
  } catch (error) {
    console.error('Wallet deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect wallet' }, 
      { status: 500 }
    )
  }
}

// Helper function to validate Solana address
function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - 44 characters, base58
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return base58Regex.test(address)
  } catch {
    return false
  }
} 