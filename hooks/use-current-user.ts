"use client"

import { useState, useEffect } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import { shouldBypassAuth, MOCK_USER } from "@/lib/config"

interface UserData {
  userId: string
  email?: string
  fullName?: string
  role?: string
}

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        // Check if we should bypass auth in development mode
        if (shouldBypassAuth()) {
          console.log("[Auth] Using mock user in development mode")
          setUserId(MOCK_USER.userId)
          setUserData(MOCK_USER)

          // Store a fake token in localStorage for components that check it
          localStorage.setItem("patchline-auth-token", "dev-mode-token")

          setIsLoading(false)
          return
        }

        // Normal authentication flow
        const user = await getCurrentUser()
        const uid = user.userId
        setUserId(uid)

        // Fetch additional user data if needed
        try {
          const response = await fetch(`/api/user?userId=${uid}`)
          if (response.ok) {
            const data = await response.json()
            setUserData(data)
          }
        } catch (userDataError) {
          console.error("Error fetching user data:", userDataError)
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Error getting current user:", err)
        setError(err as Error)
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  return { userId, userData, isLoading, error }
}
