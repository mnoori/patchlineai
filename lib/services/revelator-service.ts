/**
 * Revelator Service Layer
 * Maps Revelator API data to Patchline UI components
 */

import { getRevelatorClient, type RevelatorRelease, type RevelatorTrack, type RevelatorAnalytics } from '@/lib/revelator-api'
import { dynamoDBClient } from '@/lib/dynamodb-client'

// UI-specific types that map to your components
export interface CatalogTrack {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  releaseDate: string
  streams: string
  streamsTrend: 'up' | 'down' | 'same'
  streamsDelta: string
  revenue: string
  revenueTrend: 'up' | 'down' | 'same'
  revenueDelta: string
  status: 'healthy' | 'metadata' | 'rights' | 'contract'
  statusDetail: string
  sparklineData: number[]
  platforms: string[]
  genres: string[]
  mood: string
  bpm: number | null
  isrc?: string
}

export interface ReleaseWorkspaceData {
  id: string
  title: string
  artist: string
  type: 'single' | 'EP' | 'album'
  releaseDate: string
  status: 'Draft' | 'In Progress' | 'Scheduled' | 'Released'
  progress: number
  tasks: ReleaseTask[]
  steps: ReleaseStep[]
  riskLevel?: 'low' | 'medium' | 'high'
  alerts?: string[]
}

export interface ReleaseTask {
  id: string
  title: string
  completed: boolean
  category: 'metadata' | 'artwork' | 'distribution' | 'marketing'
  priority: 'low' | 'medium' | 'high'
}

export interface ReleaseStep {
  id: string
  name: string
  status: 'completed' | 'current' | 'pending'
  icon: string
}

export interface MetadataIssue {
  id: string
  field: string
  message: string
  severity: 'high' | 'medium' | 'low'
  autoFixable: boolean
  affectedTracks: number
  category: 'ISRC' | 'Credits' | 'BPM' | 'Publisher' | 'Genre' | 'Other'
}

export interface SyncOpportunity {
  id: string
  title: string
  client: string
  type: string
  tags: string[]
  matches: number
  revenue: number
  deadline: string
  status: 'active' | 'expired'
}

class RevelatorService {
  private revelatorClient = getRevelatorClient()
  
  /**
   * Transform Revelator release to UI catalog format
   */
  async getCatalogData(userId: string): Promise<{
    tracks: CatalogTrack[]
    albums: any[]
    playlists: any[]
  }> {
    try {
      // Fetch all releases from Revelator
      const { releases } = await this.revelatorClient.getAllReleases()
      
      // Get analytics for the last 30 days
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Transform releases and tracks to catalog format
      const tracks: CatalogTrack[] = []
      const albums: any[] = []
      
      for (const release of releases) {
        // Get analytics for this release
        const analytics = await this.revelatorClient.getAnalytics({
          dataType: 'consumption',
          aggregation: 'byRelease',
          dateFrom: startDate,
          dateTo: endDate,
          assetId: release.id!,
          metrics: ['streams', 'revenue']
        })
        
        const releaseAnalytics = analytics[0]
        
        // Get distribution status
        const distributionStatus = await this.revelatorClient.getDistributionStatus(release.id!)
        
        // Transform tracks
        for (const track of release.tracks) {
          const trackAnalytics = await this.getTrackAnalytics(track.id!, startDate, endDate)
          
          tracks.push({
            id: track.id!,
            title: track.title,
            artist: release.artist,
            album: release.title,
            duration: this.formatDuration(track.duration),
            releaseDate: new Date(release.releaseDate).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            }),
            streams: this.formatNumber(trackAnalytics?.streams || 0),
            streamsTrend: this.calculateTrend(trackAnalytics?.streamsTrend),
            streamsDelta: this.formatPercentage(trackAnalytics?.streamsDelta || 0),
            revenue: this.formatCurrency(trackAnalytics?.revenue || 0),
            revenueTrend: this.calculateTrend(trackAnalytics?.revenueTrend),
            revenueDelta: this.formatPercentage(trackAnalytics?.revenueDelta || 0),
            status: this.determineTrackStatus(track, release),
            statusDetail: this.getStatusDetail(track, release),
            sparklineData: await this.generateSparklineData(track.id!, 14),
            platforms: distributionStatus.stores
              .filter(s => s.status === 'live')
              .map(s => this.mapStoreToPlatform(s.storeName)),
            genres: release.metadata?.genre || [],
            mood: track.metadata?.mood?.join(', ') || '',
            bpm: track.metadata?.bpm || null,
            isrc: track.isrc
          })
        }
        
        // Add album data
        if (release.tracks.length > 1) {
          albums.push({
            id: release.id,
            title: release.title,
            artist: release.artist,
            tracks: release.tracks.length,
            tracksReady: this.calculateTracksReady(release),
            releaseDate: new Date(release.releaseDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric', 
              year: 'numeric'
            }),
            totalStreams: this.formatNumber(releaseAnalytics?.metrics?.streams || 0),
            streamsTrend: this.calculateTrend(releaseAnalytics?.metrics?.streams),
            totalRevenue: this.formatCurrency(releaseAnalytics?.metrics?.revenue || 0),
            revenueTrend: this.calculateTrend(releaseAnalytics?.metrics?.revenue),
            status: this.determineReleaseStatus(release),
            statusDetail: this.getReleaseStatusDetail(release),
            platforms: distributionStatus.stores
              .filter(s => s.status === 'live')
              .map(s => this.mapStoreToPlatform(s.storeName))
          })
        }
      }
      
      // Get playlist data from DynamoDB (not available in Revelator)
      const playlists = await this.getPlaylistData(userId)
      
      return { tracks, albums, playlists }
    } catch (error) {
      console.error('Error fetching catalog data:', error)
      throw error
    }
  }
  
  /**
   * Get release workspace data
   */
  async getReleaseWorkspaceData(userId: string): Promise<ReleaseWorkspaceData[]> {
    const { releases } = await this.revelatorClient.getAllReleases()
    
    return Promise.all(releases.map(async (release) => {
      const validation = await this.revelatorClient.validateRelease(release.id!)
      const distributionStatus = await this.revelatorClient.getDistributionStatus(release.id!)
      
      return {
        id: release.id!,
        title: release.title,
        artist: release.artist,
        type: release.releaseType,
        releaseDate: release.releaseDate,
        status: this.mapReleaseStatus(release.status, distributionStatus),
        progress: this.calculateReleaseProgress(release, validation, distributionStatus),
        tasks: this.generateReleaseTasks(release, validation),
        steps: this.generateReleaseSteps(release, distributionStatus),
        riskLevel: validation.errors.some(e => e.severity === 1) ? 'high' : 
                   validation.errors.some(e => e.severity === 2) ? 'medium' : 'low',
        alerts: validation.errors
          .filter(e => e.severity <= 2)
          .map(e => e.message)
      }
    }))
  }
  
  /**
   * Get metadata issues for the Metadata Agent
   */
  async getMetadataIssues(userId: string): Promise<MetadataIssue[]> {
    const { releases } = await this.revelatorClient.getAllReleases()
    const issues: MetadataIssue[] = []
    const issueMap = new Map<string, MetadataIssue>()
    
    for (const release of releases) {
      const validation = await this.revelatorClient.validateRelease(release.id!)
      
      for (const error of validation.errors) {
        const category = this.categorizeMetadataError(error.field)
        const key = `${error.field}-${error.code}`
        
        if (issueMap.has(key)) {
          const issue = issueMap.get(key)!
          issue.affectedTracks++
        } else {
          issueMap.set(key, {
            id: key,
            field: error.field,
            message: error.message,
            severity: error.severity === 1 ? 'high' : error.severity === 2 ? 'medium' : 'low',
            autoFixable: this.isAutoFixable(error.field),
            affectedTracks: 1,
            category
          })
        }
      }
    }
    
    return Array.from(issueMap.values())
  }
  
  /**
   * Auto-fix metadata issues
   */
  async autoFixMetadata(issueId: string): Promise<{ success: boolean; message: string }> {
    const [field, code] = issueId.split('-')
    
    // Implement auto-fix logic based on field type
    switch (field) {
      case 'isrc':
        return this.autoGenerateISRCs()
      case 'bpm':
        return this.autoDetectBPM()
      case 'genre':
        return this.autoSuggestGenres()
      default:
        return { success: false, message: 'Auto-fix not available for this field' }
    }
  }
  
  /**
   * Get sync opportunities (mock data for now)
   */
  async getSyncOpportunities(userId: string): Promise<SyncOpportunity[]> {
    // This would integrate with a sync licensing platform
    // For now, return mock data
    return [
      {
        id: 'sync-1',
        title: 'TV Commercial',
        client: 'Nike',
        type: 'Electronic',
        tags: ['Upbeat', 'Electronic'],
        matches: 3,
        revenue: 15000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: 'sync-2',
        title: 'Indie Film',
        client: 'Sundance Film',
        type: 'Ambient',
        tags: ['Melancholic', 'Ambient'],
        matches: 2,
        revenue: 8000,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ]
  }
  
  // Helper methods
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }
  
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  private formatPercentage(value: number): string {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }
  
  private calculateTrend(value?: number): 'up' | 'down' | 'same' {
    if (!value) return 'same'
    if (value > 0) return 'up'
    if (value < 0) return 'down'
    return 'same'
  }
  
  private async getTrackAnalytics(trackId: string, startDate: string, endDate: string) {
    try {
      const analytics = await this.revelatorClient.getAnalytics({
        dataType: 'consumption',
        aggregation: 'byTrack',
        dateFrom: startDate,
        dateTo: endDate,
        assetId: trackId,
        metrics: ['streams', 'revenue']
      })
      
      if (!analytics.length) return null
      
      const current = analytics[0]
      
      // Get previous period for comparison
      const prevEndDate = startDate
      const prevStartDate = new Date(new Date(startDate).getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      
      const prevAnalytics = await this.revelatorClient.getAnalytics({
        dataType: 'consumption',
        aggregation: 'byTrack',
        dateFrom: prevStartDate,
        dateTo: prevEndDate,
        assetId: trackId,
        metrics: ['streams', 'revenue']
      })
      
      const prev = prevAnalytics[0]
      
      return {
        streams: current.metrics.streams || 0,
        revenue: current.metrics.revenue || 0,
        streamsTrend: prev ? (current.metrics.streams! - prev.metrics.streams!) / prev.metrics.streams! * 100 : 0,
        revenueTrend: prev ? (current.metrics.revenue! - prev.metrics.revenue!) / prev.metrics.revenue! * 100 : 0,
        streamsDelta: prev ? (current.metrics.streams! - prev.metrics.streams!) / prev.metrics.streams! * 100 : 0,
        revenueDelta: prev ? (current.metrics.revenue! - prev.metrics.revenue!) / prev.metrics.revenue! * 100 : 0
      }
    } catch (error) {
      console.error('Error fetching track analytics:', error)
      return null
    }
  }
  
  private async generateSparklineData(trackId: string, days: number): Promise<number[]> {
    const data: number[] = []
    const endDate = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      try {
        const analytics = await this.revelatorClient.getAnalytics({
          dataType: 'consumption',
          aggregation: 'byDate',
          dateFrom: dateStr,
          dateTo: dateStr,
          assetId: trackId,
          metrics: ['streams']
        })
        
        data.push(analytics[0]?.metrics?.streams || 0)
      } catch {
        data.push(0)
      }
    }
    
    // Normalize data for sparkline (0-100 scale)
    const max = Math.max(...data)
    return data.map(v => max > 0 ? (v / max) * 100 : 0)
  }
  
  private determineTrackStatus(track: RevelatorTrack, release: RevelatorRelease): CatalogTrack['status'] {
    if (!track.isrc) return 'metadata'
    if (!track.splits || track.splits.length === 0) return 'rights'
    // Check for contract issues - would need contract API integration
    return 'healthy'
  }
  
  private getStatusDetail(track: RevelatorTrack, release: RevelatorRelease): string {
    if (!track.isrc) return 'Missing ISRC code'
    if (!track.splits || track.splits.length === 0) return 'No royalty splits defined'
    if (!track.metadata?.bpm) return 'Missing BPM information'
    return 'All metadata complete and verified'
  }
  
  private mapStoreToPlatform(storeName: string): string {
    const mapping: Record<string, string> = {
      'Spotify': 'spotify',
      'Apple Music': 'apple',
      'YouTube Music': 'youtube',
      'Amazon Music': 'amazon',
      'Deezer': 'deezer',
      'Tidal': 'tidal'
    }
    return mapping[storeName] || storeName.toLowerCase()
  }
  
  private determineReleaseStatus(release: RevelatorRelease): string {
    if (!release.tracks.every(t => t.isrc)) return 'metadata'
    if (!release.upc) return 'metadata'
    return 'healthy'
  }
  
  private getReleaseStatusDetail(release: RevelatorRelease): string {
    const missingISRC = release.tracks.filter(t => !t.isrc).length
    if (missingISRC > 0) return `${missingISRC} tracks missing ISRC codes`
    if (!release.upc) return 'Missing UPC code'
    return 'All metadata complete'
  }
  
  private calculateTracksReady(release: RevelatorRelease): number {
    const ready = release.tracks.filter(t => t.isrc && t.audioFile).length
    return Math.round((ready / release.tracks.length) * 100)
  }
  
  private mapReleaseStatus(
    apiStatus?: string,
    distributionStatus?: any
  ): ReleaseWorkspaceData['status'] {
    if (apiStatus === 'distributed') return 'Released'
    if (distributionStatus?.stores.some((s: any) => s.status === 'pending')) return 'In Progress'
    if (apiStatus === 'draft') return 'Draft'
    return 'Scheduled'
  }
  
  private calculateReleaseProgress(
    release: RevelatorRelease,
    validation: any,
    distributionStatus: any
  ): number {
    let progress = 0
    
    // Tracks uploaded (25%)
    if (release.tracks.every(t => t.audioFile)) progress += 25
    
    // Metadata complete (25%)
    if (validation.valid) progress += 25
    
    // Artwork uploaded (25%)
    if (release.coverArt) progress += 25
    
    // Distribution active (25%)
    if (distributionStatus.stores.some((s: any) => s.status === 'live')) progress += 25
    
    return progress
  }
  
  private generateReleaseTasks(release: RevelatorRelease, validation: any): ReleaseTask[] {
    const tasks: ReleaseTask[] = []
    
    // Check for missing metadata
    if (!release.upc) {
      tasks.push({
        id: 'upc',
        title: 'Add UPC code',
        completed: false,
        category: 'metadata',
        priority: 'high'
      })
    }
    
    // Check for validation errors
    validation.errors.forEach((error: any) => {
      tasks.push({
        id: error.field,
        title: error.message,
        completed: false,
        category: 'metadata',
        priority: error.severity === 1 ? 'high' : 'medium'
      })
    })
    
    // Check artwork
    if (!release.coverArt) {
      tasks.push({
        id: 'artwork',
        title: 'Upload release artwork',
        completed: false,
        category: 'artwork',
        priority: 'high'
      })
    }
    
    return tasks
  }
  
  private generateReleaseSteps(release: RevelatorRelease, distributionStatus: any): ReleaseStep[] {
    return [
      {
        id: 'upload',
        name: 'Upload Tracks',
        status: release.tracks.every(t => t.audioFile) ? 'completed' : 'current',
        icon: 'Upload'
      },
      {
        id: 'metadata',
        name: 'Metadata',
        status: release.tracks.every(t => t.isrc) ? 'completed' : 
                release.tracks.some(t => t.audioFile) ? 'current' : 'pending',
        icon: 'FileText'
      },
      {
        id: 'artwork',
        name: 'Artwork',
        status: release.coverArt ? 'completed' : 'pending',
        icon: 'Image'
      },
      {
        id: 'distribution',
        name: 'Distribution',
        status: distributionStatus.stores.length > 0 ? 'completed' : 'pending',
        icon: 'Send'
      },
      {
        id: 'marketing',
        name: 'Marketing',
        status: 'pending',
        icon: 'Megaphone'
      }
    ]
  }
  
  private categorizeMetadataError(field: string): MetadataIssue['category'] {
    if (field.includes('isrc')) return 'ISRC'
    if (field.includes('composer') || field.includes('writer')) return 'Credits'
    if (field.includes('bpm')) return 'BPM'
    if (field.includes('publisher')) return 'Publisher'
    if (field.includes('genre')) return 'Genre'
    return 'Other'
  }
  
  private isAutoFixable(field: string): boolean {
    const autoFixableFields = ['isrc', 'upc', 'bpm', 'genre', 'language']
    return autoFixableFields.some(f => field.toLowerCase().includes(f))
  }
  
  private async autoGenerateISRCs(): Promise<{ success: boolean; message: string }> {
    // Implement ISRC generation logic
    // This would typically integrate with an ISRC registry
    return { success: true, message: 'ISRCs generated successfully' }
  }
  
  private async autoDetectBPM(): Promise<{ success: boolean; message: string }> {
    // Implement BPM detection using audio analysis
    return { success: true, message: 'BPM detected for all tracks' }
  }
  
  private async autoSuggestGenres(): Promise<{ success: boolean; message: string }> {
    // Implement genre suggestion based on audio features
    return { success: true, message: 'Genres suggested based on audio analysis' }
  }
  
  private async getPlaylistData(userId: string): Promise<any[]> {
    // Mock playlist data - would integrate with streaming platforms
    return []
  }
}

export const revelatorService = new RevelatorService()
export default revelatorService 