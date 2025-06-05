"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  Menu,
  Search,
  Settings,
  LogOut,
  HelpCircle,
  X,
  User,
  CreditCard,
  LifeBuoy,
  Mail,
  MessageSquare,
  Zap,
  LayoutDashboard,
  Music2,
  Calendar,
  Edit3,
  PlusCircle,
  FileText,
  Database,
  Users,
  Store,
  BarChart2,
  ChevronDown,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { signOut } from "aws-amplify/auth"
import { useCurrentUser } from "@/hooks/use-current-user"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/lib/permissions"
import { getTierConfig } from "@/lib/tier-config"
import { Badge } from "@/components/ui/badge"

interface UserInfo {
  fullName: string
  email: string
}

// Mobile navigation items (same as sidebar)
const mobileNavItems = [
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
    title: "Content",
    href: "/dashboard/content",
    icon: <Edit3 className="h-5 w-5" />,
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

export function DashboardNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [userInfo, setUserInfo] = useState<UserInfo>({ fullName: "", email: "" })
  const { userId } = useCurrentUser()
  const [unreadNotifications, setUnreadNotifications] = useState(3)
  const pathname = usePathname()
  const { user } = usePermissions()

  // Fetch user profile once we have a userId
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/user?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setUserInfo({
            fullName: data.fullName || "Music Professional",
            email: data.email || "user@patchline.com",
          })
        }
      } catch (err) {
        console.error("Failed to load user info", err)
      }
    })()
  }, [userId])

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
  }

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMobileMenu && !target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMobileMenu])

  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus()
    }
  }, [showSearch])

  // Close search on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false)
      }
      if (e.key === "Escape" && showMobileMenu) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showSearch, showMobileMenu])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
          <div className="hidden md:flex md:items-center">
            <Link href="/dashboard" className="mr-6">
              <Logo className="h-8 w-auto" />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center md:justify-end space-x-4">
            {/* Logo for mobile - centered */}
            <div className="md:hidden">
              <Link href="/dashboard">
                <Logo className="h-8 w-auto" />
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div
                className={cn(
                  "relative flex items-center transition-all duration-300",
                  showSearch ? "w-full max-w-sm" : "w-10",
                )}
              >
                {showSearch ? (
                  <>
                    <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Search..."
                      className="pl-8 bg-muted/50 border-border/50 focus:border-cosmic-teal/50"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 text-muted-foreground"
                      onClick={toggleSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-cosmic-teal transition-colors"
                    onClick={toggleSearch}
                  >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-cosmic-teal transition-colors"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-cosmic-teal transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cosmic-teal text-xs text-black font-medium">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full border-2 border-transparent hover:border-cosmic-teal/50 transition-all duration-200"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/music-label-owner-avatar.png" alt="User" />
                      <AvatarFallback>
                        {userInfo.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 mt-1 p-1 bg-background/95 backdrop-blur-md border-border/50"
                  align="end"
                  forceMount
                >
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <div className="flex items-center justify-start gap-2 p-2 mb-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cosmic-teal/20">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/music-label-owner-avatar.png" alt="User" />
                          <AvatarFallback>
                            {userInfo.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium leading-none">{userInfo.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userInfo.email}</p>
                        {user && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {getTierConfig(user.tier).name} Plan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild
                    className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20"
                  >
                    <Link href="/dashboard">
                      <Zap className="mr-2 h-4 w-4 text-cosmic-teal" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20"
                  >
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4 text-cosmic-teal" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20">
                    <User className="mr-2 h-4 w-4 text-cosmic-teal" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20">
                    <CreditCard className="mr-2 h-4 w-4 text-cosmic-teal" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20">
                    <MessageSquare className="mr-2 h-4 w-4 text-cosmic-teal" />
                    <span>Support Chat</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20">
                    <Mail className="mr-2 h-4 w-4 text-cosmic-teal" />
                    <span>Contact Us</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-cosmic-teal/20 focus:bg-cosmic-teal/20">
                    <LifeBuoy className="mr-2 h-4 w-4 text-cosmic-teal" />
                    <span>Documentation</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user && user.tier !== 'enterprise' && (
                    <>
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2 py-1.5 cursor-pointer bg-gradient-to-r from-cosmic-teal/20 to-purple-500/20 hover:from-cosmic-teal/30 hover:to-purple-500/30 focus:from-cosmic-teal/30 focus:to-purple-500/30"
                      >
                        <Link href="/dashboard/settings?tab=billing">
                          <Zap className="mr-2 h-4 w-4 text-cosmic-teal" />
                          <span className="font-medium">Upgrade Plan</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-1.5 cursor-pointer text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden mobile-menu-container"
          >
            <div className="bg-background/95 backdrop-blur-md border-b border-border shadow-lg">
              <nav className="p-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {mobileNavItems.map((item) => {
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
                              "flex w-full items-center justify-between rounded-md px-3 py-3 text-sm font-medium transition-colors",
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
                          <AnimatePresence>
                            {openSubmenu === item.title && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-1 space-y-1 pl-6 overflow-hidden"
                              >
                                {item.submenu.map((subItem) => {
                                  const isSubActive = pathname === subItem.href
                                  return (
                                    <Link
                                      key={subItem.title}
                                      href={subItem.href}
                                      onClick={() => setShowMobileMenu(false)}
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          href={item.href!}
                          onClick={() => setShowMobileMenu(false)}
                          className={cn(
                            "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
