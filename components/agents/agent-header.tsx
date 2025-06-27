"use client"

import { useState } from "react"
import { Card } from '@/components/brand'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Zap } from "lucide-react"
import { AGENT_QUICK_ACTIONS, showTaskProgress } from "@/lib/agent-bridge"

interface AgentHeaderProps {
  agentName: keyof typeof AGENT_QUICK_ACTIONS
  title: string
  description: string
}

export function AgentHeader({ agentName, title, description }: AgentHeaderProps) {
  const [isRunning, setIsRunning] = useState(false)
  const agentActions = AGENT_QUICK_ACTIONS[agentName]

  const handleQuickAction = () => {
    setIsRunning(true)
    showTaskProgress(agentActions.primary, () => {
      setIsRunning(false)
    })
  }

  const handleAutomation = (automation: string) => {
    showTaskProgress(automation)
  }

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 ${isRunning ? "animate-pulse border-brand-cyan" : ""}`}
              disabled={isRunning}
            >
              <Zap className={`h-4 w-4 ${isRunning ? "text-brand-cyan animate-pulse" : ""}`} />
              Run Agent
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleQuickAction} className="font-medium">
              <Zap className="h-4 w-4 mr-2 text-brand-cyan" />
              {agentActions.primary}
            </DropdownMenuItem>
            <div className="border-t my-1" />
            {agentActions.automations.map((automation, index) => (
              <DropdownMenuItem key={index} onClick={() => handleAutomation(automation)} className="text-sm">
                {automation}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
