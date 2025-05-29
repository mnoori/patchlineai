"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, CheckCircle, AlertCircle, ChevronRight, Zap, Mail, Calendar, User } from 'lucide-react'

interface AgentTrace {
  timestamp: string
  agent?: string
  action: string
  status: 'info' | 'success' | 'error' | 'delegating'
  details?: string
  emailData?: {
    subject?: string
    from?: string
    date?: string
  }
}

interface SupervisorTracesProps {
  traces: AgentTrace[]
  isOpen: boolean
  onClose: () => void
}

export function SupervisorTraces({ traces, isOpen, onClose }: SupervisorTracesProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'delegating':
        return <Zap className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 border-green-200'
      case 'error':
        return 'text-red-600 border-red-200'
      case 'delegating':
        return 'text-yellow-600 border-yellow-200'
      default:
        return 'text-blue-600 border-blue-200'
    }
  }

  const formatEmailData = (emailData: AgentTrace['emailData']) => {
    if (!emailData) return null
    
    return (
      <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-cosmic-teal" />
          <span className="text-sm font-medium text-cosmic-teal">Email Found</span>
        </div>
        <div className="space-y-1 text-xs">
          {emailData.subject && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-muted-foreground min-w-[60px]">Subject:</span>
              <span className="text-foreground">{emailData.subject}</span>
            </div>
          )}
          {emailData.from && (
            <div className="flex items-start gap-2">
              <User className="h-3 w-3 text-muted-foreground mt-0.5" />
              <span className="font-medium text-muted-foreground min-w-[50px]">From:</span>
              <span className="text-foreground">{emailData.from}</span>
            </div>
          )}
          {emailData.date && (
            <div className="flex items-start gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground mt-0.5" />
              <span className="font-medium text-muted-foreground min-w-[50px]">Date:</span>
              <span className="text-foreground">{emailData.date}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cosmic-teal" />
            Supervisor Agent Orchestration Traces
          </DialogTitle>
          <DialogDescription>
            View the detailed execution flow of your request through the agent system
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
          <div className="space-y-4">
            {traces.map((trace, index) => (
              <div key={index} className="flex items-start gap-3 relative">
                {/* Timeline connector */}
                {index < traces.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-16 bg-border" />
                )}
                
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(trace.status)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{trace.action}</span>
                    {trace.agent && (
                      <Badge variant="outline" className={`text-xs ${getStatusColor(trace.status)}`}>
                        {trace.agent}
                      </Badge>
                    )}
                  </div>
                  
                  {trace.details && (
                    <p className="text-xs text-muted-foreground mt-1">{trace.details}</p>
                  )}
                  
                  {/* Email metadata display */}
                  {trace.emailData && formatEmailData(trace.emailData)}
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    {new Date(trace.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {traces.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No traces available</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {traces.length} trace{traces.length !== 1 ? 's' : ''} recorded
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 