"use client"

import { useEffect, useState } from 'react'
import { PerformanceMonitor } from '@/lib/performance-monitor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    // Check if performance monitoring is enabled
    const showPerf = localStorage.getItem('showPerformance') === 'true'
    setIsVisible(showPerf)

    if (!showPerf) return

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      const summary = PerformanceMonitor.getSummary()
      setMetrics(summary)
    }, 2000)

    // Log summary every 30 seconds
    const logInterval = setInterval(() => {
      PerformanceMonitor.logSummary()
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(logInterval)
    }
  }, [])

  // Toggle performance dashboard with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        const newState = !isVisible
        setIsVisible(newState)
        localStorage.setItem('showPerformance', newState.toString())
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVisible])

  if (!isVisible || process.env.NODE_ENV !== 'development') return null

  const getPerformanceColor = (avg: number) => {
    if (avg < 100) return 'text-green-500'
    if (avg < 500) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getPerformanceBadge = (avg: number) => {
    if (avg < 100) return { variant: 'default' as const, text: 'Fast' }
    if (avg < 500) return { variant: 'secondary' as const, text: 'Normal' }
    return { variant: 'destructive' as const, text: 'Slow' }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-background/95 backdrop-blur border-brand-cyan/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-cyan" />
              Performance Monitor
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Ctrl+Shift+P to toggle
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(metrics).length === 0 ? (
            <p className="text-sm text-muted-foreground">No metrics collected yet...</p>
          ) : (
            <>
              {Object.entries(metrics).map(([name, stats]) => {
                const badge = getPerformanceBadge(stats.average)
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{name}</span>
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.text}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className={cn('font-mono', getPerformanceColor(stats.average))}>
                          {stats.average}ms
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-muted-foreground">{stats.min}ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-muted-foreground">{stats.max}ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">n=</span>
                        <span className="font-mono text-muted-foreground">{stats.count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Cache hits reduce API calls to ~20ms
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 