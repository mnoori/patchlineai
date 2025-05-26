"use client"

import { useState } from "react"
import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AgentHintProps {
  id: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: (id: string) => void
  className?: string
}

export function AgentHint({ id, message, action, onDismiss, className }: AgentHintProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.(id)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "bg-sky-900/60 border-l-2 border-cyan-500 p-3 rounded-r-md",
        "flex items-center justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
        <p className="text-sm italic text-cyan-100">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {action && (
          <Button
            size="sm"
            variant="outline"
            onClick={action.onClick}
            className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
          >
            {action.label}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-cyan-400 hover:bg-cyan-500/10"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
