/**
 * Supervisor Stream Utilities
 * Handles real-time log streaming for supervisor sessions
 */

// Store active connections
export const connections = new Map<string, ReadableStreamDefaultController<any>>()

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