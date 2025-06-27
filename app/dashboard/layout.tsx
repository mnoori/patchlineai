"use client"

import type React from "react"
import { useAuthSync } from "@/hooks/use-auth-sync"
import { GradientOrbs } from "@/components/brand"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sync auth state with permissions
  useAuthSync()
  
  return (
    <div data-dashboard-page className="dashboard-wrapper relative min-h-screen bg-background">
      {/* Gradient background orbs */}
      <GradientOrbs variant="default" className="opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
