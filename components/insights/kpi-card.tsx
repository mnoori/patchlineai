"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CHART_COLORS, COLORS } from "@/lib/brand"

interface KPICardProps {
  title: string
  value: number
  format?: "currency" | "number" | "percentage"
  suffix?: string
  change: number
  trend: "up" | "down" | "flat"
  sparkline: number[]
  badge?: string
  icon: React.ReactNode
  alert?: string
}

const SparklineComponent = ({ data, color = CHART_COLORS.primary }: { data: number[]; color?: string }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 60
      const y = 20 - ((value - min) / range) * 20
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width="60" height="20" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const trendColors = {
  up: COLORS.semantic.success,
  down: COLORS.semantic.error,
  flat: CHART_COLORS.primary,
}

const trendIcon = {
  up: <ArrowUp className="h-3.5 w-3.5" />,
  down: <ArrowDown className="h-3.5 w-3.5" />,
  flat: null,
}

const sparklineColor = {
  up: "#22c55e",
  down: "#ef4444",
  flat: "#00F0FF",
}

const formatValue = (value: number, format?: "currency" | "number" | "percentage") => {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (format === "percentage") {
    return `${value}%`
  }
  if (format === "number") {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
  }
  return value.toString()
}

export function KPICard({
  title,
  value,
  format = "number",
  suffix = "",
  change,
  trend,
  sparkline,
  badge,
  icon,
  alert,
}: KPICardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glass-effect hover:border-cosmic-teal/30 hover:scale-[1.02] transition-all duration-300 overflow-hidden group relative h-[180px]">
        {alert && (
          <div className="absolute top-2 right-2 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{alert}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="rounded-full bg-cosmic-teal/10 p-1.5 text-cosmic-teal">{icon}</div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold">
              {formatValue(value, format)}
              {suffix}
            </div>
            {badge && (
              <Badge variant="outline" className="text-xs bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20">
                {badge}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-1 text-xs ${trendColors[trend]}`}>
              {trendIcon[trend]}
              <span>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
            <SparklineComponent data={sparkline} color={sparklineColor[trend]} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
