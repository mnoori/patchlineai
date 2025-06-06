"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  Mail,
  ListMusic,
  TrendingUp,
  Headphones,
  Play,
  Pause,
  Music2,
  Users,
  Globe,
  DollarSign,
  Calendar,
  MessageCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

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
  monthlyListeners?: string
  topMarkets?: string[]
  engagement?: string
  recentActivity?: string
  similarArtists?: string[]
  potentialRevenue?: string
  fanDemographics?: {
    age: string
    gender: string
    locations: string
  }
  careerStage?: string
  country?: string
  biography?: string
  playlists?: { name: string; position: number; followers: string; platform: string }[]
}

interface ArtistDetailDrawerProps {
  artist: Artist | null
  open: boolean
  onClose: () => void
  onWatchlistToggle: (artistId: string) => void
  onPitchToPlaylists: (artist: Artist) => void
  onDraftEmail: (artist: Artist) => void
}

export function ArtistDetailDrawer({
  artist,
  open,
  onClose,
  onWatchlistToggle,
  onPitchToPlaylists,
  onDraftEmail,
}: ArtistDetailDrawerProps) {
  const [playingAudio, setPlayingAudio] = useState(false)

  if (!artist) return null

  const handlePlayAudio = () => {
    setPlayingAudio(!playingAudio)
    // In a real app, this would play actual audio
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "spotify":
        return (
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        )
      case "tiktok":
        return (
          <svg className="h-5 w-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.321 5.562a5.124 5.124 0 0 1-3.414-1.267 5.124 5.124 0 0 1-1.537-2.723H10.5v10.99c0 1.42-1.193 2.56-2.64 2.56-1.45 0-2.64-1.14-2.64-2.56 0-1.42 1.19-2.56 2.64-2.56.287 0 .573.046.84.138v-3.86a6.3 6.3 0 0 0-.84-.057C4.15 6.227 1 9.376 1 13.276c0 3.9 3.15 7.05 7.02 7.05 3.87 0 7.02-3.15 7.02-7.05v-3.995a8.783 8.783 0 0 0 4.282 1.092V6.517a5.234 5.234 0 0 1-1-.955Z" />
          </svg>
        )
      case "instagram":
        return (
          <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        )
      case "youtube":
        return (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        )
      case "soundcloud":
        return (
          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.075.075.135.149.135.075 0 .135-.06.15-.135l.24-2.544-.24-2.64c-.015-.074-.074-.135-.149-.135m1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c.005.09.075.157.159.157.074 0 .148-.068.158-.157l.227-2.563-.226-2.43m.824-.44c-.09 0-.18.089-.18.179l-.194 2.669.194 2.614c0 .09.09.164.18.164.09 0 .168-.073.18-.164l.21-2.614-.2-2.67c-.012-.09-.09-.179-.18-.179m.945-.089c-.104 0-.194.089-.194.194l-.187 2.669.187 2.614c0 .104.09.194.194.194.103 0 .194-.09.193-.194l.211-2.614-.211-2.669c0-.105-.09-.194-.194-.194m.989.004c-.12 0-.209.098-.209.21l-.18 2.65.18 2.613c0 .111.089.21.209.21.105 0 .195-.099.195-.21l.203-2.614-.203-2.65c0-.111-.09-.21-.195-.21m1.248.45c-.023-.104-.104-.176-.195-.176-.12 0-.194.072-.211.176l-.157 2.386.157 2.386c.017.12.09.187.21.187.096 0 .177-.067.195-.187l.174-2.386-.173-2.386m.954-.65c-.12 0-.231.089-.231.209l-.182 3.026.182 2.975c0 .12.105.211.231.211.12 0 .226-.091.225-.211l.195-2.975-.196-3.026c0-.12-.105-.21-.225-.21m.585-.029c-.137 0-.242.103-.242.227l-.167 3.027.167 2.974c0 .136.114.239.242.239.135 0 .234-.103.235-.239l.182-2.974-.182-3.027c0-.124-.1-.227-.235-.227m1.2.104c-.151 0-.258.115-.258.254l-.15 2.908.15 2.856c0 .139.107.254.258.254.148 0 .26-.115.26-.254l.167-2.856-.167-2.908c0-.139-.112-.254-.26-.254m.617.032c-.15 0-.27.113-.27.25l-.138 2.88.138 2.85c0 .135.12.248.27.248s.258-.113.258-.249l.153-2.85-.153-2.88c0-.135-.12-.248-.258-.248m1.371-.188c-.014-.105-.12-.194-.234-.194-.142 0-.24.089-.254.194l-.124 3.118.124 3.118c.015.12.12.195.254.195.113 0 .226-.09.234-.195l.136-3.118-.136-3.118m.496-.004c-.045-.12-.15-.22-.285-.22-.134 0-.24.1-.27.22l-.126 3.122.126 3.106c.03.135.135.221.27.221.135 0 .24-.086.285-.207l.149-3.12-.15-3.122m.66 6.345c.135 0 .255-.1.285-.221l.134-2.961-.135-3.112c-.03-.135-.149-.221-.284-.221-.15 0-.24.086-.285.221l-.121 3.112.121 2.961c.045.135.135.221.285.221m.763.004c.165 0 .284-.105.3-.225l.119-2.956-.119-3.087c-.016-.135-.135-.24-.3-.24-.149 0-.27.105-.284.24l-.105 3.087.105 2.956c.03.136.135.225.284.225m2.162-.674c.076.135.21.195.375.195.165 0 .3-.06.39-.195.046-.075.076-.15.076-.255v-5.336c0-.12-.034-.225-.105-.314-.09-.091-.195-.136-.345-.136-.144 0-.27.06-.375.165-.074.091-.12.21-.12.33v5.306c0 .105.045.18.105.24m-8.469-3.202l.076 1.875-.076 3.615c0 .195-.105.344-.254.344-.15 0-.24-.12-.24-.27l-.106-3.689.106-1.856c0-.194.09-.3.24-.3.148 0 .254.105.254.285m-1.591 1.29l.09 1.575-.09 3.704c0 .15-.09.256-.225.256-.12 0-.21-.105-.21-.255l-.105-3.704.105-1.59c0-.135.09-.24.21-.24.135 0 .225.105.225.254m-1.425 0l.09 1.605-.09 3.59c0 .12-.074.204-.18.204-.105 0-.195-.09-.195-.21l-.09-3.584.09-1.605c0-.12.09-.194.195-.194.105 0 .18.074.18.194m-1.2-.914l.105 2.52-.105 3.524c0 .09-.075.18-.18.18-.09 0-.18-.09-.18l-.09-3.524.09-2.52c0-.09.09-.165.18-.165.105 0 .18.074.18.165m-1.155.344l.12 2.175-.12 3.435c0 .09-.06.149-.15.149-.09 0-.149-.06-.149-.15l-.12-3.434.12-2.175c0-.074.06-.135.149-.135.09 0 .15.06.15.135m-1.005-.3l.135 2.475-.135 3.314c0 .075-.06.135-.135.135s-.135-.06-.135-.135l-.12-3.314.12-2.474c0-.074.06-.135.135-.135s.135.06.135.135m-1.185-.254l.135 2.729-.135 3.165c0 .06-.045.12-.12.12-.06 0-.12-.06-.12-.12l-.12-3.165.12-2.729c0-.06.06-.105.12-.105.075 0 .12.045.12.105m-1.005 0l.135 2.734-.135 3.061c0 .06-.045.105-.105.105-.075 0-.105-.045-.105-.105l-.135-3.061.135-2.734c0-.06.03-.105.105-.105.06 0 .105.045.105.105m-1.155-.194l.15 2.928-.15 2.909c0 .045-.03.075-.09.075-.045 0-.09-.03-.09-.075l-.149-2.909.149-2.928c0-.045.045-.09.09-.09.06 0 .09.045.09.09m-1.064-.074l.149 3.002-.149 2.854c0 .044-.03.074-.074.074-.045 0-.075-.03-.075-.074L3.175 15.31l.15-3.002c0-.045.03-.06.075-.06.045 0 .074.015.074.06m-.524.015l.15 2.987-.15 2.894c0 .03-.03.06-.06-.06-.03 0-.06-.03-.06-.06l-.15-2.894.15-2.987c0-.03.03-.045.06-.045.03 0 .06.015.06.045m16.264-3.962c-.21 0-.39.06-.54.194-.135.12-.225.3-.27.494v.045l-.164 7.364.09 1.319.075 1.319c.016.225.15.404.3.524.15.12.33.18.54.18.195 0 .384-.074.54-.18.149-.12.255-.299.27-.524l.165-2.638-.165-7.364c-.016-.21-.121-.375-.271-.494-.149-.135-.345-.195-.54-.195m-15.134 7.05l.15-2.429c0-.03-.03-.06-.06-.06-.03 0-.06.03-.06.06l-.135 2.429.135 2.819c0 .03.03.06.06.06.03 0 .06-.03.06-.06l.135-2.819-.135-2.429" />
          </svg>
        )
      case "bandcamp":
        return (
          <svg className="h-5 w-5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 19.2c-4 0-7.2-3.2-7.2-7.2s3.2-7.2 7.2-7.2 7.2 3.2 7.2 7.2-3.2 7.2-7.2 7.2zm3.6-10.8H8.4l-2.4 4.8h7.2l2.4-4.8z" />
          </svg>
        )
      case "beatport":
        return (
          <svg className="h-5 w-5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.8 8.1l4.8 7.8h4.8l-4.8-7.8H1.8zm15 0l-4.8 7.8h-4.8l4.8-7.8h4.8zm1.8 0l4.8 7.8h-4.8l-4.8-7.8h4.8z" />
          </svg>
        )
      default:
        return <Music2 className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border/50">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={artist.image || "/placeholder.svg"} alt={artist.name} />
              <AvatarFallback>{artist.name.slice(0, 2)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <SheetTitle className="text-2xl flex items-center gap-2">
                {artist.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${artist.isWatchlisted ? "text-cosmic-teal" : "text-muted-foreground"}`}
                  onClick={() => onWatchlistToggle(artist.id)}
                >
                  <Star className={`h-5 w-5 ${artist.isWatchlisted ? "fill-current" : ""}`} />
                </Button>
              </SheetTitle>
              <SheetDescription className="text-base">{artist.genre || 'Music Artist'}</SheetDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(artist.platforms || []).map((platform) => (
              <Badge key={platform} variant="outline" className="flex items-center gap-1 px-3 py-1">
                {getPlatformIcon(platform)}
                <span className="capitalize">{platform}</span>
              </Badge>
            ))}
          </div>

          {/* AI Summary */}
          <div className="bg-cosmic-midnight/50 rounded-md p-3 border border-cosmic-teal/20">
            <div className="flex items-start gap-2">
              <MessageCircle className="h-5 w-5 text-cosmic-teal mt-0.5 shrink-0" />
              <p className="text-cosmic-teal/90">{artist.aiSummary}</p>
            </div>
          </div>

          {/* Artist Info */}
          <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="capitalize">
              {artist.genre || 'Unknown Genre'}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {artist.careerStage?.replace('_', ' ') || 'Emerging'}
            </Badge>
            {artist.country && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {artist.country}
              </Badge>
            )}
          </div>

          {/* Biography */}
          {artist.biography && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Biography</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{artist.biography}</p>
              </CardContent>
            </Card>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Audio Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Audio Preview</CardTitle>
            </CardHeader>
            <CardContent>
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
                        height: playingAudio
                          ? [`${Math.random() * 60 + 20}%`, `${Math.random() * 80 + 10}%`]
                          : `${Math.random() * 60 + 20}%`,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: playingAudio ? Number.POSITIVE_INFINITY : 0,
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
                  onClick={handlePlayAudio}
                >
                  {playingAudio ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Match Score</p>
                <div className="flex items-center gap-2">
                  <Progress value={artist.matchScore} className="h-2" />
                  <span className="text-sm font-medium">{artist.matchScore}/100</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Growth Score</p>
                <div className="flex items-center gap-2">
                  <Progress value={artist.growthScore} className="h-2" />
                  <span className="text-sm font-medium">{artist.growthScore}/100</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Streams</p>
                <p className={`font-medium flex items-center gap-1 ${artist.streams === 'Coming soon' ? 'text-muted-foreground text-sm' : ''}`}>
                  <Headphones className="h-4 w-4 text-muted-foreground" />
                  {artist.streams}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monthly Listeners</p>
                <p className={`font-medium flex items-center gap-1 ${artist.monthlyListeners === 'Coming soon' ? 'text-muted-foreground text-sm' : ''}`}>
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {artist.monthlyListeners}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Growth Rate</p>
                <p className={`font-medium flex items-center gap-1 ${artist.growth === 'Coming soon' ? 'text-muted-foreground text-sm' : 'text-green-500'}`}>
                  <TrendingUp className="h-4 w-4" />
                  {artist.growth}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Engagement</p>
                <p className={`font-medium ${artist.engagement === 'Coming soon' ? 'text-muted-foreground text-sm' : ''}`}>{artist.engagement}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                {artist.recentActivity}
              </p>
            </CardContent>
          </Card>

          {/* Playlists */}
          {artist.playlists && artist.playlists.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Featured Playlists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {artist.playlists.slice(0, 5).map((playlist, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ListMusic className="h-4 w-4 text-muted-foreground" />
                        <span>{playlist.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">#{playlist.position}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs">{playlist.followers} followers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Markets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Markets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(artist.topMarkets || []).map((market) => (
                  <Badge key={market} variant="outline" className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {market}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fan Demographics */}
          {artist.fanDemographics && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fan Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p className="text-sm">{artist.fanDemographics.age}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm">{artist.fanDemographics.gender}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Top Locations</p>
                  <p className="text-sm">{artist.fanDemographics.locations}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Artists */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Similar Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(artist.similarArtists || []).map((similarArtist) => (
                  <Badge key={similarArtist} variant="secondary" className="bg-muted">
                    {similarArtist}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Potential Revenue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-semibold flex items-center gap-1 ${artist.potentialRevenue === 'Coming soon' ? 'text-muted-foreground text-base' : 'text-cosmic-teal'}`}>
                <DollarSign className="h-5 w-5" />
                {artist.potentialRevenue}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated annual revenue based on current growth trajectory
              </p>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="mt-6 flex flex-row gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => onDraftEmail(artist)}>
            <Mail className="h-4 w-4" />
            Draft Email
          </Button>

          <Button
            className="flex-1 gap-2 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
            onClick={() => onPitchToPlaylists(artist)}
          >
            <ListMusic className="h-4 w-4" />
            Pitch to Playlists
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
