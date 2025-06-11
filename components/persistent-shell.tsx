"use client"

import { usePathname } from 'next/navigation'
import { DashboardNavbar } from "@/components/dashboard/navbar"
import { SidebarWithChat } from "@/components/dashboard/sidebar-with-chat"
import { CommandBar } from "@/components/command-bar"

export function PersistentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')
  
  if (!isDashboard) {
    return <>{children}</>
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNavbar />
      <div className="flex flex-1 pt-16">
        <SidebarWithChat />
        <main className="flex-1 p-6 md:p-8 md:ml-64 chat-main transition-all duration-300">
          {children}
        </main>
      </div>
      <CommandBar />
    </div>
  )
} 