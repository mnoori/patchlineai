import { NextRequest, NextResponse } from 'next/server'
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from '@aws-sdk/client-bedrock-agent-runtime'
import { CONFIG, GMAIL_AGENT, LEGAL_AGENT } from '@/lib/config'

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

// Logging helpers
const log = {
  info: (msg: string) => console.log(`🔵 [MULTI-AGENT] ${msg}`),
  success: (msg: string) => console.log(`✅ [MULTI-AGENT] ${msg}`),
  error: (msg: string) => console.log(`❌ [MULTI-AGENT] ${msg}`),
  agent: (msg: string) => console.log(`🤖 [MULTI-AGENT] ${msg}`),
}

// Helper to invoke an agent and get response
async function invokeAgent(
  agentId: string, 
  agentAliasId: string, 
  message: string, 
  sessionId: string,
  agentName: string
): Promise<string> {
  log.agent(`Invoking ${agentName} (${agentId})...`)
  
  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId,
    sessionId,
    inputText: message,
    enableTrace: true,
  })

  const response = await agentClient.send(command)
  
  let fullResponse = ''
  if (response.completion) {
    for await (const chunk of response.completion) {
      if (chunk.chunk?.bytes) {
        const text = new TextDecoder().decode(chunk.chunk.bytes)
        fullResponse += text
      }
    }
  }
  
  log.success(`${agentName} response received (${fullResponse.length} chars)`)
  return fullResponse
}

// Analyze query to determine workflow
function analyzeQuery(query: string): {
  needsEmail: boolean
  needsLegal: boolean
  emailFirst: boolean
} {
  const lowerQuery = query.toLowerCase()
  
  const emailKeywords = ['email', 'gmail', 'inbox', 'messages', 'sent', 'received', 'mehdi']
  const legalKeywords = ['contract', 'legal', 'agreement', 'terms', 'analyze', 'review', 'assess']
  
  const needsEmail = emailKeywords.some(keyword => lowerQuery.includes(keyword))
  const needsLegal = legalKeywords.some(keyword => lowerQuery.includes(keyword))
  
  // If query mentions finding/searching first, email should go first
  const emailFirst = lowerQuery.includes('find') || lowerQuery.includes('search') || 
                     lowerQuery.includes('get') || lowerQuery.includes('retrieve')
  
  return { needsEmail, needsLegal, emailFirst }
}

// Extract contract content from email response
function extractContractContent(emailResponse: string): string | null {
  // Look for contract content patterns
  const contractPatterns = [
    /EXCLUSIVE RECORDING AGREEMENT[\s\S]*?(?=\n\n|$)/i,
    /CONTRACT[\s\S]*?(?=\n\n|$)/i,
    /AGREEMENT[\s\S]*?(?=\n\n|$)/i,
    /Terms and Conditions:[\s\S]*?(?=\n\n|$)/i,
  ]
  
  for (const pattern of contractPatterns) {
    const match = emailResponse.match(pattern)
    if (match) {
      return match[0]
    }
  }
  
  // If no specific contract found, look for quoted content
  const quotedPattern = /"([^"]+)"/g
  const quotes = emailResponse.match(quotedPattern)
  if (quotes && quotes.length > 0) {
    // Join all quoted content as potential contract
    return quotes.join('\n')
  }
  
  return null
}

// POST /api/chat/multi-agent - Handle multi-agent orchestration
export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    log.info(`Multi-agent orchestration request from user: ${userId.substring(0, 8)}...`)
    log.info(`Query: ${message}`)

    // Analyze the query
    const workflow = analyzeQuery(message)
    log.info(`Workflow analysis: Email=${workflow.needsEmail}, Legal=${workflow.needsLegal}, EmailFirst=${workflow.emailFirst}`)

    const sessionId = `multi-agent-${userId}-${Date.now()}`
    const responses: { agent: string; response: string }[] = []

    // Case 1: Email + Legal workflow
    if (workflow.needsEmail && workflow.needsLegal) {
      log.info('Executing Email → Legal workflow')
      
      // Step 1: Search emails
      const emailQuery = `Search for emails about contracts from Mehdi or any recent contract-related emails. Provide the full content of any contracts found.`
      const emailResponse = await invokeAgent(
        GMAIL_AGENT.agentId,
        GMAIL_AGENT.agentAliasId,
        emailQuery,
        sessionId,
        'Gmail Agent'
      )
      responses.push({ agent: 'Gmail', response: emailResponse })
      
      // Step 2: Extract contract content
      const contractContent = extractContractContent(emailResponse)
      
      if (contractContent) {
        log.info('Contract content found, sending to Legal Agent')
        
        // Step 3: Analyze with Legal Agent
        const legalQuery = `Please analyze this contract and provide a comprehensive assessment including key terms, risks, and recommendations:\n\n${contractContent}`
        const legalResponse = await invokeAgent(
          LEGAL_AGENT.agentId,
          LEGAL_AGENT.agentAliasId,
          legalQuery,
          sessionId,
          'Legal Agent'
        )
        responses.push({ agent: 'Legal', response: legalResponse })
        
        // Step 4: Synthesize response
        const synthesizedResponse = `I've completed the multi-step analysis you requested:

## Email Search Results
${emailResponse}

## Legal Analysis
${legalResponse}

## Summary
I found the contract-related emails and had our legal specialist analyze the content. The analysis above provides a comprehensive assessment of the key terms, risks, and recommendations.`
        
        return NextResponse.json({
          response: synthesizedResponse,
          sessionId,
          workflow: 'email-legal',
          agentsUsed: ['Gmail', 'Legal'],
        })
        
      } else {
        // No contract found in emails
        const noContractResponse = `I searched for contract-related emails but couldn't find specific contract content to analyze.

## Email Search Results
${emailResponse}

To proceed with a legal analysis, please:
1. Forward the specific contract as an attachment
2. Or copy and paste the contract text directly
3. Or provide more details about which email contains the contract`
        
        return NextResponse.json({
          response: noContractResponse,
          sessionId,
          workflow: 'email-only',
          agentsUsed: ['Gmail'],
        })
      }
    }
    
    // Case 2: Email only
    else if (workflow.needsEmail) {
      log.info('Executing Email-only workflow')
      
      const emailResponse = await invokeAgent(
        GMAIL_AGENT.agentId,
        GMAIL_AGENT.agentAliasId,
        message,
        sessionId,
        'Gmail Agent'
      )
      
      return NextResponse.json({
        response: emailResponse,
        sessionId,
        workflow: 'email-only',
        agentsUsed: ['Gmail'],
      })
    }
    
    // Case 3: Legal only
    else if (workflow.needsLegal) {
      log.info('Executing Legal-only workflow')
      
      const legalResponse = await invokeAgent(
        LEGAL_AGENT.agentId,
        LEGAL_AGENT.agentAliasId,
        message,
        sessionId,
        'Legal Agent'
      )
      
      return NextResponse.json({
        response: legalResponse,
        sessionId,
        workflow: 'legal-only',
        agentsUsed: ['Legal'],
      })
    }
    
    // Case 4: Neither - use default chat
    else {
      log.info('No specific workflow detected, using general response')
      
      return NextResponse.json({
        response: "I can help you with email management and legal document analysis. You can ask me to:\n\n1. Search and manage your emails\n2. Analyze contracts and legal documents\n3. Combine both - like finding a contract in your email and analyzing it\n\nWhat would you like me to help you with?",
        sessionId,
        workflow: 'none',
        agentsUsed: [],
      })
    }

  } catch (error: any) {
    log.error(`Multi-agent orchestration error: ${error.message}`)
    return NextResponse.json({ 
      error: 'Multi-agent orchestration failed',
      details: error.message 
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic' 