import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

// Configure AWS DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined,
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

interface UserInteraction {
  userId: string
  action: string
  metadata?: Record<string, any>
  timestamp?: string
  interactionId?: string
}

export async function trackUserInteraction(interaction: UserInteraction) {
  if (!interaction.userId) {
    console.warn("Cannot track interaction without userId")
    return
  }

  try {
    const interactionRecord = {
      interactionId: interaction.interactionId || uuidv4(),
      userId: interaction.userId,
      action: interaction.action,
      metadata: interaction.metadata || {},
      timestamp: interaction.timestamp || new Date().toISOString(),
      // Add session information
      sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('sessionId') || uuidv4() : uuidv4(),
      // Add environment context
      environment: process.env.NODE_ENV || 'development',
      // Add agent context
      agent: 'scout',
      // Add TTL for automatic cleanup after 90 days
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
    }

    // Store session ID for future interactions
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem('sessionId')) {
      window.sessionStorage.setItem('sessionId', interactionRecord.sessionId)
    }

    // For now, we'll store in localStorage as a fallback
    // In production, this should be sent to an API endpoint
    if (typeof window !== 'undefined') {
      const interactions = JSON.parse(localStorage.getItem('user-interactions') || '[]')
      interactions.push(interactionRecord)
      
      // Keep only last 100 interactions in localStorage
      if (interactions.length > 100) {
        interactions.splice(0, interactions.length - 100)
      }
      
      localStorage.setItem('user-interactions', JSON.stringify(interactions))
    }

    // In production, send to DynamoDB via API
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionRecord)
      })
    }

    console.log('[Interaction Tracked]', interaction.action, interaction.metadata)
  } catch (error) {
    console.error('Failed to track interaction:', error)
  }
}

// Get user interaction history
export async function getUserInteractionHistory(userId: string, limit = 50) {
  if (typeof window !== 'undefined') {
    const interactions = JSON.parse(localStorage.getItem('user-interactions') || '[]')
    return interactions
      .filter((i: any) => i.userId === userId)
      .slice(-limit)
      .reverse()
  }
  return []
}

// Analytics helper functions
export async function getInteractionAnalytics(userId: string) {
  const interactions = await getUserInteractionHistory(userId, 1000)
  
  const actionCounts = interactions.reduce((acc: any, interaction: any) => {
    acc[interaction.action] = (acc[interaction.action] || 0) + 1
    return acc
  }, {})
  
  const recentSessions = new Set(
    interactions
      .filter((i: any) => new Date(i.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map((i: any) => i.sessionId)
  ).size
  
  return {
    totalInteractions: interactions.length,
    actionCounts,
    recentSessions,
    mostCommonAction: Object.entries(actionCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
  }
} 