"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface AgentCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  href: string
  actionLabel: string
  actionHref?: string
  actionOnClick?: () => void
}

export function AgentCard({
  title,
  value,
  description,
  icon,
  href,
  actionLabel,
  actionHref,
  actionOnClick,
}: AgentCardProps) {
  return (
    <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10 justify-start"
            asChild
          >
            <Link href={href}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {actionOnClick ? (
            <Button
              variant="default"
              size="sm"
              className="gap-1 h-7 text-xs bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
              onClick={actionOnClick}
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="gap-1 h-7 text-xs bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
              asChild
            >
              <Link href={actionHref || href}>{actionLabel}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
