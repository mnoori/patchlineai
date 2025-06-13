'use client'

/**
 * AWS MCP Dashboard Component
 * Enterprise-scale dashboard for AWS MCP integration
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cloud,
  Database,
  FileAudio,
  Loader2,
  Monitor,
  Play,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

interface MCPTool {
  name: string
  description: string
  inputSchema: any
}

interface ServerHealth {
  serverId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: string
  responseTime: number
  errorRate: number
  activeConnections: number
  metrics: {
    requestsPerMinute: number
    averageResponseTime: number
    errorCount: number
  }
}

interface TaskResult {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    executionTime: number
    toolsUsed: string[]
    awsResourcesAccessed: string[]
  }
}

export function AWSMCPDashboard() {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [serverHealth, setServerHealth] = useState<ServerHealth[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTool, setSelectedTool] = useState<string>('')
  const [taskInput, setTaskInput] = useState('')
  const [taskParameters, setTaskParameters] = useState('')
  const [musicRole, setMusicRole] = useState<string>('artist')
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Load tools and health data on component mount
  useEffect(() => {
    loadTools()
    loadHealthData()
    
    // Set up periodic health monitoring
    const healthInterval = setInterval(loadHealthData, 30000) // Every 30 seconds
    
    return () => clearInterval(healthInterval)
  }, [])

  const loadTools = async () => {
    try {
      const response = await fetch('/api/aws-mcp/tools', {
        headers: {
          'Authorization': 'Bearer demo-token', // In production, use actual auth token
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setTools(data.tools || [])
      }
    } catch (error) {
      console.error('Failed to load tools:', error)
    }
  }

  const loadHealthData = async () => {
    try {
      const response = await fetch('/api/aws-mcp/health', {
        headers: {
          'Authorization': 'Bearer demo-token',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setServerHealth(data.health?.servers || [])
      }
    } catch (error) {
      console.error('Failed to load health data:', error)
    }
  }

  const executeTask = async () => {
    if (!taskInput.trim()) return

    setIsExecuting(true)
    setTaskResult(null)

    try {
      let parameters = {}
      if (taskParameters.trim()) {
        try {
          parameters = JSON.parse(taskParameters)
        } catch (e) {
          throw new Error('Invalid JSON in parameters')
        }
      }

      const response = await fetch('/api/aws-mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token',
        },
        body: JSON.stringify({
          task: taskInput,
          parameters,
          musicIndustryRole: musicRole,
        }),
      })

      const result = await response.json()
      setTaskResult(result)
    } catch (error) {
      setTaskResult({
        success: false,
        error: error.message,
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const executeSpecificTool = async (toolName: string, params: any) => {
    setIsExecuting(true)
    setTaskResult(null)

    try {
      const response = await fetch('/api/aws-mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token',
        },
        body: JSON.stringify({
          task: `Execute ${toolName} tool`,
          parameters: params,
          musicIndustryRole: musicRole,
        }),
      })

      const result = await response.json()
      setTaskResult(result)
    } catch (error) {
      setTaskResult({
        success: false,
        error: error.message,
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Monitor className="h-4 w-4 text-gray-600" />
    }
  }

  const overallHealth = serverHealth.length > 0 
    ? serverHealth.every(s => s.status === 'healthy') ? 'healthy' 
    : serverHealth.some(s => s.status === 'unhealthy') ? 'unhealthy' 
    : 'degraded'
    : 'unknown'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AWS MCP Dashboard</h1>
          <p className="text-muted-foreground">
            Enterprise Model Context Protocol integration with AWS services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(overallHealth)}
          <span className={`font-medium ${getStatusColor(overallHealth)}`}>
            System {overallHealth}
          </span>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
            <p className="text-xs text-muted-foreground">
              AWS MCP tools ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serverHealth.filter(s => s.status === 'healthy').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {serverHealth.length} servers healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serverHealth.length > 0 
                ? Math.round(serverHealth.reduce((sum, s) => sum + s.responseTime, 0) / serverHealth.length)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              across all servers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serverHealth.reduce((sum, s) => sum + s.activeConnections, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              total connections
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="execute" className="space-y-4">
        <TabsList>
          <TabsTrigger value="execute">Execute Tasks</TabsTrigger>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="music">Music Industry</TabsTrigger>
        </TabsList>

        {/* Task Execution Tab */}
        <TabsContent value="execute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execute MCP Task</CardTitle>
              <CardDescription>
                Enter a natural language task to execute using AWS MCP tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task">Task Description</Label>
                  <Textarea
                    id="task"
                    placeholder="e.g., Search for information about indie rock trends, Upload audio file, Analyze artist performance..."
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parameters">Parameters (JSON)</Label>
                  <Textarea
                    id="parameters"
                    placeholder='{"artistId": "123", "timeRange": "30d"}'
                    value={taskParameters}
                    onChange={(e) => setTaskParameters(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Music Industry Role</Label>
                  <Select value={musicRole} onValueChange={setMusicRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="producer">Producer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={executeTask} 
                  disabled={isExecuting || !taskInput.trim()}
                  className="mt-6"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Execute Task
                    </>
                  )}
                </Button>
              </div>

              {/* Task Result */}
              {taskResult && (
                <div className="mt-6">
                  <Alert className={taskResult.success ? 'border-green-200' : 'border-red-200'}>
                    {taskResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      {taskResult.success ? 'Task Completed Successfully' : 'Task Failed'}
                    </AlertTitle>
                    <AlertDescription>
                      {taskResult.error && (
                        <div className="text-red-600 mb-2">{taskResult.error}</div>
                      )}
                      {taskResult.metadata && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Execution Time: {taskResult.metadata.executionTime}ms</div>
                          <div>Tools Used: {taskResult.metadata.toolsUsed.join(', ')}</div>
                          <div>AWS Resources: {taskResult.metadata.awsResourcesAccessed.join(', ')}</div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>

                  {taskResult.data && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Result Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                            {JSON.stringify(taskResult.data, null, 2)}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available AWS MCP Tools</CardTitle>
              <CardDescription>
                Tools available through the AWS MCP integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Card key={tool.name} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <Badge variant="outline">
                          {tool.name.includes('bedrock') ? 'Bedrock' :
                           tool.name.includes('s3') ? 'S3' :
                           tool.name.includes('dynamo') ? 'DynamoDB' :
                           tool.name.includes('cloudwatch') ? 'CloudWatch' : 'AWS'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        Required: {Object.keys(tool.inputSchema?.properties || {})
                          .filter(key => tool.inputSchema?.required?.includes(key))
                          .join(', ') || 'None'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AWS MCP Server Health</CardTitle>
              <CardDescription>
                Real-time health monitoring of AWS MCP servers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serverHealth.map((server) => (
                  <Card key={server.serverId} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(server.status)}
                          <CardTitle className="text-base">{server.serverId}</CardTitle>
                        </div>
                        <Badge 
                          variant={server.status === 'healthy' ? 'default' : 
                                  server.status === 'degraded' ? 'secondary' : 'destructive'}
                        >
                          {server.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Response Time</div>
                          <div className="font-medium">{server.responseTime}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Error Rate</div>
                          <div className="font-medium">{(server.errorRate * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Connections</div>
                          <div className="font-medium">{server.activeConnections}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Last Check</div>
                          <div className="font-medium">
                            {new Date(server.lastCheck).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Requests/min</div>
                          <div className="font-medium">{server.metrics.requestsPerMinute}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Response</div>
                          <div className="font-medium">{server.metrics.averageResponseTime}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Error Count</div>
                          <div className="font-medium">{server.metrics.errorCount}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Music Industry Tab */}
        <TabsContent value="music" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Artist Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Artist Analysis</span>
                </CardTitle>
                <CardDescription>
                  Analyze artist performance and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Artist ID" />
                <Button 
                  onClick={() => executeSpecificTool('query_artist_data', { artistId: 'demo-artist' })}
                  disabled={isExecuting}
                  className="w-full"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze Artist
                </Button>
              </CardContent>
            </Card>

            {/* Audio Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileAudio className="h-5 w-5" />
                  <span>Audio Processing</span>
                </CardTitle>
                <CardDescription>
                  Upload and process audio files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="File name" />
                <Button 
                  onClick={() => executeSpecificTool('upload_audio_file', { 
                    bucketName: 'patchline-audio',
                    fileName: 'demo-track.mp3',
                    fileContent: 'base64-encoded-content'
                  })}
                  disabled={isExecuting}
                  className="w-full"
                >
                  <FileAudio className="mr-2 h-4 w-4" />
                  Process Audio
                </Button>
              </CardContent>
            </Card>

            {/* Knowledge Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Music Knowledge</span>
                </CardTitle>
                <CardDescription>
                  Search music industry knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Search query" />
                <Button 
                  onClick={() => executeSpecificTool('music_knowledge_search', { 
                    query: 'indie rock trends 2024',
                    knowledgeBaseId: 'demo-kb'
                  })}
                  disabled={isExecuting}
                  className="w-full"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Search Knowledge
                </Button>
              </CardContent>
            </Card>

            {/* Performance Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Performance Logs</span>
                </CardTitle>
                <CardDescription>
                  Query performance and activity logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Log query" />
                <Button 
                  onClick={() => executeSpecificTool('query_performance_logs', { 
                    logGroupName: '/patchline/application',
                    query: 'fields @timestamp, @message | sort @timestamp desc | limit 100',
                    startTime: new Date(Date.now() - 3600000).toISOString(),
                    endTime: new Date().toISOString()
                  })}
                  disabled={isExecuting}
                  className="w-full"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Query Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 