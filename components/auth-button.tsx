"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { signOut, getCurrentUser } from "aws-amplify/auth"

export function AuthButton() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState({ fullName: "", email: "" })
  const { userId } = useCurrentUser()

  // Check auth status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is signed in with Cognito
        const user = await getCurrentUser()
        if (user) {
          setIsLoggedIn(true)
          setUserData({
            fullName: user.signInDetails?.loginId?.split('@')[0] || user.username || "Music Producer",
            email: user.signInDetails?.loginId || "user@patchline.com",
          })
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        // User not authenticated
        setIsLoggedIn(false)
        console.log("User not authenticated:", error)
      }
    }
    
    checkAuthStatus()
  }, [userId])

  // Fetch user data from the API
  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/user?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserData({
          fullName: data.fullName || "Music Producer",
          email: data.email || "user@patchline.com",
        })
      }
    } catch (error) {
      console.error("Failed to fetch user data", error)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      // Sign out from Cognito
      await signOut()
      
      // Clear localStorage
      localStorage.removeItem("patchline-auth-token")
      localStorage.removeItem("patchline-user")
      
      // Clear cookie
      document.cookie = "patchline-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      
      setIsLoggedIn(false)
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      // Force logout even if Cognito signout fails
      localStorage.removeItem("patchline-auth-token")
      localStorage.removeItem("patchline-user")
      document.cookie = "patchline-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      setIsLoggedIn(false)
      window.location.href = "/login"
    }
  }

  // Handle navigation to dashboard
  const navigateToDashboard = () => {
    router.push("/dashboard")
  }

  // Handle navigation to settings
  const navigateToSettings = () => {
    router.push("/dashboard/settings")
  }

  if (isLoggedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/diverse-avatars.png" alt="User" />
              <AvatarFallback>
                {userData.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userData.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={navigateToDashboard}>
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={navigateToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Button asChild className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
        <Link href="/login">Log in</Link>
      </Button>
    </div>
  )
}
