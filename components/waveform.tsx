import type React from "react"
import { cn } from "@/lib/utils"

interface WaveformProps {
  className?: string
  barCount?: number
  animated?: boolean
}

export function Waveform({ className, barCount = 20, animated = true }: WaveformProps) {
  return (
    <div className={cn("waveform-container", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn("waveform-bar", animated ? "" : "!animation-none")}
          style={
            {
              "--i": i,
              "--speed": `${1 + Math.random() * 0.5}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
