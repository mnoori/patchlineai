"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, BarChart2, Plus } from "lucide-react"
import { AgentHeader } from "@/components/agents/agent-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArtistDiscoveryList } from "@/components/agents/scout/artist-discovery-list"
import { WatchlistView } from "@/components/agents/scout/watchlist-view"
import { AnalyticsView } from "@/components/agents/scout/analytics-view"
import { ArtistDetailDrawer } from "@/components/agents/scout/artist-detail-drawer"
import { handoff } from "@/lib/agent-bridge"

export default function ScoutAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pageBlurred, setPageBlurred] = useState(false)

  // Sample artists data
  const [artists, setArtists] = useState([
    {
      id: "artist-1",
      name: "Cosmic Waves",
      track: "Nebula Dreams",
      genre: "Electronic",
      growthScore: 87,
      matchScore: 92,
      streams: "12.4K",
      growth: "+156%",
      image: "/electronic-artist-avatar.png",
      playlistMatches: ["Late Night Vibes", "Electronic Essentials", "Future Beats"],
      platforms: ["spotify", "tiktok", "soundcloud"],
      aiSummary: "Viral on TikTok this week with 3 trending sounds",
      isWatchlisted: false,
      monthlyListeners: "5.2K",
      topMarkets: ["US", "UK", "Germany"],
      engagement: "High",
      recentActivity: "Released 2 tracks in the last month",
      similarArtists: ["Neon Pulse", "Electro Dreams", "Synth Collective"],
      potentialRevenue: "$1.2K - $3.5K",
      fanDemographics: {
        age: "18-24 (65%), 25-34 (25%)",
        gender: "Male (58%), Female (42%)",
        locations: "New York, London, Berlin",
      },
    },
    {
      id: "artist-2",
      name: "Luna Ray",
      track: "Midnight Glow",
      genre: "Indie Pop",
      growthScore: 82,
      matchScore: 88,
      streams: "8.7K",
      growth: "+124%",
      image: "/indie-artist-avatar.png",
      playlistMatches: ["Indie Discoveries", "Chill Vibes"],
      platforms: ["spotify", "instagram"],
      aiSummary: "Sound matches Astral Drift on your roster",
      isWatchlisted: true,
      monthlyListeners: "3.8K",
      topMarkets: ["US", "Canada", "Australia"],
      engagement: "Medium",
      recentActivity: "Growing Instagram following (+28% this month)",
      similarArtists: ["Astral Drift", "Indie Waves", "Lunar Echo"],
      potentialRevenue: "$800 - $2.2K",
      fanDemographics: {
        age: "18-24 (45%), 25-34 (40%)",
        gender: "Female (62%), Male (38%)",
        locations: "Los Angeles, Toronto, Sydney",
      },
    },
    {
      id: "artist-3",
      name: "The Echoes",
      track: "Distant Memories",
      genre: "Alternative",
      growthScore: 79,
      matchScore: 85,
      streams: "15.2K",
      growth: "+98%",
      image: "/alternative-band-avatar.png",
      playlistMatches: ["Alternative Hits", "New Rock"],
      platforms: ["spotify", "youtube", "bandcamp"],
      aiSummary: "Strong audience overlap with your top artists",
      isWatchlisted: false,
      monthlyListeners: "7.5K",
      topMarkets: ["US", "UK", "Japan"],
      engagement: "Medium-High",
      recentActivity: "YouTube views up 45% after latest video",
      similarArtists: ["Echo Chamber", "The Resonance", "Sound Waves"],
      potentialRevenue: "$1.5K - $4K",
      fanDemographics: {
        age: "18-24 (35%), 25-34 (45%)",
        gender: "Male (55%), Female (45%)",
        locations: "Chicago, Manchester, Tokyo",
      },
    },
    {
      id: "artist-4",
      name: "Metro Beats",
      track: "Urban Jungle",
      genre: "Hip Hop",
      growthScore: 76,
      matchScore: 81,
      streams: "22.8K",
      growth: "+87%",
      image: "/hip-hop-producer-avatar.png",
      playlistMatches: ["Hip Hop Essentials"],
      platforms: ["spotify", "soundcloud", "tiktok"],
      aiSummary: "Rapidly growing in NYC streaming market",
      isWatchlisted: false,
      monthlyListeners: "10.2K",
      topMarkets: ["US", "Canada", "France"],
      engagement: "High",
      recentActivity: "Trending on TikTok with latest single",
      similarArtists: ["Urban Flow", "City Rhythm", "Beat Master"],
      potentialRevenue: "$2K - $5.5K",
      fanDemographics: {
        age: "18-24 (55%), 25-34 (35%)",
        gender: "Male (65%), Female (35%)",
        locations: "New York, Toronto, Paris",
      },
    },
    {
      id: "artist-5",
      name: "Skyline Collective",
      track: "Higher Ground",
      genre: "House",
      growthScore: 74,
      matchScore: 79,
      streams: "9.3K",
      growth: "+112%",
      image: "/house-dj-avatar.png",
      playlistMatches: ["House Party", "EDM Workout"],
      platforms: ["spotify", "beatport", "instagram"],
      aiSummary: "Featured in 3 influential DJ sets this month",
      isWatchlisted: false,
      monthlyListeners: "4.7K",
      topMarkets: ["US", "UK", "Germany", "Netherlands"],
      engagement: "Medium",
      recentActivity: "Released EP on Beatport, reached Top 10 in House",
      similarArtists: ["Sky High", "House Nation", "Elevation"],
      potentialRevenue: "$1K - $3K",
      fanDemographics: {
        age: "18-24 (40%), 25-34 (45%)",
        gender: "Male (60%), Female (40%)",
        locations: "Miami, London, Berlin, Amsterdam",
      },
    },
  ])

  const handleWatchlistToggle = (artistId) => {
    setArtists((prev) =>
      prev.map((artist) => (artist.id === artistId ? { ...artist, isWatchlisted: !artist.isWatchlisted } : artist)),
    )
  }

  const handleArtistClick = (artist) => {
    setSelectedArtist(artist)
    setDrawerOpen(true)
    setPageBlurred(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setPageBlurred(false)
  }

  const handlePitchToPlaylists = (artist) => {
    handoff("Scout", "Fan", {
      action: "playlist_pitch",
      trackIds: [artist.id],
      artistName: artist.name,
      playlists: artist.playlistMatches,
    })
  }

  const handleDraftEmail = (artist) => {
    handoff("Scout", "Patchy", {
      action: "draft_email",
      artist: artist,
    })
  }

  return (
    <div className={`space-y-6 transition-all duration-300 ${pageBlurred ? "blur-[2px] brightness-[0.96]" : ""}`}>
      <AgentHeader
        agentName="Scout"
        title="Scout Agent"
        description="Discover promising unsigned talent based on growth metrics, sound profile, and genre match."
      />

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search artists, tracks, or genres..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
            <Plus className="h-4 w-4" /> Add Artist
          </Button>
        </div>
      </div>

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-background/5 p-1">
          <TabsTrigger value="discovery" className="flex-1 max-w-[200px]">
            Discovery
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex-1 max-w-[200px]">
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 max-w-[200px]">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="mt-0">
          <ArtistDiscoveryList
            artists={artists}
            onWatchlistToggle={handleWatchlistToggle}
            onArtistClick={handleArtistClick}
            onPitchToPlaylists={handlePitchToPlaylists}
            onDraftEmail={handleDraftEmail}
          />
        </TabsContent>

        <TabsContent value="watchlist" className="mt-0">
          <WatchlistView
            artists={artists.filter((artist) => artist.isWatchlisted)}
            onWatchlistToggle={handleWatchlistToggle}
            onArtistClick={handleArtistClick}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <AnalyticsView />
        </TabsContent>
      </Tabs>

      <ArtistDetailDrawer
        artist={selectedArtist}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onWatchlistToggle={handleWatchlistToggle}
        onPitchToPlaylists={handlePitchToPlaylists}
        onDraftEmail={handleDraftEmail}
      />
    </div>
  )
}
