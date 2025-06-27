/**
 * AWS MCP API Routes
 * Enterprise-scale API endpoints for AWS MCP integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { AWSMCPClient } from '@/lib/mcp/aws-client'
import { AWSMCPSupervisorAgent } from '@/lib/supervisor-agent-aws-mcp'
import { AWSMCPConfig, MCPSecurityPolicy } from '@/lib/mcp/aws-types'

// In production, these would come from environment variables or AWS Secrets Manager
const getAWSConfig = (): AWSMCPConfig => ({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
  services: {
    bedrock: {
      enabled: process.env.ENABLE_BEDROCK === 'true',
      knowledgeBases: (process.env.BEDROCK_KNOWLEDGE_BASES || '').split(',').filter(Boolean),
      models: (process.env.BEDROCK_MODELS || 'anthropic.claude-3-sonnet-20240229-v1:0').split(','),
    },
    s3: {
      enabled: process.env.ENABLE_S3 === 'true',
      buckets: (process.env.S3_BUCKETS || 'patchline-audio,patchline-artwork,patchline-contracts').split(','),
    },
    dynamodb: {
      enabled: process.env.ENABLE_DYNAMODB === 'true',
      tables: (process.env.DYNAMODB_TABLES || 'artists,releases,analytics').split(','),
    },
    cloudwatch: {
      enabled: process.env.ENABLE_CLOUDWATCH === 'true',
      logGroups: (process.env.CLOUDWATCH_LOG_GROUPS || '/aws/lambda/patchline,/patchline/application').split(','),
    },
    rds: {
      enabled: process.env.ENABLE_RDS === 'true',
      instances: (process.env.RDS_INSTANCES || '').split(',').filter(Boolean),
    },
  },
})

const getSecurityPolicy = (): MCPSecurityPolicy => ({
  policyId: 'patchline-mcp-policy-v1',
  name: 'Patchline MCP Security Policy',
  version: '1.0.0',
  rules: {
    allowedTools: [
      'music_knowledge_search',
      'generate_music_insights',
      'upload_audio_file',
      'get_audio_file',
      'list_audio_files',
      'query_artist_data',
      'update_release_data',
      'scan_analytics_data',
      'query_performance_logs',
      'analyze_user_activity',
    ],
    deniedTools: [],
    resourceAccess: {
      s3Buckets: (process.env.S3_BUCKETS || '').split(',').filter(Boolean),
      dynamoTables: (process.env.DYNAMODB_TABLES || '').split(',').filter(Boolean),
      bedrockModels: (process.env.BEDROCK_MODELS || '').split(',').filter(Boolean),
    },
    rateLimit: {
      requestsPerMinute: parseInt(process.env.MCP_RATE_LIMIT || '60'),
      burstLimit: parseInt(process.env.MCP_BURST_LIMIT || '10'),
    },
    ipWhitelist: process.env.MCP_IP_WHITELIST?.split(','),
    timeRestrictions: process.env.MCP_TIME_RESTRICTIONS ? {
      allowedHours: process.env.MCP_TIME_RESTRICTIONS,
      timezone: process.env.MCP_TIMEZONE || 'UTC',
    } : undefined,
  },
  enforcement: {
    mode: (process.env.MCP_SECURITY_MODE as 'permissive' | 'enforcing') || 'enforcing',
    logViolations: true,
    blockViolations: true,
  },
})

// Global supervisor instance (in production, this would be managed differently)
let supervisorAgent: AWSMCPSupervisorAgent | null = null

const getSupervisorAgent = async (): Promise<AWSMCPSupervisorAgent> => {
  if (!supervisorAgent) {
    supervisorAgent = new AWSMCPSupervisorAgent({
      awsConfig: getAWSConfig(),
      securityPolicy: getSecurityPolicy(),
      enableAuditLogging: true,
      maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPERATIONS || '10'),
    })
    await supervisorAgent.initialize()
  }
  return supervisorAgent
}

// Middleware for authentication and authorization
const authenticate = async (request: NextRequest): Promise<{ userId: string; permissions: string[] } | null> => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  // In production, validate JWT token with Cognito
  // For now, we'll use a simple token validation
  const token = authHeader.substring(7)
  
  // Mock validation - replace with actual Cognito JWT validation
  if (token === 'demo-token') {
    return {
      userId: 'demo-user',
      permissions: ['mcp:execute', 'mcp:read', 'mcp:write'],
    }
  }

  return null
}

// POST /api/aws-mcp - Execute MCP task
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const auth = await authenticate(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { task, parameters, musicIndustryRole } = body

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 })
    }

    const supervisor = await getSupervisorAgent()
    
    const context = {
      userId: auth.userId,
      sessionId: `session-${Date.now()}`,
      sourceIp: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      permissions: auth.permissions,
      musicIndustryRole,
    }

    const result = await supervisor.executeTask(task, context, parameters)

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: {
        executionTime: result.executionTime,
        toolsUsed: result.toolsUsed,
        awsResourcesAccessed: result.awsResourcesAccessed,
      },
    })

  } catch (error) {
    console.error('AWS MCP API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/aws-mcp - Get tools or health check
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'health') {
      // Health check
      const supervisor = await getSupervisorAgent()
      
      const context = {
        userId: auth.userId,
        sessionId: `health-${Date.now()}`,
        sourceIp: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        permissions: auth.permissions,
      }

      const healthResult = await supervisor.monitorSystemHealth(context)

      return NextResponse.json({
        success: healthResult.success,
        health: healthResult.data,
        metadata: {
          executionTime: healthResult.executionTime,
          activeOperations: supervisor.getActiveOperations(),
        },
      })
    } else {
      // Default: get available tools
      const supervisor = await getSupervisorAgent()
      const tools = supervisor.getAvailableTools()

      return NextResponse.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        count: tools.length,
      })
    }

  } catch (error) {
    console.error('AWS MCP API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
