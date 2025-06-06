"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, BarChart2, Plus, RefreshCw, AlertCircle } from "lucide-react"
import { AgentHeader } from "@/components/agents/agent-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArtistDiscoveryList } from "@/components/agents/scout/artist-discovery-list"
import { WatchlistView } from "@/components/agents/scout/watchlist-view"
import { AnalyticsView } from "@/components/agents/scout/analytics-view"
import { ArtistDetailDrawer } from "@/components/agents/scout/artist-detail-drawer"
import { handoff } from "@/lib/agent-bridge"
import { soundchartsClient } from "@/lib/services/soundcharts-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/hooks/use-debounce"

export default function ScoutAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pageBlurred, setPageBlurred] = useState(false)
  
  // Data states
  const [artists, setArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Watchlist stored in localStorage
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  
  // Debounced search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('scout-watchlist')
    if (savedWatchlist) {
      setWatchlist(new Set(JSON.parse(savedWatchlist)))
    }
  }, [])

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('scout-watchlist', JSON.stringify(Array.from(watchlist)))
  }, [watchlist])

  // Fetch trending artists
  const fetchTrendingArtists = useCallback(async () => {
    try {
      setError(null)
      
      const response = await soundchartsClient.getTrendingArtists({
        limit: 20,
        sort: {
          platform: 'spotify',
          metricType: 'followers',
          period: 'month',
          sortBy: 'volume',
          order: 'desc'
        },
        filters: [
          {
            type: 'careerStage',
            data: {
              values: ['emerging', 'mid_level'],
              operator: 'in'
            }
          }
        ]
      })

      // Fetch detailed stats for each artist
      const artistsWithStats = await Promise.all(
        response.items.slice(0, 10).map(async (item) => {
          try {
            const { artist, stats, playlists } = await soundchartsClient.getArtistWithStats(item.artist.uuid)
            const formatted = soundchartsClient.formatArtistForScout(artist, stats, playlists)
            return {
              ...formatted,
              isWatchlisted: watchlist.has(artist.uuid)
            }
          } catch (error) {
            console.error(`Failed to fetch details for artist ${item.artist.name}:`, error)
            // Return basic info if detailed fetch fails
            return soundchartsClient.formatArtistForScout(item.artist)
          }
        })
      )

      setArtists(artistsWithStats)
    } catch (error) {
      console.error('Failed to fetch trending artists:', error)
      setError('Failed to load trending artists. Please try again later.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [watchlist])

  // Search artists
  const searchArtists = useCallback(async (query: string) => {
    if (!query) {
      fetchTrendingArtists()
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await soundchartsClient.searchArtists(query, 10)
      
      // Fetch detailed stats for search results
      const artistsWithStats = await Promise.all(
        response.items.map(async (artist) => {
          try {
            const { stats, playlists } = await soundchartsClient.getArtistWithStats(artist.uuid)
            const formatted = soundchartsClient.formatArtistForScout(artist, stats, playlists)
            return {
              ...formatted,
              isWatchlisted: watchlist.has(artist.uuid)
            }
          } catch (error) {
            console.error(`Failed to fetch details for artist ${artist.name}:`, error)
            return soundchartsClient.formatArtistForScout(artist)
          }
        })
      )

      setArtists(artistsWithStats)
    } catch (error) {
      console.error('Failed to search artists:', error)
      setError('Failed to search artists. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [watchlist])

  // Initial load
  useEffect(() => {
    fetchTrendingArtists()
  }, [fetchTrendingArtists])

  // Search effect
  useEffect(() => {
    searchArtists(debouncedSearchTerm)
  }, [debouncedSearchTerm, searchArtists])

  const handleWatchlistToggle = (artistId: string) => {
    setWatchlist((prev) => {
      const newWatchlist = new Set(prev)
      if (newWatchlist.has(artistId)) {
        newWatchlist.delete(artistId)
      } else {
        newWatchlist.add(artistId)
      }
      return newWatchlist
    })
    
    setArtists((prev) =>
      prev.map((artist) => 
        artist.id === artistId 
          ? { ...artist, isWatchlisted: !artist.isWatchlisted } 
          : artist
      )
    )
  }

  const handleArtistClick = (artist: any) => {
    setSelectedArtist(artist)
    setDrawerOpen(true)
    setPageBlurred(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setPageBlurred(false)
  }

  const handlePitchToPlaylists = (artist: any) => {
    handoff("Scout", "Fan", {
      action: "playlist_pitch",
      trackIds: [artist.id],
      artistName: artist.name,
      playlists: artist.playlistMatches,
    })
  }

  const handleDraftEmail = (artist: any) => {
    handoff("Scout", "Patchy", {
      action: "draft_email",
      artist: artist,
    })
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTrendingArtists()
  }

  const watchlistedArtists = artists.filter((artist) => artist.isWatchlisted)

  return (
    <div className={`space-y-6 transition-all duration-300 ${pageBlurred ? "blur-[2px] brightness-[0.96]" : ""}`}>
      <AgentHeader
        agentName="Scout"
        title="Scout Agent"
        description="Discover promising unsigned talent with real-time data from Soundcharts."
      />

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search artists by name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading && !refreshing}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-background/5 p-1">
          <TabsTrigger value="discovery" className="flex-1 max-w-[200px]">
            Discovery
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex-1 max-w-[200px]">
            Watchlist ({watchlistedArtists.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 max-w-[200px]">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="mt-0">
          {loading && !refreshing ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="artist-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArtistDiscoveryList
                  artists={artists}
                  onWatchlistToggle={handleWatchlistToggle}
                  onArtistClick={handleArtistClick}
                  onPitchToPlaylists={handlePitchToPlaylists}
                  onDraftEmail={handleDraftEmail}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="mt-0">
          <WatchlistView
            artists={watchlistedArtists}
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
