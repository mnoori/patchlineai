"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, CheckCircle, AlertCircle, ChevronRight, Zap } from 'lucide-react'

interface AgentTrace {
  timestamp: string
  agent?: string
  action: string
  status: 'info' | 'success' | 'error' | 'delegating'
  details?: string
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
        return <Zap className="h-4 w-4 text-cosmic-teal" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'delegating':
        return 'bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20'
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cosmic-teal" />
            Supervisor Agent Orchestration Traces
          </DialogTitle>
          <DialogDescription>
            View the detailed execution flow of your request through the agent system
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-3">
            {traces.map((trace, index) => (
              <div key={index} className="flex items-start gap-3 relative">
                {/* Timeline connector */}
                {index < traces.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-12 bg-border" />
                )}
                
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(trace.status)}
                </div>
                
                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{trace.action}</span>
                    {trace.agent && (
                      <Badge variant="outline" className={`text-xs ${getStatusColor(trace.status)}`}>
                        {trace.agent}
                      </Badge>
                    )}
                  </div>
                  
                  {trace.details && (
                    <p className="text-xs text-muted-foreground">{trace.details}</p>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(trace.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 