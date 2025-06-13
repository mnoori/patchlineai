/**
 * Enterprise AWS MCP Client with Streamable HTTP Transport
 * Based on AWS MCP blog post best practices
 */

import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
  RetrieveAndGenerateCommand,
} from '@aws-sdk/client-bedrock-agent-runtime'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb'
import {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'

import {
  AWSMCPConfig,
  AWSMCPServer,
  StreamableHTTPConfig,
  MCPAuditEvent,
  MCPSecurityPolicy,
  MCPServerHealth,
  MCPLoadBalancer,
  AWSMCPContext,
} from './aws-types'
import { MCPTool, MCPToolResult } from './types'

export class AWSMCPClient {
  private config: AWSMCPConfig
  private servers: Map<string, AWSMCPServer> = new Map()
  private clients: {
    bedrock?: BedrockAgentRuntimeClient
    s3?: S3Client
    dynamodb?: DynamoDBClient
    cloudwatch?: CloudWatchLogsClient
    sts?: STSClient
  } = {}
  private loadBalancer?: MCPLoadBalancer
  private securityPolicy?: MCPSecurityPolicy
  private auditLog: MCPAuditEvent[] = []
  private activeSessions: Map<string, any> = new Map()

  constructor(config: AWSMCPConfig) {
    this.config = config
    this.initializeAWSClients()
  }

  private initializeAWSClients() {
    const credentials = this.config.credentials

    // Initialize AWS service clients
    if (this.config.services.bedrock?.enabled) {
      this.clients.bedrock = new BedrockAgentRuntimeClient({
        region: this.config.region,
        credentials,
      })
    }

    if (this.config.services.s3?.enabled) {
      this.clients.s3 = new S3Client({
        region: this.config.region,
        credentials,
      })
    }

    if (this.config.services.dynamodb?.enabled) {
      this.clients.dynamodb = new DynamoDBClient({
        region: this.config.region,
        credentials,
      })
    }

    if (this.config.services.cloudwatch?.enabled) {
      this.clients.cloudwatch = new CloudWatchLogsClient({
        region: this.config.region,
        credentials,
      })
    }

    this.clients.sts = new STSClient({
      region: this.config.region,
      credentials,
    })
  }

  async initializeServers(): Promise<void> {
    // Initialize Bedrock Knowledge Base server
    if (this.config.services.bedrock?.enabled) {
      const bedrockServer: AWSMCPServer = {
        id: 'bedrock-kb-server',
        name: 'Bedrock Knowledge Base Server',
        service: 'bedrock',
        endpoint: `https://bedrock-agent-runtime.${this.config.region}.amazonaws.com`,
        transport: 'streamable-http',
        config: {
          baseUrl: `https://bedrock-agent-runtime.${this.config.region}.amazonaws.com`,
          sessionManagement: true,
          authentication: {
            type: 'iam',
            config: { region: this.config.region },
          },
          scaling: {
            maxConcurrentSessions: 100,
            sessionTimeout: 300000, // 5 minutes
            enableLoadBalancing: true,
          },
        },
        capabilities: {
          tools: true,
          resources: true,
          prompts: true,
        },
        security: {
          iamRole: 'PatchlineMCPBedrockRole',
          permissions: [
            'bedrock:InvokeModel',
            'bedrock:Retrieve',
            'bedrock:RetrieveAndGenerate',
          ],
          resourceAccess: this.config.services.bedrock.knowledgeBases,
        },
      }
      this.servers.set(bedrockServer.id, bedrockServer)
    }

    // Initialize S3 server
    if (this.config.services.s3?.enabled) {
      const s3Server: AWSMCPServer = {
        id: 's3-storage-server',
        name: 'S3 Storage Server',
        service: 's3',
        endpoint: `https://s3.${this.config.region}.amazonaws.com`,
        transport: 'streamable-http',
        config: {
          baseUrl: `https://s3.${this.config.region}.amazonaws.com`,
          sessionManagement: false,
          authentication: {
            type: 'iam',
            config: { region: this.config.region },
          },
          scaling: {
            maxConcurrentSessions: 200,
            sessionTimeout: 60000, // 1 minute
            enableLoadBalancing: true,
          },
        },
        capabilities: {
          tools: true,
          resources: true,
          prompts: false,
        },
        security: {
          iamRole: 'PatchlineMCPS3Role',
          permissions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:DeleteObject'],
          resourceAccess: this.config.services.s3.buckets.map(bucket => `arn:aws:s3:::${bucket}/*`),
        },
      }
      this.servers.set(s3Server.id, s3Server)
    }

    // Initialize DynamoDB server
    if (this.config.services.dynamodb?.enabled) {
      const dynamoServer: AWSMCPServer = {
        id: 'dynamodb-data-server',
        name: 'DynamoDB Data Server',
        service: 'dynamodb',
        endpoint: `https://dynamodb.${this.config.region}.amazonaws.com`,
        transport: 'streamable-http',
        config: {
          baseUrl: `https://dynamodb.${this.config.region}.amazonaws.com`,
          sessionManagement: false,
          authentication: {
            type: 'iam',
            config: { region: this.config.region },
          },
          scaling: {
            maxConcurrentSessions: 150,
            sessionTimeout: 30000, // 30 seconds
            enableLoadBalancing: true,
          },
        },
        capabilities: {
          tools: true,
          resources: true,
          prompts: false,
        },
        security: {
          iamRole: 'PatchlineMCPDynamoRole',
          permissions: [
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
          ],
          resourceAccess: this.config.services.dynamodb.tables.map(
            table => `arn:aws:dynamodb:${this.config.region}:*:table/${table}`
          ),
        },
      }
      this.servers.set(dynamoServer.id, dynamoServer)
    }

    // Initialize CloudWatch server
    if (this.config.services.cloudwatch?.enabled) {
      const cloudwatchServer: AWSMCPServer = {
        id: 'cloudwatch-logs-server',
        name: 'CloudWatch Logs Server',
        service: 'cloudwatch',
        endpoint: `https://logs.${this.config.region}.amazonaws.com`,
        transport: 'streamable-http',
        config: {
          baseUrl: `https://logs.${this.config.region}.amazonaws.com`,
          sessionManagement: true,
          authentication: {
            type: 'iam',
            config: { region: this.config.region },
          },
          scaling: {
            maxConcurrentSessions: 50,
            sessionTimeout: 120000, // 2 minutes
            enableLoadBalancing: false,
          },
        },
        capabilities: {
          tools: true,
          resources: true,
          prompts: false,
        },
        security: {
          iamRole: 'PatchlineMCPCloudWatchRole',
          permissions: [
            'logs:StartQuery',
            'logs:GetQueryResults',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          resourceAccess: this.config.services.cloudwatch.logGroups.map(
            group => `arn:aws:logs:${this.config.region}:*:log-group:${group}:*`
          ),
        },
      }
      this.servers.set(cloudwatchServer.id, cloudwatchServer)
    }

    console.log(`Initialized ${this.servers.size} AWS MCP servers`)
  }

  async discoverTools(): Promise<MCPTool[]> {
    const tools: MCPTool[] = []

    // Bedrock Knowledge Base tools
    if (this.servers.has('bedrock-kb-server')) {
      tools.push({
        name: 'music_knowledge_search',
        description: 'Search music industry knowledge base using Bedrock',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query for music knowledge' },
            knowledgeBaseId: { type: 'string', description: 'Knowledge base ID' },
            maxResults: { type: 'number', default: 10 },
          },
          required: ['query', 'knowledgeBaseId'],
        },
      })

      tools.push({
        name: 'generate_music_insights',
        description: 'Generate insights using Bedrock knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Prompt for insight generation' },
            knowledgeBaseId: { type: 'string', description: 'Knowledge base ID' },
            modelId: { type: 'string', description: 'Bedrock model ID' },
          },
          required: ['prompt', 'knowledgeBaseId'],
        },
      })
    }

    // S3 storage tools
    if (this.servers.has('s3-storage-server')) {
      tools.push({
        name: 'upload_audio_file',
        description: 'Upload audio file to S3 storage',
        inputSchema: {
          type: 'object',
          properties: {
            bucketName: { type: 'string', description: 'S3 bucket name' },
            fileName: { type: 'string', description: 'File name' },
            fileContent: { type: 'string', description: 'Base64 encoded file content' },
            metadata: { type: 'object', description: 'File metadata' },
          },
          required: ['bucketName', 'fileName', 'fileContent'],
        },
      })

      tools.push({
        name: 'get_audio_file',
        description: 'Retrieve audio file from S3 storage',
        inputSchema: {
          type: 'object',
          properties: {
            bucketName: { type: 'string', description: 'S3 bucket name' },
            fileName: { type: 'string', description: 'File name' },
          },
          required: ['bucketName', 'fileName'],
        },
      })

      tools.push({
        name: 'list_audio_files',
        description: 'List audio files in S3 bucket',
        inputSchema: {
          type: 'object',
          properties: {
            bucketName: { type: 'string', description: 'S3 bucket name' },
            prefix: { type: 'string', description: 'File prefix filter' },
            maxKeys: { type: 'number', default: 100 },
          },
          required: ['bucketName'],
        },
      })
    }

    // DynamoDB data tools
    if (this.servers.has('dynamodb-data-server')) {
      tools.push({
        name: 'query_artist_data',
        description: 'Query artist data from DynamoDB',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'DynamoDB table name' },
            artistId: { type: 'string', description: 'Artist ID' },
            attributes: { type: 'array', items: { type: 'string' } },
          },
          required: ['tableName', 'artistId'],
        },
      })

      tools.push({
        name: 'update_release_data',
        description: 'Update release data in DynamoDB',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'DynamoDB table name' },
            releaseId: { type: 'string', description: 'Release ID' },
            updateData: { type: 'object', description: 'Data to update' },
          },
          required: ['tableName', 'releaseId', 'updateData'],
        },
      })

      tools.push({
        name: 'scan_analytics_data',
        description: 'Scan analytics data from DynamoDB',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'DynamoDB table name' },
            filterExpression: { type: 'string', description: 'Filter expression' },
            limit: { type: 'number', default: 100 },
          },
          required: ['tableName'],
        },
      })
    }

    // CloudWatch monitoring tools
    if (this.servers.has('cloudwatch-logs-server')) {
      tools.push({
        name: 'query_performance_logs',
        description: 'Query performance logs from CloudWatch',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'CloudWatch log group name' },
            query: { type: 'string', description: 'CloudWatch Insights query' },
            startTime: { type: 'string', description: 'Start time (ISO string)' },
            endTime: { type: 'string', description: 'End time (ISO string)' },
          },
          required: ['logGroupName', 'query', 'startTime', 'endTime'],
        },
      })

      tools.push({
        name: 'analyze_user_activity',
        description: 'Analyze user activity logs from CloudWatch',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'CloudWatch log group name' },
            userId: { type: 'string', description: 'User ID to analyze' },
            timeRange: { type: 'string', description: 'Time range (1h, 24h, 7d)' },
          },
          required: ['logGroupName', 'userId', 'timeRange'],
        },
      })
    }

    return tools
  }

  async executeTool(
    toolName: string,
    parameters: Record<string, any>,
    context: AWSMCPContext
  ): Promise<MCPToolResult> {
    const startTime = Date.now()
    const sessionId = this.generateSessionId()

    try {
      // Security check
      if (this.securityPolicy && !this.isToolAllowed(toolName, context)) {
        throw new Error(`Tool ${toolName} not allowed by security policy`)
      }

      let result: any

      // Execute based on tool name
      switch (toolName) {
        case 'music_knowledge_search':
          result = await this.executeBedrockRetrieve(parameters)
          break
        case 'generate_music_insights':
          result = await this.executeBedrockGenerate(parameters)
          break
        case 'upload_audio_file':
          result = await this.executeS3Upload(parameters)
          break
        case 'get_audio_file':
          result = await this.executeS3Get(parameters)
          break
        case 'list_audio_files':
          result = await this.executeS3List(parameters)
          break
        case 'query_artist_data':
          result = await this.executeDynamoQuery(parameters)
          break
        case 'update_release_data':
          result = await this.executeDynamoUpdate(parameters)
          break
        case 'scan_analytics_data':
          result = await this.executeDynamoScan(parameters)
          break
        case 'query_performance_logs':
          result = await this.executeCloudWatchQuery(parameters)
          break
        case 'analyze_user_activity':
          result = await this.executeCloudWatchAnalysis(parameters)
          break
        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }

      // Log successful execution
      this.logAuditEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        userId: context.userId,
        sessionId,
        serverId: this.getServerIdForTool(toolName),
        toolName,
        action: 'execute',
        parameters,
        result: 'success',
        duration: Date.now() - startTime,
        securityContext: {
          sourceIp: context.sourceIp || 'unknown',
          userAgent: context.userAgent || 'unknown',
          iamPrincipal: context.securityContext?.principalId,
        },
      })

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: false,
      }
    } catch (error) {
      // Log error
      this.logAuditEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        userId: context.userId,
        sessionId,
        serverId: this.getServerIdForTool(toolName),
        toolName,
        action: 'execute',
        parameters,
        result: 'error',
        duration: Date.now() - startTime,
        securityContext: {
          sourceIp: context.sourceIp || 'unknown',
          userAgent: context.userAgent || 'unknown',
          iamPrincipal: context.securityContext?.principalId,
        },
      })

      return {
        content: [{ type: 'text', text: `Error executing ${toolName}: ${error.message}` }],
        isError: true,
      }
    }
  }

  // Bedrock Knowledge Base operations
  private async executeBedrockRetrieve(parameters: any): Promise<any> {
    if (!this.clients.bedrock) {
      throw new Error('Bedrock client not initialized')
    }

    const command = new RetrieveCommand({
      knowledgeBaseId: parameters.knowledgeBaseId,
      retrievalQuery: {
        text: parameters.query,
      },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: parameters.maxResults || 10,
        },
      },
    })

    const response = await this.clients.bedrock.send(command)
    return {
      results: response.retrievalResults?.map(result => ({
        content: result.content?.text,
        score: result.score,
        location: result.location,
      })),
    }
  }

  private async executeBedrockGenerate(parameters: any): Promise<any> {
    if (!this.clients.bedrock) {
      throw new Error('Bedrock client not initialized')
    }

    const command = new RetrieveAndGenerateCommand({
      input: {
        text: parameters.prompt,
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: parameters.knowledgeBaseId,
          modelArn: parameters.modelId,
        },
      },
    })

    const response = await this.clients.bedrock.send(command)
    return {
      output: response.output?.text,
      citations: response.citations,
      sessionId: response.sessionId,
    }
  }

  // S3 operations
  private async executeS3Upload(parameters: any): Promise<any> {
    if (!this.clients.s3) {
      throw new Error('S3 client not initialized')
    }

    const command = new PutObjectCommand({
      Bucket: parameters.bucketName,
      Key: parameters.fileName,
      Body: Buffer.from(parameters.fileContent, 'base64'),
      Metadata: parameters.metadata,
    })

    const response = await this.clients.s3.send(command)
    return {
      success: true,
      etag: response.ETag,
      versionId: response.VersionId,
    }
  }

  private async executeS3Get(parameters: any): Promise<any> {
    if (!this.clients.s3) {
      throw new Error('S3 client not initialized')
    }

    const command = new GetObjectCommand({
      Bucket: parameters.bucketName,
      Key: parameters.fileName,
    })

    const response = await this.clients.s3.send(command)
    const body = await response.Body?.transformToString('base64')

    return {
      content: body,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      size: response.ContentLength,
      metadata: response.Metadata,
    }
  }

  private async executeS3List(parameters: any): Promise<any> {
    if (!this.clients.s3) {
      throw new Error('S3 client not initialized')
    }

    const command = new ListObjectsV2Command({
      Bucket: parameters.bucketName,
      Prefix: parameters.prefix,
      MaxKeys: parameters.maxKeys || 100,
    })

    const response = await this.clients.s3.send(command)
    return {
      objects: response.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
      })),
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    }
  }

  // DynamoDB operations
  private async executeDynamoQuery(parameters: any): Promise<any> {
    if (!this.clients.dynamodb) {
      throw new Error('DynamoDB client not initialized')
    }

    const command = new QueryCommand({
      TableName: parameters.tableName,
      KeyConditionExpression: 'artistId = :artistId',
      ExpressionAttributeValues: {
        ':artistId': { S: parameters.artistId },
      },
      ProjectionExpression: parameters.attributes?.join(', '),
    })

    const response = await this.clients.dynamodb.send(command)
    return {
      items: response.Items,
      count: response.Count,
      scannedCount: response.ScannedCount,
    }
  }

  private async executeDynamoUpdate(parameters: any): Promise<any> {
    if (!this.clients.dynamodb) {
      throw new Error('DynamoDB client not initialized')
    }

    const updateExpression = Object.keys(parameters.updateData)
      .map(key => `#${key} = :${key}`)
      .join(', ')

    const expressionAttributeNames = Object.keys(parameters.updateData).reduce(
      (acc, key) => ({ ...acc, [`#${key}`]: key }),
      {}
    )

    const expressionAttributeValues = Object.entries(parameters.updateData).reduce(
      (acc, [key, value]) => ({ ...acc, [`:${key}`]: { S: String(value) } }),
      {}
    )

    const command = new UpdateItemCommand({
      TableName: parameters.tableName,
      Key: {
        releaseId: { S: parameters.releaseId },
      },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })

    const response = await this.clients.dynamodb.send(command)
    return {
      updatedItem: response.Attributes,
    }
  }

  private async executeDynamoScan(parameters: any): Promise<any> {
    if (!this.clients.dynamodb) {
      throw new Error('DynamoDB client not initialized')
    }

    const command = new ScanCommand({
      TableName: parameters.tableName,
      FilterExpression: parameters.filterExpression,
      Limit: parameters.limit || 100,
    })

    const response = await this.clients.dynamodb.send(command)
    return {
      items: response.Items,
      count: response.Count,
      scannedCount: response.ScannedCount,
    }
  }

  // CloudWatch operations
  private async executeCloudWatchQuery(parameters: any): Promise<any> {
    if (!this.clients.cloudwatch) {
      throw new Error('CloudWatch client not initialized')
    }

    const startQuery = new StartQueryCommand({
      logGroupName: parameters.logGroupName,
      startTime: Math.floor(new Date(parameters.startTime).getTime() / 1000),
      endTime: Math.floor(new Date(parameters.endTime).getTime() / 1000),
      queryString: parameters.query,
    })

    const queryResponse = await this.clients.cloudwatch.send(startQuery)
    const queryId = queryResponse.queryId

    // Wait for query to complete
    let results
    let status = 'Running'
    while (status === 'Running') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const getResults = new GetQueryResultsCommand({ queryId })
      const resultsResponse = await this.clients.cloudwatch.send(getResults)
      status = resultsResponse.status || 'Complete'
      results = resultsResponse.results
    }

    return {
      queryId,
      status,
      results,
      statistics: {
        recordsMatched: results?.length || 0,
        recordsScanned: results?.length || 0,
      },
    }
  }

  private async executeCloudWatchAnalysis(parameters: any): Promise<any> {
    const timeRanges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
    }

    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - timeRanges[parameters.timeRange])

    const query = `
      fields @timestamp, userId, action, duration
      | filter userId = "${parameters.userId}"
      | stats count() as actionCount, avg(duration) as avgDuration by action
      | sort actionCount desc
    `

    return this.executeCloudWatchQuery({
      logGroupName: parameters.logGroupName,
      query,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    })
  }

  // Health monitoring
  async checkServerHealth(): Promise<MCPServerHealth[]> {
    const healthChecks: MCPServerHealth[] = []

    for (const [serverId, server] of this.servers) {
      const startTime = Date.now()
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      let errorRate = 0

      try {
        // Perform basic health check based on service type
        switch (server.service) {
          case 'bedrock':
            // Check if we can get caller identity
            if (this.clients.sts) {
              await this.clients.sts.send(new GetCallerIdentityCommand({}))
            }
            break
          case 's3':
            // Check if we can list buckets (basic connectivity)
            if (this.clients.s3 && this.config.services.s3?.buckets.length) {
              await this.clients.s3.send(
                new ListObjectsV2Command({
                  Bucket: this.config.services.s3.buckets[0],
                  MaxKeys: 1,
                })
              )
            }
            break
          case 'dynamodb':
            // Check if we can describe a table
            if (this.clients.dynamodb && this.config.services.dynamodb?.tables.length) {
              // Basic connectivity check - we'll just verify the client is working
              await this.clients.sts?.send(new GetCallerIdentityCommand({}))
            }
            break
          case 'cloudwatch':
            // Check if we can describe log groups
            if (this.clients.cloudwatch) {
              await this.clients.cloudwatch.send(new DescribeLogGroupsCommand({ limit: 1 }))
            }
            break
        }
      } catch (error) {
        status = 'unhealthy'
        errorRate = 1.0
      }

      const responseTime = Date.now() - startTime

      healthChecks.push({
        serverId,
        status,
        lastCheck: new Date(),
        responseTime,
        errorRate,
        activeConnections: this.activeSessions.size,
        metrics: {
          requestsPerMinute: 0, // Would be calculated from audit logs
          averageResponseTime: responseTime,
          errorCount: errorRate > 0 ? 1 : 0,
        },
      })
    }

    return healthChecks
  }

  // Security and audit
  private isToolAllowed(toolName: string, context: AWSMCPContext): boolean {
    if (!this.securityPolicy) return true

    const { rules } = this.securityPolicy
    
    // Check if tool is explicitly denied
    if (rules.deniedTools.includes(toolName)) return false
    
    // Check if tool is in allowed list (if allowedTools is specified)
    if (rules.allowedTools.length > 0 && !rules.allowedTools.includes(toolName)) return false
    
    // Check rate limiting (simplified)
    // In production, this would check against a rate limiting store
    
    return true
  }

  private logAuditEvent(event: MCPAuditEvent): void {
    this.auditLog.push(event)
    
    // In production, this would send to CloudWatch Logs or other audit system
    console.log('MCP Audit Event:', JSON.stringify(event, null, 2))
    
    // Keep only last 1000 events in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getServerIdForTool(toolName: string): string {
    if (toolName.includes('knowledge') || toolName.includes('insights')) return 'bedrock-kb-server'
    if (toolName.includes('audio') || toolName.includes('file')) return 's3-storage-server'
    if (toolName.includes('artist') || toolName.includes('release') || toolName.includes('analytics')) return 'dynamodb-data-server'
    if (toolName.includes('logs') || toolName.includes('activity')) return 'cloudwatch-logs-server'
    return 'unknown'
  }

  // Public getters
  getServers(): AWSMCPServer[] {
    return Array.from(this.servers.values())
  }

  getAuditLog(): MCPAuditEvent[] {
    return [...this.auditLog]
  }

  setSecurityPolicy(policy: MCPSecurityPolicy): void {
    this.securityPolicy = policy
  }
} 