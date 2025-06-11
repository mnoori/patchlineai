"use client"

import type React from "react"
import { useAuthSync } from "@/hooks/use-auth-sync"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sync auth state with permissions
  useAuthSync()
  
  return <>{children}</>
}
