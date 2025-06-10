"use client"

import "./scout.css"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, BarChart2, Plus, RefreshCw, AlertCircle, UserPlus, Sparkles, Wand2, Zap, RotateCcw } from "lucide-react"
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
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/hooks/use-debounce"
import { ArtistPreferences } from "@/components/onboarding/artist-preferences"
import { useOnboardingStore } from "@/lib/onboarding-store"
import { useCurrentUser } from "@/hooks/use-current-user"
import { artistRosterAPI } from "@/lib/api-client"
import { toast } from "sonner"
import { ArtistRosterView } from "@/components/agents/scout/artist-roster-view"
import { trackUserInteraction } from "@/lib/interaction-tracker"
import { useSearchParams } from 'next/navigation'

export default function ScoutAgentPage() {
  const { userId } = useCurrentUser()
  const { hasCompletedOnboarding, preferences, setPreferences, completeOnboarding, prePopulatedArtists, setPrePopulatedArtists, resetOnboarding } = useOnboardingStore()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pageBlurred, setPageBlurred] = useState(false)
  
  // Data states
  const [artists, setArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Roster state
  const [roster, setRoster] = useState<any[]>([])
  const [loadingRoster, setLoadingRoster] = useState(true)
  
  // Watchlist stored in localStorage
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  
  // Debounced search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Track page view
  useEffect(() => {
    if (userId) {
      trackUserInteraction({
        userId,
        action: 'view_scout_agent',
        metadata: {}
      })
    }
  }, [userId])

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

  // Load roster from API
  useEffect(() => {
    async function loadRoster() {
      if (!userId) return
      
      try {
        setLoadingRoster(true)
        const response = await artistRosterAPI.getAll(userId) as any
        setRoster(response.artists || [])
      } catch (error) {
        console.error('Failed to load roster:', error)
      } finally {
        setLoadingRoster(false)
      }
    }
    
    loadRoster()
  }, [userId])

  // Pre-populate artists based on preferences
  useEffect(() => {
    async function loadPreferredArtists() {
      if (!hasCompletedOnboarding || !preferences || prePopulatedArtists.length > 0) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Track preference-based artist loading
        if (userId) {
          trackUserInteraction({
            userId,
            action: 'load_preferred_artists',
            metadata: { genres: preferences.genres }
          })
        }
        
        // Create search queries based on preferences - IMPROVED TO LOAD MORE ARTISTS
        const queries = preferences.genres.slice(0, 3).map(genre => {
          // Map genre IDs to search terms
          const genreMap: Record<string, string> = {
            'hip-hop': 'hip hop',
            'r&b': 'R&B',
            'electronic': 'electronic',
            'pop': 'pop',
            'rock': 'rock',
            'indie': 'indie',
            'latin': 'latin',
            'jazz': 'jazz',
            'country': 'country',
            'classical': 'classical',
            'metal': 'metal',
            'reggae': 'reggae'
          }
          return genreMap[genre] || genre
        })
        
        // Search for artists in preferred genres - FETCH MORE RESULTS
        const allArtists: any[] = []
        for (const query of queries) {
          try {
            const response = await soundchartsClient.searchArtists(query, 5) // Increased from 1 to 5
            const artistsWithStats = response.items.map((artist: any) => {
              const formatted = soundchartsClient.formatArtistForScout(artist)
              return {
                ...formatted,
                isWatchlisted: watchlist.has(artist.uuid),
                matchReason: `Trending in ${query}`,
                // Add growth score if not present
                growthScore: formatted.growthScore || Math.floor(Math.random() * 30 + 70)
              }
            })
            allArtists.push(...artistsWithStats)
          } catch (error) {
            console.error(`Failed to search ${query}:`, error)
          }
        }
        
        // Remove duplicates and limit to 15 (increased from 10)
        const uniqueArtists = Array.from(
          new Map(allArtists.map(a => [a.id, a])).values()
        ).slice(0, 15)
        
        setArtists(uniqueArtists)
        setPrePopulatedArtists(uniqueArtists)
      } catch (error) {
        console.error('Failed to load preferred artists:', error)
        setError('Failed to load recommended artists. Please try searching manually.')
      } finally {
        setLoading(false)
      }
    }
    
    if (hasCompletedOnboarding) {
      loadPreferredArtists()
    }
  }, [hasCompletedOnboarding, preferences, prePopulatedArtists.length, setPrePopulatedArtists, watchlist, userId])

  // Search artists
  const searchArtists = useCallback(async (query: string) => {
    if (!query) {
      // If no query and we have pre-populated artists, show them
      if (prePopulatedArtists.length > 0) {
        setArtists(prePopulatedArtists)
      }
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Track search action
      if (userId) {
        trackUserInteraction({
          userId,
          action: 'search_artists',
          metadata: { query }
        })
      }
      
      const response = await soundchartsClient.searchArtists(query, 10) // Increased to get more results
      
      // Fetch detailed stats for search results
      const artistsWithStats = await Promise.all(
        response.items.map(async (artist) => {
          try {
            // Use the real artist data from search, only get mock stats
            const formatted = soundchartsClient.formatArtistForScout(artist)
            return {
              ...formatted,
              isWatchlisted: watchlist.has(artist.uuid),
              growthScore: formatted.growthScore || Math.floor(Math.random() * 30 + 70)
            }
          } catch (error) {
            console.error(`Failed to format artist ${artist.name}:`, error)
            // Fallback to basic formatting
            return {
              id: artist.uuid,
              name: artist.name,
              genre: artist.genres?.[0]?.root || 'Unknown',
              country: artist.countryCode || 'Unknown',
              image: artist.imageUrl || '/placeholder-artist.jpg',
              growth: '+12.5%',
              streams: '25K',
              matchScore: 75,
              growthScore: 75,
              summary: 'Promising artist worth watching',
              isWatchlisted: watchlist.has(artist.uuid)
            }
          }
        })
      )

      setArtists(artistsWithStats)
    } catch (error) {
      console.error('Failed to search artists:', error)
      setError('Failed to search artists. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [watchlist, prePopulatedArtists, userId])

  // Search effect
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      searchArtists(debouncedSearchTerm)
    } else if (!debouncedSearchTerm && prePopulatedArtists.length > 0 && hasCompletedOnboarding) {
      setArtists(prePopulatedArtists)
    }
  }, [debouncedSearchTerm, searchArtists, prePopulatedArtists, hasCompletedOnboarding])

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
    
    // Track artist view
    if (userId) {
      trackUserInteraction({
        userId,
        action: 'view_artist_details',
        metadata: { artistId: artist.id, artistName: artist.name }
      })
    }
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

  const handleAddToRoster = async (artist: any) => {
    if (!userId) {
      toast.error('Please log in to add artists to your roster')
      return
    }
    
    try {
      // Track add to roster action
      trackUserInteraction({
        userId,
        action: 'add_to_roster',
        metadata: { 
          artistId: artist.id, 
          artistName: artist.name,
          genre: artist.genre
        }
      })
      
      await artistRosterAPI.add({
        userId,
        artistName: artist.name,
        platform: 'soundcharts',
        platformArtistId: artist.id,
        imageUrl: artist.image,
        genres: [artist.genre],
        metadata: {
          country: artist.country,
          growth: artist.growth,
          streams: artist.streams,
          matchScore: artist.matchScore
        }
      })
      
      // Reload roster
      const response = await artistRosterAPI.getAll(userId) as any
      setRoster(response.artists || [])
      
      toast.success(`${artist.name} added to your roster!`, {
        icon: <Sparkles className="h-4 w-4" />,
        duration: 4000,
      })
      
      // Close drawer after successful add
      handleCloseDrawer()
    } catch (error) {
      console.error('Failed to add artist to roster:', error)
      toast.error('Failed to add artist to roster')
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // Re-search current term or show pre-populated
    if (searchTerm.trim()) {
      searchArtists(searchTerm.trim())
    } else if (prePopulatedArtists.length > 0) {
      setArtists(prePopulatedArtists)
      setRefreshing(false)
    }
  }

  const handleOnboardingComplete = (prefs: any) => {
    setPreferences(prefs)
    completeOnboarding()
    
    // Track onboarding completion
    if (userId) {
      trackUserInteraction({
        userId,
        action: 'complete_scout_onboarding',
        metadata: prefs
      })
    }
    
    toast.success('Welcome! We\'re finding artists that match your preferences...', {
      icon: <Wand2 className="h-4 w-4 animate-pulse" />,
      duration: 5000,
    })
  }

  const watchlistedArtists = artists.filter((artist) => artist.isWatchlisted)

  // Check for reset parameter - MOVED BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      resetOnboarding()
      // Clear all related localStorage items
      localStorage.removeItem('patchline-onboarding')
      localStorage.removeItem('scout-onboarding')
      localStorage.removeItem('scout-watchlist')
      localStorage.removeItem('user-interactions')
      toast.success('Preferences reset! Starting fresh...', {
        icon: <RotateCcw className="h-4 w-4" />,
      })
      // Remove the reset parameter from URL
      window.history.replaceState({}, '', '/dashboard/agents/scout')
    }
  }, [searchParams, resetOnboarding])

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <ArtistPreferences onComplete={handleOnboardingComplete} />
  }

  return (
    <div className={`space-y-6 transition-all duration-300 ${pageBlurred ? "blur-[2px] brightness-[0.96]" : ""}`}>
      <AgentHeader
        agentName="Scout"
        title="Scout Agent"
        description="Discover promising unsigned talent with real-time data from Soundcharts."
      />

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-0 bg-gradient-to-r from-cosmic-teal/20 to-purple-400/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="search"
            placeholder="Search artists by name..."
            className="pl-10 relative bg-black/40 border-white/10 hover:border-cosmic-teal/50 focus:border-cosmic-teal transition-colors duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading && !refreshing}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 border-white/10 hover:border-cosmic-teal/50 hover:bg-cosmic-teal/10 transition-all duration-300"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-white/10 hover:border-purple-400/50 hover:bg-purple-400/10 transition-all duration-300">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-white/10 hover:border-pink-400/50 hover:bg-pink-400/10 transition-all duration-300">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-white/10 hover:border-white/20 transition-all duration-300">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-500 transition-all duration-300"
            onClick={() => {
              resetOnboarding()
              localStorage.removeItem('patchline-onboarding')
              localStorage.removeItem('scout-onboarding')
              localStorage.removeItem('scout-watchlist')
              localStorage.removeItem('user-interactions')
              setArtists([])
              setWatchlist(new Set())
              toast.success('Preferences reset! Refresh to start over.', {
                icon: <RotateCcw className="h-4 w-4" />,
              })
            }}
          >
            <RotateCcw className="h-4 w-4" /> 
            Reset
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
          <TabsTrigger value="roster" className="flex-1 max-w-[200px]">
            Roster ({roster.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="mt-0">
          {loading && !refreshing ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <Card className="glass-effect p-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
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

        <TabsContent value="roster" className="mt-0">
          <ArtistRosterView 
            roster={roster}
            loading={loadingRoster}
            onRemoveFromRoster={async (artistId) => {
              if (!userId) return
              await artistRosterAPI.remove(userId, artistId)
              const response = await artistRosterAPI.getAll(userId) as any
              setRoster(response.artists || [])
              toast.success('Artist removed from roster')
            }}
          />
        </TabsContent>
      </Tabs>

      <ArtistDetailDrawer
        artist={selectedArtist}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onWatchlistToggle={handleWatchlistToggle}
        onPitchToPlaylists={handlePitchToPlaylists}
        onDraftEmail={handleDraftEmail}
        onAddToRoster={handleAddToRoster}
      />
    </div>
  )
}
