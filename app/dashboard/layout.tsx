import type React from "react"
import { DashboardNavbar } from "@/components/dashboard/navbar"
import { SidebarWithChat } from "@/components/dashboard/sidebar-with-chat"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNavbar />
      <div className="flex flex-1 pt-16">
        <SidebarWithChat />
        <main className="flex-1 p-6 md:p-8 md:ml-64 chat-main transition-all duration-300">{children}</main>
      </div>
    </div>
  )
}
