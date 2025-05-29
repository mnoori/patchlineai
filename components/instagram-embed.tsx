"use client"

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'

interface InstagramEmbed {
  embedId: string
  platform: string
  url: string
  embedHtml: string
  username: string
  displayName: string
  createdAt: string
  isActive: boolean
}

export function InstagramEmbed() {
  const [embeds, setEmbeds] = useState<InstagramEmbed[]>([])
  const [loading, setLoading] = useState(false)
  const { userId } = useCurrentUser()

  useEffect(() => {
    const fetchEmbeds = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/embeds?userId=${encodeURIComponent(userId)}`)
        if (response.ok) {
          const data = await response.json()
          const igEmbeds = data.embeds?.filter((embed: any) => 
            embed.platform?.toLowerCase() === 'instagram' && embed.isActive
          ) || []
          setEmbeds(igEmbeds)
        }
      } catch (error) {
        console.error('Failed to fetch Instagram embeds:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmbeds()
  }, [userId])

  // Load Instagram embed script
  useEffect(() => {
    if (embeds.length > 0) {
      const script = document.createElement('script')
      script.async = true
      script.src = '//www.instagram.com/embed.js'
      document.body.appendChild(script)

      // Process embeds after script loads
      script.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process()
        }
      }

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [embeds])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (embeds.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No Instagram content available</p>
      </div>
    )
  }

  // Show the first active embed
  const embed = embeds[0]

  return (
    <div 
      className="p-4"
      dangerouslySetInnerHTML={{ __html: embed.embedHtml }}
    />
  )
} 