"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Play,
  Pause,
  Star,
  Mail,
  ListMusic,
  TrendingUp,
  Headphones,
  AirplayIcon as Spotify,
  Music2,
  Instagram,
  Youtube,
  MessageCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { handoff, showTaskProgress } from "@/lib/agent-bridge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  snippet?: string
}

interface ArtistDiscoveryGridProps {
  artists: Artist[]
  onWatchlistToggle: (artistId: string) => void
  onSelectArtist: (artistId: string, selected: boolean) => void
  selectedArtists: string[]
}

export function ArtistDiscoveryGrid({
  artists,
  onWatchlistToggle,
  onSelectArtist,
  selectedArtists,
}: ArtistDiscoveryGridProps) {
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
      handoff("Scout", "Fan", {
        action: "playlist_pitch",
        trackIds: [artist.id],
        artistName: artist.name,
        playlists: artist.playlistMatches,
      })
    }, 2000)
  }

  const handleDraftEmail = (artist: Artist) => {
    showTaskProgress(`Drafting intro email for ${artist.name}`)
    handoff("Scout", "Patchy", {
      action: "draft_email",
      artist: artist,
    })
  }

  const handleWatchlistToggle = (artist: Artist) => {
    onWatchlistToggle(artist.id)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "spotify":
        return <Spotify className="h-4 w-4 text-green-400" />
      case "tiktok":
        return (
          <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.321 5.562a5.124 5.124 0 0 1-3.414-1.267 5.124 5.124 0 0 1-1.537-2.723H10.5v10.99c0 1.42-1.193 2.56-2.64 2.56-1.45 0-2.64-1.14-2.64-2.56 0-1.42 1.19-2.56 2.64-2.56.287 0 .573.046.84.138v-3.86a6.3 6.3 0 0 0-.84-.057C4.15 6.227 1 9.376 1 13.276c0 3.9 3.15 7.05 7.02 7.05 3.87 0 7.02-3.15 7.02-7.05v-3.995a8.783 8.783 0 0 0 4.282 1.092V6.517a5.234 5.234 0 0 1-1-.955Z" />
          </svg>
        )
      case "instagram":
        return <Instagram className="h-4 w-4 text-pink-500" />
      case "youtube":
        return <Youtube className="h-4 w-4 text-red-500" />
      case "soundcloud":
        return (
          <svg className="h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.075.075.135.149.135.075 0 .135-.06.15-.135l.24-2.544-.24-2.64c-.015-.074-.074-.135-.149-.135m1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c.005.09.075.157.159.157.074 0 .148-.068.158-.157l.227-2.563-.226-2.43m.824-.44c-.09 0-.18.089-.18.179l-.194 2.669.194 2.614c0 .09.09.164.18.164.09 0 .168-.073.18-.164l.21-2.614-.2-2.67c-.012-.09-.09-.179-.18-.179m.945-.089c-.104 0-.194.089-.194.194l-.187 2.669.187 2.614c0 .104.09.194.194.194.103 0 .194-.09.193-.194l.211-2.614-.211-2.669c0-.105-.09-.194-.194-.194m.989.004c-.12 0-.209.098-.209.21l-.18 2.65.18 2.613c0 .111.089.21.209.21.105 0 .195-.099.195-.21l.203-2.614-.203-2.65c0-.111-.09-.21-.195-.21m1.248.45c-.023-.104-.104-.176-.195-.176-.12 0-.194.072-.211.176l-.157 2.386.157 2.386c.017.12.09.187.21.187.096 0 .177-.067.195-.187l.174-2.386-.173-2.386m.954-.65c-.12 0-.231.089-.231.209l-.182 3.026.182 2.975c0 .12.105.211.231.211.12 0 .226-.091.225-.211l.195-2.975-.196-3.026c0-.12-.105-.21-.225-.21m.585-.029c-.137 0-.242.103-.242.227l-.167 3.027.167 2.974c0 .136.114.239.242.239.135 0 .234-.103.235-.239l.182-2.974-.182-3.027c0-.124-.1-.227-.235-.227m1.2.104c-.151 0-.258.115-.258.254l-.15 2.908.15 2.856c0 .139.107.254.258.254.148 0 .26-.115.26-.254l.167-2.856-.167-2.908c0-.139-.112-.254-.26-.254m.617.032c-.15 0-.27.113-.27.25l-.138 2.88.138 2.85c0 .135.12.248.27.248s.258-.113.258-.249l.153-2.85-.153-2.88c0-.135-.12-.248-.258-.248m1.371-.188c-.014-.105-.12-.194-.234-.194-.142 0-.24.089-.254.194l-.124 3.118.124 3.118c.015.12.12.195.254.195.113 0 .226-.09.234-.195l.136-3.118-.136-3.118m.496-.004c-.045-.12-.15-.22-.285-.22-.134 0-.24.1-.27.22l-.126 3.122.126 3.106c.03.135.135.221.27.221.135 0 .24-.086.285-.207l.149-3.12-.15-3.122m.66 6.345c.135 0 .255-.1.285-.221l.134-2.961-.135-3.112c-.03-.135-.149-.221-.284-.221-.15 0-.24.086-.285.221l-.121 3.112.121 2.961c.045.135.135.221.285.221m.763.004c.165 0 .284-.105.3-.225l.119-2.956-.119-3.087c-.016-.135-.135-.24-.3-.24-.149 0-.27.105-.284.24l-.105 3.087.105 2.956c.03.136.135.225.284.225m2.162-.674c.076.135.21.195.375.195.165 0 .3-.06.39-.195.046-.075.076-.15.076-.255v-5.336c0-.12-.034-.225-.105-.314-.09-.091-.195-.136-.345-.136-.144 0-.27.06-.375.165-.074.091-.12.21-.12.33v5.306c0 .105.045.18.105.24m-8.469-3.202l.076 1.875-.076 3.615c0 .195-.105.344-.254.344-.15 0-.24-.12-.24-.27l-.106-3.689.106-1.856c0-.194.09-.3.24-.3.148 0 .254.105.254.285m-1.591 1.29l.09 1.575-.09 3.704c0 .15-.09.256-.225.256-.12 0-.21-.105-.21-.255l-.105-3.704.105-1.59c0-.135.09-.24.21-.24.135 0 .225.105.225.254m-1.425 0l.09 1.605-.09 3.59c0 .12-.074.204-.18.204-.105 0-.195-.09-.195-.21l-.09-3.584.09-1.605c0-.12.09-.194.195-.194.105 0 .18.074.18.194m-1.2-.914l.105 2.52-.105 3.524c0 .09-.075.18-.18.18-.09 0-.18-.09-.18-.18l-.09-3.524.09-2.52c0-.09.09-.165.18-.165.105 0 .18.074.18.165m-1.155.344l.12 2.175-.12 3.435c0 .09-.06.149-.15.149-.09 0-.149-.06-.149-.15l-.12-3.434.12-2.175c0-.074.06-.135.149-.135.09 0 .15.06.15.135m-1.005-.3l.135 2.475-.135 3.314c0 .075-.06.135-.135.135s-.135-.06-.135-.135l-.12-3.314.12-2.474c0-.074.06-.135.135-.135s.135.06.135.135m-1.185-.254l.135 2.729-.135 3.165c0 .06-.045.12-.12.12-.06 0-.12-.06-.12-.12l-.12-3.165.12-2.729c0-.06.06-.105.12-.105.075 0 .12.045.12.105m-1.005 0l.135 2.734-.135 3.061c0 .06-.045.105-.105.105-.075 0-.105-.045-.105-.105l-.135-3.061.135-2.734c0-.06.03-.105.105-.105.06 0 .105.045.105.105m-1.155-.194l.15 2.928-.15 2.909c0 .045-.03.075-.09.075-.045 0-.09-.03-.09-.075l-.149-2.909.149-2.928c0-.045.045-.09.09-.09.06 0 .09.045.09.09m-1.064-.074l.149 3.002-.149 2.854c0 .044-.03.074-.074.074-.045 0-.075-.03-.075-.074L3.175 15.31l.15-3.002c0-.045.03-.06.075-.06.045 0 .074.015.074.06m-.524.015l.15 2.987-.15 2.894c0 .03-.03.06-.06.06-.03 0-.06-.03-.06-.06l-.15-2.894.15-2.987c0-.03.03-.045.06-.045.03 0 .06.015.06.045m16.264-3.962c-.21 0-.39.06-.54.194-.135.12-.225.3-.27.494v.045l-.164 7.364.09 1.319.075 1.319c.016.225.15.404.3.524.15.12.33.18.54.18.195 0 .384-.074.54-.18.149-.12.255-.299.27-.524l.165-2.638-.165-7.364c-.016-.21-.121-.375-.271-.494-.149-.135-.345-.195-.54-.195m-15.134 7.05l.15-2.429c0-.03-.03-.06-.06-.06-.03 0-.06.03-.06.06l-.135 2.429.135 2.819c0 .03.03.06.06.06.03 0 .06-.03.06-.06l.135-2.819-.135-2.429" />
          </svg>
        )
      case "bandcamp":
        return (
          <svg className="h-4 w-4 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 19.2c-4 0-7.2-3.2-7.2-7.2s3.2-7.2 7.2-7.2 7.2 3.2 7.2 7.2-3.2 7.2-7.2 7.2zm3.6-10.8H8.4l-2.4 4.8h7.2l2.4-4.8z" />
          </svg>
        )
      case "beatport":
        return (
          <svg className="h-4 w-4 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.8 8.1l4.8 7.8h4.8l-4.8-7.8H1.8zm15 0l-4.8 7.8h-4.8l4.8-7.8h4.8zm1.8 0l4.8 7.8h-4.8l-4.8-7.8h4.8z" />
          </svg>
        )
      default:
        return <Music2 className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Artist Discovery</CardTitle>
          <CardDescription>Artists with high growth potential that match your label's sound profile.</CardDescription>
        </CardHeader>
        <CardContent>
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
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={artist.image || "/placeholder.svg"} alt={artist.name} />
                            <AvatarFallback>{artist.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <Checkbox
                            className="absolute -top-1 -left-1 h-4 w-4"
                            checked={selectedArtists.includes(artist.id)}
                            onCheckedChange={(checked) => onSelectArtist(artist.id, !!checked)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{artist.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{artist.track}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge
                              variant="outline"
                              className="bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20"
                            >
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
                      {/* AI Summary */}
                      <div className="mb-3 bg-cosmic-midnight/50 rounded-md p-2 border border-cosmic-teal/10">
                        <div className="flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 text-cosmic-teal mt-0.5" />
                          <p className="text-xs text-cosmic-teal/90">{artist.aiSummary}</p>
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="flex items-center gap-1 mb-3">
                        {artist.platforms.map((platform) => (
                          <TooltipProvider key={platform}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded-full bg-cosmic-midnight/50">
                                  {getPlatformIcon(platform)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="capitalize">{platform}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>

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
        </CardContent>
      </Card>

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

            {/* Platform details */}
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedArtist?.platforms.map((platform) => (
                <Badge key={platform} variant="outline" className="flex items-center gap-1">
                  {getPlatformIcon(platform)}
                  <span className="capitalize">{platform}</span>
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  if (selectedArtist) {
                    handleDraftEmail(selectedArtist)
                    setShowWaveform(false)
                  }
                }}
              >
                <Mail className="h-3.5 w-3.5" />
                Draft Email
              </Button>
              <Button
                size="sm"
                className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                onClick={() => {
                  if (selectedArtist) {
                    handlePitchToPlaylists(selectedArtist)
                    setShowWaveform(false)
                  }
                }}
              >
                <ListMusic className="h-3.5 w-3.5" />
                Pitch to Playlists
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
