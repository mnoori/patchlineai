"use client"

import { useState, useEffect } from "react"

export function useChatExpansion() {
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleChatExpansion = (e: Event) => {
      if (e instanceof CustomEvent) {
        setIsExpanded(e.detail.expanded)
      }
    }

    window.addEventListener("chat-expanded", handleChatExpansion as EventListener)
    return () => {
      window.removeEventListener("chat-expanded", handleChatExpansion as EventListener)
    }
  }, [])

  return { isExpanded }
}
