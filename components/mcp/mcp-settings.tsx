"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Zap, 
  Music,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react'
import { MCPConnectionStatus, MCPTool, ZapierAction } from '@/lib/mcp/types'

interface MCPSettingsProps {
  onStatusChange?: (status: MCPConnectionStatus) => void
}

export function MCPSettings({ onStatusChange }: MCPSettingsProps) {
  const [connectionStatus, setConnectionStatus] = useState<MCPConnectionStatus>({
    zapier: { connected: false, availableActions: 0 },
    patchline: { connected: false, availableTools: 0 }
  })
  
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([])
  const [zapierApiKey, setZapierApiKey] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  // Simulated data for development
  useEffect(() => {
    // Simulate initial connection status
    const mockStatus: MCPConnectionStatus = {
      zapier: {
        connected: false,
        availableActions: 0,
        error: 'API key not configured'
      },
      patchline: {
        connected: true,
        availableTools: 5,
        lastSync: new Date()
      }
    }
    setConnectionStatus(mockStatus)
    onStatusChange?.(mockStatus)

    // Simulate available tools
    const mockTools: MCPTool[] = [
      {
        name: 'zapier_send_slack_message',
        description: 'Send a message to a Slack channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Slack channel name' },
            message: { type: 'string', description: 'Message to send' }
          },
          required: ['channel', 'message']
        }
      },
      {
        name: 'zapier_post_to_buffer',
        description: 'Schedule a social media post via Buffer',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Post content' },
            platforms: { type: 'array', description: 'Social media platforms' }
          },
          required: ['text', 'platforms']
        }
      },
      {
        name: 'patchline_get_soundcharts_metrics',
        description: 'Get real-time artist metrics from SoundCharts',
        inputSchema: {
          type: 'object',
          properties: {
            artistId: { type: 'string', description: 'SoundCharts artist ID' }
          },
          required: ['artistId']
        }
      },
      {
        name: 'patchline_generate_flyer',
        description: 'Generate promotional flyer using AI',
        inputSchema: {
          type: 'object',
          properties: {
            eventTitle: { type: 'string', description: 'Event or release title' },
            artistName: { type: 'string', description: 'Artist name' }
          },
          required: ['eventTitle', 'artistName']
        }
      }
    ]
    setAvailableTools(mockTools)
  }, [onStatusChange])

  const handleZapierConnect = async () => {
    if (!zapierApiKey.trim()) {
      alert('Please enter your Zapier API key')
      return
    }

    setIsConnecting(true)
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newStatus = {
        ...connectionStatus,
        zapier: {
          connected: true,
          availableActions: 50,
          lastSync: new Date()
        }
      }
      
      setConnectionStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error('Failed to connect to Zapier:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = (server: 'zapier' | 'patchline') => {
    const newStatus = {
      ...connectionStatus,
      [server]: {
        connected: false,
        availableActions: 0,
        availableTools: 0
      }
    }
    setConnectionStatus(newStatus)
    onStatusChange?.(newStatus)
  }

  const handleRefreshTools = async () => {
    setIsConnecting(true)
    
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newStatus = {
        ...connectionStatus,
        zapier: {
          ...connectionStatus.zapier,
          lastSync: new Date()
        },
        patchline: {
          ...connectionStatus.patchline,
          lastSync: new Date()
        }
      }
      
      setConnectionStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch (error) {
      console.error('Failed to refresh tools:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const toggleToolSelection = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName) 
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    )
  }

  const getServerIcon = (server: 'zapier' | 'patchline') => {
    return server === 'zapier' ? <Zap className="h-4 w-4" /> : <Music className="h-4 w-4" />
  }

  const getStatusIcon = (connected: boolean, error?: string) => {
    if (error) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return connected ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MCP Settings</h2>
          <p className="text-muted-foreground">
            Configure Model Context Protocol connections to extend your AI capabilities
          </p>
        </div>
        <Button 
          onClick={handleRefreshTools} 
          disabled={isConnecting}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          {/* Zapier Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Zapier MCP
                {getStatusIcon(connectionStatus.zapier.connected, connectionStatus.zapier.error)}
              </CardTitle>
              <CardDescription>
                Connect to 8,000+ apps through Zapier's MCP server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connectionStatus.zapier.connected ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zapier-api-key">Zapier API Key</Label>
                    <Input
                      id="zapier-api-key"
                      type="password"
                      placeholder="Enter your Zapier API key"
                      value={zapierApiKey}
                      onChange={(e) => setZapierApiKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from{' '}
                      <a 
                        href="https://zapier.com/app/developer" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        Zapier Developer Platform
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                  
                  {connectionStatus.zapier.error && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {connectionStatus.zapier.error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    onClick={handleZapierConnect} 
                    disabled={isConnecting || !zapierApiKey.trim()}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect to Zapier'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-600">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        {connectionStatus.zapier.availableActions} actions available
                      </p>
                      {connectionStatus.zapier.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced: {connectionStatus.zapier.lastSync.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleDisconnect('zapier')} 
                      variant="outline"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patchline Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Patchline MCP
                {getStatusIcon(connectionStatus.patchline.connected, connectionStatus.patchline.error)}
              </CardTitle>
              <CardDescription>
                Specialized music industry tools and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionStatus.patchline.connected ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-600">Connected</p>
                    <p className="text-sm text-muted-foreground">
                      {connectionStatus.patchline.availableTools} tools available
                    </p>
                    {connectionStatus.patchline.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {connectionStatus.patchline.lastSync.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleDisconnect('patchline')} 
                    variant="outline"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Patchline MCP server is not available. This will be enabled in the next update.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
              <CardDescription>
                Select which MCP tools you want to enable for your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableTools.map((tool) => (
                  <div key={tool.name} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Switch
                      checked={selectedTools.includes(tool.name)}
                      onCheckedChange={() => toggleToolSelection(tool.name)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{tool.name}</h4>
                        <Badge variant={tool.name.startsWith('zapier_') ? 'default' : 'secondary'}>
                          {tool.name.startsWith('zapier_') ? 'Zapier' : 'Patchline'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Required: {tool.inputSchema.required?.join(', ') || 'None'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP Preferences</CardTitle>
              <CardDescription>
                Configure how MCP tools behave in your workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-confirm actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically execute MCP tools without confirmation prompts
                  </p>
                </div>
                <Switch />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when MCP tools complete actions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep detailed logs of all MCP tool executions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 