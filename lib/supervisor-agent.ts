import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from '@aws-sdk/client-bedrock-agent-runtime'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { CONFIG, GMAIL_AGENT, LEGAL_AGENT } from './config'
import { BEDROCK_MODELS } from './models-config'

// Agent Tool interface based on Agent Squad pattern
interface AgentTool {
  name: string
  description: string
  properties: Record<string, any>
  required: string[]
  func: (...args: any[]) => Promise<any>
}

// Enhanced trace interface
export interface AgentTrace {
  timestamp: string
  agent?: string
  action: string
  status: 'info' | 'success' | 'error' | 'delegating'
  details?: string
  emailData?: {
    subject?: string
    from?: string
    date?: string
  }
}

// Memory storage interface
interface ChatMemory {
  userSupervisorMemory: Array<{ role: string; content: string }>
  supervisorTeamMemory: Record<string, Array<{ role: string; content: string }>>
  combinedMemory: Array<{ role: string; content: string; agent?: string }>
}

// Initialize clients
const agentRuntime = new BedrockAgentRuntimeClient({
  region: CONFIG.AWS_REGION,
  credentials:
    CONFIG.AWS_ACCESS_KEY_ID && CONFIG.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
          secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
          ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN }),
        }
      : undefined,
})

const bedrockRuntime = new BedrockRuntimeClient({
  region: CONFIG.AWS_REGION,
  credentials:
    CONFIG.AWS_ACCESS_KEY_ID && CONFIG.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
          secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
          ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN }),
        }
      : undefined,
})

export class SupervisorAgent {
  private name: string
  private description: string
  private memory: ChatMemory
  private teamTools: AgentTool[]
  private traces: AgentTrace[]
  
  constructor() {
    this.name = "Patchline Supervisor"
    this.description = "Coordinates Gmail and Legal agents for music industry professionals"
    this.memory = {
      userSupervisorMemory: [],
      supervisorTeamMemory: {
        'Gmail Agent': [],
        'Legal Agent': []
      },
      combinedMemory: []
    }
    this.traces = []
    
    // Initialize team members as tools
    this.teamTools = [
      this.createGmailAgentTool(),
      this.createLegalAgentTool(),
      this.createSendMessagesTools()
    ]
  }

  // Add trace helper
  private addTrace(action: string, status: AgentTrace['status'], agent?: string, details?: string, emailData?: AgentTrace['emailData']) {
    this.traces.push({
      timestamp: new Date().toISOString(),
      action,
      status,
      agent,
      details,
      emailData
    })
  }

  // Extract email metadata from Gmail response
  private extractEmailMetadata(gmailResponse: string): AgentTrace['emailData'] | undefined {
    try {
      // Look for email patterns in the response
      const subjectMatch = gmailResponse.match(/Subject:\s*(.+?)(?:\n|$)/i)
      const fromMatch = gmailResponse.match(/From:\s*(.+?)(?:\n|$)/i)
      const dateMatch = gmailResponse.match(/Date:\s*(.+?)(?:\n|$)/i)
      
      if (subjectMatch || fromMatch || dateMatch) {
        return {
          subject: subjectMatch?.[1]?.trim(),
          from: fromMatch?.[1]?.trim(),
          date: dateMatch?.[1]?.trim()
        }
      }
    } catch (error) {
      console.warn('Failed to extract email metadata:', error)
    }
    return undefined
  }

  // Create Gmail Agent as a tool
  private createGmailAgentTool(): AgentTool {
    return {
      name: 'gmail_agent',
      description: 'Handles email operations - search, read, draft, and send emails',
      properties: {
        message: {
          type: 'string',
          description: 'The request to send to the Gmail agent'
        }
      },
      required: ['message'],
      func: async (message: string) => {
        this.addTrace('Delegating to Gmail Agent', 'delegating', 'Gmail Agent', 'Searching and reading emails...')
        
        // Record supervisor->team communication
        this.memory.supervisorTeamMemory['Gmail Agent'].push({
          role: 'supervisor',
          content: message
        })
        
        try {
          // Invoke Gmail agent
          const command = new InvokeAgentCommand({
            agentId: GMAIL_AGENT.agentId,
            agentAliasId: GMAIL_AGENT.agentAliasId,
            sessionId: `supervisor-gmail-${Date.now()}`,
            inputText: message,
          })
          
          const response = await agentRuntime.send(command)
          let agentResponse = ''
          
          if (response.completion) {
            for await (const chunk of response.completion) {
              if (chunk.chunk?.bytes) {
                agentResponse += new TextDecoder().decode(chunk.chunk.bytes)
              }
            }
          }
          
          // Extract email metadata for traces
          const emailData = this.extractEmailMetadata(agentResponse)
          
          // Record team->supervisor response
          this.memory.supervisorTeamMemory['Gmail Agent'].push({
            role: 'agent',
            content: agentResponse
          })
          
          // Add to combined memory
          this.memory.combinedMemory.push({
            role: 'assistant',
            content: agentResponse,
            agent: 'Gmail Agent'
          })
          
          // Add success trace with email metadata
          this.addTrace(
            'Gmail Agent completed', 
            'success', 
            'Gmail Agent', 
            emailData ? `Found email: "${emailData.subject}"` : 'Email search completed',
            emailData
          )
          
          return agentResponse
          
        } catch (error) {
          this.addTrace('Gmail Agent failed', 'error', 'Gmail Agent', error instanceof Error ? error.message : 'Unknown error')
          throw error
        }
      }
    }
  }

  // Create Legal Agent as a tool
  private createLegalAgentTool(): AgentTool {
    return {
      name: 'legal_agent',
      description: 'Analyzes contracts, legal documents, and provides legal assessments',
      properties: {
        message: {
          type: 'string',
          description: 'The contract or legal query to send to the Legal agent'
        }
      },
      required: ['message'],
      func: async (message: string) => {
        this.addTrace('Delegating to Legal Agent', 'delegating', 'Legal Agent', 'Analyzing contract terms and legal implications...')
        
        // Record supervisor->team communication
        this.memory.supervisorTeamMemory['Legal Agent'].push({
          role: 'supervisor',
          content: message
        })
        
        try {
          // Invoke Legal agent
          const command = new InvokeAgentCommand({
            agentId: LEGAL_AGENT.agentId,
            agentAliasId: LEGAL_AGENT.agentAliasId,
            sessionId: `supervisor-legal-${Date.now()}`,
            inputText: message,
          })
          
          const response = await agentRuntime.send(command)
          let agentResponse = ''
          
          if (response.completion) {
            for await (const chunk of response.completion) {
              if (chunk.chunk?.bytes) {
                agentResponse += new TextDecoder().decode(chunk.chunk.bytes)
              }
            }
          }
          
          // Record team->supervisor response
          this.memory.supervisorTeamMemory['Legal Agent'].push({
            role: 'agent',
            content: agentResponse
          })
          
          // Add to combined memory
          this.memory.combinedMemory.push({
            role: 'assistant',
            content: agentResponse,
            agent: 'Legal Agent'
          })
          
          // Add success trace
          this.addTrace('Legal Agent completed', 'success', 'Legal Agent', 'Contract analysis and risk assessment completed')
          
          return agentResponse
          
        } catch (error) {
          this.addTrace('Legal Agent failed', 'error', 'Legal Agent', error instanceof Error ? error.message : 'Unknown error')
          throw error
        }
      }
    }
  }

  // Create parallel message tool
  private createSendMessagesTools(): AgentTool {
    return {
      name: 'send_messages',
      description: 'Send messages to multiple agents in parallel',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recipient: {
                type: 'string',
                description: 'Agent name to send message to (gmail_agent or legal_agent)'
              },
              content: {
                type: 'string',
                description: 'Message content'
              }
            }
          },
          description: 'Array of messages for different agents',
          minItems: 1
        }
      },
      required: ['messages'],
      func: async (messages: Array<{recipient: string; content: string}>) => {
        this.addTrace('Parallel agent execution', 'delegating', 'Multiple Agents', `Coordinating ${messages.length} agents simultaneously`)
        
        const results = await Promise.all(
          messages.map(async (msg) => {
            if (msg.recipient === 'gmail_agent') {
              return {
                agent: 'Gmail Agent',
                response: await this.teamTools[0].func(msg.content)
              }
            } else if (msg.recipient === 'legal_agent') {
              return {
                agent: 'Legal Agent',
                response: await this.teamTools[1].func(msg.content)
              }
            }
            return null
          })
        )
        
        const validResults = results.filter(r => r !== null)
        this.addTrace('Parallel execution completed', 'success', 'Multiple Agents', `${validResults.length} agents completed successfully`)
        
        return validResults
      }
    }
  }

  // Process user request using supervisor with tools
  async processRequest(userInput: string, userId: string, sessionId: string): Promise<string> {
    // Clear previous traces for new request
    this.traces = []
    
    this.addTrace('Request analysis started', 'info', undefined, 'Supervisor analyzing user request and planning workflow')
    
    // Add user message to memory
    this.memory.userSupervisorMemory.push({
      role: 'user',
      content: userInput
    })
    
    this.memory.combinedMemory.push({
      role: 'user',
      content: userInput
    })

    // Build the supervisor prompt with tool definitions
    const toolsPrompt = this.buildToolsPrompt()
    const memoryContext = this.buildMemoryContext()
    
    const supervisorPrompt = `You are ${this.name}, ${this.description}.

${memoryContext}

You have access to the following tools to help coordinate responses:

${toolsPrompt}

When you need to delegate tasks:
1. For email-related queries, use the gmail_agent tool
2. For legal document analysis, use the legal_agent tool
3. For parallel processing, use send_messages to query multiple agents at once

IMPORTANT: 
- Always use tools to delegate to specialized agents
- Never try to answer email or legal questions yourself
- Coordinate and synthesize responses from the agents
- Use send_messages for efficiency when you need both agents

User Query: ${userInput}`;

    try {
      // Use Nova model for supervisor coordination
      const command = new InvokeModelCommand({
        modelId: "amazon.nova-micro-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [{ text: supervisorPrompt }]
            }
          ],
          system: [{ 
            text: "You are a supervisor agent that coordinates between specialized agents. Always delegate tasks to the appropriate agents and synthesize their responses." 
          }],
          inferenceConfig: { 
            max_new_tokens: 2048,
            temperature: 0.7,
            top_p: 0.9
          }
        })
      })

      const response = await bedrockRuntime.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      
      // Process Nova model response
      const content = responseBody?.output?.message?.content?.[0]?.text || "I could not understand your request."
      
      this.addTrace('Workflow planning completed', 'success', undefined, 'Email search → Contract extraction → Legal analysis')
      
      // STEP 1: Ask Gmail agent to find the contract email
      const gmailPrompt = `Search my emails for the most recent contract or legal agreement from ${userInput.includes('Mehdi') ? 'Mehdi' : 'anyone'}.
Look for emails containing: contract, agreement, terms, license, distribution, publishing, royalty, payment terms.
Please provide the full email content including the contract text.`

      const gmailResponse = await this.teamTools[0].func(gmailPrompt)

      if (!gmailResponse || gmailResponse.trim() === '') {
        const noEmailMsg = 'I could not find any relevant contract emails.'
        this.memory.userSupervisorMemory.push({ role: 'assistant', content: noEmailMsg })
        this.addTrace('Workflow completed', 'error', undefined, 'No contract emails found')
        return noEmailMsg
      }

      // STEP 2: Pass the raw email content directly to Legal agent
      const legalPrompt = `Please analyze the following email content for any contracts or legal agreements. 
Extract and analyze any contract text you find within this email content.

Provide a structured assessment with:
1. EXECUTIVE SUMMARY (Risk Level: LOW/MODERATE/HIGH, Key Points, Action Items)
2. KEY TERMS BREAKDOWN (Compensation, Rights, Territory/Duration, Exclusivity, Obligations)
3. RED FLAGS & CONCERNS (Missing Protections, Unusual Terms, Ambiguities, Unfavorable Clauses)
4. INDUSTRY CONTEXT (Comparative Analysis, Market Rate Assessment)
5. PRACTICAL RECOMMENDATIONS (Negotiation Points, Required Changes, Next Steps)

Format with clear headers, bullet points, and minimal jargon.
Include numeric values when analyzing financials.
Note that your analysis is not a substitute for attorney review.

EMAIL CONTENT:
${gmailResponse}`

      const legalResponse = await this.teamTools[1].func(legalPrompt)

      // Combine results
      const combined = `# Contract Analysis Report\n\n${legalResponse}`

      // Record supervisor response
      this.memory.userSupervisorMemory.push({ role: 'assistant', content: combined })

      this.addTrace('Workflow completed successfully', 'success', undefined, 'Contract analysis report generated and delivered')

      return combined

    } catch (error: any) {
      console.error('Supervisor error:', error)
      this.addTrace('Workflow failed', 'error', undefined, error.message)
      throw new Error(`Supervisor orchestration failed: ${error.message}`)
    }
  }

  // Get traces
  getTraces(): AgentTrace[] {
    return this.traces
  }

  // Build tools prompt for the supervisor
  private buildToolsPrompt(): string {
    return this.teamTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n')
  }

  // Build memory context
  private buildMemoryContext(): string {
    if (this.memory.combinedMemory.length === 0) {
      return "This is the start of our conversation."
    }
    
    return `<agents_memory>
${this.memory.combinedMemory.map(msg => 
  msg.agent 
    ? `${msg.role === 'user' ? 'User' : `[${msg.agent}]`}: ${msg.content}`
    : `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
).join('\n')}
</agents_memory>`
  }

  // Format tools for Claude/Bedrock
  private formatToolsForClaude() {
    return this.teamTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: "object",
        properties: tool.properties,
        required: tool.required
      }
    }))
  }

  // Get conversation memory
  getMemory(): ChatMemory {
    return this.memory
  }

  // Clear memory
  clearMemory(): void {
    this.memory = {
      userSupervisorMemory: [],
      supervisorTeamMemory: {
        'Gmail Agent': [],
        'Legal Agent': []
      },
      combinedMemory: []
    }
    this.traces = []
  }
} 