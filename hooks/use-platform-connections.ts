import { useState, useEffect } from 'react'
import { platformsAPI } from '@/lib/api-client'
import { useCurrentUser } from '@/hooks/use-current-user'

export interface PlatformConnection {
  connected: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  userId?: string
  displayName?: string
  connectedAt?: string
}

export interface PlatformConnections {
  spotify?: PlatformConnection
  google?: PlatformConnection
  gmail?: PlatformConnection
  soundcloud?: PlatformConnection
  instagram?: PlatformConnection
  applemusic?: PlatformConnection
  youtube?: PlatformConnection
  twitter?: PlatformConnection
  facebook?: PlatformConnection
  distrokid?: PlatformConnection
}

export function usePlatformConnections() {
  const { userId } = useCurrentUser()
  const [platforms, setPlatforms] = useState<PlatformConnections>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset all platforms to disconnected state initially
  const resetPlatforms = () => {
    setPlatforms({
      spotify: { connected: false },
      google: { connected: false },
      gmail: { connected: false },
      soundcloud: { connected: false },
      instagram: { connected: false },
      applemusic: { connected: false },
      youtube: { connected: false },
      twitter: { connected: false },
      facebook: { connected: false },
      distrokid: { connected: false },
    })
  }

  const fetchPlatforms = async () => {
    if (!userId) {
      resetPlatforms()
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await platformsAPI.get(userId) as { platforms?: Record<string, PlatformConnection | boolean> }
      
      // Always start with disconnected state, then update with actual connections
      const basePlatforms: PlatformConnections = {
        spotify: { connected: false },
        google: { connected: false },
        gmail: { connected: false },
        soundcloud: { connected: false },
        instagram: { connected: false },
        applemusic: { connected: false },
        youtube: { connected: false },
        twitter: { connected: false },
        facebook: { connected: false },
        distrokid: { connected: false },
      }

      // Only mark as connected if we have valid connection data
      if (response?.platforms) {
        Object.keys(response.platforms).forEach((platform) => {
          // Map deprecated or alias platform keys to canonical ones
          const canonicalPlatform = platform === 'spotify-artist-profile' ? 'spotify' : platform

          const connectionData = response.platforms?.[platform]
          // Handle both new format (object with connected property) and legacy format (boolean)
          if (connectionData === true || (connectionData && connectionData.connected)) {
            basePlatforms[canonicalPlatform as keyof PlatformConnections] = {
              connected: true,
              ...(typeof connectionData === 'object' ? connectionData : {})
            }
          }
        })
      }

      setPlatforms(basePlatforms)
    } catch (err) {
      console.error('Failed to fetch platforms:', err)
      setError('Failed to load platform connections')
      // On error, reset to disconnected state
      resetPlatforms()
    } finally {
      setLoading(false)
    }
  }

  const connectPlatform = (platform: string) => {
    if (!userId) {
      console.error('No user ID available for OAuth connection')
      return
    }
    
    // Store user ID in session storage temporarily
    sessionStorage.setItem('oauth_user_id', userId)
    
    // Handle Gmail specifically - use our custom Gmail OAuth flow
    if (platform === 'gmail') {
      window.location.href = `/api/auth/gmail/connect?userId=${encodeURIComponent(userId)}`
      return
    }
    
    // For other platforms, use the generic OAuth flow
    window.location.href = `/api/auth/${platform}?uid=${encodeURIComponent(userId)}`
  }

  const disconnectPlatform = async (platform: string) => {
    if (!userId) return

    try {
      await platformsAPI.update({ userId, platform, connected: false })
      setPlatforms(prev => ({
        ...prev,
        [platform]: { connected: false }
      }))
      return { success: true }
    } catch (err) {
      console.error(`Failed to disconnect ${platform}:`, err)
      return { success: false, error: `Failed to disconnect ${platform}` }
    }
  }

  const getConnectedCount = () => {
    return Object.values(platforms).filter(p => p?.connected).length
  }

  const getConnectedPlatforms = () => {
    return Object.entries(platforms)
      .filter(([_, connection]) => connection?.connected)
      .map(([platform, _]) => platform)
  }

  const isPlatformConnected = (platform: string) => {
    return platforms[platform as keyof PlatformConnections]?.connected || false
  }

  useEffect(() => {
    fetchPlatforms()
  }, [userId])

  return {
    platforms,
    loading,
    error,
    connectPlatform,
    disconnectPlatform,
    refreshPlatforms: fetchPlatforms,
    getConnectedCount,
    getConnectedPlatforms,
    isPlatformConnected,
  }
} 