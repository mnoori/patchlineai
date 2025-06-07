import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController<any>>()

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
      
      // Store the controller for this session
      connections.set(sessionId, controller as any)
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          clearInterval(heartbeat)
          connections.delete(sessionId)
        }
      }, 30000)
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        connections.delete(sessionId)
        try {
          controller.close()
        } catch (e) {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}

// Export function to send logs to connected clients
export function sendLog(sessionId: string, log: any) {
  const controller = connections.get(sessionId)
  if (controller) {
    try {
      const encoder = new TextEncoder()
      const data = `data: ${JSON.stringify(log)}\n\n`
      controller.enqueue(encoder.encode(data))
    } catch (error) {
      // Connection closed, remove it
      connections.delete(sessionId)
    }
  }
} 