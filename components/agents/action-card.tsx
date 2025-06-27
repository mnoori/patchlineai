"use client"

import type React from "react"

import { Card as BrandCard } from '@/components/brand'
import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { PATCHLINE_CONFIG } from "@/lib/config"

interface ActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  actions: {
    label: string
    onClick: () => Promise<void> | void
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
    icon?: React.ReactNode
    autoAction?: boolean // If true, this is the "Do it for me" action
  }[]
  className?: string
  status?: "idle" | "loading" | "success" | "error"
}

export function ActionCard({ title, description, icon, actions, className, status = "idle" }: ActionCardProps) {
  const [cardStatus, setCardStatus] = useState(status)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAction = async (action: ActionCardProps["actions"][0]) => {
    if (!PATCHLINE_CONFIG.features.enableAgentSuperLoop) {
      console.log("Agent Super-Loop is disabled")
      return
    }

    try {
      setCardStatus("loading")
      await action.onClick()
      setCardStatus("success")

      // Reset status after 2 seconds
      setTimeout(() => {
        setCardStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Action failed:", error)
      setCardStatus("error")

      // Reset status after 2 seconds
      setTimeout(() => {
        setCardStatus("idle")
      }, 2000)
    }
  }

  return (
    <BrandCard
      className={cn(
        "glass-effect hover:border-brand-cyan/30 transition-all duration-300",
        "hover:shadow-[0_8px_30px_rgb(0,240,255,0.1)]",
        cardStatus === "success" && "border-green-500/30",
        cardStatus === "error" && "border-red-500/30",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-brand-cyan/10 p-2 mt-0.5">{icon}</div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {cardStatus === "success" && (
                <div className="rounded-full bg-green-500/10 p-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || (action.autoAction ? "default" : "outline")}
                  size="sm"
                  className={cn("gap-1 h-8", action.autoAction && "bg-brand-cyan hover:bg-brand-cyan/90 text-black")}
                  onClick={() => handleAction(action)}
                  disabled={cardStatus === "loading"}
                >
                  {cardStatus === "loading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : action.icon ? (
                    action.icon
                  ) : action.autoAction ? (
                    <ArrowRight className="h-3.5 w-3.5" />
                  ) : null}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </BrandCard>
  )
}
