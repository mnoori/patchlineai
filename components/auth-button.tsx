"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { signOut } from "aws-amplify/auth"
import { useCurrentUser } from "@/hooks/use-current-user"

export function AuthButton() {
  // In a real app, this would be determined by your auth system
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState({ fullName: "", email: "" })
  const { userId } = useCurrentUser()

  // Simulate checking auth status
  useEffect(() => {
    // Check if user is logged in (e.g. by checking for a token in localStorage)
    const hasToken = localStorage.getItem("patchline-auth-token")
    setIsLoggedIn(!!hasToken)
    
    // If logged in, fetch user data
    if (hasToken && userId) {
      fetchUserData(userId);
    }
  }, [userId])
  
  // Fetch user data from the API
  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/user?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserData({
          fullName: data.fullName || "Music Producer",
          email: data.email || "user@patchline.com"
        });
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  // For demo purposes, let's add a function to toggle login state
  const handleLogout = async () => {
    await signOut()
    setIsLoggedIn(false)
    window.location.href = "/"
  }

  if (isLoggedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32&query=avatar" alt="User" />
              <AvatarFallback>{userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
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
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
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
