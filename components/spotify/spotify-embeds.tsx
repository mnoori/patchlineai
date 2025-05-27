import React from "react"

interface Track {
  id: string
  name?: string
  embedUrl?: string
}

interface SpotifyEmbedsProps {
  tracks: Track[]
}

export function SpotifyEmbeds({ tracks }: SpotifyEmbedsProps) {
  if (!tracks || tracks.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tracks.map((track) => {
        const embedSrc = track.embedUrl || `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`
        return (
          <iframe
            key={track.id}
            src={embedSrc}
            title={track.name || track.id}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        )
      })}
    </div>
  )
} 