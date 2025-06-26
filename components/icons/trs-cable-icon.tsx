import React from "react"
import { COLORS } from "@/lib/brand"

interface TRSCableIconProps {
  className?: string
}

export function TRSCableIcon({ className }: TRSCableIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer rounded square (patchbay module) */}
      <rect x="2" y="2" width="20" height="20" rx="3" fill={COLORS.ui.card} stroke="currentColor" />
      
      {/* Jack input holes */}
      <circle cx="7" cy="7" r="2" fill={COLORS.ui.border} stroke="currentColor" />
      <circle cx="17" cy="7" r="2" fill={COLORS.ui.border} stroke="currentColor" />
      <circle cx="7" cy="17" r="2" fill={COLORS.ui.border} stroke="currentColor" />
      <circle cx="17" cy="17" r="2" fill={COLORS.ui.border} stroke="currentColor" />
      
      {/* TRS Cable - going from top-left to bottom-right */}
      <path 
        d="M7 7 C 9 9, 15 15, 17 17" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
      />
      
      {/* Cable highlights/sheen */}
      <path 
        d="M7.5 6.5 C 9.5 8.5, 15.5 14.5, 17.5 16.5" 
        stroke="white" 
        strokeWidth="0.5" 
        strokeOpacity="0.3" 
        fill="none" 
      />
      
      {/* Jack connectors (cable ends) */}
      <circle cx="7" cy="7" r="1" fill="gold" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="17" cy="17" r="1" fill="gold" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  )
}
