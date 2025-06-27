"use client"

import type React from "react"
import { Card as BrandCard } from '@/components/brand'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, TrendingUp, Zap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

interface InsightAction {
  label: string
  action: string
}

interface Insight {
  id: string
  type: "growth" | "viral" | "opportunity" | "warning"
  title: string
  description: string
  icon: React.ReactNode
  actions: InsightAction[]
  date: string
  priority: "high" | "medium" | "low"
}

interface AriaInsightsProps {
  insights: Insight[]
}

export function AriaInsights({ insights }: AriaInsightsProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "growth":
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case "viral":
        return <Zap className="h-5 w-5 text-purple-500" />
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-brand-cyan" />
      default:
        return <Lightbulb className="h-5 w-5 text-brand-cyan" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-500 border-red-500/20"
      case "medium":
        return "bg-purple-500/20 text-purple-500 border-purple-500/20"
      case "low":
        return "bg-green-500/20 text-green-500 border-green-500/20"
      default:
        return "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/20"
    }
  }

  return (
    <BrandCard className="glass-effect hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-brand-cyan" />
          <CardTitle className="text-lg font-medium">Aria's Insights</CardTitle>
        </div>
        <Badge variant="outline" className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20">
          AI-Powered
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border border-border/50 rounded-lg p-4 hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(insight.type)}
                  <h3 className="font-medium">{insight.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                    {insight.priority}
                  </Badge>
                  <Badge variant="outline" className="bg-background/20 text-muted-foreground border-border/50">
                    {insight.date}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
              <div className="flex flex-wrap gap-2">
                {insight.actions.map((action) => (
                  <Button
                    key={action.action}
                    variant="outline"
                    size="sm"
                    className="hover:bg-brand-cyan/10 hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors"
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </BrandCard>
  )
}
