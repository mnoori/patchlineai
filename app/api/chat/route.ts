import { NextRequest, NextResponse } from 'next/server'
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from '@aws-sdk/client-bedrock-agent-runtime'
import { BedrockClientDirect } from '@/lib/bedrock-client-direct'
import { CONFIG } from '@/lib/config'

// Initialize Bedrock Agent Runtime client
const agentClient = new BedrockAgentRuntimeClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})

// Agent configuration from environment variables
const AGENT_ID = CONFIG.BEDROCK_AGENT_ID || process.env.BEDROCK_AGENT_ID || ''
const AGENT_ALIAS_ID = CONFIG.BEDROCK_AGENT_ALIAS_ID || process.env.BEDROCK_AGENT_ALIAS_ID || ''

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

// POST /api/chat - Handle both chat mode (direct model) and agent mode (Bedrock Agent)
export async function POST(request: NextRequest) {
  try {
    const { message, userId, mode = 'chat', sessionId, modelId } = await request.json()

    if (!message || !userId) {
      log.error('Missing message or userId')
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    log.info(`Mode: ${mode}, User: ${userId.substring(0, 8)}...`)

    // Create a session ID if not provided
    const chatSessionId = sessionId || `${userId}-${Date.now()}`

    if (mode === 'chat') {
      // CHAT MODE: Use direct Bedrock model
      log.model(`Using direct model for chat: ${modelId || CONFIG.BEDROCK_MODEL_ID}`)
      
      try {
        const bedrockClient = new BedrockClientDirect(
          modelId || CONFIG.BEDROCK_MODEL_ID,
          "You are Patchy, a helpful AI assistant for musicians and music industry professionals. Be friendly, knowledgeable, and supportive."
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
      // AGENT MODE: Use Bedrock Agent with Gmail actions
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
      log.info(`[DEBUG] === FRONTEND ENV VARS ===`)
      log.info(`[DEBUG] BEDROCK_AGENT_ID: ${AGENT_ID}`)
      log.info(`[DEBUG] BEDROCK_AGENT_ALIAS_ID: ${AGENT_ALIAS_ID}`)
      log.info(`[DEBUG] === INVOKING AGENT ===`)
      log.agent(`Invoking agent ${AGENT_ID} with alias ${AGENT_ALIAS_ID}`)

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
        agentId: AGENT_ID 
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
