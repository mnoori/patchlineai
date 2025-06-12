import { NextRequest, NextResponse } from 'next/server'
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from '@aws-sdk/client-bedrock-agent-runtime'
import { BedrockClientDirect } from '@/lib/bedrock-client-direct'
import { CONFIG, GMAIL_AGENT, LEGAL_AGENT, SUPERVISOR_AGENT, BLOCKCHAIN_AGENT, SCOUT_AGENT } from '@/lib/config'

// Initialize Bedrock Agent Runtime client
const agentCredentials = CONFIG.AWS_ACCESS_KEY_ID && CONFIG.AWS_SECRET_ACCESS_KEY ? {
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN })
} : undefined

const agentClient = new BedrockAgentRuntimeClient({
  region: CONFIG.AWS_REGION,
  ...(agentCredentials && { credentials: agentCredentials }),
})

// Consistent logging with icons and colors
const log = {
  info: (msg: string) => console.log(`🔵 [CHAT] ${msg}`),
  success: (msg: string) => console.log(`✅ [CHAT] ${msg}`),
  warning: (msg: string) => console.log(`⚠️ [CHAT] ${msg}`),
  error: (msg: string) => console.log(`❌ [CHAT] ${msg}`),
  agent: (msg: string) => console.log(`🤖 [AGENT] ${msg}`),
  model: (msg: string) => console.log(`🧠 [MODEL] ${msg}`),
  gmail: (msg: string) => console.log(`📧 [GMAIL] ${msg}`),
}

// Track agent ID for error handling across try/catch
let currentAgentId: string | undefined

// POST /api/chat - Handle both chat mode (direct model) and agent mode (Bedrock Agent)
export async function POST(request: NextRequest) {
  try {
    let { message, userId, mode = 'chat', sessionId, modelId, agentType } = await request.json()

    // Normalize agentType to avoid whitespace / casing issues
    const normalizedAgentType = (agentType || '').toString().trim().toUpperCase()

    // Use normalized value everywhere from now on
    agentType = normalizedAgentType

    if (!message || !userId) {
      log.error('Missing message or userId')
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    log.info(`Mode: ${mode}, User: ${userId.substring(0, 8)}...`)

    // Create a session ID if not provided
    const chatSessionId = sessionId || `${userId}-${Date.now()}`

    // Track agent ID for error handling
    currentAgentId = undefined

    if (mode === 'chat') {
      // CHAT MODE: Use direct Bedrock model
      log.model(`Using direct model for chat: ${modelId || CONFIG.BEDROCK_MODEL_ID}`)
      
      try {
        const bedrockClient = new BedrockClientDirect(
          modelId || CONFIG.BEDROCK_MODEL_ID,
          "You are Aria, a helpful AI assistant for musicians and music industry professionals. Be friendly, knowledgeable, and supportive."
        )
        
        const response = await bedrockClient.generateResponse(message)
        
        log.success(`Generated response (${response.length} chars)`)
        
        return NextResponse.json({
          response,
          sessionId: chatSessionId,
          mode: 'chat',
          modelUsed: modelId || CONFIG.BEDROCK_MODEL_ID
        })
        
      } catch (error: any) {
        log.error(`Model error: ${error.message}`)
        return NextResponse.json({ 
          error: 'Failed to generate response',
          details: error.message 
        }, { status: 500 })
      }
      
    } else if (mode === 'agent') {
      // AGENT MODE: Determine which agent to use (request can override)
      let agentConfig;
      switch (agentType) {
        case 'GMAIL_AGENT':
          agentConfig = GMAIL_AGENT;
          break;
        case 'LEGAL_AGENT':
          agentConfig = LEGAL_AGENT;
          break;
        case 'SUPERVISOR_AGENT':
          agentConfig = SUPERVISOR_AGENT;
          break;
        case 'BLOCKCHAIN_AGENT':
          agentConfig = BLOCKCHAIN_AGENT;
          break;
        case 'SCOUT_AGENT':
          agentConfig = SCOUT_AGENT;
          break;
        default:
          // If no agent type provided, we need to be smarter about selection
          if (!agentType || agentType === '') {
            // If CONFIG.ACTIVE_AGENT is set, use it
            if (CONFIG.ACTIVE_AGENT) {
              log.warning(`No agentType provided – using CONFIG.ACTIVE_AGENT (${CONFIG.ACTIVE_AGENT})`)
              switch (CONFIG.ACTIVE_AGENT) {
                case 'BLOCKCHAIN_AGENT':
                  agentConfig = BLOCKCHAIN_AGENT;
                  break;
                case 'LEGAL_AGENT':
                  agentConfig = LEGAL_AGENT;
                  break;
                case 'SUPERVISOR_AGENT':
                  agentConfig = SUPERVISOR_AGENT;
                  break;
                case 'SCOUT_AGENT':
                  agentConfig = SCOUT_AGENT;
                  break;
                case 'GMAIL_AGENT':
                  agentConfig = GMAIL_AGENT;
                  break;
                default:
                  // If ACTIVE_AGENT is invalid, use supervisor for routing
                  log.warning(`Invalid CONFIG.ACTIVE_AGENT "${CONFIG.ACTIVE_AGENT}" – using Supervisor`)
                  agentConfig = SUPERVISOR_AGENT;
              }
            } else {
              // No active agent configured - use supervisor to route intelligently
              log.info('No agentType or ACTIVE_AGENT – using Supervisor for intelligent routing')
              agentConfig = SUPERVISOR_AGENT;
            }
          } else {
            // Unknown agent type specified
            log.warning(`Unknown agentType "${agentType}" – using Supervisor for routing`)
            agentConfig = SUPERVISOR_AGENT;
          }
      }

      // Resolve IDs with fallbacks
      const AGENT_ID = agentConfig?.agentId || CONFIG.BEDROCK_AGENT_ID || process.env.BEDROCK_AGENT_ID || 'C7VZ0QWDSG'
      const AGENT_ALIAS_ID = agentConfig?.agentAliasId || CONFIG.BEDROCK_AGENT_ALIAS_ID || process.env.BEDROCK_AGENT_ALIAS_ID || 'WDGFWL1YCB'
      
      // Determine the actual agent being used (important for fallback cases)
      let actualAgentType = agentType
      if (!agentType || agentType === '') {
        // When no agentType provided, we need to know which agent was actually selected
        if (agentConfig === BLOCKCHAIN_AGENT) actualAgentType = 'BLOCKCHAIN_AGENT'
        else if (agentConfig === LEGAL_AGENT) actualAgentType = 'LEGAL_AGENT'
        else if (agentConfig === SUPERVISOR_AGENT) actualAgentType = 'SUPERVISOR_AGENT'
        else if (agentConfig === SCOUT_AGENT) actualAgentType = 'SCOUT_AGENT'
        else actualAgentType = 'GMAIL_AGENT'
      }
      
      const AGENT_NAME = actualAgentType === 'SUPERVISOR_AGENT' ? 'Supervisor Agent' :
                         actualAgentType === 'LEGAL_AGENT' ? 'Legal Agent' :
                         actualAgentType === 'BLOCKCHAIN_AGENT' ? 'Blockchain Agent' :
                         actualAgentType === 'SCOUT_AGENT' ? 'Scout Agent' :
                         'Gmail Agent'
      const AGENT_DESCRIPTION = actualAgentType === 'SUPERVISOR_AGENT' ? 'Multi-agent coordinator' :
                                actualAgentType === 'LEGAL_AGENT' ? 'Legal document analysis' :
                                actualAgentType === 'BLOCKCHAIN_AGENT' ? 'Web3 transactions and crypto payments' :
                                actualAgentType === 'SCOUT_AGENT' ? 'Artist discovery and analytics' :
                                'Email management'

      if (!AGENT_ID || !AGENT_ALIAS_ID) {
        log.error('Bedrock Agent not configured')
        log.error(`BEDROCK_AGENT_ID: ${AGENT_ID ? 'set' : 'missing'}`)
        log.error(`BEDROCK_AGENT_ALIAS_ID: ${AGENT_ALIAS_ID ? 'set' : 'missing'}`)
        return NextResponse.json({ 
          error: 'Bedrock Agent not configured',
          details: 'BEDROCK_AGENT_ID or BEDROCK_AGENT_ALIAS_ID is missing' 
        }, { status: 500 })
      }

      // Debug logging to track what we're actually using
      log.info(`[DEBUG] === AGENT CONFIGURATION ===`)
      log.info(`[DEBUG] Active Agent: ${AGENT_NAME} (${agentType})`)
      log.info(`[DEBUG] Description: ${AGENT_DESCRIPTION}`)
      log.info(`[DEBUG] BEDROCK_AGENT_ID: ${AGENT_ID}`)
      log.info(`[DEBUG] BEDROCK_AGENT_ALIAS_ID: ${AGENT_ALIAS_ID}`)
      log.info(`[DEBUG] === INVOKING AGENT ===`)
      log.agent(`Invoking ${AGENT_NAME} (${AGENT_ID}) with alias ${AGENT_ALIAS_ID}`)

      // Save for error handling
      currentAgentId = AGENT_ID

      // Prepare the agent invocation
      const command = new InvokeAgentCommand({
        agentId: AGENT_ID,
        agentAliasId: AGENT_ALIAS_ID,
        sessionId: chatSessionId,
        inputText: message,
        enableTrace: true, // Enable tracing for debugging
        sessionState: {
          sessionAttributes: {
            userId: userId,
            mode: mode,
            timestamp: new Date().toISOString()
          }
        }
      })

      // Invoke the agent
      const response = await agentClient.send(command)

      // Process the streaming response
      let fullResponse = ''
      let traces: any[] = []
      let emailContext = false
      let actionsInvoked: string[] = []
      let actionDisplay = '' // Track current action for logging

      if (response.completion) {
        // Handle streaming response
        for await (const chunk of response.completion) {
          // Process each chunk
          if (chunk.chunk?.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes)
            fullResponse += text
          }

          // Collect trace information
          if (chunk.trace?.trace) {
            traces.push(chunk.trace.trace)
            
            // Check if Gmail actions were invoked
            if (chunk.trace.trace.orchestrationTrace?.invocationInput?.actionGroupInvocationInput) {
              const actionGroup = chunk.trace.trace.orchestrationTrace.invocationInput.actionGroupInvocationInput
              if (actionGroup.actionGroupName === 'GmailActions') {
                emailContext = true
                const actionPath = actionGroup.apiPath || 'unknown'
                actionsInvoked.push(actionPath)
                
                // Format action display based on the path
                actionDisplay = ''
                switch (actionPath) {
                  case '/search-emails':
                    actionDisplay = 'Searching emails...'
                    break
                  case '/read-email':
                    actionDisplay = 'Reading email content...'
                    break
                  case '/draft-email':
                    actionDisplay = 'Creating email draft...'
                    break
                  case '/send-email':
                    actionDisplay = 'Sending email...'
                    break
                  case '/list-labels':
                    actionDisplay = 'Fetching email labels...'
                    break
                  case '/get-email-stats':
                    actionDisplay = 'Getting email statistics...'
                    break
                  default:
                    actionDisplay = `Gmail action: ${actionPath}`
                }
                
                // Log the action immediately
                log.gmail(actionDisplay)
              }
              // ADD: Handle Blockchain actions
              else if (actionGroup.actionGroupName === 'BlockchainActions') {
                const actionPath = actionGroup.apiPath || 'unknown'
                actionsInvoked.push(actionPath)
                
                switch (actionPath) {
                  case '/send-sol-payment':
                    actionDisplay = 'Processing SOL payment...'
                    break
                  case '/check-wallet-balance':
                    actionDisplay = 'Checking wallet balance...'
                    break
                  case '/validate-wallet-address':
                    actionDisplay = 'Validating wallet address...'
                    break
                  case '/get-transaction-history':
                    actionDisplay = 'Fetching transaction history...'
                    break
                  case '/get-network-status':
                    actionDisplay = 'Checking network status...'
                    break
                  case '/calculate-transaction-fees':
                    actionDisplay = 'Calculating transaction fees...'
                    break
                  default:
                    actionDisplay = `Blockchain action: ${actionPath}`
                }
                
                log.info(`🔗 [BLOCKCHAIN] ${actionDisplay}`)
              }
              // ADD: Handle Scout actions
              else if (actionGroup.actionGroupName === 'ScoutActions') {
                const actionPath = actionGroup.apiPath || 'unknown'
                actionsInvoked.push(actionPath)
                
                switch (actionPath) {
                  case '/discover-artists':
                    actionDisplay = 'Discovering artists...'
                    break
                  case '/analyze-artist':
                    actionDisplay = 'Analyzing artist metrics...'
                    break
                  case '/compare-artists':
                    actionDisplay = 'Comparing artists...'
                    break
                  default:
                    actionDisplay = `Scout action: ${actionPath}`
                }
                
                log.info(`🎯 [SCOUT] ${actionDisplay}`)
              }
              // ADD: Handle Legal actions
              else if (actionGroup.actionGroupName === 'ContractAnalysis') {
                const actionPath = actionGroup.apiPath || 'unknown'
                actionsInvoked.push(actionPath)
                
                switch (actionPath) {
                  case '/analyze-contract':
                    actionDisplay = 'Analyzing contract...'
                    break
                  case '/review-terms':
                    actionDisplay = 'Reviewing contract terms...'
                    break
                  case '/identify-risks':
                    actionDisplay = 'Identifying legal risks...'
                    break
                  default:
                    actionDisplay = `Legal action: ${actionPath}`
                }
                
                log.info(`⚖️ [LEGAL] ${actionDisplay}`)
              }
            }
            
            // Check for action completion
            if (chunk.trace?.trace?.orchestrationTrace?.observation?.actionGroupInvocationOutput) {
              const output = chunk.trace.trace.orchestrationTrace.observation.actionGroupInvocationOutput
              if (output.text) {
                // Log action completion
                log.success(`${actionDisplay.replace('...', '')} completed`)
              }
            }
          }
        }
      }

      // If no response was generated, check for errors
      if (!fullResponse) {
        log.error('No response from agent')
        return NextResponse.json({ 
          error: 'No response generated',
          details: 'The agent did not return a response. Check the agent configuration.' 
        }, { status: 500 })
      }

      // Log actions invoked for debugging
      if (actionsInvoked.length > 0) {
        log.success(`Gmail actions completed: ${actionsInvoked.join(', ')}`)
      } else {
        log.info('No Gmail actions invoked')
      }

      log.success(`Agent response generated (${fullResponse.length} chars)`)

      // Return the response with metadata
      return NextResponse.json({
        response: fullResponse,
        sessionId: chatSessionId,
        hasEmailContext: emailContext,
        actionsInvoked: actionsInvoked,
        mode: 'agent'
      })
      
    } else {
      log.error(`Invalid mode: ${mode}`)
      return NextResponse.json({ 
        error: 'Invalid mode',
        details: 'Mode must be either "chat" or "agent"' 
      }, { status: 400 })
    }

  } catch (error: any) {
    log.error(`API error: ${error.message}`)
    
    // Handle specific error types
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json({ 
        error: 'Agent not found',
        details: 'The specified Bedrock Agent does not exist. Please check the agent ID and ensure it has been created.',
        agentId: currentAgentId || 'unknown' 
      }, { status: 404 })
    }
    
    if (error.name === 'AccessDeniedException' || error.name === 'DependencyFailedException') {
      log.error(`Permission error: ${error.message}`)
      return NextResponse.json({ 
        error: 'Access denied',
        details: 'Permission denied. Check AWS credentials and Lambda function permissions.' 
      }, { status: 403 })
    }
    
    if (error.name === 'ValidationException') {
      return NextResponse.json({ 
        error: 'Invalid request',
        details: error.message || 'The request to the Bedrock Agent was invalid.' 
      }, { status: 400 })
    }

    // Generic error response
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error.message || 'An unexpected error occurred',
      errorType: error.name
    }, { status: 500 })
  }
}
