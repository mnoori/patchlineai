// Soundcharts API Service
// Provides real-time music industry data for Scout agent

import { LRUCache } from 'lru-cache'

// API Configuration
const SOUNDCHARTS_APP_ID = process.env.SOUNDCHARTS_APP_ID || 'PATCHLINE_A2F4F819'
const SOUNDCHARTS_API_KEY = process.env.SOUNDCHARTS_API_KEY || 'd8e39c775adc8797'
const SOUNDCHARTS_API_URL = process.env.SOUNDCHARTS_API_URL || 'https://customer.api.soundcharts.com'

// Types
export interface SoundchartsArtist {
  uuid: string
  name: string
  type: 'person' | 'group' | 'other'
  gender?: string
  countryCode?: string
  genres?: Array<{
    root: string
    sub: string[]
  }>
  subGenres?: string[]
  careerStage?: 'emerging' | 'mid_level' | 'mainstream' | 'superstar'
  birthDate?: string
  imageUrl?: string
  isrcCount?: number
  latestReleaseDate?: string
  slug?: string
  appUrl?: string
  biography?: string
  isni?: string
  ipi?: string
}

export interface ArtistStats {
  platform: string
  metricType: string
  value: number
  change?: {
    value: number
    percent: number
    period: string
  }
  updatedAt: string
}

export interface ArtistCurrentStats {
  score?: {
    soundcharts: number
    growth?: number
  }
  audience: ArtistStats[]
  streaming: ArtistStats[]
  popularity: ArtistStats[]
  retention?: ArtistStats[]
}

export interface PlaylistEntry {
  uuid: string
  name: string
  platform: string
  followers: number
  position?: number
  addedAt?: string
  curatorName?: string
}

export interface ArtistSearchParams {
  countryCode?: string
  cityKey?: string
  offset?: number
  limit?: number
  sort?: {
    platform: string
    metricType: string
    period?: 'week' | 'month' | 'quarter'
    sortBy?: 'total' | 'volume' | 'percent'
    order?: 'desc' | 'asc'
  }
  filters?: Array<{
    type: string
    data: any
  }>
}

// Cache configuration
const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
})

class SoundchartsService {
  private headers = {
    'x-app-id': SOUNDCHARTS_APP_ID,
    'x-api-key': SOUNDCHARTS_API_KEY,
    'Content-Type': 'application/json',
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(options.body || {})}`
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached as T
    }

    try {
      const response = await fetch(`${SOUNDCHARTS_API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`Soundcharts API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Cache successful responses
      cache.set(cacheKey, data)
      
      return data as T
    } catch (error) {
      console.error('Soundcharts API request failed:', error)
      throw error
    }
  }

  // Search for artists by name
  async searchArtists(query: string, limit = 10): Promise<{ items: SoundchartsArtist[] }> {
    return this.request(`/api/v2/search/artist`, {
      method: 'GET',
      // Add query parameters
      headers: {
        ...this.headers,
      },
    })
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
  async getArtistStats(uuid: string, period?: string): Promise<ArtistCurrentStats> {
    const queryParams = period ? `?period=${period}` : ''
    return this.request(`/api/v2/artist/${uuid}/current/stats${queryParams}`)
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

  // Get artist by platform ID (e.g., Spotify ID)
  async getArtistByPlatformId(
    platform: string,
    identifier: string
  ): Promise<{ object: SoundchartsArtist }> {
    return this.request(`/api/v2.9/artist/by-platform/${platform}/${identifier}`)
  }

  // Helper method to convert Soundcharts data to Scout agent format
  formatArtistForScout(artist: SoundchartsArtist, stats?: ArtistCurrentStats): any {
    // Extract key metrics
    const spotifyFollowers = stats?.audience.find(
      s => s.platform === 'spotify' && s.metricType === 'followers'
    )
    const spotifyListeners = stats?.streaming.find(
      s => s.platform === 'spotify' && s.metricType === 'monthly_listeners'
    )

    return {
      id: artist.uuid,
      name: artist.name,
      genre: (artist.genres && artist.genres.length > 0) ? artist.genres[0].root : 'Unknown',
      genres: artist.genres?.map(g => g.root) || [],
      image: artist.imageUrl || '/placeholder.svg',
      growthScore: stats?.score?.growth || 0,
      matchScore: stats?.score?.soundcharts || 0,
      streams: spotifyListeners?.value ? 
        this.formatNumber(spotifyListeners.value) : 'N/A',
      growth: spotifyFollowers?.change?.percent ? 
        `${spotifyFollowers.change.percent > 0 ? '+' : ''}${spotifyFollowers.change.percent.toFixed(1)}%` : 'N/A',
      monthlyListeners: spotifyListeners?.value ? 
        this.formatNumber(spotifyListeners.value) : 'N/A',
      careerStage: artist.careerStage,
      country: artist.countryCode,
    }
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

  // Clear cache (useful for testing or force refresh)
  clearCache() {
    cache.clear()
  }
}

// Export singleton instance
export const soundchartsService = new SoundchartsService() 