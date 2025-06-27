import { NextRequest, NextResponse } from 'next/server'
import { SupervisorAgent, type AgentTrace } from '@/lib/supervisor-agent'
import { CONFIG } from '@/lib/config'
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { sendLog } from '@/lib/supervisor-stream'

console.log('[CONFIG] Running in', CONFIG.ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT', 'mode')

const dynamoDB = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})

// Store supervisor instances per session
const supervisorInstances = new Map<string, SupervisorAgent>()

// Logging helpers
const log = {
  info: (msg: string, sessionId?: string) => {
    console.log(`🔵 [SUPERVISOR] ${msg}`)
    if (sessionId) {
      sendLog(sessionId, { type: 'info', message: msg, timestamp: new Date().toISOString() })
    }
  },
  success: (msg: string, sessionId?: string) => {
    console.log(`✅ [SUPERVISOR] ${msg}`)
    if (sessionId) {
      sendLog(sessionId, { type: 'success', message: msg, timestamp: new Date().toISOString() })
    }
  },
  error: (msg: string, sessionId?: string) => {
    console.log(`❌ [SUPERVISOR] ${msg}`)
    if (sessionId) {
      sendLog(sessionId, { type: 'error', message: msg, timestamp: new Date().toISOString() })
    }
  },
  agent: (msg: string, sessionId?: string) => {
    console.log(`🤖 [SUPERVISOR] ${msg}`)
    if (sessionId) {
      sendLog(sessionId, { type: 'agent', message: msg, timestamp: new Date().toISOString() })
    }
  },
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
    
    log.info(`Processing request from user: ${actualUserId.substring(0, 8)}...`, sessionId)
    log.info(`Session: ${sessionId}`, sessionId)
    log.info(`Message: ${message}`, sessionId)

    // Create supervisor agent
    log.agent('Creating new SupervisorAgent instance', sessionId)
    const supervisor = new SupervisorAgent()

    // Set up trace listener to send real-time updates
    supervisor.onTrace = (trace: AgentTrace) => {
      sendLog(sessionId, {
        type: 'trace',
        trace,
        timestamp: new Date().toISOString()
      })
    }

    // Process the request with the supervisor
    log.agent('Delegating to specialized agents...', sessionId)

    // Process the request and capture agent usage
    const startTime = Date.now()
    const response = await supervisor.processRequest(message, actualUserId, sessionId)
    const endTime = Date.now()
    
    // Get enhanced traces from supervisor
    const traces = supervisor.getTraces()
    
    // Extract which agents were used from the traces
    const agentsUsed = traces
      .filter(trace => trace.agent && trace.status === 'success')
      .map(trace => trace.agent!)
      .filter((agent, index, array) => array.indexOf(agent) === index) // unique agents
    
    // Add final timing trace
    const finalTrace = {
      timestamp: new Date().toISOString(),
      action: 'Response generated',
      status: 'success' as const,
      details: `All agent tasks completed successfully in ${((endTime - startTime) / 1000).toFixed(1)}s`
    }
    traces.push(finalTrace)
    sendLog(sessionId, { type: 'trace', trace: finalTrace, timestamp: new Date().toISOString() })

    // Log successful response
    log.success(`Response generated using: ${agentsUsed.join(', ')}`, sessionId)

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

    // Get supervisor instance for this session
    const supervisor = supervisorInstances.get(sessionId)
    
    if (!supervisor) {
      return NextResponse.json({
        status: 'no_session',
        message: 'No active session found'
      })
    }

    // Get memory and traces from supervisor
    const memory = supervisor.getMemory()
    const traces = supervisor.getTraces()
    
    return NextResponse.json({
      status: 'active',
      memory: {
        totalInteractions: memory.combinedMemory.length,
        agentInteractions: Object.entries(memory.supervisorTeamMemory).map(([agent, interactions]) => ({
          agent,
          messageCount: interactions.length
        }))
      },
      traces
    })
  } catch (error) {
    console.error('❌ [SUPERVISOR] Error getting session status:', error)
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    )
  }
}

// Extract agents used from response (fallback method)
function extractAgentsUsed(response: string): string[] {
  const agents: string[] = []
  
  if (response.includes('Gmail') || response.includes('email')) {
    agents.push('Gmail Agent')
  }
  
  if (response.includes('Legal') || response.includes('contract') || response.includes('agreement')) {
    agents.push('Legal Agent')
  }
  
  return agents
}

// Store interaction in DynamoDB
async function storeInteraction(sessionId: string, userId: string, message: string, response: string) {
  // Skip storing if in development or table doesn't exist
  if (CONFIG.ENV !== 'production') {
    console.log('[SUPERVISOR] Skipping interaction storage in development mode')
    return
  }
  
  const tableName = 'SupervisorInteractions'
  
  try {
    await dynamoDB.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        sessionId: { S: sessionId },
        timestamp: { S: new Date().toISOString() },
        userId: { S: userId },
        userMessage: { S: message },
        supervisorResponse: { S: response },
        ttl: { N: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60).toString() } // 30 days TTL
      }
    }))
    console.log('[SUPERVISOR] Interaction stored successfully')
  } catch (error: any) {
    if (error.__type === 'com.amazonaws.dynamodb.v20120810#ResourceNotFoundException') {
      console.log('[SUPERVISOR] SupervisorInteractions table does not exist - skipping storage')
    } else {
      console.error('[SUPERVISOR] Failed to store interaction:', error.message || error)
    }
    // Don't throw - this is non-critical
  }
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