"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music } from "lucide-react"

interface Track {
  id: string
  name?: string
  embedUrl?: string
  artists?: string
  album?: string
}

interface SpotifyEmbedsProps {
  tracks: Track[]
}

export function SpotifyEmbeds({ tracks }: SpotifyEmbedsProps) {
  if (!tracks || tracks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Music className="h-5 w-5 text-green-500" />
          </div>
          Spotify
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tracks.map((track) => {
          const embedSrc = track.embedUrl || `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`
          
          return (
            <div key={track.id} className="space-y-2">
              {track.name && (
                <div className="text-sm font-medium">
                  {track.name}
                  {track.artists && <span className="text-muted-foreground"> by {track.artists}</span>}
                </div>
              )}
              <div className="w-full rounded-lg overflow-hidden spotify-embed">
                <iframe
                  src={embedSrc}
                  title={track.name || track.id}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                />
              </div>
            </div>
          )
        })}
      </CardContent>
      {/* Global styles to ensure proper sizing and remove scrollbars */}
      <style jsx global>{`
        .spotify-embed iframe {
          width: 100% !important;
          height: 152px !important;
          border-radius: 8px;
          border: none;
          overflow: hidden;
        }
      `}</style>
    </Card>
  )
} 