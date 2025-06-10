"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Mail, ListMusic, TrendingUp, MessageCircle, Sparkles, Zap, Music, Globe2 } from "lucide-react"
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
  country?: string
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400"
    if (score >= 70) return "text-cosmic-teal"
    if (score >= 50) return "text-yellow-400"
    return "text-orange-400"
  }

  const getGrowthIcon = (growth: string) => {
    const growthValue = parseFloat(growth)
    if (growthValue >= 20) return <Zap className="h-3 w-3" />
    if (growthValue >= 10) return <TrendingUp className="h-3 w-3" />
    return <Sparkles className="h-3 w-3" />
  }

  return (
    <div className="space-y-4">
      {artists.map((artist, index) => (
        <motion.div
          key={artist.id}
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            duration: 0.4,
            delay: index * 0.05,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{ scale: 1.01 }}
        >
          <Card
            className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,240,255,0.12)] cursor-pointer overflow-hidden group"
            onClick={() => onArtistClick(artist)}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cosmic-teal/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Artist Avatar and Basic Info */}
                <div className="flex gap-4 items-start">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Avatar className="h-16 w-16 ring-2 ring-white/10 group-hover:ring-cosmic-teal/30 transition-all duration-300">
                      <AvatarImage src={artist.image || "/placeholder.svg"} alt={artist.name} />
                      <AvatarFallback className="bg-gradient-to-br from-cosmic-teal to-purple-400 text-white">
                        {artist.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-semibold group-hover:text-cosmic-teal transition-colors duration-300">
                        {artist.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${artist.isWatchlisted ? "text-cosmic-teal" : "text-muted-foreground"} hover:scale-110 transition-transform`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onWatchlistToggle(artist.id)
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: artist.isWatchlisted ? [1, 1.3, 1] : 1,
                            rotate: artist.isWatchlisted ? [0, 20, 0] : 0,
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          <Star className={`h-5 w-5 ${artist.isWatchlisted ? "fill-current drop-shadow-glow" : ""}`} />
                        </motion.div>
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Music className="h-3 w-3" />
                      <span>{artist.track || "Latest track"}</span>
                      {artist.country && (
                        <>
                          <span className="text-white/20">•</span>
                          <Globe2 className="h-3 w-3" />
                          <span>{artist.country}</span>
                        </>
                      )}
                    </div>

                    {/* AI Summary with enhanced styling */}
                    <motion.div 
                      className="mt-2 flex items-start gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="p-1.5 bg-cosmic-teal/20 rounded-md">
                        <MessageCircle className="h-3 w-3 text-cosmic-teal" />
                      </div>
                      <p className="text-cosmic-teal/90 text-sm leading-relaxed">{artist.aiSummary}</p>
                    </motion.div>
                  </div>
                </div>

                {/* Stats and Metrics - Enhanced with animations */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div 
                    className="space-y-1"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs text-muted-foreground">Genre</p>
                    <Badge variant="outline" className="bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20 backdrop-blur-sm">
                      {artist.genre}
                    </Badge>
                  </motion.div>

                  <motion.div 
                    className="space-y-1"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-sm">
                      {getGrowthIcon(artist.growth)}
                      <span className="ml-1">{artist.growth}</span>
                    </Badge>
                  </motion.div>

                  <motion.div 
                    className="space-y-1"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs text-muted-foreground">Streams</p>
                    <p className="font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                      {artist.streams}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="space-y-1"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-xs text-muted-foreground">Match Score</p>
                    <div className="flex items-center gap-1">
                      <div className={`text-2xl font-bold ${getScoreColor(artist.matchScore)}`}>
                        {artist.matchScore}
                      </div>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </motion.div>
                </div>

                {/* Actions - Enhanced with hover effects */}
                <div className="flex flex-row md:flex-col gap-2 justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-purple-400/20 hover:border-purple-400/50 hover:bg-purple-400/10 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPitchToPlaylists(artist)
                      }}
                    >
                      <ListMusic className="h-3.5 w-3.5" />
                      Pitch
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-400/10 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDraftEmail(artist)
                      }}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
