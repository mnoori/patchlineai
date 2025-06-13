/**
 * MCP (Model Context Protocol) type definitions for Patchline AI
 */

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPResource {
  uri: string
  name: string
  mimeType?: string
  description?: string
}

export interface MCPServer {
  name: string
  version: string
  capabilities: {
    tools?: boolean
    resources?: boolean
    prompts?: boolean
  }
}

export interface MCPToolCall {
  tool: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    uri?: string
  }>
}

export interface MCPClientConfig {
  zapier?: {
    enabled: boolean
    apiKey?: string
    serverUrl?: string
  }
  patchline?: {
    enabled: boolean
    serverUrl: string
  }
}

export interface MCPContext {
  userId: string
  sessionId: string
  permissions: string[]
}

export interface ZapierMCPConfig {
  apiKey: string
  enabled: boolean
  selectedActions: ZapierAction[]
}

export interface ZapierAction {
  id: string
  name: string
  description: string
  app: string
  type: 'trigger' | 'action'
  enabled: boolean
  configuration: Record<string, any>
}

export interface PatchlineMCPTool {
  name: string
  description: string
  category: 'music' | 'marketing' | 'legal' | 'analytics'
  parameters: Record<string, {
    type: string
    description: string
    required: boolean
    default?: any
  }>
  handler: (params: Record<string, any>, context: MCPContext) => Promise<MCPToolResult>
}

export interface MCPConnectionStatus {
  zapier: {
    connected: boolean
    lastSync?: Date
    availableActions: number
    error?: string
  }
  patchline: {
    connected: boolean
    lastSync?: Date
    availableTools: number
    error?: string
  }
}

export interface MCPAuditLog {
  id: string
  timestamp: Date
  userId: string
  sessionId: string
  toolName: string
  server: 'zapier' | 'patchline'
  parameters: Record<string, any>
  result: 'success' | 'error'
  error?: string
  duration: number
}

export interface MCPUserSettings {
  userId: string
  zapierConfig?: ZapierMCPConfig
  enabledTools: string[]
  permissions: string[]
  rateLimit: {
    hourly: number
    daily: number
    monthly: number
  }
  preferences: {
    autoConfirm: boolean
    notifications: boolean
    auditLogging: boolean
  }
} 