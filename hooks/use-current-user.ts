import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getCurrentUser()
        if (!cancelled) {
          // Cognito userId (sub) is returned as user.userId
          setUserId(user?.userId)
        }
      } catch {
        if (!cancelled) setUserId(undefined)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { userId }
} 