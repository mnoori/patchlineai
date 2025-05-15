"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function KeyboardHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-eclipse/80 backdrop-blur-md px-4 py-2 rounded-full border border-light/10 text-light/70 text-sm flex items-center gap-2 transition-opacity duration-500">
      <span>Use</span>
      <ArrowLeft className="h-4 w-4" />
      <ArrowRight className="h-4 w-4" />
      <span>keys to navigate slides</span>
    </div>
  )
}
