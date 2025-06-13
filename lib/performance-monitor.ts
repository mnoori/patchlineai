/**
 * Performance monitoring utility for tracking API response times
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitorClass {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private activeTimers: Map<string, number> = new Map()

  /**
   * Start timing an operation
   * @param name - Name of the operation (e.g., 'api:user', 'api:platforms')
   * @returns Function to stop the timer
   */
  start(name: string): () => void {
    const startTime = Date.now()
    const timerId = `${name}-${startTime}-${Math.random()}`
    
    this.activeTimers.set(timerId, startTime)
    
    return () => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Remove from active timers
      this.activeTimers.delete(timerId)
      
      // Store metric
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      
      const metrics = this.metrics.get(name)!
      metrics.push({
        name,
        startTime,
        endTime,
        duration
      })
      
      // Keep only last 100 metrics per operation
      if (metrics.length > 100) {
        metrics.shift()
      }
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`[PERFORMANCE] Slow operation detected: ${name} took ${duration}ms`)
      }
      
      return duration
    }
  }

  /**
   * Get average duration for an operation
   */
  getAverage(name: string): number {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, m) => acc + (m.duration || 0), 0)
    return Math.round(sum / metrics.length)
  }

  /**
   * Get all metrics for an operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || []
  }

  /**
   * Get summary of all operations
   */
  getSummary(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, any> = {}
    
    this.metrics.forEach((metrics, name) => {
      const durations = metrics.map(m => m.duration || 0).filter(d => d > 0)
      if (durations.length === 0) return
      
      summary[name] = {
        count: durations.length,
        average: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations)
      }
    })
    
    return summary
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
    this.activeTimers.clear()
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const summary = this.getSummary()
    console.log('[PERFORMANCE SUMMARY]')
    console.table(summary)
  }
}

// Export singleton instance
export const PerformanceMonitor = new PerformanceMonitorClass() 