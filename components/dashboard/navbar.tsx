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
} from "lucide-react"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { signOut } from "aws-amplify/auth"
import { useCurrentUser } from "@/hooks/use-current-user"
import { motion } from "framer-motion"

interface UserInfo {
  fullName: string
  email: string
}

export function DashboardNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [userInfo, setUserInfo] = useState<UserInfo>({ fullName: "", email: "" })
  const { userId } = useCurrentUser()
  const [unreadNotifications, setUnreadNotifications] = useState(3)

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
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showSearch])

  return (
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
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div
            className={cn(
              "relative hidden md:flex items-center transition-all duration-300",
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
    </header>
  )
}
