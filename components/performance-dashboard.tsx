"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { PerformanceMonitor } from '@/lib/performance-monitor'

export function PerformanceDashboard() {
  const [stats, setStats] = useState<Record<string, any>>({})
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return
    
    // Check for keyboard shortcut (Ctrl+Shift+P)
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setVisible(!visible)
      }
    }
    
    window.addEventListener('keydown', handleKeydown)
    
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      const newStats: Record<string, any> = {}
      const labels = [
        'api:user',
        'api:platforms', 
        'api:embeds',
        'api:embed',
        'api:spotify-search',
      ]
      
      labels.forEach(label => {
        const stat = PerformanceMonitor.getStats(label)
        if (stat) {
          newStats[label] = stat
        }
      })
      
      setStats(newStats)
    }, 2000)
    
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      clearInterval(interval)
    }
  }, [visible])
  
  if (!visible || process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 bg-background/95 backdrop-blur shadow-lg max-w-md">
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm">Performance Monitor</h3>
          <button 
            onClick={() => setVisible(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Press Ctrl+Shift+P to toggle
          </button>
        </div>
        
        {Object.entries(stats).map(([label, stat]) => (
          <div key={label} className="text-xs space-y-1 border-b pb-2">
            <div className="font-medium">{label}</div>
            <div className="grid grid-cols-5 gap-2 text-muted-foreground">
              <div>
                <span className="block text-[10px]">AVG</span>
                <span className="text-foreground">{stat.avg}ms</span>
              </div>
              <div>
                <span className="block text-[10px]">MIN</span>
                <span className="text-green-600">{stat.min}ms</span>
              </div>
              <div>
                <span className="block text-[10px]">MAX</span>
                <span className="text-red-600">{stat.max}ms</span>
              </div>
              <div>
                <span className="block text-[10px]">P50</span>
                <span className="text-foreground">{stat.p50}ms</span>
              </div>
              <div>
                <span className="block text-[10px]">P95</span>
                <span className="text-orange-600">{stat.p95}ms</span>
              </div>
            </div>
          </div>
        ))}
        
        {Object.keys(stats).length === 0 && (
          <p className="text-xs text-muted-foreground">No performance data yet...</p>
        )}
      </div>
    </Card>
  )
} 