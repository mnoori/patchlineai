/**
 * MCP-Enhanced Supervisor Agent for Patchline AI
 * Extends the existing supervisor with MCP tool capabilities
 */

import { SupervisorAgent, AgentTrace } from './supervisor-agent'
import { PatchlineMCPClient } from './mcp/client'
import { 
  MCPClientConfig, 
  MCPContext, 
  MCPTool, 
  MCPToolCall, 
  MCPToolResult,
  MCPConnectionStatus 
} from './mcp/types'
import { CONFIG } from './config'
import { agentName } from './agent-utils'

export class MCPEnhancedSupervisor extends SupervisorAgent {
  private mcpClient: PatchlineMCPClient
  private mcpContext?: MCPContext
  private availableTools: MCPTool[] = []
  
  constructor() {
    super()
    
    // Initialize MCP client with configuration
    const mcpConfig: MCPClientConfig = {
      zapier: {
        enabled: true,
        // In production, this would come from user settings
        apiKey: process.env.ZAPIER_API_KEY,
        serverUrl: process.env.ZAPIER_MCP_URL
      },
      patchline: {
        enabled: true,
        serverUrl: process.env.PATCHLINE_MCP_URL || 'http://localhost:3001/mcp'
      }
    }
    
    this.mcpClient = new PatchlineMCPClient(mcpConfig)
  }
  
  /**
   * Initialize MCP capabilities
   */
  async initializeMCP(userId: string, sessionId: string): Promise<void> {
    this.mcpContext = {
      userId,
      sessionId,
      permissions: ['read', 'write', 'execute'] // In production, get from user settings
    }
    
    try {
      await this.mcpClient.initialize(this.mcpContext)
      this.availableTools = await this.mcpClient.discoverTools()
      
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: 'MCP initialized',
        status: 'success',
        details: `Connected to MCP servers. ${this.availableTools.length} tools available.`
      })
    } catch (error) {
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: 'MCP initialization failed',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
  
  /**
   * Enhanced process request with MCP capabilities
   */
  async processRequestWithMCP(userInput: string, userId: string, sessionId: string): Promise<string> {
    // Initialize MCP if not already done
    if (!this.mcpContext) {
      await this.initializeMCP(userId, sessionId)
    }
    
    // Clear previous traces for new request
    this.traces = []
    
    this.addTrace({
      timestamp: new Date().toISOString(),
      action: 'Enhanced request analysis started',
      status: 'info',
      details: 'Supervisor analyzing request with MCP tool capabilities'
    })
    
    // Build enhanced prompt with MCP tools
    const enhancedPrompt = this.buildMCPEnhancedPrompt(userInput)
    
    // Process with enhanced capabilities
    return this.executeWithMCPTools(enhancedPrompt, userInput)
  }
  
  /**
   * Build prompt that includes MCP tool capabilities
   */
  private buildMCPEnhancedPrompt(userInput: string): string {
    const toolsDescription = this.buildToolsDescription()
    const connectionStatus = this.mcpClient.getConnectionStatus()
    
    return `You are ${agentName()} Supervisor, an advanced AI coordinator for music industry professionals.

CURRENT CAPABILITIES:
- Traditional Bedrock agents: Gmail, Legal, Scout, Blockchain
- MCP Tools: ${this.availableTools.length} tools available
  - Zapier: ${connectionStatus.zapier.connected ? connectionStatus.zapier.availableActions + ' actions' : 'disconnected'}
  - Patchline: ${connectionStatus.patchline.connected ? connectionStatus.patchline.availableTools + ' tools' : 'disconnected'}

AVAILABLE MCP TOOLS:
${toolsDescription}

ENHANCED WORKFLOW:
1. Analyze the user's request
2. Determine if MCP tools can help (social media, calendar, email automation, music analytics)
3. Choose between traditional agents and MCP tools based on the task
4. Execute actions and provide comprehensive results

USER REQUEST: ${userInput}

Please analyze this request and determine the best approach. If MCP tools would be helpful, specify which tools to use and with what parameters. If traditional agents are better suited, delegate accordingly.

Respond with your analysis and action plan.`
  }
  
  /**
   * Build description of available MCP tools
   */
  private buildToolsDescription(): string {
    if (this.availableTools.length === 0) {
      return 'No MCP tools currently available.'
    }
    
    return this.availableTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n')
  }
  
  /**
   * Execute request with MCP tool integration
   */
  private async executeWithMCPTools(prompt: string, originalInput: string): Promise<string> {
    try {
      // First, get supervisor's analysis and plan
      const supervisorResponse = await this.invokeSupervisorAgent(prompt, `mcp-${Date.now()}`)
      
      // Parse supervisor response to see if it wants to use MCP tools
      const mcpToolCalls = this.extractMCPToolCalls(supervisorResponse)
      
      if (mcpToolCalls.length > 0) {
        // Execute MCP tools
        const mcpResults = await this.executeMCPTools(mcpToolCalls)
        
        // Combine results with supervisor response
        return this.combineResults(supervisorResponse, mcpResults)
      } else {
        // No MCP tools needed, return supervisor response
        return supervisorResponse
      }
    } catch (error) {
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: 'Enhanced processing failed',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Fallback to traditional processing
      return this.processRequest(originalInput, this.mcpContext!.userId, this.mcpContext!.sessionId)
    }
  }
  
  /**
   * Extract MCP tool calls from supervisor response
   */
  private extractMCPToolCalls(response: string): MCPToolCall[] {
    const toolCalls: MCPToolCall[] = []
    
    // Look for tool call patterns in the response
    // This is a simplified parser - in production, you'd want more robust parsing
    const toolCallRegex = /USE_MCP_TOOL:\s*(\w+)\s*\{([^}]+)\}/g
    let match
    
    while ((match = toolCallRegex.exec(response)) !== null) {
      try {
        const toolName = match[1]
        const argsString = match[2]
        
        // Parse arguments (simplified JSON parsing)
        const args: Record<string, any> = {}
        const argPairs = argsString.split(',')
        
        for (const pair of argPairs) {
          const [key, value] = pair.split(':').map(s => s.trim())
          if (key && value) {
            // Remove quotes and parse value
            const cleanKey = key.replace(/['"]/g, '')
            const cleanValue = value.replace(/['"]/g, '')
            args[cleanKey] = cleanValue
          }
        }
        
        toolCalls.push({
          tool: toolName,
          arguments: args
        })
      } catch (error) {
        console.warn('Failed to parse MCP tool call:', match[0])
      }
    }
    
    return toolCalls
  }
  
  /**
   * Execute multiple MCP tools
   */
  private async executeMCPTools(toolCalls: MCPToolCall[]): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = []
    
    for (const toolCall of toolCalls) {
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: `Executing MCP tool: ${toolCall.tool}`,
        status: 'info',
        details: `Parameters: ${JSON.stringify(toolCall.arguments)}`
      })
      
      try {
        const result = await this.mcpClient.executeTool(toolCall)
        results.push(result)
        
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: `MCP tool completed: ${toolCall.tool}`,
          status: 'success',
          details: result.content[0]?.text || 'Tool executed successfully'
        })
      } catch (error) {
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: `MCP tool failed: ${toolCall.tool}`,
          status: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Add error result
        results.push({
          content: [{
            type: 'text',
            text: `Error executing ${toolCall.tool}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        })
      }
    }
    
    return results
  }
  
  /**
   * Combine supervisor response with MCP tool results
   */
  private combineResults(supervisorResponse: string, mcpResults: MCPToolResult[]): string {
    let combinedResponse = supervisorResponse
    
    // Remove tool call instructions from response
    combinedResponse = combinedResponse.replace(/USE_MCP_TOOL:\s*\w+\s*\{[^}]+\}/g, '')
    
    // Add MCP tool results
    if (mcpResults.length > 0) {
      combinedResponse += '\n\n**Actions Completed:**\n'
      
      mcpResults.forEach((result, index) => {
        const resultText = result.content[0]?.text || 'Action completed'
        combinedResponse += `${index + 1}. ${resultText}\n`
      })
    }
    
    return combinedResponse.trim()
  }
  
  /**
   * Get MCP connection status
   */
  getMCPStatus(): MCPConnectionStatus {
    return this.mcpClient.getConnectionStatus()
  }
  
  /**
   * Get available MCP tools
   */
  getAvailableTools(): MCPTool[] {
    return [...this.availableTools]
  }
  
  /**
   * Refresh MCP tools
   */
  async refreshMCPTools(): Promise<void> {
    if (this.mcpContext) {
      this.availableTools = await this.mcpClient.discoverTools()
      
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: 'MCP tools refreshed',
        status: 'success',
        details: `${this.availableTools.length} tools available`
      })
    }
  }
  
  /**
   * Disconnect MCP clients
   */
  async disconnectMCP(): Promise<void> {
    await this.mcpClient.disconnect()
    this.mcpContext = undefined
    this.availableTools = []
    
    this.addTrace({
      timestamp: new Date().toISOString(),
      action: 'MCP disconnected',
      status: 'info',
      details: 'All MCP connections closed'
    })
  }
} 