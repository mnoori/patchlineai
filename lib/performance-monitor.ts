/**
 * Simple performance monitoring for API routes
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()
  
  static start(label: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, [])
      }
      
      const measurements = this.measurements.get(label)!
      measurements.push(duration)
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift()
      }
      
      // Log if it's particularly slow
      if (duration > 1000) {
        console.warn(`[PERF] Slow operation: ${label} took ${duration.toFixed(0)}ms`)
      }
      
      return duration
    }
  }
  
  static getStats(label: string) {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) {
      return null
    }
    
    const sorted = [...measurements].sort((a, b) => a - b)
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
    
    return {
      avg: avg.toFixed(0),
      min: sorted[0].toFixed(0),
      max: sorted[sorted.length - 1].toFixed(0),
      p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(0),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(0),
      count: measurements.length
    }
  }
  
  static logAllStats() {
    console.log('[PERF] Performance Statistics:')
    for (const [label, _] of this.measurements) {
      const stats = this.getStats(label)
      if (stats) {
        console.log(`  ${label}: avg=${stats.avg}ms, p50=${stats.p50}ms, p95=${stats.p95}ms (n=${stats.count})`)
      }
    }
  }
} 