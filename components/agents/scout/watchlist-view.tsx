"use client"
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Card as BrandCard } from '@/components/brand'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageCircle, TrendingUp } from "lucide-react"
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

interface WatchlistViewProps {
  artists: Artist[]
  onWatchlistToggle: (artistId: string) => void
  onArtistClick: (artist: Artist) => void
}

export function WatchlistView({ artists, onWatchlistToggle, onArtistClick }: WatchlistViewProps) {
  if (artists.length === 0) {
    return (
      <BrandCard className="glass-effect">
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
          <CardDescription>Artists you're keeping an eye on will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-center">Your watchlist is empty</p>
          <p className="text-muted-foreground text-center text-sm mt-1">
            Add artists to your watchlist to track their growth and get updates
          </p>
        </CardContent>
      </BrandCard>
    )
  }

  return (
    <BrandCard className="glass-effect">
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
        <CardDescription>Artists you're keeping an eye on.</CardDescription>
      </CardHeader>
      <CardContent>
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
              <BrandCard
                className="glass-effect hover:border-brand-cyan/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,240,255,0.1)] cursor-pointer"
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
                          <h3 className="text-xl font-bold">{artist.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-brand-cyan"
                            onClick={(e) => {
                              e.stopPropagation()
                              onWatchlistToggle(artist.id)
                            }}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground">{artist.track}</p>

                        {/* AI Summary */}
                        <div className="mt-2 flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 text-brand-cyan mt-1 shrink-0" />
                          <p className="text-brand-cyan/90 text-sm">{artist.aiSummary}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats and Metrics */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Genre</p>
                        <Badge variant="outline" className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20">
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
                  </div>
                </CardContent>
              </BrandCard>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </BrandCard>
  )
}
