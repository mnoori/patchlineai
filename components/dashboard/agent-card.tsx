"use client"

import type React from "react"

import { Card as BrandCard } from '@/components/brand'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <BrandCard className="glass-effect hover:border-brand-cyan/30 transition-all duration-300" variant="gradient" hover="glow">
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
            className="gap-1 h-7 px-2 text-xs text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10 justify-start"
            asChild
          >
            <Link href={href}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {actionOnClick ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-7 text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-black"
              onClick={actionOnClick}
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-7 text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-black"
              asChild
            >
              <Link href={actionHref || href}>{actionLabel}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </BrandCard>
  )
}
