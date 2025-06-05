"use client"

import type React from "react"
import { DashboardNavbar } from "@/components/dashboard/navbar"
import { SidebarWithChat } from "@/components/dashboard/sidebar-with-chat"
import { CommandBar } from "@/components/command-bar"
import { useAuthSync } from "@/hooks/use-auth-sync"
import { TierPersistence } from "@/components/tier-persistence"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sync auth state with permissions
  useAuthSync()
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* This component ensures tier persistence across page navigations */}
      <TierPersistence />
      
      <DashboardNavbar />
      <div className="flex flex-1 pt-16">
        <SidebarWithChat />
        <main className="flex-1 p-6 md:p-8 md:ml-64 chat-main transition-all duration-300">{children}</main>
      </div>
      <CommandBar />
    </div>
  )
}
