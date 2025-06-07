'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, Mail, Scale, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentTrace {
  timestamp: string
  action: string
  status: 'info' | 'success' | 'error' | 'delegating'
  agent?: string
  details?: string
  emailData?: {
    subject: string
    from: string
    date: string
  }
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agentsUsed?: string[]
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function SupervisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [traces, setTraces] = useState<AgentTrace[]>([])
  const [agentsUsed, setAgentsUsed] = useState<string[]>([])
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('supervisorSessionId') || generateSessionId()
    }
    return generateSessionId()
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const tracesScrollRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentAction, setCurrentAction] = useState<string>('')
  const [streamingAgent, setStreamingAgent] = useState<string>('')

  // Save session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supervisorSessionId', sessionId)
    }
  }, [sessionId])

  // Connect to streaming logs when component mounts
  useEffect(() => {
    // Connect to SSE endpoint
    const es = new EventSource(`/api/chat/supervisor/stream?sessionId=${sessionId}`)
    
    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'trace') {
        setTraces(prev => [...prev, data.trace])
        
        // Update streaming visualization
        if (data.trace.status === 'delegating') {
          console.log('Setting streaming state:', data.trace)
          setIsStreaming(true)
          setCurrentAction(data.trace.action)
          setStreamingAgent(data.trace.agent || '')
        } else if (data.trace.status === 'info' && data.trace.agent) {
          setIsStreaming(true)
          setCurrentAction(data.trace.action)
          setStreamingAgent(data.trace.agent)
        } else if (data.trace.status === 'success' || data.trace.status === 'error') {
          // Keep streaming for a moment to show completion
          setTimeout(() => {
            setIsStreaming(false)
            setCurrentAction('')
            setStreamingAgent('')
          }, 500)
        }
      } else if (data.type === 'info' || data.type === 'success' || data.type === 'error' || data.type === 'agent') {
        // Add as a trace for display
        setTraces(prev => [...prev, {
          timestamp: data.timestamp,
          action: data.message,
          status: data.type === 'error' ? 'error' : data.type === 'success' ? 'success' : 'info',
        }])
      }
    }
    
    es.onerror = (error) => {
      console.error('SSE error:', error)
      setIsStreaming(false)
    }
    
    setEventSource(es)
    
    return () => {
      es.close()
    }
  }, [sessionId])

  // Auto-scroll traces
  useEffect(() => {
    if (tracesScrollRef.current) {
      tracesScrollRef.current.scrollTop = tracesScrollRef.current.scrollHeight
    }
  }, [traces])

  // Auto-scroll messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setTraces([]) // Clear traces for new request
    setAgentsUsed([])
    setIsStreaming(true)
    setCurrentAction('Analyzing your request...')

    try {
      const response = await fetch('/api/chat/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          userId: 'user-123' // In production, get from auth
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        agentsUsed: data.agentsUsed
      }

      setMessages(prev => [...prev, assistantMessage])
      setAgentsUsed(data.agentsUsed || [])
      
      // Traces are already being updated via SSE
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setCurrentAction('')
      setStreamingAgent('')
    }
  }

  const getAgentIcon = (agent?: string) => {
    if (!agent) return <Bot className="h-4 w-4" />
    if (agent.includes('Gmail')) return <Mail className="h-4 w-4" />
    if (agent.includes('Legal')) return <Scale className="h-4 w-4" />
    return <Bot className="h-4 w-4" />
  }

  const getStatusIcon = (status: AgentTrace['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'delegating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const renderMessageContent = (content: string) => {
    // Check if the content contains contract analysis
    const hasContractAnalysis = content.includes('# Contract Analysis Report')
    const hasLegalAssessment = content.includes('## Legal Assessment')
    
    if (hasContractAnalysis || hasLegalAssessment) {
      const lines = content.split('\n')
      
      // Parse and render structured content
      return (
        <div className="space-y-3">
          {/* Show legal assessment in a styled card */}
          {hasLegalAssessment && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-sm text-amber-900 dark:text-amber-100">Legal Assessment</span>
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                {lines
                  .slice(lines.findIndex(line => line.includes('## Legal Assessment')) + 1)
                  .filter(line => line.trim() !== '' && !line.startsWith('#'))
                  .join('\n')
                  .trim()}
              </div>
            </div>
          )}
          
          {/* Render the full content as well for context */}
          <div className="whitespace-pre-wrap text-sm opacity-90">
            {content}
          </div>
        </div>
      )
    }
    
    // Default rendering for regular messages
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[800px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                Supervisor Agent
              </CardTitle>
              <CardDescription>
                Multi-agent orchestrator that coordinates Gmail and Legal specialists
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ask me anything! I'll coordinate with specialized agents to help you.</p>
                      <p className="text-sm mt-2">Try: "Did Ael send me any contracts?" or "Check my emails from last week"</p>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[80%]",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {renderMessageContent(message.content)}
                        {message.agentsUsed && message.agentsUsed.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {message.agentsUsed.map((agent, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {getAgentIcon(agent)}
                                <span className="ml-1">{agent}</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="rounded-lg px-4 py-2 bg-muted max-w-[80%]">
                        {isStreaming ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="h-2 w-2 bg-primary rounded-full animate-ping absolute"></div>
                                <div className="h-2 w-2 bg-primary rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium">{currentAction}</span>
                            </div>
                            {streamingAgent && (
                              <div className="flex items-center gap-2 ml-4">
                                {getAgentIcon(streamingAgent)}
                                <span className="text-xs text-muted-foreground">{streamingAgent} is working...</span>
                                <div className="flex gap-1">
                                  <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about emails, contracts, or any combination..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Traces */}
        <div className="lg:col-span-1">
          <Card className="h-[800px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm">Real-time Activity</CardTitle>
              <CardDescription className="text-xs">
                Live agent coordination logs
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-2" ref={tracesScrollRef}>
                <div className="space-y-2">
                  {traces.map((trace, index) => (
                    <div
                      key={index}
                      className="text-xs border rounded-lg p-2 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(trace.status)}
                        <span className="font-medium">{trace.action}</span>
                      </div>
                      {trace.agent && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {getAgentIcon(trace.agent)}
                          <span>{trace.agent}</span>
                        </div>
                      )}
                      {trace.details && (
                        <p className="text-muted-foreground">{trace.details}</p>
                      )}
                      {trace.emailData && (
                        <div className="bg-muted rounded p-2 mt-1 border border-primary/20">
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3 text-primary" />
                            <p className="font-medium text-xs">Email Preview</p>
                          </div>
                          <p className="font-medium text-xs">{trace.emailData.subject}</p>
                          <p className="text-muted-foreground text-xs">From: {trace.emailData.from}</p>
                          {trace.emailData.date && (
                            <p className="text-muted-foreground text-xs">Date: {trace.emailData.date}</p>
                          )}
                        </div>
                      )}
                      <p className="text-muted-foreground">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 