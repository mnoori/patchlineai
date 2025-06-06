// Client-side Soundcharts API service
// Uses the Next.js API route to avoid CORS issues and protect API keys

import type { 
  SoundchartsArtist, 
  ArtistStats, 
  ArtistCurrentStats,
  PlaylistEntry,
  ArtistSearchParams 
} from './soundcharts'

class SoundchartsClient {
  private apiUrl = '/api/soundcharts'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = new URL(this.apiUrl, window.location.origin)
      url.searchParams.append('endpoint', endpoint)

      // If it's a GET request with query parameters in the endpoint
      if (options.method === 'GET' || !options.method) {
        const [basePath, queryString] = endpoint.split('?')
        if (queryString) {
          url.searchParams.set('endpoint', basePath)
          const params = new URLSearchParams(queryString)
          params.forEach((value, key) => {
            url.searchParams.append(key, value)
          })
        }
      }

      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Log remaining quota for monitoring
      const quotaRemaining = response.headers.get('X-Quota-Remaining')
      if (quotaRemaining && quotaRemaining !== 'unknown') {
        console.log(`Soundcharts API quota remaining: ${quotaRemaining}`)
      }
      
      return data as T
    } catch (error) {
      console.error('Soundcharts client error:', error)
      throw error
    }
  }

  // Search for artists by name
  async searchArtists(query: string, limit = 10): Promise<{ items: SoundchartsArtist[] }> {
    // The search endpoint uses query parameters
    return this.request(`/api/v2/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`)
  }

  // Get trending artists with filters
  async getTrendingArtists(params: ArtistSearchParams): Promise<{
    items: Array<{
      artist: SoundchartsArtist
      stats: ArtistStats[]
    }>
    page: {
      offset: number
      total: number
      limit: number
    }
  }> {
    const queryParams = new URLSearchParams()
    if (params.countryCode) queryParams.append('countryCode', params.countryCode)
    if (params.cityKey) queryParams.append('cityKey', params.cityKey)
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    return this.request(`/api/v2/top/artists?${queryParams.toString()}`, {
      method: 'POST',
      body: JSON.stringify({
        sort: params.sort || {
          platform: 'spotify',
          metricType: 'followers',
          period: 'month',
          sortBy: 'volume',
          order: 'desc'
        },
        filters: params.filters || []
      }),
    })
  }

  // Get artist metadata
  async getArtist(uuid: string): Promise<{ object: SoundchartsArtist }> {
    return this.request(`/api/v2.9/artist/${uuid}`)
  }

  // Get artist current stats
  async getArtistStats(uuid: string, period = 'month'): Promise<ArtistCurrentStats> {
    return this.request(`/api/v2/artist/${uuid}/current/stats?period=${period}`)
  }

  // Get artist's Soundcharts score
  async getArtistScore(uuid: string): Promise<{
    score: {
      value: number
      rank?: number
      percentile?: number
    }
  }> {
    return this.request(`/api/v2/artist/${uuid}/soundcharts/score`)
  }

  // Get artist audience by platform
  async getArtistAudience(
    uuid: string,
    platform: string
  ): Promise<{
    items: Array<{
      date: string
      value: number
      change?: {
        value: number
        percent: number
      }
    }>
  }> {
    return this.request(`/api/v2/artist/${uuid}/audience/${platform}`)
  }

  // Get artist's current playlist entries
  async getArtistPlaylists(
    uuid: string,
    platform: string
  ): Promise<{
    items: PlaylistEntry[]
    related: SoundchartsArtist
  }> {
    return this.request(`/api/v2.20/artist/${uuid}/playlist/current/${platform}`)
  }

  // Get similar artists
  async getSimilarArtists(uuid: string): Promise<{
    items: Array<{
      artist: SoundchartsArtist
      similarity: number
    }>
  }> {
    return this.request(`/api/v2/artist/${uuid}/related`)
  }

  // Batch fetch artist details (optimized for Scout agent)
  async getArtistWithStats(uuid: string): Promise<{
    artist: SoundchartsArtist
    stats: ArtistCurrentStats
    playlists?: PlaylistEntry[]
  }> {
    try {
      // Fetch artist metadata and stats in parallel
      const [artistResponse, statsResponse] = await Promise.all([
        this.getArtist(uuid),
        this.getArtistStats(uuid)
      ])

      // Optionally fetch playlists
      let playlists: PlaylistEntry[] | undefined
      try {
        const playlistResponse = await this.getArtistPlaylists(uuid, 'spotify')
        playlists = playlistResponse.items
      } catch (error) {
        console.warn('Failed to fetch playlists:', error)
      }

      return {
        artist: artistResponse.object,
        stats: statsResponse,
        playlists
      }
    } catch (error) {
      console.error('Failed to fetch artist details:', error)
      throw error
    }
  }

  // Helper method to format artist for Scout UI
  formatArtistForScout(artist: SoundchartsArtist, stats?: ArtistCurrentStats, playlists?: PlaylistEntry[]): any {
    // Extract key metrics
    const spotifyFollowers = stats?.audience.find(
      s => s.platform === 'spotify' && s.metricType === 'followers'
    )
    const spotifyListeners = stats?.streaming.find(
      s => s.platform === 'spotify' && s.metricType === 'monthly_listeners'
    )
    const instagramFollowers = stats?.audience.find(
      s => s.platform === 'instagram' && s.metricType === 'followers'
    )
    const tiktokFollowers = stats?.audience.find(
      s => s.platform === 'tiktok' && s.metricType === 'followers'
    )

    // Determine platforms where artist is active
    const platforms = []
    if (spotifyFollowers?.value) platforms.push('spotify')
    if (instagramFollowers?.value) platforms.push('instagram')
    if (tiktokFollowers?.value) platforms.push('tiktok')
    
    // Extract playlist matches
    const playlistMatches = playlists?.map(p => p.name) || []

    return {
      id: artist.uuid,
      name: artist.name,
      genre: artist.genres[0] || 'Unknown',
      genres: artist.genres,
      image: artist.image?.medium || artist.image?.small || '/placeholder.svg',
      growthScore: stats?.score?.growth || 0,
      matchScore: stats?.score?.soundcharts || 0,
      streams: spotifyListeners?.value ? 
        this.formatNumber(spotifyListeners.value) : 'N/A',
      growth: spotifyFollowers?.change?.percent ? 
        `${spotifyFollowers.change.percent > 0 ? '+' : ''}${spotifyFollowers.change.percent.toFixed(1)}%` : 'N/A',
      monthlyListeners: spotifyListeners?.value ? 
        this.formatNumber(spotifyListeners.value) : 'N/A',
      careerStage: artist.careerStage,
      country: artist.country,
      platforms,
      playlistMatches,
      aiSummary: this.generateAISummary(artist, stats, playlists),
      isWatchlisted: false, // This will be managed by the UI
      engagement: this.calculateEngagement(stats),
      topMarkets: [], // Would need additional API call
      similarArtists: [], // Would need additional API call
      potentialRevenue: this.estimateRevenue(stats),
      fanDemographics: {
        age: "18-24 (45%), 25-34 (35%)", // Placeholder - would need additional data
        gender: "Mixed audience", // Placeholder
        locations: artist.country || "Global"
      }
    }
  }

  // Generate AI-style summary based on data
  private generateAISummary(
    artist: SoundchartsArtist, 
    stats?: ArtistCurrentStats,
    playlists?: PlaylistEntry[]
  ): string {
    const summaries = []
    
    // Growth summary
    const spotifyGrowth = stats?.audience.find(
      s => s.platform === 'spotify' && s.metricType === 'followers'
    )?.change?.percent
    
    if (spotifyGrowth && spotifyGrowth > 50) {
      summaries.push(`Experiencing rapid growth with ${spotifyGrowth.toFixed(0)}% increase`)
    }
    
    // Playlist summary
    if (playlists && playlists.length > 0) {
      const totalFollowers = playlists.reduce((sum, p) => sum + (p.followers || 0), 0)
      summaries.push(`Featured in ${playlists.length} playlists reaching ${this.formatNumber(totalFollowers)} listeners`)
    }
    
    // Career stage
    if (artist.careerStage === 'emerging') {
      summaries.push('Emerging artist with high growth potential')
    }
    
    return summaries.join('. ') || 'Promising artist worth watching'
  }

  // Calculate engagement level
  private calculateEngagement(stats?: ArtistCurrentStats): string {
    if (!stats) return 'Medium'
    
    const growthScore = stats.score?.growth || 0
    if (growthScore > 80) return 'High'
    if (growthScore > 50) return 'Medium-High'
    if (growthScore > 30) return 'Medium'
    return 'Low'
  }

  // Estimate revenue potential
  private estimateRevenue(stats?: ArtistCurrentStats): string {
    const listeners = stats?.streaming.find(
      s => s.platform === 'spotify' && s.metricType === 'monthly_listeners'
    )?.value || 0
    
    // Rough estimation based on industry averages
    const minRevenue = Math.round(listeners * 0.003)
    const maxRevenue = Math.round(listeners * 0.008)
    
    if (minRevenue < 1000) {
      return `$${minRevenue} - $${maxRevenue}`
    }
    
    return `$${this.formatNumber(minRevenue)} - $${this.formatNumber(maxRevenue)}`
  }

  // Format large numbers
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }
}

// Export singleton instance
export const soundchartsClient = new SoundchartsClient() 