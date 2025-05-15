"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Bell,
  ArrowUpRight,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  Music,
  Users,
  BarChart,
  RefreshCcw,
  Laptop,
} from "lucide-react"
import { useArtistAnalysis } from "@/hooks/use-artist-analysis"
import { motion, AnimatePresence } from "framer-motion"
import { DEMO_CONFIG } from "@/lib/config"

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("discover")
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null)
  const [mounted, setMounted] = useState(false)
  const { loading, error, artists, fetchArtists, batchRefreshTime, initialLoadComplete, isDemoMode } =
    useArtistAnalysis()

  useEffect(() => {
    setMounted(true)
    fetchArtists()
  }, [fetchArtists])

  // Show error if all artists fail
  if (mounted && error) {
    return (
      <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 min-h-[400px] flex flex-col items-center justify-center">
        <div className="mb-6 text-neon-red">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-light/70 font-medium text-center">Could not load artist data</p>
        <p className="text-light/40 text-sm mt-2 text-center max-w-md px-4">
          There was an issue connecting to Spotify. Please check back for the next batch.
        </p>
      </div>
    )
  }

  // Show loading state only on initial load, not on subsequent refreshes
  if (!mounted || (loading && !initialLoadComplete)) {
    return (
      <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 min-h-[400px] flex flex-col items-center justify-center">
        <div className="mb-6 relative">
          <div className="w-12 h-12 rounded-full border-t-2 border-neon-cyan animate-spin"></div>
          <div
            className="w-12 h-12 rounded-full border-r-2 border-neon-magenta animate-spin absolute top-0 left-0"
            style={{ animationDuration: "1.5s" }}
          ></div>
        </div>
        <p className="text-light/70 font-medium">Curating today's talent batch...</p>
        <p className="text-light/40 text-sm mt-2">Analyzing artist performance data</p>
      </div>
    )
  }

  // If no artists were found at all
  if (mounted && initialLoadComplete && (!artists || artists.length === 0)) {
    return (
      <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 min-h-[400px] flex flex-col items-center justify-center">
        <div className="mb-6 text-neon-cyan">
          <Music className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-light/70 font-medium text-center">No artists found in today's batch</p>
        <p className="text-light/40 text-sm mt-2 text-center max-w-md px-4">
          We couldn't find any artists for today's batch. Please check back for the next batch.
        </p>
      </div>
    )
  }

  // Featured artists are the top 2 by popularity (or any criteria you prefer)
  const featuredArtists =
    artists && artists.length > 0
      ? [...artists].sort((a, b) => b.popularity - a.popularity).slice(0, Math.min(2, artists.length))
      : []

  // Remaining artists for the list
  const remainingArtists =
    artists && artists.length > 2 ? [...artists].sort((a, b) => b.popularity - a.popularity).slice(2) : []

  // Generate a color based on artist genre/popularity for visual variety
  const getArtistColor = (artist: any) => {
    const genres = artist?.genres || []
    if (genres.some((g: string) => g.includes("electro") || g.includes("techno") || g.includes("house")))
      return "neon-cyan"
    if (genres.some((g: string) => g.includes("hip") || g.includes("rap") || g.includes("r&b"))) return "neon-magenta"
    if (genres.some((g: string) => g.includes("rock") || g.includes("metal"))) return "neon-red"
    if (genres.some((g: string) => g.includes("ambient") || g.includes("chill"))) return "neon-green"
    return "neon-cyan" // default
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glassmorphic rounded-xl overflow-hidden border border-light/10 relative"
    >
      {/* Demo Mode Badge */}
      {isDemoMode && DEMO_CONFIG.SHOW_DEMO_BADGE && (
        <div className="absolute top-2 right-2 z-50 bg-neon-magenta/80 text-light px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
          <Laptop className="h-3 w-3" />
          Demo Mode
        </div>
      )}

      {/* Dashboard Header */}
      <div className="border-b border-light/10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "discover" ? "bg-neon-cyan/20 text-neon-cyan" : "text-light/60 hover:text-light"
            }`}
            onClick={() => {
              setActiveTab("discover")
              setSelectedArtist(null)
            }}
          >
            A&R Scout
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "legal" ? "bg-neon-magenta/20 text-neon-magenta" : "text-light/60 hover:text-light"
            }`}
            onClick={() => {
              setActiveTab("legal")
              setSelectedArtist(null)
            }}
          >
            Legal
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "catalog" ? "bg-neon-green/20 text-neon-green" : "text-light/60 hover:text-light"
            }`}
            onClick={() => {
              setActiveTab("catalog")
              setSelectedArtist(null)
            }}
          >
            Catalog
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-light/60" />
            <span className="absolute -top-1 -right-1 bg-neon-magenta text-eclipse text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6">
        {activeTab === "discover" && !selectedArtist && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">Daily Talent Batch</h3>
                <div className="flex items-center gap-2 mt-1">
                  <RefreshCcw className="h-3 w-3 text-light/60" />
                  <p className="text-xs text-light/60">
                    Next batch in: <span className="text-neon-cyan">{batchRefreshTime}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light/40" />
                  <input
                    type="text"
                    placeholder="Search artists, tracks..."
                    className="pl-10 pr-4 py-2 bg-eclipse/50 border border-light/10 rounded-md text-sm w-64 focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <button className="p-2 bg-eclipse/50 border border-light/10 rounded-md hover:border-neon-cyan/50 transition-colors">
                  <Filter className="h-4 w-4 text-light/60" />
                </button>
              </div>
            </div>

            {/* Featured Artists - Top 2 */}
            <h4 className="text-light/80 text-sm uppercase tracking-wider mb-3">Featured Talent</h4>
            {featuredArtists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <AnimatePresence mode="wait">
                  {featuredArtists.map((artist: any) => (
                    <motion.div
                      key={artist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        duration: 0.4,
                      }}
                      className="bg-eclipse/30 border border-light/10 rounded-lg p-4 hover:border-neon-cyan/50 transition-all cursor-pointer relative overflow-hidden group"
                      onClick={() => setSelectedArtist(artist)}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-md flex-shrink-0 overflow-hidden">
                          {artist.images && artist.images[0] ? (
                            <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className={`w-full h-full bg-${getArtistColor(artist)}/20 flex items-center justify-center`}
                            >
                              <Music className={`h-8 w-8 text-${getArtistColor(artist)}`} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{artist.name}</h4>
                            <span
                              className={`text-xs bg-${getArtistColor(artist)}/20 text-${getArtistColor(artist)} px-2 py-0.5 rounded-full`}
                            >
                              Spotify
                            </span>
                          </div>
                          <p className="text-sm text-light/60 mb-2">
                            {artist.genres?.length > 0 ? artist.genres[0] : "Unknown Genre"} •{" "}
                            {artist.followers?.total?.toLocaleString() || "N/A"} followers
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-neon-green" />
                              <span className="text-xs text-neon-green">Popularity: {artist.popularity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-light/60" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-eclipse/30 border border-light/10 rounded-lg p-4 mb-6 text-center">
                <p className="text-light/60">No artists found in today's batch.</p>
              </div>
            )}

            {/* Trending Artists List - Remaining */}
            <h4 className="text-light/80 text-sm uppercase tracking-wider mb-3">Rising Artists</h4>
            {remainingArtists.length > 0 ? (
              <div className="bg-eclipse/30 border border-light/10 rounded-lg mb-6 overflow-hidden">
                <div className="max-h-[320px] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {remainingArtists.map((artist: any, index: number) => (
                      <motion.div
                        key={artist.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05, // Stagger the animations
                        }}
                        className="flex items-center gap-3 p-3 border-b border-light/5 last:border-0 hover:bg-light/5 cursor-pointer group transition-all"
                        onClick={() => setSelectedArtist(artist)}
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-12 h-12 rounded-md flex-shrink-0 overflow-hidden">
                          {artist.images && artist.images[0] ? (
                            <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className={`w-full h-full bg-${getArtistColor(artist)}/20 flex items-center justify-center`}
                            >
                              <Music className={`h-5 w-5 text-${getArtistColor(artist)}`} />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{artist.name}</p>
                            <span
                              className={`text-xs bg-${getArtistColor(artist)}/20 text-${getArtistColor(artist)} px-1.5 py-0.5 rounded-full`}
                            >
                              {artist.popularity}
                            </span>
                          </div>
                          <p className="text-xs text-light/50">
                            {artist.genres?.length > 0 ? artist.genres[0] : "Unknown Genre"} •{" "}
                            {artist.followers?.total?.toLocaleString() || "N/A"} followers
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-light/60" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="bg-eclipse/30 border border-light/10 rounded-lg p-4 mb-6 text-center">
                <p className="text-light/60">No additional artists found in today's batch.</p>
              </div>
            )}

            <div className="bg-eclipse/30 border border-light/10 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Batch Insights</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <div className="mt-0.5">
                    <CheckCircle className="h-4 w-4 text-neon-cyan" />
                  </div>
                  <p className="text-light/80">
                    Today's batch emphasizes{" "}
                    <span className="text-neon-cyan cursor-pointer hover:underline">electronic</span> and{" "}
                    <span className="text-neon-cyan cursor-pointer hover:underline">ambient</span> artists with strong
                    streaming growth.
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="mt-0.5">
                    <CheckCircle className="h-4 w-4 text-neon-green" />
                  </div>
                  <p className="text-light/80">
                    Tomorrow's batch will include more artists from the{" "}
                    <span className="text-neon-green cursor-pointer hover:underline">downtempo</span> and{" "}
                    <span className="text-neon-green cursor-pointer hover:underline">chillwave</span> genres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artist Detail View */}
        {activeTab === "discover" && selectedArtist && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-6">
                <button onClick={() => setSelectedArtist(null)} className="mr-3 text-light/60 hover:text-neon-cyan">
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-semibold">{selectedArtist.name}</h3>
                <span
                  className={`ml-2 text-xs bg-${getArtistColor(selectedArtist)}/20 text-${getArtistColor(selectedArtist)} px-2 py-0.5 rounded-full`}
                >
                  Spotify
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Artist Image and Basic Info */}
                <div className="md:col-span-1">
                  <div className="bg-eclipse/30 border border-light/10 rounded-lg p-5 mb-4">
                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-4">
                      {selectedArtist.images?.[0]?.url ? (
                        <img
                          src={selectedArtist.images[0].url}
                          alt={selectedArtist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-${getArtistColor(selectedArtist)}/20 flex items-center justify-center`}
                        >
                          <Music className={`h-16 w-16 text-${getArtistColor(selectedArtist)}`} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-light/60 text-xs mb-1">Genres</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedArtist.genres?.map((genre: string, i: number) => (
                            <span
                              key={i}
                              className={`text-xs bg-${getArtistColor(selectedArtist)}/10 text-light/90 px-2 py-1 rounded-md`}
                            >
                              {genre}
                            </span>
                          )) || "N/A"}
                        </div>
                      </div>

                      <div>
                        <div className="text-light/60 text-xs mb-1">Spotify URL</div>
                        <a
                          href={selectedArtist.external_urls?.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-${getArtistColor(selectedArtist)} text-sm underline inline-flex items-center gap-1`}
                        >
                          View on Spotify
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artist Analytics */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Popularity Stats */}
                    <div className="bg-eclipse/30 border border-light/10 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart className={`h-5 w-5 text-${getArtistColor(selectedArtist)}`} />
                        <h4 className="font-medium">Popularity Metrics</h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Spotify Popularity</span>
                            <span className={`text-${getArtistColor(selectedArtist)}`}>
                              {selectedArtist.popularity}%
                            </span>
                          </div>
                          <div className="h-2 bg-eclipse rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-${getArtistColor(selectedArtist)} rounded-full`}
                              style={{ width: `${selectedArtist.popularity}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Genre Match</span>
                            <span className="text-neon-green">78%</span>
                          </div>
                          <div className="h-2 bg-eclipse rounded-full overflow-hidden">
                            <div className="h-full bg-neon-green rounded-full" style={{ width: "78%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Growth Potential</span>
                            <span className="text-neon-magenta">92%</span>
                          </div>
                          <div className="h-2 bg-eclipse rounded-full overflow-hidden">
                            <div className="h-full bg-neon-magenta rounded-full" style={{ width: "92%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Followers */}
                    <div className="bg-eclipse/30 border border-light/10 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className={`h-5 w-5 text-${getArtistColor(selectedArtist)}`} />
                        <h4 className="font-medium">Audience Reach</h4>
                      </div>

                      <div className="flex flex-col h-[calc(100%-32px)] justify-between">
                        <div className="text-center py-4">
                          <p className="text-3xl font-bold">
                            {selectedArtist.followers?.total?.toLocaleString() || "0"}
                          </p>
                          <p className="text-xs text-light/60">Spotify Followers</p>
                        </div>

                        <div className="mt-auto">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-eclipse/50 rounded-md p-2">
                              <p className="text-xl font-semibold">{Math.floor(selectedArtist.popularity * 450)}</p>
                              <p className="text-xs text-light/60">Monthly Streams</p>
                            </div>
                            <div className="bg-eclipse/50 rounded-md p-2">
                              <p className="text-xl font-semibold">{selectedArtist.popularity * 12}</p>
                              <p className="text-xs text-light/60">Playlists</p>
                            </div>
                            <div className="bg-eclipse/50 rounded-md p-2">
                              <p className="text-xl font-semibold">12%</p>
                              <p className="text-xs text-light/60">Growth</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-eclipse/30 border border-light/10 rounded-lg p-5 md:col-span-2">
                      <h4 className="font-medium mb-3">Agent Recommendation</h4>
                      <p className="text-light/80 mb-3 text-sm">
                        {selectedArtist.name} shows significant potential in the{" "}
                        {selectedArtist.genres?.[0] || "electronic"} genre with consistent growth in followers. Based on
                        audience demographics and streaming patterns, this artist would be a strong candidate for your
                        label's roster.
                      </p>

                      <div className="flex gap-3">
                        <button
                          className={`px-4 py-2 bg-${getArtistColor(selectedArtist)} text-eclipse rounded-md text-sm font-medium hover:opacity-90 transition-opacity`}
                        >
                          Add to Watchlist
                        </button>
                        <button className="px-4 py-2 border border-light/20 rounded-md text-sm font-medium hover:border-light/40 transition-colors">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Legal Tab */}
        {activeTab === "legal" && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Legal Agent</h3>
            <div className="space-y-4">
              <div className="bg-eclipse/30 border border-neon-magenta/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-neon-magenta mt-1" />
                  <div>
                    <h4 className="font-semibold">Contract Review: Distribution Agreement</h4>
                    <p className="text-sm text-light/80 mt-1">
                      I've analyzed the distribution agreement and found 3 clauses that may be unfavorable. The royalty
                      split is below industry standard, and the term length is unusually long.
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-neon-magenta mt-0.5" />
                        <p className="text-sm text-light/80">
                          <span className="font-medium">Clause 4.2:</span> Royalty rate of 15% is below the industry
                          standard of 20-25%
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-neon-magenta mt-0.5" />
                        <p className="text-sm text-light/80">
                          <span className="font-medium">Clause 7.1:</span> 5-year term with automatic renewal is longer
                          than typical
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs bg-neon-magenta text-eclipse px-3 py-1 rounded-md">
                        View Full Analysis
                      </button>
                      <button className="text-xs border border-light/20 px-3 py-1 rounded-md">Request Revision</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-eclipse/30 border border-neon-green/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-neon-green mt-1" />
                  <div>
                    <h4 className="font-semibold">Contract Approved: Publishing Agreement</h4>
                    <p className="text-sm text-light/80 mt-1">
                      The publishing agreement with Sonic Rights Management has been reviewed and meets all your
                      standard requirements. All terms are within industry standards and align with your preferences.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs bg-neon-green text-eclipse px-3 py-1 rounded-md">Sign Contract</button>
                      <button className="text-xs border border-light/20 px-3 py-1 rounded-md">View Details</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Catalog Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-eclipse/30 border border-light/10 rounded-lg p-4">
                <h4 className="font-medium mb-3">Catalog Health</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Metadata Completeness</span>
                      <span className="text-neon-green">92%</span>
                    </div>
                    <div className="h-2 bg-eclipse rounded-full overflow-hidden">
                      <div className="h-full bg-neon-green rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Rights Documentation</span>
                      <span className="text-neon-cyan">78%</span>
                    </div>
                    <div className="h-2 bg-eclipse rounded-full overflow-hidden">
                      <div className="h-full bg-neon-cyan rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Sync Readiness</span>
                      <span className="text-neon-magenta">65%</span>
                    </div>
                    <div className="h-2 bg-eclipse rounded-full overflow-hidden">
                      <div className="h-full bg-neon-magenta rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-eclipse/30 border border-light/10 rounded-lg p-4">
                <h4 className="font-medium mb-3">Recent Activity</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-neon-green mt-0.5" />
                    <div>
                      <p className="text-light/80">
                        <span className="font-medium">42 tracks</span> automatically tagged with enhanced metadata
                      </p>
                      <p className="text-light/50 text-xs">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-neon-cyan mt-0.5" />
                    <div>
                      <p className="text-light/80">
                        <span className="font-medium">New release</span> automatically distributed to 18 platforms
                      </p>
                      <p className="text-light/50 text-xs">Yesterday</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-neon-magenta mt-0.5" />
                    <div>
                      <p className="text-light/80">
                        <span className="font-medium">3 tracks</span> matched to sync licensing opportunities
                      </p>
                      <p className="text-light/50 text-xs">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
