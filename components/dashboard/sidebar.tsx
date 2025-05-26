"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Music2,
  Calendar,
  Search,
  FileText,
  Database,
  Users,
  PlusCircle,
  BarChart2,
  Settings,
  ChevronDown,
  HelpCircle,
  Store,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Catalog",
    href: "/dashboard/catalog",
    icon: <Music2 className="h-5 w-5" />,
  },
  {
    title: "Releases",
    href: "/dashboard/releases",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Agents",
    icon: <PlusCircle className="h-5 w-5" />,
    submenu: [
      {
        title: "Scout",
        href: "/dashboard/agents/scout",
        icon: <Search className="h-5 w-5" />,
      },
      {
        title: "Legal",
        href: "/dashboard/agents/legal",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "Metadata",
        href: "/dashboard/agents/metadata",
        icon: <Database className="h-5 w-5" />,
      },
      {
        title: "Fan",
        href: "/dashboard/agents/fan",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Marketplace",
        href: "/dashboard/agents/marketplace",
        icon: <Store className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Insights",
    href: "/dashboard/insights",
    icon: <BarChart2 className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: <HelpCircle className="h-5 w-5" />,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("Agents")

  // Set Agents submenu to open by default
  useEffect(() => {
    setOpenSubmenu("Agents")
  }, [])

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  return (
    <div className="fixed top-16 bottom-0 left-0 z-40 hidden w-64 border-r bg-background md:block">
      <div className="flex h-full flex-col overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => {
            const isActive = item.href
              ? pathname === item.href
              : item.submenu?.some((subItem) => pathname === subItem.href)

            return (
              <div key={item.title}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-cosmic-teal/10 text-cosmic-teal"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", openSubmenu === item.title && "rotate-180")}
                      />
                    </button>
                    {openSubmenu === item.title && (
                      <div className="mt-1 space-y-1 pl-6">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <Link
                              key={subItem.title}
                              href={subItem.href}
                              className={cn(
                                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isSubActive
                                  ? "bg-cosmic-teal/10 text-cosmic-teal"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              {subItem.icon}
                              <span className="ml-3">{subItem.title}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-cosmic-teal/10 text-cosmic-teal"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
