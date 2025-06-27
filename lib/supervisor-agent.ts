import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from '@aws-sdk/client-bedrock-agent-runtime'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { CONFIG, GMAIL_AGENT, LEGAL_AGENT, BLOCKCHAIN_AGENT, SUPERVISOR_AGENT } from './config'
import { BEDROCK_MODELS } from './models-config'
import { agentName } from './agent-utils'

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
  protected traces: AgentTrace[] = []
  private userSupervisorMemory: Array<{ role: string; content: string }> = []
  private supervisorTeamMemory: Record<string, Array<{ role: string; content: string }>> = {}
  private combinedMemory: Array<{ role: string; content: string; agent?: string }> = []
  
  // Callback for real-time trace updates
  public onTrace?: (trace: AgentTrace) => void

  constructor() {
    this.name = `${agentName()} Supervisor`
    this.description = "Coordinates Gmail and Legal agents for music industry professionals"
    this.memory = {
      userSupervisorMemory: [],
      supervisorTeamMemory: {
        'Gmail Agent': [],
        'Legal Agent': []
      },
      combinedMemory: []
    }
    
    // This needs to be dynamic based on the user session
    const tempUserIdForInit = 'temporary-user-id';
    
    // Initialize team members as tools
    this.teamTools = [
      this.createGmailAgentTool(tempUserIdForInit),
      this.createLegalAgentTool(),
      this.createSendMessagesTools()
    ]
  }

  protected addTrace(trace: AgentTrace) {
    this.traces.push(trace)
    // Call the callback if set
    if (this.onTrace) {
      this.onTrace(trace)
    }
  }

  // Extract email metadata from Gmail response
  private extractEmailMetadata(gmailResponse: string): AgentTrace['emailData'] | undefined {
    try {
      // Look for various email patterns in the response
      // Pattern 1: Standard email headers
      const subjectMatch = gmailResponse.match(/Subject:\s*(.+?)(?:\n|$)/i) || 
                          gmailResponse.match(/subject[:\s]+["']?(.+?)["']?(?:\n|,|$)/i)
      const fromMatch = gmailResponse.match(/From:\s*(.+?)(?:\n|$)/i) || 
                       gmailResponse.match(/from[:\s]+["']?(.+?)["']?(?:\n|,|$)/i) ||
                       gmailResponse.match(/sender[:\s]+["']?(.+?)["']?(?:\n|,|$)/i)
      const dateMatch = gmailResponse.match(/Date:\s*(.+?)(?:\n|$)/i) || 
                       gmailResponse.match(/date[:\s]+["']?(.+?)["']?(?:\n|,|$)/i) ||
                       gmailResponse.match(/sent[:\s]+["']?(.+?)["']?(?:\n|,|$)/i)
      
      // Pattern 2: Look for email structure in JSON-like format
      if (!subjectMatch && !fromMatch) {
        // Try to find email data in structured format
        const emailMatch = gmailResponse.match(/email[^{]*{([^}]+)}/i)
        if (emailMatch) {
          const emailContent = emailMatch[1]
          const subjectInContent = emailContent.match(/subject[:\s]+["']?([^"',]+)["']?/i)
          const fromInContent = emailContent.match(/from[:\s]+["']?([^"',]+)["']?/i)
          const dateInContent = emailContent.match(/date[:\s]+["']?([^"',]+)["']?/i)
          
          if (subjectInContent || fromInContent || dateInContent) {
            return {
              subject: subjectInContent?.[1]?.trim(),
              from: fromInContent?.[1]?.trim(),
              date: dateInContent?.[1]?.trim()
            }
          }
        }
      }
      
      // Pattern 3: Look for contract-specific patterns
      if (!subjectMatch) {
        const contractMatch = gmailResponse.match(/(?:contract|agreement|deal)(?:\s+(?:for|with|from))?\s+["']?([^"'\n]+?)["']?(?:\s+from\s+([^"'\n]+?))?/i)
        if (contractMatch) {
          return {
            subject: contractMatch[1]?.trim() || 'Contract/Agreement',
            from: contractMatch[2]?.trim() || fromMatch?.[1]?.trim(),
            date: dateMatch?.[1]?.trim()
          }
        }
      }
      
      if (subjectMatch || fromMatch || dateMatch) {
        return {
          subject: subjectMatch?.[1]?.trim(),
          from: fromMatch?.[1]?.trim(),
          date: dateMatch?.[1]?.trim()
        }
      }
      
      // Pattern 4: Last resort - look for any email-like content
      const anyEmailPattern = gmailResponse.match(/(?:email|message|correspondence).*?(?:from|by)\s+([^\s,]+(?:\s+[^\s,]+)?)/i)
      if (anyEmailPattern) {
        return {
          subject: 'Email correspondence',
          from: anyEmailPattern[1]?.trim(),
          date: 'Recent'
        }
      }
    } catch (error) {
      console.warn('Failed to extract email metadata:', error)
    }
    return undefined
  }

  // Create Gmail Agent as a tool
  private createGmailAgentTool(userId: string): AgentTool {
    return {
      name: 'gmail_agent',
      description: 'Handles email operations including searching, reading, and managing Gmail messages',
      properties: {
        message: {
          type: 'string',
          description: 'The email search query or natural language request'
        }
      },
      required: ['message'],
      func: async (args: any) => {
        console.log('[Gmail Agent] Starting email operation:', args);
        
        // Add trace for Gmail operation
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Searching Gmail...',
          status: 'info',
          agent: 'Internal Gmail Service',
          details: `Query: ${args.message || args}`
        });
        
        try {
          // Convert natural language to Gmail search query
          let searchQuery = args.message || args.query || args || '';
          
          // Simple natural language to Gmail query conversion
          if (searchQuery.toLowerCase().includes('from tom')) {
            searchQuery = 'from:Tom';
          } else if (searchQuery.toLowerCase().includes('email from')) {
            const match = searchQuery.match(/email from (\w+)/i);
            if (match) {
              searchQuery = `from:${match[1]}`;
            }
          } else if (searchQuery.toLowerCase().includes('unread')) {
            searchQuery = 'is:unread';
          } else if (searchQuery.toLowerCase().includes('today')) {
            searchQuery = 'after:today';
          } else if (searchQuery.toLowerCase().includes('attachment')) {
            searchQuery = 'has:attachment';
          }
          
          console.log('[Gmail Agent] Converted query:', searchQuery);
          
          // Call our internal Gmail API
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              query: searchQuery
            })
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Gmail search failed');
          }

          console.log('[Gmail Agent] Search results:', data);
          
          // Add success trace
          this.addTrace({
            timestamp: new Date().toISOString(),
            action: 'Gmail search complete',
            status: 'success',
            agent: 'Internal Gmail Service',
            details: data.result || `Found ${data.emails?.length || 0} emails.`
          });
          
          // Format the response
          if (data.emails && data.emails.length > 0) {
            let emailSummary = `Found ${data.emails.length} email(s):\n\n`;
            data.emails.forEach((email: any, index: number) => {
              emailSummary += `${index + 1}. From: ${email.from}\n`;
              emailSummary += `   Subject: ${email.subject}\n`;
              emailSummary += `   Preview: ${email.snippet.substring(0, 100)}...\n\n`;
            });
            return emailSummary;
          } else {
            return data.result || 'No emails found matching your query.';
          }
          
        } catch (error: any) {
          console.error('[Gmail Agent] Error:', error);
          
          // Add error trace
          this.addTrace({
            timestamp: new Date().toISOString(),
            action: 'Gmail Search Failed',
            status: 'error',
            agent: 'Internal Gmail Service',
            details: error.message
          });
          
          throw new Error(`Gmail search failed: ${error.message}`);
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
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Delegating to Legal Agent',
          status: 'delegating',
          agent: 'Legal Agent',
          details: 'Analyzing contract terms and legal implications...'
        })
        
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
            try {
              for await (const chunk of response.completion) {
                if (chunk.chunk?.bytes) {
                  agentResponse += new TextDecoder().decode(chunk.chunk.bytes)
                }
              }
            } catch (streamError) {
              console.error('Error reading completion stream:', streamError)
              // Fallback to any available response data
              throw new Error('Failed to read agent response')
            }
          } else {
            // No completion stream available
            throw new Error('No response from Legal agent')
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
          this.addTrace({
            timestamp: new Date().toISOString(),
            action: 'Legal Agent completed',
            status: 'success',
            agent: 'Legal Agent',
            details: 'Contract analysis and risk assessment completed'
          })
          
          return agentResponse
          
        } catch (error) {
          this.addTrace({
            timestamp: new Date().toISOString(),
            action: 'Legal Agent failed',
            status: 'error',
            agent: 'Legal Agent',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
          
          // Handle specific AWS errors
          if (error instanceof Error && (error.name === 'DependencyFailedException' || error.name === 'ResourceNotFoundException' || (error as any).$fault === 'client')) {
            console.error('AWS Agent dependency error:', error)
            
            // For Legal-specific queries, provide a helpful response
            if (error.message.includes("doesn't exist")) {
              return 'I apologize, but the Legal agent is not properly configured. I can still provide general guidance on contracts and legal matters, but for detailed analysis, the specialized Legal agent needs to be set up.'
            }
            
            return 'The Legal agent is temporarily unavailable. Please try again in a moment.'
          }
          
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
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Parallel agent execution',
          status: 'delegating',
          agent: 'Multiple Agents',
          details: `Coordinating ${messages.length} agents simultaneously`
        })
        
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
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Parallel execution completed',
          status: 'success',
          agent: 'Multiple Agents',
          details: `${validResults.length} agents completed successfully`
        })
        
        return validResults
      }
    }
  }

  // Process user request using supervisor with tools
  async processRequest(userInput: string, userId: string, sessionId: string): Promise<string> {
    this.addTrace({ timestamp: new Date().toISOString(), action: 'Request analysis started', status: 'info', details: 'Supervisor analyzing user request and planning workflow' })
    
    // IMPORTANT: Re-create the Gmail tool with the actual userId for this request
    this.teamTools = [
      this.createGmailAgentTool(userId),
      this.createLegalAgentTool(),
      this.createSendMessagesTools()
    ];

    // Add user input to memory
    this.memory.userSupervisorMemory.push({ role: 'user', content: userInput })
    
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
      // Simple intent routing based on user input
      const lowerInput = userInput.toLowerCase()
      
      // Check for simple greetings or general queries that don't need delegation
      const greetingPatterns = ['hey', 'hi', 'hello', 'good morning', 'good afternoon', 'good evening', 'how are you', 'what\'s up', 'sup']
      const isGreeting = greetingPatterns.some(pattern => lowerInput.includes(pattern) && lowerInput.length < 20)
      
      if (isGreeting) {
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Direct response',
          status: 'success',
          details: 'Greeting detected - responding directly'
        })
        
        const greetingResponse = `Hello! I'm ${agentName()}, your AI supervisor coordinating between specialized agents. I can help you with:

• **Email Management** - Search, read, draft, and send emails through our Gmail Agent
• **Legal Analysis** - Review contracts and legal documents with our Legal Agent
• **Blockchain Operations** - Handle crypto transactions via our Blockchain Agent
• **Artist Discovery** - Find promising talent using our Scout Agent

What would you like help with today?`
        
        this.memory.userSupervisorMemory.push({ role: 'assistant', content: greetingResponse })
        return greetingResponse
      }
      
      // Check if user is asking about contracts/agreements that might be in emails
      if ((lowerInput.includes('contract') || lowerInput.includes('agreement')) && 
          (lowerInput.includes('send') || lowerInput.includes('sent') || lowerInput.includes('email') || 
           lowerInput.includes('mehdi') || lowerInput.includes('ael') || lowerInput.includes('from'))) {
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Multi-agent workflow',
          status: 'info',
          details: 'Contract search workflow initiated - checking emails first'
        })
        
        // STEP 1: Ask Gmail agent to find the contract email
        const gmailPrompt = userInput.includes('mehdi') 
          ? `Search for emails from Mehdi containing contracts, agreements, or legal documents. Include the full email content.`
          : userInput.includes('ael')
          ? `Search for emails from Ael containing contracts, agreements, or legal documents. Include the full email content.`
          : `Search my emails for contracts or legal agreements based on this query: ${userInput}. Include the full email content.`
        
        const gmailResponse = await this.teamTools[0].func(gmailPrompt)
        
        if (!gmailResponse || gmailResponse.trim() === '' || gmailResponse.includes('no emails found') || gmailResponse.includes('could not find')) {
          const noEmailMsg = `I searched for emails matching your query but couldn't find any contracts or agreements${userInput.includes('mehdi') ? ' from Mehdi' : userInput.includes('ael') ? ' from Ael' : ''}. Please check if the sender name is correct or try a different search term.`
          this.memory.userSupervisorMemory.push({ role: 'assistant', content: noEmailMsg })
          this.addTrace({
            timestamp: new Date().toISOString(),
            action: 'Workflow completed',
            status: 'error',
            details: 'No contract emails found'
          })
          return noEmailMsg
        }
        
        // STEP 2: Pass the email content to Legal agent for analysis
        const legalPrompt = `Please analyze the following email content and provide a concise assessment in 50 words focusing on:
- Risk level (LOW/MODERATE/HIGH)
- Key terms (compensation, rights, obligations)
- Any red flags or concerns
- Recommended action

EMAIL CONTENT:
${gmailResponse}`
        
        const legalResponse = await this.teamTools[1].func(legalPrompt)
        
        // Extract email metadata for preview
        const emailData = this.extractEmailMetadata(gmailResponse)
        
        // Combine results with email preview
        let combined = `# Contract Analysis Report\n\n`
        
        if (emailData) {
          combined += `## Email Found\n`
          combined += `**From:** ${emailData.from || 'Unknown'}\n`
          combined += `**Subject:** ${emailData.subject || 'No subject'}\n`
          combined += `**Date:** ${emailData.date || 'Unknown date'}\n\n`
        }
        
        combined += `## Legal Assessment (50 words)\n${legalResponse}`
        
        this.memory.userSupervisorMemory.push({ role: 'assistant', content: combined })
        
        // Add final trace with email data
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Workflow completed successfully',
          status: 'success',
          details: 'Contract found and analyzed',
          emailData: emailData || undefined
        })
        
        return combined
      }
      
      // Check if it's purely an email query (no contract/legal terms)
      if ((lowerInput.includes('email') || lowerInput.includes('gmail') || lowerInput.includes('sent') || lowerInput.includes('received')) 
          && !lowerInput.includes('contract') && !lowerInput.includes('agreement') && !lowerInput.includes('legal')) {
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Routing to Gmail Agent',
          status: 'info',
          details: 'Email-only query detected'
        })
        const gmailResponse = await this.teamTools[0].func(userInput)
        this.memory.userSupervisorMemory.push({ role: 'assistant', content: gmailResponse })
        return gmailResponse
      }
      
      // Check if it's purely a legal query (no email context)
      if ((lowerInput.includes('contract') || lowerInput.includes('agreement') || lowerInput.includes('legal') || lowerInput.includes('terms'))
          && !lowerInput.includes('email') && !lowerInput.includes('gmail') && !lowerInput.includes('sent') && !lowerInput.includes('from')) {
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Routing to Legal Agent',
          status: 'info',
          details: 'Legal-only query detected'
        })
        const legalResponse = await this.teamTools[1].func(userInput)
        this.memory.userSupervisorMemory.push({ role: 'assistant', content: legalResponse })
        return legalResponse
      }
      
      // For complex queries that don't match simple routing, use the supervisor agent itself.
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: 'Using Supervisor Agent for Complex Routing',
        status: 'info',
        details: 'No simple route matched. Delegating to the main supervisor agent for advanced reasoning.'
      });

      const supervisorResponse = await this.invokeSupervisorAgent(userInput, sessionId);
      
      // Check if we need to use fallback routing
      if (supervisorResponse === 'FALLBACK_TO_DIRECT_ROUTING') {
        // Use a simple response for complex queries when supervisor is not available
        const fallbackResponse = `I understand you're asking about "${userInput}". While I don't have access to all specialized agents at the moment, I can still help you with general questions about:

• Email management and communication
• Contract and legal document guidance
• Music industry best practices
• General business advice

Please let me know how I can assist you, or try asking a more specific question.`;
        
        this.memory.userSupervisorMemory.push({ role: 'assistant', content: fallbackResponse });
        return fallbackResponse;
      }
      
      this.memory.userSupervisorMemory.push({ role: 'assistant', content: supervisorResponse });
      return supervisorResponse;

    } catch (error: any) {
      console.error('Supervisor error:', error)
      this.addTrace({
        timestamp: new Date().toISOString(),
        action: 'Workflow failed',
        status: 'error',
        details: error.message
      })
      throw new Error(`Supervisor orchestration failed: ${error.message}`)
    }
  }
  
  protected async invokeSupervisorAgent(userInput: string, sessionId: string): Promise<string> {
    try {
      const command = new InvokeAgentCommand({
        agentId: SUPERVISOR_AGENT.agentId,
        agentAliasId: SUPERVISOR_AGENT.agentAliasId,
        sessionId: sessionId,
        inputText: userInput,
      });
    
      const response = await agentRuntime.send(command);
      let agentResponse = '';
    
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            agentResponse += new TextDecoder().decode(chunk.chunk.bytes);
          }
        }
      } else {
        throw new Error('No response completion stream from Supervisor agent');
      }
    
      return agentResponse;
    } catch (error: any) {
      // If supervisor agent doesn't exist, use direct routing logic
      if (error.name === 'ResourceNotFoundException' || error.$fault === 'client') {
        this.addTrace({
          timestamp: new Date().toISOString(),
          action: 'Supervisor Agent not found - using fallback routing',
          status: 'info',
          details: 'Using built-in routing logic'
        });
        
        // Return a response indicating we'll use direct routing
        return 'FALLBACK_TO_DIRECT_ROUTING';
      }
      throw error;
    }
  }

  // --------------------- Helper methods ---------------------

  getTraces(): AgentTrace[] {
    return this.traces
  }

  private buildToolsPrompt(): string {
    return this.teamTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')
  }

  private buildMemoryContext(): string {
    if (this.memory.combinedMemory.length === 0) {
      return "This is the start of our conversation."
    }
    
    return `<agents_memory>\n${this.memory.combinedMemory.map(msg => 
      msg.agent 
        ? `${msg.role === 'user' ? 'User' : `[${msg.agent}]`}: ${msg.content}`
        : `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n')}\n</agents_memory>`
  }

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

  getMemory(): ChatMemory {
    return this.memory
  }

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