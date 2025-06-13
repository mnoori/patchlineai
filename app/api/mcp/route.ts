import { NextRequest, NextResponse } from 'next/server'
import { MCPEnhancedSupervisor } from '@/lib/supervisor-agent-mcp'
import { MCPConnectionStatus, MCPTool } from '@/lib/mcp/types'

// Global supervisor instance (in production, you'd want proper session management)
let supervisorInstance: MCPEnhancedSupervisor | null = null

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'status':
        return handleGetStatus()
      case 'tools':
        return handleGetTools()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[MCP API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'initialize':
        return handleInitialize(params)
      case 'execute':
        return handleExecute(params)
      case 'refresh':
        return handleRefresh(params)
      case 'disconnect':
        return handleDisconnect(params)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[MCP API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleGetStatus(): Promise<NextResponse> {
  if (!supervisorInstance) {
    return NextResponse.json({
      status: {
        zapier: { connected: false, availableActions: 0 },
        patchline: { connected: false, availableTools: 0 }
      }
    })
  }

  const status = supervisorInstance.getMCPStatus()
  return NextResponse.json({ status })
}

async function handleGetTools(): Promise<NextResponse> {
  if (!supervisorInstance) {
    return NextResponse.json({ tools: [] })
  }

  const tools = supervisorInstance.getAvailableTools()
  return NextResponse.json({ tools })
}

async function handleInitialize(params: {
  userId: string
  sessionId: string
}): Promise<NextResponse> {
  try {
    if (!supervisorInstance) {
      supervisorInstance = new MCPEnhancedSupervisor()
    }

    await supervisorInstance.initializeMCP(params.userId, params.sessionId)
    const status = supervisorInstance.getMCPStatus()
    const tools = supervisorInstance.getAvailableTools()

    return NextResponse.json({
      success: true,
      status,
      tools
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Initialization failed' 
      },
      { status: 500 }
    )
  }
}

async function handleExecute(params: {
  userInput: string
  userId: string
  sessionId: string
}): Promise<NextResponse> {
  try {
    if (!supervisorInstance) {
      supervisorInstance = new MCPEnhancedSupervisor()
      await supervisorInstance.initializeMCP(params.userId, params.sessionId)
    }

    const response = await supervisorInstance.processRequestWithMCP(
      params.userInput,
      params.userId,
      params.sessionId
    )

    const traces = supervisorInstance.getTraces()

    return NextResponse.json({
      success: true,
      response,
      traces
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Execution failed' 
      },
      { status: 500 }
    )
  }
}

async function handleRefresh(params: {
  userId?: string
  sessionId?: string
}): Promise<NextResponse> {
  try {
    if (!supervisorInstance) {
      return NextResponse.json(
        { success: false, error: 'MCP not initialized' },
        { status: 400 }
      )
    }

    await supervisorInstance.refreshMCPTools()
    const status = supervisorInstance.getMCPStatus()
    const tools = supervisorInstance.getAvailableTools()

    return NextResponse.json({
      success: true,
      status,
      tools
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Refresh failed' 
      },
      { status: 500 }
    )
  }
}

async function handleDisconnect(params: {
  userId?: string
  sessionId?: string
}): Promise<NextResponse> {
  try {
    if (supervisorInstance) {
      await supervisorInstance.disconnectMCP()
      supervisorInstance = null
    }

    return NextResponse.json({
      success: true,
      status: {
        zapier: { connected: false, availableActions: 0 },
        patchline: { connected: false, availableTools: 0 }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Disconnect failed' 
      },
      { status: 500 }
    )
  }
} 