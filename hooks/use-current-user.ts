import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    console.log("[useCurrentUser] Hook initiated, attempting to get current authenticated user")
    
    ;(async () => {
      try {
        const user = await getCurrentUser()
        if (!cancelled) {
          console.log("[useCurrentUser] Successfully retrieved authenticated user:", user)
          console.log("[useCurrentUser] User ID (sub):", user?.userId)
          
          // Cognito userId (sub) is returned as user.userId
          setUserId(user?.userId)
          setIsLoading(false)
        }
      } catch (error: any) {
        if (!cancelled) {
          console.log("[useCurrentUser] No authenticated user found or error occurred")
          console.log("[useCurrentUser] Error details:", error?.message || "Unknown error")
          setUserId(undefined)
          setIsLoading(false)
        }
      }
    })()

    return () => {
      console.log("[useCurrentUser] Cleanup - component unmounted or dependencies changed")
      cancelled = true
    }
  }, [])

  // Log whenever userId changes
  useEffect(() => {
    console.log("[useCurrentUser] Current userId state:", userId)
  }, [userId])

  return { userId, isLoading }
} 