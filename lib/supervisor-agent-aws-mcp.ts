/**
 * AWS MCP Enhanced Supervisor Agent
 * Enterprise-scale supervisor with AWS service integration
 */

import { AWSMCPClient } from './mcp/aws-client'
import { AWSMCPConfig, AWSMCPContext, MCPSecurityPolicy } from './mcp/aws-types'
import { MCPTool } from './mcp/types'

interface SupervisorConfig {
  awsConfig: AWSMCPConfig
  securityPolicy?: MCPSecurityPolicy
  enableAuditLogging: boolean
  maxConcurrentOperations: number
}

interface SupervisorContext {
  userId: string
  sessionId: string
  sourceIp?: string
  userAgent?: string
  permissions: string[]
  musicIndustryRole?: 'artist' | 'label' | 'manager' | 'producer' | 'admin'
}

interface TaskResult {
  success: boolean
  data?: any
  error?: string
  executionTime: number
  toolsUsed: string[]
  awsResourcesAccessed: string[]
}

export class AWSMCPSupervisorAgent {
  private mcpClient: AWSMCPClient
  private config: SupervisorConfig
  private availableTools: MCPTool[] = []
  private activeOperations: Map<string, any> = new Map()

  constructor(config: SupervisorConfig) {
    this.config = config
    this.mcpClient = new AWSMCPClient(config.awsConfig)
    
    if (config.securityPolicy) {
      this.mcpClient.setSecurityPolicy(config.securityPolicy)
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing AWS MCP Supervisor Agent...')
    
    // Initialize MCP servers
    await this.mcpClient.initializeServers()
    
    // Discover available tools
    this.availableTools = await this.mcpClient.discoverTools()
    
    console.log(`Supervisor initialized with ${this.availableTools.length} AWS MCP tools`)
  }

  async executeTask(
    task: string,
    context: SupervisorContext,
    parameters?: Record<string, any>
  ): Promise<TaskResult> {
    const startTime = Date.now()
    const operationId = this.generateOperationId()
    const toolsUsed: string[] = []
    const awsResourcesAccessed: string[] = []

    try {
      // Check concurrent operations limit
      if (this.activeOperations.size >= this.config.maxConcurrentOperations) {
        throw new Error('Maximum concurrent operations limit reached')
      }

      this.activeOperations.set(operationId, { task, context, startTime })

      // Create AWS MCP context
      const mcpContext: AWSMCPContext = {
        userId: context.userId,
        sessionId: context.sessionId,
        permissions: context.permissions,
        awsRegion: this.config.awsConfig.region,
        resourceArns: [],
        securityContext: {
          principalId: context.userId,
          accountId: 'patchline-account', // Would be dynamic in production
          permissions: context.permissions,
        },
      }

      // Analyze task and determine execution plan
      const executionPlan = await this.analyzeTask(task, parameters, context)
      
      // Execute the plan
      const result = await this.executePlan(executionPlan, mcpContext)
      
      return {
        success: true,
        data: result.data,
        executionTime: Date.now() - startTime,
        toolsUsed: result.toolsUsed,
        awsResourcesAccessed: result.awsResourcesAccessed,
      }

    } catch (error) {
      console.error('Task execution failed:', error)
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        toolsUsed,
        awsResourcesAccessed,
      }
    } finally {
      this.activeOperations.delete(operationId)
    }
  }

  private async analyzeTask(
    task: string,
    parameters?: Record<string, any>,
    context?: SupervisorContext
  ): Promise<ExecutionPlan> {
    // Enhanced task analysis with music industry context
    const taskLower = task.toLowerCase()
    const plan: ExecutionPlan = {
      steps: [],
      requiredTools: [],
      estimatedDuration: 0,
      riskLevel: 'low',
    }

    // Music industry specific task patterns
    if (taskLower.includes('artist') && taskLower.includes('search')) {
      plan.steps.push({
        action: 'search_music_knowledge',
        tool: 'music_knowledge_search',
        parameters: {
          query: parameters?.query || task,
          knowledgeBaseId: this.config.awsConfig.services.bedrock?.knowledgeBases[0],
        },
      })
      plan.requiredTools.push('music_knowledge_search')
      plan.estimatedDuration += 2000
    }

    if (taskLower.includes('upload') && taskLower.includes('audio')) {
      plan.steps.push({
        action: 'upload_audio',
        tool: 'upload_audio_file',
        parameters: {
          bucketName: this.config.awsConfig.services.s3?.buckets.find(b => b.includes('audio')),
          fileName: parameters?.fileName,
          fileContent: parameters?.fileContent,
        },
      })
      plan.requiredTools.push('upload_audio_file')
      plan.estimatedDuration += 5000
      plan.riskLevel = 'medium' // File operations have higher risk
    }

    if (taskLower.includes('analytics') || taskLower.includes('performance')) {
      plan.steps.push({
        action: 'query_analytics',
        tool: 'scan_analytics_data',
        parameters: {
          tableName: this.config.awsConfig.services.dynamodb?.tables.find(t => t.includes('analytics')),
          filterExpression: parameters?.filter,
        },
      })
      plan.requiredTools.push('scan_analytics_data')
      plan.estimatedDuration += 3000
    }

    if (taskLower.includes('release') && (taskLower.includes('update') || taskLower.includes('modify'))) {
      plan.steps.push({
        action: 'update_release',
        tool: 'update_release_data',
        parameters: {
          tableName: this.config.awsConfig.services.dynamodb?.tables.find(t => t.includes('release')),
          releaseId: parameters?.releaseId,
          updateData: parameters?.updateData,
        },
      })
      plan.requiredTools.push('update_release_data')
      plan.estimatedDuration += 1500
    }

    if (taskLower.includes('logs') || taskLower.includes('monitoring')) {
      plan.steps.push({
        action: 'query_logs',
        tool: 'query_performance_logs',
        parameters: {
          logGroupName: this.config.awsConfig.services.cloudwatch?.logGroups[0],
          query: parameters?.query || 'fields @timestamp, @message | sort @timestamp desc | limit 100',
          startTime: parameters?.startTime || new Date(Date.now() - 3600000).toISOString(),
          endTime: parameters?.endTime || new Date().toISOString(),
        },
      })
      plan.requiredTools.push('query_performance_logs')
      plan.estimatedDuration += 4000
    }

    // Generate insights for complex tasks
    if (taskLower.includes('insight') || taskLower.includes('analyze') || taskLower.includes('recommend')) {
      plan.steps.push({
        action: 'generate_insights',
        tool: 'generate_music_insights',
        parameters: {
          prompt: this.buildInsightPrompt(task, parameters, context),
          knowledgeBaseId: this.config.awsConfig.services.bedrock?.knowledgeBases[0],
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        },
      })
      plan.requiredTools.push('generate_music_insights')
      plan.estimatedDuration += 6000
    }

    // If no specific pattern matched, create a general knowledge search
    if (plan.steps.length === 0) {
      plan.steps.push({
        action: 'general_search',
        tool: 'music_knowledge_search',
        parameters: {
          query: task,
          knowledgeBaseId: this.config.awsConfig.services.bedrock?.knowledgeBases[0],
        },
      })
      plan.requiredTools.push('music_knowledge_search')
      plan.estimatedDuration += 2000
    }

    return plan
  }

  private async executePlan(
    plan: ExecutionPlan,
    context: AWSMCPContext
  ): Promise<{ data: any; toolsUsed: string[]; awsResourcesAccessed: string[] }> {
    const results: any[] = []
    const toolsUsed: string[] = []
    const awsResourcesAccessed: string[] = []

    for (const step of plan.steps) {
      console.log(`Executing step: ${step.action} with tool: ${step.tool}`)
      
      const result = await this.mcpClient.executeTool(step.tool, step.parameters, context)
      
      // Check if the result indicates an error based on content
      if (result.content[0]?.text?.startsWith('Error executing')) {
        throw new Error(`Step ${step.action} failed: ${result.content[0]?.text}`)
      }

      results.push({
        step: step.action,
        result: JSON.parse(result.content[0]?.text || '{}'),
      })

      toolsUsed.push(step.tool)
      
      // Track AWS resources accessed
      if (step.parameters.bucketName) {
        awsResourcesAccessed.push(`s3://${step.parameters.bucketName}`)
      }
      if (step.parameters.tableName) {
        awsResourcesAccessed.push(`dynamodb:${step.parameters.tableName}`)
      }
      if (step.parameters.knowledgeBaseId) {
        awsResourcesAccessed.push(`bedrock:kb:${step.parameters.knowledgeBaseId}`)
      }
      if (step.parameters.logGroupName) {
        awsResourcesAccessed.push(`cloudwatch:logs:${step.parameters.logGroupName}`)
      }
    }

    return {
      data: this.synthesizeResults(results, plan),
      toolsUsed: [...new Set(toolsUsed)],
      awsResourcesAccessed: [...new Set(awsResourcesAccessed)],
    }
  }

  private buildInsightPrompt(
    task: string,
    parameters?: Record<string, any>,
    context?: SupervisorContext
  ): string {
    let prompt = `As a music industry AI assistant, please provide insights for the following request: "${task}"`

    if (context?.musicIndustryRole) {
      prompt += `\n\nContext: The user is a ${context.musicIndustryRole} in the music industry.`
    }

    if (parameters) {
      prompt += `\n\nAdditional parameters: ${JSON.stringify(parameters, null, 2)}`
    }

    prompt += `\n\nPlease provide:
1. Relevant insights based on current music industry trends
2. Actionable recommendations
3. Key metrics or data points to consider
4. Potential risks or opportunities

Focus on practical, data-driven advice that can help with music industry decision-making.`

    return prompt
  }

  private synthesizeResults(results: any[], plan: ExecutionPlan): any {
    if (results.length === 1) {
      return results[0].result
    }

    // Combine multiple results intelligently
    const synthesis: any = {
      summary: `Executed ${results.length} operations successfully`,
      results: {},
      insights: [],
      recommendations: [],
    }

    for (const result of results) {
      synthesis.results[result.step] = result.result

      // Extract insights from Bedrock responses
      if (result.result.output) {
        synthesis.insights.push(result.result.output)
      }

      // Extract data from database queries
      if (result.result.items) {
        synthesis.data = synthesis.data || []
        synthesis.data.push(...result.result.items)
      }

      // Extract file information from S3 operations
      if (result.result.objects) {
        synthesis.files = result.result.objects
      }

      // Extract log analysis from CloudWatch
      if (result.result.results) {
        synthesis.logAnalysis = result.result.results
      }
    }

    return synthesis
  }

  // Music industry specific helper methods
  async analyzeArtistPerformance(
    artistId: string,
    context: SupervisorContext
  ): Promise<TaskResult> {
    return this.executeTask(
      `Analyze performance metrics and trends for artist ${artistId}`,
      context,
      {
        artistId,
        includeStreaming: true,
        includeSocial: true,
        timeRange: '30d',
      }
    )
  }

  async generateReleaseInsights(
    releaseId: string,
    context: SupervisorContext
  ): Promise<TaskResult> {
    return this.executeTask(
      `Generate comprehensive insights and recommendations for release ${releaseId}`,
      context,
      {
        releaseId,
        includeMarketAnalysis: true,
        includeCompetitorAnalysis: true,
      }
    )
  }

  async processAudioUpload(
    fileName: string,
    fileContent: string,
    metadata: Record<string, any>,
    context: SupervisorContext
  ): Promise<TaskResult> {
    return this.executeTask(
      `Upload and process audio file ${fileName}`,
      context,
      {
        fileName,
        fileContent,
        metadata,
        generateWaveform: true,
        extractMetadata: true,
      }
    )
  }

  async monitorSystemHealth(context: SupervisorContext): Promise<TaskResult> {
    const startTime = Date.now()

    try {
      const healthChecks = await this.mcpClient.checkServerHealth()
      const auditLog = this.mcpClient.getAuditLog()
      
      const healthSummary = {
        overallStatus: healthChecks.every(h => h.status === 'healthy') ? 'healthy' : 'degraded',
        servers: healthChecks,
        recentActivity: auditLog.slice(-10),
        activeOperations: this.activeOperations.size,
        systemMetrics: {
          averageResponseTime: healthChecks.reduce((sum, h) => sum + h.responseTime, 0) / healthChecks.length,
          totalErrors: healthChecks.reduce((sum, h) => sum + h.metrics.errorCount, 0),
          activeConnections: healthChecks.reduce((sum, h) => sum + h.activeConnections, 0),
        },
      }

      return {
        success: true,
        data: healthSummary,
        executionTime: Date.now() - startTime,
        toolsUsed: ['system_health_check'],
        awsResourcesAccessed: this.mcpClient.getServers().map(s => s.endpoint),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        toolsUsed: [],
        awsResourcesAccessed: [],
      }
    }
  }

  // Utility methods
  getAvailableTools(): MCPTool[] {
    return [...this.availableTools]
  }

  getActiveOperations(): number {
    return this.activeOperations.size
  }

  private generateOperationId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

interface ExecutionPlan {
  steps: ExecutionStep[]
  requiredTools: string[]
  estimatedDuration: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface ExecutionStep {
  action: string
  tool: string
  parameters: Record<string, any>
} 