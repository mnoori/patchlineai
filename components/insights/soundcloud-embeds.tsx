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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Music className="h-5 w-5 text-orange-500" />
          </div>
          SoundCloud Tracks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {soundcloudEmbeds.map((embed) => (
          <div key={embed.embedId} className="space-y-2">
            {embed.title && (
              <div className="text-sm font-medium">
                {embed.title}
                {embed.artist && <span className="text-muted-foreground"> by {embed.artist}</span>}
              </div>
            )}
            <div 
              className="w-full rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: embed.html }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 