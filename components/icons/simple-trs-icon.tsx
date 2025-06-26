import React from "react"
import { COLORS } from "@/lib/brand"

interface SimpleTRSIconProps {
  className?: string
}

export function SimpleTRSIcon({ className }: SimpleTRSIconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded square (patchbay module) */}
      <rect x="2" y="2" width="20" height="20" rx="3" fill={COLORS.ui.card} stroke="currentColor" strokeWidth="1.5" />
      
      {/* Jack input holes - simpler version with just 2 jacks */}
      <circle cx="8" cy="8" r="2.5" fill={COLORS.ui.border} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill={COLORS.ui.border} stroke="currentColor" strokeWidth="1.5" />
      
      {/* TRS Cable connecting the jacks */}
      <path 
        d="M8 8 L16 16" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Jack connectors (gold tips) */}
      <circle cx="8" cy="8" r="1" fill="gold" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="1" fill="gold" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  )
}
