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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

  const [showResetDialog, setShowResetDialog] = useState(false)

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

  // Load roster on mount
  useEffect(() => {
    async function loadRoster() {
      if (!userId) return
      
      try {
        const response = await artistRosterAPI.getAll(userId) as any
        setRoster(response.artists || [])
      } catch (error) {
        console.error('Failed to load roster:', error)
        setRoster([])
      }
    }
    
    loadRoster()
  }, [userId])

  // Load preferences from DynamoDB on mount
  useEffect(() => {
    async function loadSavedPreferences() {
      if (!userId || preferences) return // Don't load if already have preferences
      
      try {
        const response = await fetch(`/api/user-preferences?userId=${userId}&agentId=scout`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            console.log('📥 Loaded saved preferences:', data.preferences)
            setPreferences(data.preferences)
            completeOnboarding() // Mark onboarding as complete if we have saved preferences
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
    
    loadSavedPreferences()
  }, [userId, preferences, completeOnboarding])

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
        
        // Use real Soundcharts API with user preferences
        console.log('🎵 Loading artists based on your preferences...', preferences)
        
        const artists = await soundchartsClient.getArtistsByPreferences({
          genres: preferences.genres,
          markets: preferences.markets,
          careerStages: preferences.careerStage,
          sortBy: 'monthly_listeners',
          limit: 20
        })

        if (artists.length > 0) {
          console.log('✅ Got real artists from Soundcharts:', artists.length)
          
          const formattedArtists = await Promise.all(
            artists.slice(0, 15).map(async (artist) => {
              try {
                const formatted = soundchartsClient.formatArtistForScout(artist)
                return {
                  ...formatted,
                  isWatchlisted: watchlist.has(artist.uuid || formatted.id)
                }
              } catch (error) {
                console.error(`Failed to format artist ${artist.name}:`, error)
                return null
              }
            })
          )

          const validArtists = formattedArtists.filter(Boolean)
          if (validArtists.length > 0) {
            setArtists(validArtists)
            setPrePopulatedArtists(validArtists)
            
            toast.success(`Found ${validArtists.length} artists matching your preferences!`, {
              icon: <Sparkles className="h-4 w-4" />,
              duration: 3000,
            })
            return
          }
        }

        // If no artists found, show helpful message
        setError(`No artists found yet. Try searching for specific artists or adjusting your preferences.`)
        
      } catch (error) {
        console.error('Failed to load preferred artists:', error)
        setError('Failed to load recommended artists. Please try searching manually.')
      } finally {
        setLoading(false)
      }
    }
    
    if (hasCompletedOnboarding && preferences) {
      loadPreferredArtists()
    }
  }, [hasCompletedOnboarding, preferences, prePopulatedArtists.length, watchlist, userId])

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
              image: artist.imageUrl || '/placeholder.svg',
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

  const handleWatchlistToggle = useCallback((artistId: string) => {
    // Update watchlist state
    setWatchlist((prev) => {
      const newWatchlist = new Set(prev)
      if (newWatchlist.has(artistId)) {
        newWatchlist.delete(artistId)
      } else {
        newWatchlist.add(artistId)
      }
      return newWatchlist
    })
    
    // Optimistically update only the specific artist to prevent flickering
    setArtists((prev) =>
      prev.map((artist) => 
        artist.id === artistId 
          ? { ...artist, isWatchlisted: !artist.isWatchlisted } 
          : artist
      )
    )
    
    // Also update pre-populated artists
    const updatedPrePopulated = prePopulatedArtists.map((artist) => 
      artist.id === artistId 
        ? { ...artist, isWatchlisted: !artist.isWatchlisted } 
        : artist
    )
    setPrePopulatedArtists(updatedPrePopulated)
    
    // Track watchlist action
    if (userId) {
      const artist = artists.find(a => a.id === artistId)
      if (artist) {
        trackUserInteraction({
          userId,
          action: watchlist.has(artistId) ? 'remove_from_watchlist' : 'add_to_watchlist',
          metadata: { 
            artistId, 
            artistName: artist.name,
            genre: artist.genre
          }
        })
      }
    }
  }, [watchlist, userId, artists, prePopulatedArtists])

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
            handoff("Scout", "Aria", {
      action: "draft_email",
      artist: artist,
    })
  }

  const handleAddToRoster = async (artist: any) => {
    if (!userId) {
      toast.error('Please log in to add artists to your roster')
      return
    }
    
    // Check if artist is already in roster
    const isAlreadyInRoster = roster.some(rosterArtist => 
      rosterArtist.platformArtistId === artist.id || 
      rosterArtist.artistName === artist.name
    )
    
    if (isAlreadyInRoster) {
      toast.info(`${artist.name} is already in your roster!`)
      return
    }
    
    try {
      // Add to roster first
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
      
      // Track add to roster action (after successful add)
      await trackUserInteraction({
        userId,
        action: 'add_to_roster',
        metadata: { 
          artistId: artist.id, 
          artistName: artist.name,
          genre: artist.genre,
          platform: 'soundcharts',
          addedAt: new Date().toISOString()
        }
      })
      
      // Reload roster to show the new addition
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
      
      // Check if it's a duplicate error
      if (error instanceof Error && error.message.includes('already in roster')) {
        toast.info(`${artist.name} is already in your roster!`)
      } else {
        toast.error('Failed to add artist to roster')
      }
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

  const handleOnboardingComplete = async (prefs: any) => {
    setPreferences(prefs)
    completeOnboarding()
    
    // Save preferences to DynamoDB
    if (userId) {
      try {
        await fetch('/api/user-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            agentId: 'scout',
            preferences: prefs
          })
        })
        console.log('💾 Saved preferences to database')
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
      
      // Track onboarding completion
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
      const performReset = async () => {
        resetOnboarding()
        // Clear all related localStorage items
        localStorage.removeItem('patchline-onboarding')
        localStorage.removeItem('scout-onboarding')
        localStorage.removeItem('scout-watchlist')
        localStorage.removeItem('user-interactions')
        setArtists([])
        setWatchlist(new Set())
        setPreferences(null)
        
        // Clear the roster from DynamoDB
        if (userId && roster.length > 0) {
          try {
            await Promise.all(
              roster.map(artist => 
                artistRosterAPI.remove(userId, artist.artistId)
              )
            )
            setRoster([])
          } catch (error) {
            console.error('Error clearing roster during URL reset:', error)
          }
        }
        
        toast.success('Preferences reset! Starting fresh...', {
          icon: <RotateCcw className="h-4 w-4" />,
        })
        // Remove the reset parameter from URL
        window.history.replaceState({}, '', '/dashboard/agents/scout')
      }
      
      performReset()
    }
  }, [searchParams, resetOnboarding, userId, roster])

  const handleResetConfirm = async () => {
    try {
      resetOnboarding()
      localStorage.removeItem('patchline-onboarding')
      localStorage.removeItem('scout-onboarding')
      localStorage.removeItem('scout-watchlist')
      localStorage.removeItem('user-interactions')
      setArtists([])
      setWatchlist(new Set())
      setPreferences(null)
      
      // Clear the roster from DynamoDB
      if (userId && roster.length > 0) {
        await Promise.all(
          roster.map(artist => 
            artistRosterAPI.remove(userId, artist.artistId)
          )
        )
        setRoster([])
      }
      
      // Track the reset action
      if (userId) {
        trackUserInteraction({
          userId,
          action: 'reset_scout_preferences',
          metadata: { 
            resetAt: new Date().toISOString(),
            previousPreferences: preferences,
            clearedRosterCount: roster.length
          }
        })
      }
      
      toast.success('All Scout preferences and data have been reset!', {
        icon: <RotateCcw className="h-4 w-4" />,
        duration: 4000,
      })
      setShowResetDialog(false)
    } catch (error) {
      console.error('Error during reset:', error)
      toast.error('Reset completed, but some data may not have been cleared')
      setShowResetDialog(false)
    }
  }

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
            onClick={() => setShowResetDialog(true)}
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
        roster={roster}
      />

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="glass-effect border-white/10 bg-black/40 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-500" />
              Reset Scout Preferences
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will permanently delete all your Scout data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Genre and market preferences</li>
                <li>Watchlisted artists</li>
                <li>Artist roster</li>
                <li>Interaction history</li>
              </ul>
              <br />
              <strong className="text-red-400">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:border-white/20 bg-transparent text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
