"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Mail, ListMusic, TrendingUp, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

interface Artist {
  id: string
  name: string
  track: string
  genre: string
  growthScore: number
  matchScore: number
  streams: string
  growth: string
  image: string
  playlistMatches: string[]
  platforms: string[]
  aiSummary: string
  isWatchlisted: boolean
}

interface ArtistDiscoveryListProps {
  artists: Artist[]
  onWatchlistToggle: (artistId: string) => void
  onArtistClick: (artist: Artist) => void
  onPitchToPlaylists: (artist: Artist) => void
  onDraftEmail: (artist: Artist) => void
}

export function ArtistDiscoveryList({
  artists,
  onWatchlistToggle,
  onArtistClick,
  onPitchToPlaylists,
  onDraftEmail,
}: ArtistDiscoveryListProps) {
  const getPlatformBadges = (platforms: string[]) => {
    return platforms.map((platform) => (
      <Badge key={platform} variant="outline" className="bg-cosmic-midnight/50 text-xs">
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>
    ))
  }

  return (
    <div className="space-y-4">
      {artists.map((artist) => (
        <motion.div
          key={artist.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,240,255,0.1)] cursor-pointer"
            onClick={() => onArtistClick(artist)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Artist Avatar and Basic Info */}
                <div className="flex gap-4 items-start">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={artist.image || "/placeholder.svg"} alt={artist.name} />
                    <AvatarFallback>{artist.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{artist.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${artist.isWatchlisted ? "text-cosmic-teal" : "text-muted-foreground"}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onWatchlistToggle(artist.id)
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: artist.isWatchlisted ? [1, 1.2, 1] : 1,
                            rotate: artist.isWatchlisted ? [0, 15, 0] : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <Star className={`h-5 w-5 ${artist.isWatchlisted ? "fill-current" : ""}`} />
                        </motion.div>
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{artist.track}</p>

                    {/* AI Summary */}
                    <div className="mt-2 flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-cosmic-teal mt-1 shrink-0" />
                      <p className="text-cosmic-teal/90 text-sm">{artist.aiSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Stats and Metrics */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Genre</p>
                    <Badge variant="outline" className="bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20">
                      {artist.genre}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {artist.growth}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Streams</p>
                    <p className="font-medium">{artist.streams}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Match Score</p>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                      AI {artist.matchScore}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPitchToPlaylists(artist)
                    }}
                  >
                    <ListMusic className="h-3.5 w-3.5" />
                    Pitch
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDraftEmail(artist)
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
