import { NextRequest, NextResponse } from 'next/server'
import { SupervisorAgent } from '@/lib/supervisor-agent'
import { CONFIG } from '@/lib/config'
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'

console.log('[CONFIG] Running in', CONFIG.ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT', 'mode')

const dynamoDB = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})

export interface AgentTrace {
  timestamp: string
  agent?: string
  action: string
  status: 'info' | 'success' | 'error' | 'delegating'
  details?: string
}

// Store supervisor instances per session
const supervisorInstances = new Map<string, SupervisorAgent>()

// Logging helpers
const log = {
  info: (msg: string) => console.log(`🔵 [SUPERVISOR] ${msg}`),
  success: (msg: string) => console.log(`✅ [SUPERVISOR] ${msg}`),
  error: (msg: string) => console.log(`❌ [SUPERVISOR] ${msg}`),
  agent: (msg: string) => console.log(`🤖 [SUPERVISOR] ${msg}`),
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId, userId } = body

    // Basic validation
    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      )
    }

    // Extract user ID from the request
    const actualUserId = userId || 'test-user'
    
    console.log(`🔵 [SUPERVISOR] Processing request from user: ${actualUserId.substring(0, 8)}...`)
    console.log(`🔵 [SUPERVISOR] Session: ${sessionId}`)
    console.log(`🔵 [SUPERVISOR] Message: ${message}`)

    // Initialize traces array
    const traces: AgentTrace[] = []
    
    // Add initial trace
    traces.push({
      timestamp: new Date().toISOString(),
      action: 'Request received',
      status: 'info',
      details: `Processing message: "${message.substring(0, 50)}..."`
    })

    // Create supervisor agent
    console.log('🤖 [SUPERVISOR] Creating new SupervisorAgent instance')
    const supervisor = new SupervisorAgent()
    
    traces.push({
      timestamp: new Date().toISOString(),
      action: 'Supervisor Agent initialized',
      status: 'info'
    })

    // Process the request with the supervisor
    console.log('🤖 [SUPERVISOR] Delegating to specialized agents...')
    traces.push({
      timestamp: new Date().toISOString(),
      action: 'Delegating to specialized agents',
      status: 'delegating',
      details: 'Analyzing request to determine which agents to use'
    })

    // Process the request and capture agent usage
    const startTime = Date.now()
    const response = await supervisor.processRequest(message, actualUserId, sessionId)
    const endTime = Date.now()
    
    // Extract which agents were used from the response
    const agentsUsed = extractAgentsUsed(response)
    
    if (agentsUsed.length > 0) {
      traces.push({
        timestamp: new Date().toISOString(),
        action: 'Agents successfully invoked',
        status: 'success',
        agent: agentsUsed.join(', '),
        details: `Processing completed in ${(endTime - startTime) / 1000}s`
      })
    }

    // Log successful response
    console.log(`✅ [SUPERVISOR] Response generated using: ${agentsUsed.join(', ')}`)
    
    traces.push({
      timestamp: new Date().toISOString(),
      action: 'Response generated',
      status: 'success',
      details: 'All agent tasks completed successfully'
    })

    // Store the interaction
    await storeInteraction(sessionId, actualUserId, message, response)

    return NextResponse.json({ 
      response,
      traces,
      agentsUsed
    })
  } catch (error) {
    console.error('❌ [SUPERVISOR] Supervisor orchestration error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: 'Supervisor orchestration failed', 
        details: errorMessage,
        traces: [{
          timestamp: new Date().toISOString(),
          action: 'Error occurred',
          status: 'error',
          details: errorMessage
        }]
      },
      { status: 500 }
    )
  }
}

// Extract which agents were used from the response
function extractAgentsUsed(response: string): string[] {
  const agents: string[] = []
  
  // Check for patterns indicating agent usage
  if (response.includes('Gmail') || response.includes('email') || response.includes('CONTRACT_TEXT')) {
    agents.push('Gmail Agent')
  }
  
  if (response.includes('contract analysis') || response.includes('Contract Analysis Report') || response.includes('legal')) {
    agents.push('Legal Agent')
  }
  
  // If no specific agents detected but we have a response, assume supervisor handled it
  if (agents.length === 0 && response.length > 0) {
    agents.push('Supervisor Agent')
  }
  
  return agents
}

async function storeInteraction(sessionId: string, userId: string, message: string, response: string) {
  const tableName = CONFIG.ENV === 'production' ? 'SupervisorSessions-prod' : 'SupervisorSessions-dev'
  const timestamp = new Date().toISOString()

  try {
    await dynamoDB.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        sessionId: { S: sessionId },
        timestamp: { S: timestamp },
        userId: { S: userId },
        message: { S: message },
        response: { S: response },
        ttl: { N: String(Math.floor(Date.now() / 1000) + 86400 * 30) } // 30 days TTL
      }
    }))
  } catch (error) {
    console.warn('[SUPERVISOR] Failed to store interaction:', error)
    // Don't fail the request if storage fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      )
    }

    const tableName = CONFIG.ENV === 'production' ? 'SupervisorSessions-prod' : 'SupervisorSessions-dev'

    const response = await dynamoDB.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': { S: sessionId }
      },
      ScanIndexForward: true // Sort by timestamp ascending
    }))

    const history = response.Items?.map(item => ({
      timestamp: item.timestamp?.S || '',
      message: item.message?.S || '',
      response: item.response?.S || '',
      userId: item.userId?.S || ''
    })) || []

    return NextResponse.json({ history })
  } catch (error) {
    console.error('[SUPERVISOR] Failed to fetch history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    )
  }
}

// GET endpoint to check supervisor status
export async function GET_OLD(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (sessionId && supervisorInstances.has(sessionId)) {
    const supervisor = supervisorInstances.get(sessionId)!
    const memory = supervisor.getMemory()
    
    return NextResponse.json({
      status: 'active',
      sessionId,
      memory: {
        userSupervisorCount: memory.userSupervisorMemory.length,
        teamInteractions: Object.entries(memory.supervisorTeamMemory).map(([agent, msgs]) => ({
          agent,
          messageCount: msgs.length
        })),
        totalMemorySize: memory.combinedMemory.length
      }
    })
  }
  
  return NextResponse.json({
    status: 'not_found',
    activeSessions: supervisorInstances.size
  })
}

// DELETE endpoint to clear session
export async function DELETE(request: NextRequest) {
  const { sessionId } = await request.json()
  
  if (sessionId && supervisorInstances.has(sessionId)) {
    supervisorInstances.delete(sessionId)
    return NextResponse.json({ success: true, message: 'Session cleared' })
  }
  
  return NextResponse.json({ success: false, message: 'Session not found' })
} 