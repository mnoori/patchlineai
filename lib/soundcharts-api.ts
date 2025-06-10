/**
 * Soundcharts API Client - Proper Implementation
 * Based on comprehensive API documentation analysis
 */

export interface SoundchartsArtist {
  uuid: string
  name: string
  image?: string
  country?: string
  genres?: string[]
  careerStage?: 'superstar' | 'mainstream' | 'mid_level' | 'long_tail'
  platforms?: {
    spotify?: {
      monthlyListeners?: number
      followers?: number
      popularity?: number
    }
    instagram?: {
      followers?: number
    }
    youtube?: {
      subscribers?: number
      views?: number
    }
  }
  soundchartsScore?: number
  growth?: {
    spotify?: {
      monthlyListeners?: {
        value: number
        change: number
        changePercent: number
      }
    }
  }
}

export interface TopArtistsRequest {
  sort: {
    platform: 'spotify' | 'instagram' | 'youtube' | 'soundcharts'
    metricType: 'monthly_listeners' | 'followers' | 'subscribers' | 'score'
    sortBy: 'total' | 'volume' | 'percent'
    order: 'desc' | 'asc'
    period?: 'week' | 'month' | 'quarter' | 'year'
  }
  filters?: Array<{
    type: 'genre' | 'careerStage' | 'country' | 'metric'
    data: {
      values?: string[]
      operator?: 'in' | 'not_in'
      min?: string
      max?: string
      platform?: string
      metricType?: string
    }
  }>
}

export interface GenreInfo {
  id: string
  name: string
  parentGenre?: string
}

class SoundchartsAPI {
  private baseUrl = 'https://api.soundcharts.com'
  private apiKey: string
  private appId: string

  constructor(apiKey: string, appId: string) {
    this.apiKey = apiKey
    this.appId = appId
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-app-id': this.appId,
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Soundcharts API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get available genres for filtering
   */
  async getArtistGenres(): Promise<GenreInfo[]> {
    try {
      const response = await this.makeRequest('/api/v2/referential/artist/genres')
      return response.items || []
    } catch (error) {
      console.error('Error fetching genres:', error)
      return []
    }
  }

  /**
   * Get top artists using proper filtering (RECOMMENDED APPROACH)
   */
  async getTopArtists(request: TopArtistsRequest, limit = 20, offset = 0): Promise<SoundchartsArtist[]> {
    try {
      const response = await this.makeRequest('/api/v2/top/artists', {
        method: 'POST',
        body: JSON.stringify(request),
      })

      return response.items?.map(this.transformArtist) || []
    } catch (error) {
      console.error('Error fetching top artists:', error)
      return []
    }
  }

  /**
   * Get artists by genre and career stage (Scout Agent specific)
   */
  async getArtistsByPreferences(preferences: {
    genres: string[]
    markets?: string[]
    careerStages?: string[]
    sortBy?: 'monthly_listeners' | 'followers' | 'score'
    limit?: number
  }): Promise<SoundchartsArtist[]> {
    const { genres, markets, careerStages, sortBy = 'monthly_listeners', limit = 15 } = preferences

    // Build filters
    const filters: TopArtistsRequest['filters'] = []

    if (genres.length > 0) {
      filters.push({
        type: 'genre',
        data: {
          values: genres,
          operator: 'in'
        }
      })
    }

    if (careerStages && careerStages.length > 0) {
      filters.push({
        type: 'careerStage',
        data: {
          values: careerStages,
          operator: 'in'
        }
      })
    }

    if (markets && markets.length > 0) {
      filters.push({
        type: 'country',
        data: {
          values: markets,
          operator: 'in'
        }
      })
    }

    // Add metric filter to focus on emerging/growing artists
    if (sortBy === 'monthly_listeners') {
      filters.push({
        type: 'metric',
        data: {
          platform: 'spotify',
          metricType: 'monthly_listeners',
          min: '10000',    // At least 10K monthly listeners
          max: '5000000'   // But not mega-stars (under 5M)
        }
      })
    }

    const request: TopArtistsRequest = {
      sort: {
        platform: sortBy === 'score' ? 'soundcharts' : 'spotify',
        metricType: sortBy === 'score' ? 'score' : sortBy,
        sortBy: 'total',
        order: 'desc'
      },
      filters
    }

    return this.getTopArtists(request, limit)
  }

  /**
   * Search artists by name (fallback method)
   */
  async searchArtists(query: string, limit = 10): Promise<SoundchartsArtist[]> {
    try {
      const response = await this.makeRequest(`/api/v2/artist/search/${encodeURIComponent(query)}?limit=${limit}`)
      return response.items?.map(this.transformArtist) || []
    } catch (error) {
      console.error('Error searching artists:', error)
      return []
    }
  }

  /**
   * Get detailed artist information
   */
  async getArtistDetails(uuid: string): Promise<SoundchartsArtist | null> {
    try {
      const response = await this.makeRequest(`/api/v2.9/artist/${uuid}`)
      return this.transformArtist(response)
    } catch (error) {
      console.error('Error fetching artist details:', error)
      return null
    }
  }

  /**
   * Get artist current stats
   */
  async getArtistStats(uuid: string): Promise<any> {
    try {
      return await this.makeRequest(`/api/v2/artist/${uuid}/current/stats`)
    } catch (error) {
      console.error('Error fetching artist stats:', error)
      return null
    }
  }

  /**
   * Transform raw API response to our format
   */
  private transformArtist(rawArtist: any): SoundchartsArtist {
    return {
      uuid: rawArtist.uuid || rawArtist.id,
      name: rawArtist.name,
      image: rawArtist.picture?.medium || rawArtist.image,
      country: rawArtist.country,
      genres: rawArtist.genres || [],
      careerStage: rawArtist.careerStage,
      platforms: {
        spotify: {
          monthlyListeners: rawArtist.spotify?.monthlyListeners,
          followers: rawArtist.spotify?.followers,
          popularity: rawArtist.spotify?.popularity
        },
        instagram: {
          followers: rawArtist.instagram?.followers
        },
        youtube: {
          subscribers: rawArtist.youtube?.subscribers,
          views: rawArtist.youtube?.views
        }
      },
      soundchartsScore: rawArtist.soundchartsScore,
      growth: rawArtist.growth
    }
  }

  /**
   * Get available platforms
   */
  async getPlatforms(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/api/v2/referential/platforms')
      return response.items || []
    } catch (error) {
      console.error('Error fetching platforms:', error)
      return []
    }
  }
}

// Export singleton instance
export const soundchartsAPI = new SoundchartsAPI(
  process.env.SOUNDCHARTS_API_KEY || '',
  process.env.SOUNDCHARTS_APP_ID || ''
)

export default soundchartsAPI 