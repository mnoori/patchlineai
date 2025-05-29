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
              className="w-full rounded-lg overflow-hidden soundcloud-embed"
            >
              {/* eslint-disable-next-line react/no-danger */}
              {(() => {
                // Enforce compact widget: visual=false and smaller height
                const cleanedHtml = embed.html
                  .replace(/visual=true/g, 'visual=false')
                  .replace(/height="\d+"/g, 'height="150"')
                  .replace(/show_artwork=true/g, 'show_artwork=false')
                return <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />
              })()}
            </div>
          </div>
        ))}
      </CardContent>
      {/* Global height override for iframes */}
      <style jsx global>{`
        .soundcloud-embed iframe {
          height: 180px !important;
          width: 100% !important;
        }
      `}</style>
    </Card>
  )
} 