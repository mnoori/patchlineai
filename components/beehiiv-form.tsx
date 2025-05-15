"use client"

import { useEffect } from "react"

export default function BeehiivForm() {
  useEffect(() => {
    // Create a script element
    const script = document.createElement("script")
    script.src = "https://embeds.beehiiv.com/embed.js"
    script.async = true
    script.defer = true

    // Append the script to the document
    document.body.appendChild(script)

    // Clean up
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return <div data-beehiiv-embed="490f7783-0f00-47f4-8682-46aecccfeae8" style={{ display: "none" }}></div>
}
