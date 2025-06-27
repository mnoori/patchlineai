"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  Download,
  Music2,
  Play,
  Calendar,
  Tag,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  BarChart2,
  ArrowUpRightIcon,
  ArrowDownRight,
  ExternalLink,
  Settings,
  Zap,
  Sparkles,
  Users,
  TrendingUp,
  ListMusic,
  Clock,
  Headphones,
  BarChart,
  ChevronRight,
} from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { SoundCloudEmbeds } from "@/components/insights/soundcloud-embeds"
import { SpotifyEmbeds } from "@/components/spotify/spotify-embeds"
import { useCurrentUser } from "@/hooks/use-current-user"
import { usePlatformConnections } from "@/hooks/use-platform-connections"
import { embedAPI } from "@/lib/api-client"

export default function CatalogPage() {
  const { userId } = useCurrentUser()
  const { platforms } = usePlatformConnections()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("tracks")
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true)
  const [isMobileAgentOpen, setIsMobileAgentOpen] = useState(false)
  const [openTrackDrawer, setOpenTrackDrawer] = useState<string | null>(null)
  const [openAlbumDrawer, setOpenAlbumDrawer] = useState<string | null>(null)
  const [openPlaylistDrawer, setOpenPlaylistDrawer] = useState<string | null>(null)
  const [pitchInProgress, setPitchInProgress] = useState<string | null>(null)
  const [embeds, setEmbeds] = useState<any[]>([])
  const [isLoadingEmbeds, setIsLoadingEmbeds] = useState(true)

  const [spotifyTracks, setSpotifyTracks] = useState<any[]>([])
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false)
  const [artistTracks, setArtistTracks] = useState<any[]>([])
  const [artistInfo, setArtistInfo] = useState<any>(null)
  const [needsArtistSetup, setNeedsArtistSetup] = useState(false)

  // Load embeds data
  useEffect(() => {
    async function loadEmbeds() {
      if (!userId) return
      
      setIsLoadingEmbeds(true)
      try {
        const embedsData = (await embedAPI.getAll(userId)) as any
        const rawEmbeds: any[] = embedsData.embeds || []
        // Deduplicate by unique url/id
        const unique = Array.from(new Map(rawEmbeds.map((e: any) => [e.url || e.id, e])).values())
        setEmbeds(unique)
      } catch (error) {
        console.error("Failed to load embeds data:", error)
      } finally {
        setIsLoadingEmbeds(false)
      }
    }

    loadEmbeds()
  }, [userId])

  // Load Spotify top tracks when connected
  useEffect(() => {
    async function loadSpotifyTracks() {
      if (!userId || !platforms.spotify?.connected) return

      setIsLoadingSpotify(true)
      try {
        const res = await fetch(`/api/spotify/top-tracks?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setSpotifyTracks(data.tracks || [])
        } else {
          const error = await res.json()
          console.error("Failed to load Spotify tracks:", error)
        }
      } catch (err) {
        console.error("Failed to load Spotify tracks", err)
      } finally {
        setIsLoadingSpotify(false)
      }
    }

    loadSpotifyTracks()
  }, [userId, platforms.spotify?.connected])

  // Load artist tracks when connected
  useEffect(() => {
    async function loadArtistTracks() {
      if (!platforms.spotify?.connected || !userId) return
      
      try {
        // First, search for the artist profile
        const searchRes = await fetch(`/api/spotify/search-artist?userId=${userId}`)
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          console.log("Artist search results:", searchData)
          
          // If we found an artist ID, fetch their tracks
          const artistId = searchData.matchedArtist?.id || searchData.knownArtistId
          
          if (artistId) {
            const res = await fetch(`/api/spotify/artist-tracks?userId=${userId}&artistId=${artistId}`)
            if (res.ok) {
              const data = await res.json()
              setArtistTracks(data.tracks || [])
              setArtistInfo(data.artistInfo)
              setNeedsArtistSetup(false) // Reset setup flag on successful load
              console.log("Artist tracks loaded:", data)
            } else {
              const errorData = await res.json()
              if (errorData.needsSetup) {
                console.log("Artist profile needs setup:", errorData.error)
                setNeedsArtistSetup(true)
              } else {
                console.error("Failed to load artist tracks:", errorData.error)
              }
            }
          } else {
            console.log("No artist profile found, user needs to configure their artist profile")
            setNeedsArtistSetup(true)
          }
        }
      } catch (err) {
        console.error("Failed to load artist tracks", err)
      }
    }

    loadArtistTracks()
  }, [userId, platforms.spotify?.connected])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Sample data
  const tracks = [
    {
      id: "track1",
      title: "Midnight Dreams",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "3:45",
      releaseDate: "June 15, 2025",
      streams: "1.2M",
      streamsTrend: "up",
      streamsDelta: "+8.5%",
      revenue: "$4,850",
      revenueTrend: "up",
      revenueDelta: "+12.3%",
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      sparklineData: [25, 36, 47, 52, 49, 62, 73, 75, 61, 70, 82, 90, 85],
      platforms: ["spotify", "apple", "youtube", "amazon"],
      genres: ["Synthwave", "Electronic", "Chillwave"],
      mood: "Dreamy, Atmospheric",
      bpm: 105,
    },
    {
      id: "track2",
      title: "Neon City",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "4:12",
      releaseDate: "June 15, 2025",
      streams: "850K",
      streamsTrend: "up",
      streamsDelta: "+5.2%",
      revenue: "$3,420",
      revenueTrend: "up",
      revenueDelta: "+4.8%",
      status: "metadata",
      statusDetail: "Missing genre tags and BPM information",
      sparklineData: [40, 45, 42, 50, 55, 60, 58, 64, 70, 65, 72, 78, 80],
      platforms: ["spotify", "apple", "amazon"],
      genres: ["Synthwave", "Electronic"],
      mood: "Energetic, Urban",
      bpm: null,
    },
    {
      id: "track3",
      title: "Summer Haze",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "3:28",
      releaseDate: "June 15, 2025",
      streams: "720K",
      streamsTrend: "down",
      streamsDelta: "-2.1%",
      revenue: "$2,880",
      revenueTrend: "down",
      revenueDelta: "-1.5%",
      status: "rights",
      statusDetail: "Publishing split dispute with co-writer",
      sparklineData: [60, 65, 70, 68, 72, 75, 70, 65, 60, 55, 50, 48, 45],
      platforms: ["spotify", "apple", "youtube"],
      genres: ["Chillwave", "Downtempo", "Electronic"],
      mood: "Relaxed, Summery",
      bpm: 98,
    },
    {
      id: "track4",
      title: "Digital Horizon",
      artist: "Pulse Wave",
      album: "Digital Dreams",
      duration: "5:02",
      releaseDate: "March 10, 2025",
      streams: "450K",
      streamsTrend: "up",
      streamsDelta: "+15.7%",
      revenue: "$1,800",
      revenueTrend: "up",
      revenueDelta: "+18.2%",
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      sparklineData: [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
      platforms: ["spotify", "apple", "youtube", "tidal"],
      genres: ["Electronic", "Ambient", "IDM"],
      mood: "Futuristic, Expansive",
      bpm: 120,
    },
    {
      id: "track5",
      title: "Cosmic Journey",
      artist: "Astral Drift",
      album: "Cosmic Journey",
      duration: "6:18",
      releaseDate: "January 22, 2025",
      streams: "380K",
      streamsTrend: "up",
      streamsDelta: "+3.8%",
      revenue: "$1,520",
      revenueTrend: "up",
      revenueDelta: "+2.5%",
      status: "contract",
      statusDetail: "Distribution agreement expires in 14 days",
      sparklineData: [30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60],
      platforms: ["spotify", "apple", "amazon"],
      genres: ["Ambient", "Space Music", "Electronic"],
      mood: "Ethereal, Cosmic",
      bpm: 85,
    },
    {
      id: "track6",
      title: "Night Drive",
      artist: "Metro Beats",
      album: "Urban Jungle",
      duration: "4:35",
      releaseDate: "February 8, 2025",
      streams: "620K",
      streamsTrend: "up",
      streamsDelta: "+7.3%",
      revenue: "$2,480",
      revenueTrend: "up",
      revenueDelta: "+6.9%",
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      sparklineData: [45, 50, 48, 52, 55, 60, 58, 62, 65, 70, 68, 72, 75],
      platforms: ["spotify", "apple", "youtube", "deezer"],
      genres: ["Electronic", "Synthwave", "Darkwave"],
      mood: "Nocturnal, Urban",
      bpm: 110,
    },
  ]

  const albums = [
    {
      id: "album1",
      title: "Summer EP",
      artist: "Luna Echo",
      tracks: 3,
      tracksReady: 75,
      releaseDate: "June 15, 2025",
      totalStreams: "2.77M",
      streamsTrend: "up",
      streamsDelta: "+4.2%",
      totalRevenue: "$11,150",
      revenueTrend: "up",
      revenueDelta: "+5.8%",
      status: "metadata",
      statusDetail: "2 tracks missing complete metadata",
      topTracks: [
        { title: "Midnight Dreams", streams: "1.2M" },
        { title: "Neon City", streams: "850K" },
        { title: "Summer Haze", streams: "720K" },
      ],
      pendingTasks: ["Artwork missing alt-text", "Missing composer credits on track 2"],
      platforms: ["spotify", "apple", "youtube", "amazon"],
    },
    {
      id: "album2",
      title: "Digital Dreams",
      artist: "Pulse Wave",
      tracks: 8,
      tracksReady: 100,
      releaseDate: "March 10, 2025",
      totalStreams: "1.2M",
      streamsTrend: "up",
      streamsDelta: "+12.5%",
      totalRevenue: "$4,800",
      revenueTrend: "up",
      revenueDelta: "+15.3%",
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      topTracks: [
        { title: "Digital Horizon", streams: "450K" },
        { title: "Binary Sunset", streams: "320K" },
        { title: "Pixel Dreams", streams: "280K" },
      ],
      pendingTasks: [],
      platforms: ["spotify", "apple", "youtube", "tidal"],
    },
    {
      id: "album3",
      title: "Cosmic Journey",
      artist: "Astral Drift",
      tracks: 10,
      tracksReady: 90,
      releaseDate: "January 22, 2025",
      totalStreams: "950K",
      streamsTrend: "up",
      streamsDelta: "+2.8%",
      totalRevenue: "$3,800",
      revenueTrend: "up",
      revenueDelta: "+1.9%",
      status: "contract",
      statusDetail: "Distribution agreement expires in 14 days",
      topTracks: [
        { title: "Cosmic Journey", streams: "380K" },
        { title: "Stellar Winds", streams: "290K" },
        { title: "Nebula Dreams", streams: "180K" },
      ],
      pendingTasks: ["Contract renewal needed before Feb 5"],
      platforms: ["spotify", "apple", "amazon"],
    },
    {
      id: "album4",
      title: "Urban Jungle",
      artist: "Metro Beats",
      tracks: 12,
      tracksReady: 100,
      releaseDate: "February 8, 2025",
      totalStreams: "1.8M",
      streamsTrend: "up",
      streamsDelta: "+8.7%",
      totalRevenue: "$7,200",
      revenueTrend: "up",
      revenueDelta: "+9.5%",
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      topTracks: [
        { title: "Night Drive", streams: "620K" },
        { title: "City Lights", streams: "480K" },
        { title: "Downtown", streams: "350K" },
      ],
      pendingTasks: [],
      platforms: ["spotify", "apple", "youtube", "deezer"],
    },
  ]

  const playlists = [
    {
      id: "playlist1",
      title: "Late Night Vibes",
      platform: "spotify",
      followers: "1.2M",
      tracks: 2,
      tracksList: ["Midnight Dreams", "Night Drive"],
      lastUpdated: "May 5, 2025",
      position: 12,
      lastMovement: "up",
      movementValue: 3,
      matchScore: 85,
      type: "editorial",
      curator: "Spotify Editorial Team",
      description: "The perfect soundtrack for your late night drives and chill sessions.",
      genres: ["Synthwave", "Electronic", "Chillwave", "Darkwave"],
      mood: "Nocturnal, Atmospheric, Dreamy",
      averageBpm: 108,
      refreshRate: "Weekly",
      pitchInsights: [
        "Midnight Dreams matches the playlist's nocturnal atmosphere and dreamy synthwave sound",
        "Night Drive perfectly aligns with both the playlist name and urban electronic aesthetic",
        "Both tracks have performed well with similar audience demographics",
        "Tracks with 100-110 BPM tend to perform well on this playlist",
      ],
      recommendedApproach: "Highlight the atmospheric production and nocturnal themes in your pitch email",
      bestTimeToSubmit: "Tuesdays, 2-3 days before the weekly refresh",
    },
    {
      id: "playlist2",
      title: "Electronic Essentials",
      platform: "apple",
      followers: "850K",
      tracks: 1,
      tracksList: ["Digital Horizon"],
      lastUpdated: "May 10, 2025",
      position: 8,
      lastMovement: "down",
      movementValue: 2,
      matchScore: 92,
      type: "algorithmic",
      curator: "Apple Music Editorial",
      description: "Essential electronic tracks that define the genre's cutting edge.",
      genres: ["Electronic", "IDM", "Ambient", "Experimental"],
      mood: "Futuristic, Innovative, Expansive",
      averageBpm: 118,
      refreshRate: "Bi-weekly",
      pitchInsights: [
        "Digital Horizon's production quality and innovative sound design align perfectly with playlist criteria",
        "Track has strong engagement metrics that suggest it will perform well with this audience",
        "The futuristic themes complement the playlist's focus on forward-thinking electronic music",
        "Recent playlist additions have similar sonic characteristics",
      ],
      recommendedApproach: "Emphasize the innovative production techniques and futuristic sound design",
      bestTimeToSubmit: "Mondays, one week before the bi-weekly refresh",
    },
    {
      id: "playlist3",
      title: "Chill Electronica",
      platform: "spotify",
      followers: "2.3M",
      tracks: 3,
      tracksList: ["Summer Haze", "Cosmic Journey", "Night Drive"],
      lastUpdated: "May 8, 2025",
      position: 5,
      lastMovement: "up",
      movementValue: 1,
      matchScore: 78,
      type: "editorial",
      curator: "Spotify Editorial Team",
      description: "Laid-back electronic beats for relaxation and focus.",
      genres: ["Chillwave", "Downtempo", "Electronic", "Ambient"],
      mood: "Relaxed, Atmospheric, Introspective",
      averageBpm: 95,
      refreshRate: "Weekly",
      pitchInsights: [
        "Summer Haze's downtempo rhythm and relaxed atmosphere perfectly match the playlist's vibe",
        "Cosmic Journey provides the ambient textures that perform well on this playlist",
        "Night Drive offers a slightly more energetic option that still fits the overall mood",
        "All three tracks have the atmospheric quality that defines this playlist",
      ],
      recommendedApproach: "Focus on how these tracks enhance focus and relaxation in your pitch",
      bestTimeToSubmit: "Thursdays, before the weekend refresh",
    },
    {
      id: "playlist4",
      title: "Future Beats",
      platform: "youtube",
      followers: "450K",
      tracks: 2,
      tracksList: ["Neon City", "Digital Horizon"],
      lastUpdated: "May 12, 2025",
      position: 15,
      lastMovement: "same",
      movementValue: 0,
      matchScore: 65,
      type: "user-generated",
      curator: "FutureBeats Channel",
      description: "Cutting-edge electronic music pushing the boundaries of sound.",
      genres: ["Future Bass", "Electronic", "Experimental"],
      mood: "Energetic, Futuristic, Innovative",
      averageBpm: 125,
      refreshRate: "Monthly",
      pitchInsights: [
        "Neon City's energetic rhythm fits the playlist's high-energy profile",
        "Digital Horizon's experimental elements align with the playlist's focus on innovation",
        "Both tracks would benefit from complete metadata before pitching",
        "Match score is lower due to BPM differences from playlist average",
      ],
      recommendedApproach: "Complete metadata first, then highlight innovative production techniques",
      bestTimeToSubmit: "First week of the month, before the monthly refresh",
    },
  ]

  // Anomalies for agent panel
  const anomalies = [
    {
      title: "2 tracks missing ISRC codes",
      severity: "warning",
      action: "Auto-generate ISRCs",
      affectedItems: ["Neon City", "Summer Haze"],
    },
    {
      title: "Contract expiring in 14 days",
      severity: "critical",
      action: "Prepare renewal",
      affectedItems: ["Cosmic Journey (album)"],
    },
    {
      title: "3 tracks eligible for playlist pitching",
      severity: "opportunity",
      action: "Run Scout Agent",
      affectedItems: ["Midnight Dreams", "Digital Horizon", "Night Drive"],
    },
  ]

  // Render status chip based on status
  const renderStatusChip = (status: string, detail: string) => {
    switch (status) {
      case "healthy":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Healthy
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{detail}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "metadata":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" /> Metadata
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{detail}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "rights":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Rights
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{detail}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "contract":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20 cursor-pointer"
                  >
                    <Lock className="h-3 w-3 mr-1" /> Contract
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{detail}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      default:
        return null
    }
  }

  // Render platform logos
  const renderPlatformLogo = (platform: string) => {
    switch (platform) {
      case "spotify":
        return <BrandLogo domain="spotify.com" size={16} />
      case "apple":
        return <BrandLogo domain="music.apple.com" size={16} />
      case "youtube":
        return <BrandLogo domain="youtube.com" size={16} />
      case "amazon":
        return <BrandLogo domain="music.amazon.com" size={16} />
      case "tidal":
        return <BrandLogo domain="tidal.com" size={16} />
      case "deezer":
        return <BrandLogo domain="deezer.com" size={16} />
      default:
        return null
    }
  }

  // Render sparkline
  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
      })
      .join(" ")

    return (
      <div className="h-8 w-24">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="rgba(0, 240, 255, 0.7)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    )
  }

  // Render trend indicator
  const renderTrendIndicator = (trend: string, value: string) => {
    if (trend === "up") {
      return (
        <div className="flex items-center text-xs text-emerald-500">
          <ArrowUpRightIcon className="h-3 w-3 mr-0.5" />
          <span>{value}</span>
        </div>
      )
    } else if (trend === "down") {
      return (
        <div className="flex items-center text-xs text-rose-500">
          <ArrowDownRight className="h-3 w-3 mr-0.5" />
          <span>{value}</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-xs text-muted-foreground">
          <span>No change</span>
        </div>
      )
    }
  }

  // Render track drawer
  const renderTrackDrawer = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return null

    return (
      <Sheet open={openTrackDrawer === trackId} onOpenChange={(open) => !open && setOpenTrackDrawer(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-brand-cyan" />
              {track.title}
            </SheetTitle>
            <SheetDescription>
              {track.artist} • {track.album} • {track.duration}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status summary */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-2">Health Status</h3>
              <div className="flex items-center gap-2 mb-3">{renderStatusChip(track.status, track.statusDetail)}</div>
              <p className="text-sm text-muted-foreground">{track.statusDetail}</p>

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                  onClick={() => {
                    setOpenTrackDrawer(null)
                    // This would navigate to metadata health in a real implementation
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Open in Metadata Health
                </Button>
              </div>
            </div>

            {/* Performance summary */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-3">Performance</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Streams</p>
                  <p className="text-lg font-bold">{track.streams}</p>
                  {renderTrendIndicator(track.streamsTrend, track.streamsDelta)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <p className="text-lg font-bold">{track.revenue}</p>
                  {renderTrendIndicator(track.revenueTrend, track.revenueDelta)}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs text-muted-foreground mb-2">14-day trend</h4>
                <div className="h-16 w-full">{renderSparkline(track.sparklineData)}</div>
              </div>
            </div>

            {/* Distribution */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-3">Distribution</h3>
              <div className="flex flex-wrap gap-2">
                {track.platforms.map((platform, index) => (
                  <div key={`${platform}-${index}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted">
                    {renderPlatformLogo(platform)}
                    <span className="text-xs capitalize">{platform}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2">
                <Play className="h-4 w-4" />
                Play Track
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <BarChart2 className="h-4 w-4" />
                Full Analytics
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Render album drawer
  const renderAlbumDrawer = (albumId: string) => {
    const album = albums.find((a) => a.id === albumId)
    if (!album) return null

    return (
      <Sheet open={openAlbumDrawer === albumId} onOpenChange={(open) => !open && setOpenAlbumDrawer(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-brand-cyan" />
              {album.title}
            </SheetTitle>
            <SheetDescription>
              {album.artist} • {album.tracks} tracks • {album.releaseDate}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status summary */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-2">Health Status</h3>
              <div className="flex items-center gap-2 mb-3">{renderStatusChip(album.status, album.statusDetail)}</div>
              <p className="text-sm text-muted-foreground">{album.statusDetail}</p>

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                  onClick={() => {
                    setOpenAlbumDrawer(null)
                    // This would navigate to metadata health in a real implementation
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Open in Metadata Health
                </Button>
              </div>
            </div>

            {/* Top tracks */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-3">Top Tracks</h3>

              <div className="space-y-3">
                {album.topTracks.map((track, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-cyan/10 flex items-center justify-center text-xs text-brand-cyan">
                        {index + 1}
                      </div>
                      <span className="text-sm">{track.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{track.streams}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending tasks */}
            {album.pendingTasks.length > 0 && (
              <div className="p-4 rounded-lg border bg-background/50">
                <h3 className="text-sm font-medium mb-3">Pending Agent Tasks</h3>

                <div className="space-y-2">
                  {album.pendingTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">{task}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        Fix
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance summary */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-3">Performance</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Streams</p>
                  <p className="text-lg font-bold">{album.totalStreams}</p>
                  {renderTrendIndicator(album.streamsTrend, album.streamsDelta)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-lg font-bold">{album.totalRevenue}</p>
                  {renderTrendIndicator(album.revenueTrend, album.revenueDelta)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2">
                <Play className="h-4 w-4" />
                Play Album
              </Button>
              <Button variant="outline" className="flex-1 gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black">
                <Zap className="h-4 w-4" />
                Generate EPK
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Render playlist drawer
  const renderPlaylistDrawer = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return null

    // Find the full track objects that match the playlist's tracksList
    const matchingTracks = tracks.filter((track) => playlist.tracksList.includes(track.title))

    return (
      <Sheet open={openPlaylistDrawer === playlistId} onOpenChange={(open) => !open && setOpenPlaylistDrawer(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {renderPlatformLogo(playlist.platform)}
              {playlist.title}
            </SheetTitle>
            <SheetDescription>
              {playlist.platform.charAt(0).toUpperCase() + playlist.platform.slice(1)} • {playlist.followers} followers
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Playlist details */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-3">Playlist Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="text-sm capitalize">{playlist.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Curator</p>
                  <p className="text-sm">{playlist.curator}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Position</p>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">#{playlist.position}</span>
                    {playlist.lastMovement === "up" && (
                      <div className="flex items-center text-xs text-emerald-500">
                        <ArrowUpRightIcon className="h-3 w-3 mr-0.5" />
                        <span>{playlist.movementValue}</span>
                      </div>
                    )}
                    {playlist.lastMovement === "down" && (
                      <div className="flex items-center text-xs text-rose-500">
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                        <span>{playlist.movementValue}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Match Score</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{playlist.matchScore}%</span>
                    {playlist.matchScore >= 80 && (
                      <Badge className="h-5 px-1.5 bg-emerald-500/20 text-emerald-500 border-0">High</Badge>
                    )}
                    {playlist.matchScore >= 65 && playlist.matchScore < 80 && (
                      <Badge className="h-5 px-1.5 bg-amber-500/20 text-amber-500 border-0">Medium</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{playlist.description}</p>
              </div>
            </div>

            {/* Playlist insights */}
            <div className="p-4 rounded-lg border bg-background/50 space-y-4">
              <h3 className="text-sm font-medium">Playlist Insights</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListMusic className="h-3.5 w-3.5" /> Genres
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {playlist.genres.map((genre, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Headphones className="h-3.5 w-3.5" /> Mood
                  </div>
                  <p className="text-xs">{playlist.mood}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Avg. BPM
                  </div>
                  <p className="text-xs">{playlist.averageBpm}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Refresh Rate
                  </div>
                  <p className="text-xs">{playlist.refreshRate}</p>
                </div>
              </div>
            </div>

            {/* AI Pitch Analysis */}
            <div className="p-4 rounded-lg border bg-brand-cyan/5 border-brand-cyan/20 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-cyan" />
                <h3 className="text-sm font-medium text-brand-cyan">AI Pitch Analysis</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-cyan mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Match Strength</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {playlist.matchScore >= 80
                        ? "Excellent match! Your tracks align perfectly with this playlist's profile."
                        : playlist.matchScore >= 65
                          ? "Good match with room for improvement. Consider optimizing metadata."
                          : "Low match. Focus on other playlists or improve track metadata."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-brand-cyan mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Audience Alignment</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {playlist.matchScore >= 75
                        ? "Your tracks' audience demographics closely match this playlist's listeners."
                        : "Limited audience overlap. Consider other playlists for better targeting."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <BarChart className="h-4 w-4 text-brand-cyan mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Performance Prediction</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {playlist.matchScore >= 80
                        ? "High potential for strong performance based on similar tracks' history."
                        : playlist.matchScore >= 65
                          ? "Moderate performance potential. May see average engagement."
                          : "Low performance prediction. Consider other playlists."}
                    </p>
                  </div>
                </div>
              </div>

              {playlist.matchScore >= 65 && (
                <>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium mb-2">Why These Tracks Match</p>
                    <ul className="space-y-1.5">
                      {playlist.pitchInsights.map((insight, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5">
                          <CheckCircle className="h-3 w-3 text-brand-cyan mt-0.5 shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium mb-2">Recommended Approach</p>
                    <p className="text-xs text-muted-foreground">{playlist.recommendedApproach}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Best time to submit:</span> {playlist.bestTimeToSubmit}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Your tracks */}
            <div className="p-4 rounded-lg border bg-background/50">
              <h3 className="text-sm font-medium mb-3">Your Tracks on This Playlist</h3>

              <div className="space-y-2">
                {matchingTracks.map((track, index) => (
                  <div key={index} className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-brand-cyan/10 transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-cyan/10 flex items-center justify-center text-xs text-brand-cyan">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm">{track.title}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">{track.streams} streams</span>
                          {track.bpm && <span className="text-xs text-muted-foreground">• {track.bpm} BPM</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                disabled={playlist.matchScore < 65 || pitchInProgress === playlist.id}
                onClick={() => {
                  if (pitchInProgress !== playlist.id) {
                    setPitchInProgress(playlist.id)
                    // Simulate pitch process
                    setTimeout(() => {
                      setPitchInProgress(null)
                      // This would handle the pitch submission in a real implementation
                    }, 2000)
                  }
                }}
              >
                {pitchInProgress === playlist.id ? (
                  <>
                    <span className="animate-pulse">Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Send Pitch to {playlist.platform.charAt(0).toUpperCase() + playlist.platform.slice(1)}
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Open in {playlist.platform.charAt(0).toUpperCase() + playlist.platform.slice(1)}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header with title on left, search and actions on right */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">Catalog</h1>
          <p className="text-muted-foreground">Browse and manage your music assets</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 lg:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tracks, albums, or artists..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="gap-1 bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
              <Plus className="h-4 w-4" /> Add Music
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="tracks" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>

            <TabsContent value="tracks" className="space-y-4">
              <Card className="glass-effect" variant="gradient" hover="glow">
                <CardHeader>
                  <CardTitle>Tracks</CardTitle>
                  <CardDescription>All tracks in your catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">Track</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Album</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Release Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Streams</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Revenue</th>
                            <th className="h-12 w-12 px-4 text-left align-middle font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tracks.map((track) => (
                            <tr
                              key={track.id}
                              className="border-b transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group cursor-pointer"
                              onClick={() => setOpenTrackDrawer(track.id)}
                            >
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-md bg-brand-cyan/10 p-2">
                                    <Music2 className="h-4 w-4 text-brand-cyan" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{track.title}</div>
                                    <div className="text-xs text-muted-foreground">{track.artist}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">{track.album}</td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center">
                                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                  {track.releaseDate}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div onClick={(e) => e.stopPropagation()}>
                                  {renderStatusChip(track.status, track.statusDetail)}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div>
                                  <div className="font-medium">{track.streams}</div>
                                  <div className="mt-1">{renderSparkline(track.sparklineData)}</div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div>
                                  <div className="font-medium">{track.revenue}</div>
                                  {renderTrendIndicator(track.revenueTrend, track.revenueDelta)}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Render track drawers */}
              {tracks.map((track) => renderTrackDrawer(track.id))}
            </TabsContent>

            <TabsContent value="albums" className="space-y-4">
              <Card className="glass-effect" variant="gradient" hover="glow">
                <CardHeader>
                  <CardTitle>Albums</CardTitle>
                  <CardDescription>All albums and EPs in your catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">Album</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Tracks</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Total Streams</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Total Revenue</th>
                            <th className="h-12 w-12 px-4 text-left align-middle font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {albums.map((album) => (
                            <tr
                              key={album.id}
                              className="border-b transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group cursor-pointer"
                              onClick={() => setOpenAlbumDrawer(album.id)}
                            >
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-md bg-brand-cyan/10 flex items-center justify-center">
                                    <Music2 className="h-5 w-5 text-brand-cyan" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{album.title}</div>
                                    <div className="text-xs text-muted-foreground">{album.artist}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-background text-foreground">
                                      {album.tracks} tracks
                                    </Badge>
                                    <Badge variant="outline" className="bg-background text-foreground">
                                      {album.tracksReady}% ready
                                    </Badge>
                                  </div>
                                  <Progress value={album.tracksReady} className="h-1.5 w-24" />
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div onClick={(e) => e.stopPropagation()}>
                                  {renderStatusChip(album.status, album.statusDetail)}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div>
                                  <div className="font-medium">{album.totalStreams}</div>
                                  <div className="mt-0.5">
                                    {renderTrendIndicator(album.streamsTrend, album.streamsDelta)}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div>
                                  <div className="font-medium">{album.totalRevenue}</div>
                                  <div className="mt-0.5">
                                    {renderTrendIndicator(album.revenueTrend, album.revenueDelta)}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Render album drawers */}
              {albums.map((album) => renderAlbumDrawer(album.id))}
            </TabsContent>

            <TabsContent value="playlists" className="space-y-4">
              <Card className="glass-effect" variant="gradient" hover="glow">
                <CardHeader>
                  <CardTitle>Playlists</CardTitle>
                  <CardDescription>Playlists featuring your music</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr className="border-b transition-colors hover:bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">Playlist</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Platform</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Followers</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Your Tracks</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Position</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Last Updated</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Pitch</th>
                            <th className="h-12 w-12 px-4 text-left align-middle font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {playlists.map((playlist) => (
                            <tr
                              key={playlist.id}
                              className="border-b transition-all duration-200 hover:bg-muted/50 hover:shadow-sm group cursor-pointer"
                              onClick={() => setOpenPlaylistDrawer(playlist.id)}
                            >
                              <td className="p-4 align-middle">
                                <div className="font-medium">{playlist.title}</div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-2">
                                  {renderPlatformLogo(playlist.platform)}
                                  <span className="capitalize">{playlist.platform}</span>
                                </div>
                              </td>
                              <td className="p-4 align-middle">{playlist.followers}</td>
                              <td className="p-4 align-middle">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex -space-x-1">
                                        {playlist.tracksList.slice(0, 3).map((track, i) => (
                                          <div
                                            key={i}
                                            className="w-6 h-6 rounded-full bg-brand-cyan/10 border border-background flex items-center justify-center text-xs text-brand-cyan"
                                          >
                                            {i + 1}
                                          </div>
                                        ))}
                                        {playlist.tracksList.length > 3 && (
                                          <div className="w-6 h-6 rounded-full bg-muted border border-background flex items-center justify-center text-xs">
                                            +{playlist.tracksList.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {playlist.tracksList.map((track, i) => (
                                          <p key={i} className="text-xs">
                                            {track}
                                          </p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center">
                                  <span className="mr-2">#{playlist.position}</span>
                                  {playlist.lastMovement === "up" && (
                                    <div className="flex items-center text-xs text-emerald-500">
                                      <ArrowUpRightIcon className="h-3 w-3 mr-0.5" />
                                      <span>+{playlist.movementValue}</span>
                                    </div>
                                  )}
                                  {playlist.lastMovement === "down" && (
                                    <div className="flex items-center text-xs text-rose-500">
                                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                      <span>-{playlist.movementValue}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 align-middle">{playlist.lastUpdated}</td>
                              <td className="p-4 align-middle">
                                <Button
                                  variant={playlist.matchScore >= 75 ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    playlist.matchScore >= 75
                                      ? "bg-brand-cyan hover:bg-brand-cyan/90 text-black gap-1.5 w-full"
                                      : "text-muted-foreground w-full"
                                  }
                                  disabled={playlist.matchScore < 65}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenPlaylistDrawer(playlist.id)
                                  }}
                                >
                                  {playlist.matchScore >= 75 ? (
                                    <>
                                      <Zap className="h-3.5 w-3.5" />
                                      Send Pitch
                                    </>
                                  ) : (
                                    "Low Match"
                                  )}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {playlist.matchScore >= 75 ? `View AI insights` : "Improve match score to pitch"}
                                </p>
                              </td>
                              <td className="p-4 align-middle">
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Render playlist drawers */}
              {playlists.map((playlist) => renderPlaylistDrawer(playlist.id))}
            </TabsContent>
          </Tabs>

          {/* Embed sections side-by-side */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* SoundCloud (left) */}
            {embeds.length > 0 && !isLoadingEmbeds && (
              <SoundCloudEmbeds embeds={embeds.map(embed => ({
                ...embed,
                html: embed.embedHtml || embed.html
              }))} />
            )}

            {/* Spotify (right) */}
            {artistTracks.length > 0 && artistInfo && (
              <SpotifyEmbeds tracks={artistTracks} />
            )}
          </div>

          {/* Artist Profile Setup Prompt */}
          {needsArtistSetup && platforms.spotify?.connected && (
            <div className="mt-6">
              <Card className="glass-effect border-amber-500/20 bg-amber-500/5" variant="gradient" hover="glow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg">Artist Profile Setup Required</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your Spotify artist profile to see your tracks in the catalog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your Spotify account is connected, but we need to know which artist profile belongs to you. 
                      This ensures we show the correct tracks and artist information.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => window.location.href = '/dashboard/settings'}
                        variant="outline"
                        className="gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                      >
                        <Settings className="h-4 w-4" />
                        Configure Artist Profile
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setNeedsArtistSetup(false)}
                        size="sm"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Agent-assist side panel - Desktop only */}
        {isAgentPanelOpen && (
          <div className="hidden xl:block w-72 sticky top-20 h-fit space-y-4">
            <Card className="glass-effect" variant="gradient" hover="glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Agent Assist</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAgentPanelOpen(false)}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Aria's recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {anomalies.map((anomaly, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-background/50 space-y-2">
                    <div className="flex items-start gap-2">
                      {anomaly.severity === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />}
                      {anomaly.severity === "critical" && <XCircle className="h-4 w-4 text-rose-500 mt-0.5" />}
                      {anomaly.severity === "opportunity" && <Zap className="h-4 w-4 text-brand-cyan mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium">{anomaly.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Affects: {anomaly.affectedItems.join(", ")}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
                      {anomaly.action}
                    </Button>
                  </div>
                ))}

                <div className="pt-2">
                  <div className="relative">
                    <Input placeholder="Ask Aria..." className="pr-10" />
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full aspect-square">
                      <Zap className="h-4 w-4 text-brand-cyan" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

                  {/* Mobile Aria Chat Button - Fixed floating button */}
      <div className="xl:hidden">
        <Button
          onClick={() => setIsMobileAgentOpen(true)}
          variant="outline"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-brand-cyan hover:bg-brand-cyan/90 text-black shadow-lg z-50"
          size="icon"
        >
          <Zap className="h-6 w-6" />
        </Button>
      </div>

                  {/* Mobile Aria Chat Modal */}
      <Sheet open={isMobileAgentOpen} onOpenChange={setIsMobileAgentOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-cyan" />
              Agent Assist
            </SheetTitle>
                          <SheetDescription>Aria's recommendations</SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="p-3 rounded-lg border bg-background/50 space-y-2">
                <div className="flex items-start gap-2">
                  {anomaly.severity === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />}
                  {anomaly.severity === "critical" && <XCircle className="h-4 w-4 text-rose-500 mt-0.5" />}
                  {anomaly.severity === "opportunity" && <Zap className="h-4 w-4 text-brand-cyan mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium">{anomaly.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Affects: {anomaly.affectedItems.join(", ")}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
                  {anomaly.action}
                </Button>
              </div>
            ))}

            <div className="pt-2">
              <div className="relative">
                <Input placeholder="Ask Aria..." className="pr-10" />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full aspect-square">
                  <Zap className="h-4 w-4 text-brand-cyan" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Catalog Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-effect hover:border-brand-cyan/30 transition-all duration-300" variant="gradient" hover="glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music2 className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Across all releases</p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-brand-cyan/30 transition-all duration-300" variant="gradient" hover="glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Albums</CardTitle>
            <Music2 className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Including EPs and singles</p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-brand-cyan/30 transition-all duration-300" variant="gradient" hover="glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Playlist Placements</CardTitle>
            <Tag className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRightIcon className="h-3 w-3" />
              <span>+12.4%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-brand-cyan/30 transition-all duration-300" variant="gradient" hover="glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Catalog Value</CardTitle>
            <DollarSign className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$128,450</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRightIcon className="h-3 w-3" />
              <span>+8.7%</span> from last quarter
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Dollar sign icon component
function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
}

// Arrow up right icon component
function ArrowUpRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 7 10 10"></path>
      <path d="M17 7v10H7"></path>
    </svg>
  )
}

// Chevron right icon component
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  )
}

// Improved Brand logo component with better fallback handling
function BrandLogo({ domain, size = 24 }: { domain: string; size?: number }) {
  const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}?size=${size * 2}`)

  return (
    <img
      src={src || "/placeholder.svg"}
      width={size}
      height={size}
      loading="lazy"
      alt={domain}
      onError={() => setSrc(`https://icons.duckduckgo.com/ip3/${domain}.ico`)}
      style={{ borderRadius: 4 }}
    />
  )
}
