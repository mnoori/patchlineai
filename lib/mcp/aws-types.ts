/**
 * AWS-Enhanced MCP Types for Enterprise-Scale Deployment
 * Based on AWS MCP blog post best practices
 */

import { MCPTool, MCPResource, MCPContext } from './types'

export interface AWSMCPConfig {
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  services: {
    s3?: {
      enabled: boolean
      buckets: string[]
    }
    dynamodb?: {
      enabled: boolean
      tables: string[]
    }
    bedrock?: {
      enabled: boolean
      knowledgeBases: string[]
      models: string[]
    }
    cloudwatch?: {
      enabled: boolean
      logGroups: string[]
    }
    rds?: {
      enabled: boolean
      instances: string[]
    }
  }
}

export interface StreamableHTTPConfig {
  baseUrl: string
  sessionManagement: boolean
  authentication: {
    type: 'iam' | 'api-key' | 'oauth'
    config: Record<string, any>
  }
  scaling: {
    maxConcurrentSessions: number
    sessionTimeout: number
    enableLoadBalancing: boolean
  }
}

export interface AWSMCPServer {
  id: string
  name: string
  service: 'bedrock' | 's3' | 'dynamodb' | 'cloudwatch' | 'rds'
  endpoint: string
  transport: 'streamable-http' | 'stdio'
  config: StreamableHTTPConfig
  capabilities: {
    tools: boolean
    resources: boolean
    prompts: boolean
  }
  security: {
    iamRole?: string
    permissions: string[]
    resourceAccess: string[]
  }
}

export interface BedrockKnowledgeBaseTool extends MCPTool {
  knowledgeBaseId: string
  retrievalConfig: {
    vectorSearchConfiguration: {
      numberOfResults: number
      overrideSearchType?: 'HYBRID' | 'SEMANTIC'
    }
  }
}

export interface S3ResourceTool extends MCPTool {
  bucketName: string
  objectKey?: string
  operations: ('read' | 'write' | 'list' | 'delete')[]
}

export interface DynamoDBTool extends MCPTool {
  tableName: string
  operations: ('query' | 'scan' | 'get' | 'put' | 'update' | 'delete')[]
  indexName?: string
}

export interface CloudWatchTool extends MCPTool {
  logGroupName: string
  operations: ('query' | 'insights' | 'metrics')[]
  timeRange?: {
    start: string
    end: string
  }
}

export interface AWSMCPContext extends MCPContext {
  awsRegion: string
  iamRole?: string
  resourceArns: string[]
  securityContext: {
    principalId: string
    accountId: string
    permissions: string[]
  }
}

export interface MusicIndustryAWSTools {
  // Bedrock Knowledge Base for music industry knowledge
  musicKnowledgeBase: BedrockKnowledgeBaseTool
  
  // S3 for audio files, artwork, and documents
  audioStorage: S3ResourceTool
  artworkStorage: S3ResourceTool
  contractStorage: S3ResourceTool
  
  // DynamoDB for artist data, releases, and analytics
  artistDatabase: DynamoDBTool
  releaseDatabase: DynamoDBTool
  analyticsDatabase: DynamoDBTool
  
  // CloudWatch for monitoring and insights
  performanceMonitoring: CloudWatchTool
  userActivityLogs: CloudWatchTool
}

export interface MCPServerHealth {
  serverId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: Date
  responseTime: number
  errorRate: number
  activeConnections: number
  metrics: {
    requestsPerMinute: number
    averageResponseTime: number
    errorCount: number
  }
}

export interface MCPLoadBalancer {
  servers: AWSMCPServer[]
  strategy: 'round-robin' | 'least-connections' | 'weighted'
  healthChecks: MCPServerHealth[]
  failover: {
    enabled: boolean
    threshold: number
    cooldown: number
  }
}

export interface MCPAuditEvent {
  eventId: string
  timestamp: Date
  userId: string
  sessionId: string
  serverId: string
  toolName: string
  action: string
  parameters: Record<string, any>
  result: 'success' | 'error' | 'timeout'
  duration: number
  awsRequestId?: string
  cloudTrailEventId?: string
  securityContext: {
    sourceIp: string
    userAgent: string
    iamPrincipal?: string
  }
}

export interface MCPSecurityPolicy {
  policyId: string
  name: string
  version: string
  rules: {
    allowedTools: string[]
    deniedTools: string[]
    resourceAccess: {
      s3Buckets: string[]
      dynamoTables: string[]
      bedrockModels: string[]
    }
    rateLimit: {
      requestsPerMinute: number
      burstLimit: number
    }
    ipWhitelist?: string[]
    timeRestrictions?: {
      allowedHours: string
      timezone: string
    }
  }
  enforcement: {
    mode: 'permissive' | 'enforcing'
    logViolations: boolean
    blockViolations: boolean
  }
} 