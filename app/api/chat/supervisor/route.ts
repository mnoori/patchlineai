import { NextRequest, NextResponse } from 'next/server'
import { SupervisorAgent } from '@/lib/supervisor-agent'

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
    const { message, userId, sessionId } = await request.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    const effectiveSessionId = sessionId || `${userId}-${Date.now()}`
    
    log.info(`Processing request from user: ${userId.substring(0, 8)}...`)
    log.info(`Session: ${effectiveSessionId}`)
    log.info(`Message: ${message}`)

    // Get or create supervisor instance for this session
    let supervisor = supervisorInstances.get(effectiveSessionId)
    if (!supervisor) {
      log.agent('Creating new SupervisorAgent instance')
      supervisor = new SupervisorAgent()
      supervisorInstances.set(effectiveSessionId, supervisor)
      
      // Clean up old sessions (keep max 100)
      if (supervisorInstances.size > 100) {
        const oldestKey = supervisorInstances.keys().next().value
        if (oldestKey) {
          supervisorInstances.delete(oldestKey)
        }
      }
    }

    // Process the request using agent-as-tools pattern
    log.agent('Delegating to specialized agents...')
    
    // Create a stream writer to send status updates
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()
    
    // Process in background
    processWithUpdates(supervisor, message, userId, effectiveSessionId, writer, encoder).then(() => {
      writer.close()
    }).catch((error) => {
      log.error(`Error in background processing: ${error.message}`)
      writer.close()
    })
    
    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    log.error(`Supervisor orchestration error: ${error.message}`)
    return NextResponse.json({ 
      error: 'Supervisor orchestration failed',
      details: error.message 
    }, { status: 500 })
  }
}

async function processWithUpdates(
  supervisor: SupervisorAgent,
  message: string,
  userId: string,
  sessionId: string,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder
) {
  // Send initial status
  await writer.write(encoder.encode(`data: ${JSON.stringify({ 
    type: 'status', 
    content: '🤖 Analyzing your request...' 
  })}\n\n`))
  
  // Check if this is a contract analysis request
  const isContractAnalysis = message.toLowerCase().includes('contract') || 
                           message.toLowerCase().includes('legal') ||
                           message.toLowerCase().includes('agreement')
  
  if (isContractAnalysis) {
    // Send Gmail agent status
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'status', 
      content: '📧 Searching your emails for contracts...' 
    })}\n\n`))
    
    // Small delay to make it feel natural
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Process the actual request
  const response = await supervisor.processRequest(message, userId, sessionId)
  
  if (isContractAnalysis && response.includes('CONTRACT_TEXT_BEGINS')) {
    // Send legal analysis status
    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
      type: 'status', 
      content: '⚖️ Analyzing contract with Legal Agent...' 
    })}\n\n`))
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Get memory for debugging
  const memory = supervisor.getMemory()
  const agentsUsed = Object.keys(memory.supervisorTeamMemory)
    .filter(agent => memory.supervisorTeamMemory[agent].length > 0)
  
  log.success(`Response generated using: ${agentsUsed.join(', ')}`)
  
  // Send the final response
  await writer.write(encoder.encode(`data: ${JSON.stringify({
    type: 'response',
    response,
    sessionId,
    workflow: 'supervisor-agent-as-tools',
    agentsUsed,
    memorySnapshot: {
      totalInteractions: memory.combinedMemory.length,
      agentInteractions: Object.entries(memory.supervisorTeamMemory).map(([agent, msgs]) => ({
        agent,
        messageCount: msgs.length
      }))
    }
  })}\n\n`))
}

// GET endpoint to check supervisor status
export async function GET(request: NextRequest) {
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