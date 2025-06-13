"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Music,
  RefreshCw,
  Info
} from 'lucide-react'
import { MCPConnectionStatus, MCPTool } from '@/lib/mcp/types'

export default function MCPTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<MCPConnectionStatus | null>(null)
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([])
  const [selectedTool, setSelectedTool] = useState<string>('')
  const [toolParameters, setToolParameters] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Initialize MCP on component mount
  useEffect(() => {
    initializeMCP()
  }, [])

  const initializeMCP = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          userId: 'test-user',
          sessionId: `test-${Date.now()}`
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus(data.status)
        setAvailableTools(data.tools)
      } else {
        setError(data.error || 'Failed to initialize MCP')
      }
    } catch (err) {
      setError('Failed to connect to MCP API')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStatus = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/mcp?action=status')
      const data = await response.json()
      setConnectionStatus(data.status)
      
      const toolsResponse = await fetch('/api/mcp?action=tools')
      const toolsData = await toolsResponse.json()
      setAvailableTools(toolsData.tools)
    } catch (err) {
      setError('Failed to refresh status')
    } finally {
      setIsLoading(false)
    }
  }

  const executeTool = async () => {
    if (!selectedTool) {
      setError('Please select a tool to execute')
      return
    }

    setIsLoading(true)
    setError('')
    setResult('')

    try {
      // Build the user input based on selected tool and parameters
      const tool = availableTools.find(t => t.name === selectedTool)
      if (!tool) {
        setError('Selected tool not found')
        return
      }

      // Create a natural language request
      let userInput = `Please use the ${selectedTool} tool`
      
      if (Object.keys(toolParameters).length > 0) {
        const paramString = Object.entries(toolParameters)
          .filter(([_, value]) => value.trim())
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        
        if (paramString) {
          userInput += ` with parameters: ${paramString}`
        }
      }

      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          userInput,
          userId: 'test-user',
          sessionId: `test-${Date.now()}`
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.response)
      } else {
        setError(data.error || 'Failed to execute tool')
      }
    } catch (err) {
      setError('Failed to execute tool')
    } finally {
      setIsLoading(false)
    }
  }

  const handleParameterChange = (paramName: string, value: string) => {
    setToolParameters(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const selectedToolData = availableTools.find(t => t.name === selectedTool)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP Test Console</h1>
          <p className="text-muted-foreground">
            Test Model Context Protocol integration and tool execution
          </p>
        </div>
        <Button 
          onClick={refreshStatus} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Zapier MCP</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connectionStatus.zapier.connected)}
                  <span className="text-sm">
                    {connectionStatus.zapier.connected 
                      ? `${connectionStatus.zapier.availableActions} actions`
                      : 'Disconnected'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <span>Patchline MCP</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(connectionStatus.patchline.connected)}
                  <span className="text-sm">
                    {connectionStatus.patchline.connected 
                      ? `${connectionStatus.patchline.availableTools} tools`
                      : 'Disconnected'
                    }
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Initializing MCP connections...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tools</CardTitle>
          <CardDescription>
            Select a tool to test its functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTools.map((tool) => (
              <div
                key={tool.name}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedTool === tool.name
                    ? 'border-cosmic-teal bg-cosmic-teal/10'
                    : 'hover:border-cosmic-teal/50'
                }`}
                onClick={() => setSelectedTool(tool.name)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={tool.name.startsWith('zapier_') ? 'default' : 'secondary'}>
                    {tool.name.startsWith('zapier_') ? 'Zapier' : 'Patchline'}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm">{tool.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Parameters */}
      {selectedToolData && (
        <Card>
          <CardHeader>
            <CardTitle>Tool Parameters: {selectedTool}</CardTitle>
            <CardDescription>{selectedToolData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(selectedToolData.inputSchema.properties || {}).map(([paramName, paramSchema]: [string, any]) => (
              <div key={paramName} className="space-y-2">
                <Label htmlFor={paramName}>
                  {paramName}
                  {selectedToolData.inputSchema.required?.includes(paramName) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Input
                  id={paramName}
                  placeholder={paramSchema.description || `Enter ${paramName}`}
                  value={toolParameters[paramName] || ''}
                  onChange={(e) => handleParameterChange(paramName, e.target.value)}
                />
                {paramSchema.description && (
                  <p className="text-xs text-muted-foreground">{paramSchema.description}</p>
                )}
              </div>
            ))}
            
            <Button 
              onClick={executeTool} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Tool
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Execution Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={result}
              readOnly
              rows={8}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a test console for MCP integration. In development mode, tools are simulated.
          In production, they would connect to actual Zapier and Patchline MCP servers.
        </AlertDescription>
      </Alert>
    </div>
  )
} 