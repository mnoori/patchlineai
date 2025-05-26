"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Star, Mail, ListMusic, TrendingUp, Headphones } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { handoff, showTaskProgress } from "@/lib/agent-bridge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  isWatchlisted: boolean
  snippet?: string
}

interface DiscoveryCardsProps {
  artists: Artist[]
  onWatchlistToggle: (artistId: string) => void
}

export function DiscoveryCards({ artists, onWatchlistToggle }: DiscoveryCardsProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [showWaveform, setShowWaveform] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)

  const handlePlaySnippet = (artist: Artist) => {
    setSelectedArtist(artist)
    setShowWaveform(true)
    setPlayingId(artist.id)
  }

  const handlePitchToPlaylists = (artist: Artist) => {
    showTaskProgress(`Pitching ${artist.name} to ${artist.playlistMatches.length} playlists`)
    setTimeout(() => {
      handoff("Scout", "PlaylistMatcher", {
        trackIds: [artist.id],
        artistName: artist.name,
        playlists: artist.playlistMatches,
      })
    }, 2000)
  }

  const handleDraftEmail = (artist: Artist) => {
    showTaskProgress(`Drafting intro email for ${artist.name}`)
    // In real app, this would open Patchy chat with pre-filled prompt
  }

  const handleWatchlistToggle = (artist: Artist) => {
    onWatchlistToggle(artist.id)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {artists.map((artist) => (
            <motion.div
              key={artist.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,240,255,0.1)]">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={artist.image || "/placeholder.svg"} alt={artist.name} />
                      <AvatarFallback>{artist.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{artist.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{artist.track}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20">
                          {artist.genre}
                        </Badge>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {artist.growth}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-500 border-purple-500/20 group"
                        >
                          <span className="group-hover:hidden">AI {artist.matchScore}</span>
                          <span className="hidden group-hover:inline">Match Score</span>
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${artist.isWatchlisted ? "text-cosmic-teal" : "text-muted-foreground"}`}
                      onClick={() => handleWatchlistToggle(artist)}
                    >
                      <motion.div
                        animate={{
                          scale: artist.isWatchlisted ? [1, 1.2, 1] : 1,
                          rotate: artist.isWatchlisted ? [0, 15, 0] : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <Star className={`h-4 w-4 ${artist.isWatchlisted ? "fill-current" : ""}`} />
                      </motion.div>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{artist.streams} streams</span>
                    <span>Growth: {artist.growthScore}/100</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handlePlaySnippet(artist)}>
                      <Headphones className="h-3.5 w-3.5" />
                      Listen
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handlePitchToPlaylists(artist)}
                    >
                      <ListMusic className="h-3.5 w-3.5" />
                      Pitch
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 gap-2 text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                    onClick={() => handleDraftEmail(artist)}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Draft Email
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Waveform Modal */}
      <Dialog open={showWaveform} onOpenChange={setShowWaveform}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedArtist?.image || "/placeholder.svg"} alt={selectedArtist?.name} />
                <AvatarFallback>{selectedArtist?.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              {selectedArtist?.name} - {selectedArtist?.track}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Waveform Visualization */}
            <div className="h-24 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="flex items-center gap-1 h-full">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-cosmic-teal rounded-full"
                    style={{
                      width: "2px",
                      height: `${Math.random() * 60 + 20}%`,
                    }}
                    animate={{
                      height:
                        playingId === selectedArtist?.id
                          ? [`${Math.random() * 60 + 20}%`, `${Math.random() * 80 + 10}%`]
                          : `${Math.random() * 60 + 20}%`,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: playingId === selectedArtist?.id ? Number.POSITIVE_INFINITY : 0,
                      repeatType: "reverse",
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => setPlayingId(playingId === selectedArtist?.id ? null : selectedArtist?.id || null)}
              >
                {playingId === selectedArtist?.id ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">15-second preview • {selectedArtist?.genre}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
