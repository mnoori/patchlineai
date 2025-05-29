"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music } from "lucide-react"

interface SoundCloudEmbedsProps {
  embeds: Array<{
    embedId: string
    platform: string
    url: string
    html: string
    title?: string
    artist?: string
    createdAt: string
  }>
}

export function SoundCloudEmbeds({ embeds }: SoundCloudEmbedsProps) {
  const soundcloudEmbeds = embeds.filter((embed) => embed.platform === "soundcloud")

  if (soundcloudEmbeds.length === 0) {
    return null
  }

  // Helper function to determine if this is a profile embed
  const isProfileEmbed = (embed: any) => {
    // Check if URL is a profile (ends with username only, no track)
    const isProfileUrl = embed.url && !embed.url.includes('/tracks/') && 
                        embed.url.match(/soundcloud\.com\/[^\/]+\/?$/)
    // Or check if the embed HTML contains certain profile indicators
    const hasProfileIndicators = embed.html && (
      embed.html.includes('users%2F') || 
      embed.html.includes('/users/') ||
      embed.html.includes('visual=true&show_artwork=true&show_playcount=true&show_user=true')
    )
    return isProfileUrl || hasProfileIndicators
  }

  // Helper function to process embed HTML
  const processEmbedHtml = (embed: any) => {
    let processedHtml = embed.html

    try {
      if (isProfileEmbed(embed)) {
        // For profile embeds: keep visual but control height to 300px
        processedHtml = processedHtml
          .replace(/height="\d+"/g, 'height="300"')
          .replace(/visual=false/g, 'visual=true')
          .replace(/show_artwork=false/g, 'show_artwork=true')
      } else {
        // For track embeds: make compact (150px height)
        processedHtml = processedHtml
          .replace(/visual=true/g, 'visual=false')
          .replace(/height="\d+"/g, 'height="150"')
          .replace(/show_artwork=true/g, 'show_artwork=false')
      }
      
      // Always ensure 100% width
      if (!processedHtml.includes('width=')) {
        processedHtml = processedHtml.replace('<iframe', '<iframe width="100%"')
      } else {
        processedHtml = processedHtml.replace(/width="\d+%?"/g, 'width="100%"')
      }
    } catch (error) {
      console.error('Error processing SoundCloud embed:', error)
      // Fallback: return original HTML with safe height
      processedHtml = embed.html.replace(/height="\d+"/g, 'height="180"')
    }

    return processedHtml
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Music className="h-5 w-5 text-orange-500" />
          </div>
          SoundCloud
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {soundcloudEmbeds.map((embed) => (
          <div key={embed.embedId} className="space-y-2">
            {embed.title && !isProfileEmbed(embed) && (
              <div className="text-sm font-medium">
                {embed.title}
                {embed.artist && <span className="text-muted-foreground"> by {embed.artist}</span>}
              </div>
            )}
            <div
              className={`w-full rounded-lg overflow-hidden soundcloud-embed ${
                isProfileEmbed(embed) ? 'soundcloud-profile' : 'soundcloud-track'
              }`}
            >
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: processEmbedHtml(embed) }} />
            </div>
          </div>
        ))}
      </CardContent>
      {/* Global styles with specific classes for different embed types */}
      <style jsx global>{`
        .soundcloud-embed iframe {
          width: 100% !important;
          border-radius: 8px;
        }
        .soundcloud-track iframe {
          height: 150px !important;
        }
        .soundcloud-profile iframe {
          height: 300px !important;
        }
        /* Fallback for any unclassified embeds */
        .soundcloud-embed:not(.soundcloud-track):not(.soundcloud-profile) iframe {
          height: 180px !important;
        }
      `}</style>
    </Card>
  )
} 