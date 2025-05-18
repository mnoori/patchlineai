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
import { ChatInterface } from "../chat/chat-interface"
import { TRSCableLogo } from "../icons/trs-cable-logo"

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

export function SidebarWithChat() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("Agents")
  const [showChat, setShowChat] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)

  // Set Agents submenu to open by default
  useEffect(() => {
    setOpenSubmenu("Agents")
  }, [])

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const toggleChat = () => {
    setShowChat(!showChat)

    // If we're closing the chat, make sure to reset the expanded state
    if (showChat) {
      setIsChatExpanded(false)
      document.querySelector(".chat-main")?.classList.remove("chat-shifted")
      document.querySelector(".chat-main")?.classList.remove("chat-expanded-shift")
    } else {
      // If we're opening the chat, shift the main content
      document.querySelector(".chat-main")?.classList.add("chat-shifted")
    }
  }

  // Listen for chat expansion state changes
  useEffect(() => {
    const handleChatExpansion = (e: Event) => {
      if (e instanceof CustomEvent) {
        setIsChatExpanded(e.detail.expanded)

        // Update main content margin when chat expands/collapses
        if (e.detail.expanded) {
          document.querySelector(".chat-main")?.classList.add("chat-expanded-shift")
        } else {
          document.querySelector(".chat-main")?.classList.remove("chat-expanded-shift")
        }
      }
    }

    window.addEventListener("chat-expanded", handleChatExpansion as EventListener)
    return () => {
      window.removeEventListener("chat-expanded", handleChatExpansion as EventListener)
    }
  }, [])

  return (
    <div
      className={cn(
        "fixed top-16 bottom-0 left-0 z-40 hidden md:flex flex-col border-r border-border bg-background transition-all duration-300",
        isChatExpanded ? "w-80" : "w-64",
      )}
    >
      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto py-4", showChat ? "max-h-[calc(100%-350px)]" : "")}>
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

      {/* Chat toggle button */}
      <div className="p-2 border-t border-border">
        <button
          onClick={toggleChat}
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            showChat
              ? "bg-cosmic-teal/10 text-cosmic-teal"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <div className="flex items-center">
            <TRSCableLogo className="h-5 w-5 text-cosmic-teal mr-2" />
            <span>Patchy</span>
          </div>
        </button>
      </div>

      {/* Chat interface */}
      {showChat && (
        <div className={cn("transition-all duration-300", isChatExpanded ? "h-[500px]" : "h-[350px]")}>
          <ChatInterface />
        </div>
      )}
    </div>
  )
}
