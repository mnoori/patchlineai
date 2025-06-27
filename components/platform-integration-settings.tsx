"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, ExternalLink } from 'lucide-react'
import { usePlatformConnections } from '@/hooks/use-platform-connections'
import { getPlatformConfig, getPlatformsByCategory, PLATFORM_CONFIGS, type PlatformConfig } from '@/lib/platform-config'
import { getGoogleAuthUrl, isGoogleDriveConnected, clearGoogleAuth } from '@/lib/google-auth'
import { cn } from '@/lib/utils'

interface PlatformIntegrationSettingsProps {
  className?: string
  showCategories?: boolean
}

export function PlatformIntegrationSettings({ 
  className,
  showCategories = true 
}: PlatformIntegrationSettingsProps) {
  const { platforms, loading, connectPlatform, disconnectPlatform, reconnectPlatform, refreshPlatforms } = usePlatformConnections()
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [platformErrors, setPlatformErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Check Google Drive connection status
    setGoogleDriveConnected(isGoogleDriveConnected())
    
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_connected') === 'true') {
      // Store auth from cookie
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(c => c.trim().startsWith('google_auth='))
      if (authCookie) {
        const authData = JSON.parse(decodeURIComponent(authCookie.split('=')[1]))
        storeGoogleAuth(authData)
        setGoogleDriveConnected(true)
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    
    try {
      if (platformId === 'googledrive') {
        // Special handling for Google Drive
        const authUrl = getGoogleAuthUrl()
        window.location.href = authUrl
      } else {
        // Use existing platform connection flow
        connectPlatform(platformId)
      }
    } catch (error) {
      console.error(`Failed to connect ${platformId}:`, error)
      setConnectingPlatform(null)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    setConnectingPlatform(platformId)
    
    try {
      if (platformId === 'googledrive') {
        clearGoogleAuth()
        setGoogleDriveConnected(false)
      }
      
      const result = await disconnectPlatform(platformId)
      if (result.success) {
        await refreshPlatforms()
      }
    } catch (error) {
      console.error(`Failed to disconnect ${platformId}:`, error)
    } finally {
      setConnectingPlatform(null)
    }
  }

  const isPlatformConnected = (platformId: string): boolean => {
    if (platformId === 'googledrive') {
      return googleDriveConnected
    }
    return platforms[platformId as keyof typeof platforms]?.connected || false
  }

  const renderPlatformCard = (platform: PlatformConfig) => {
    const isConnected = isPlatformConnected(platform.id)
    const isConnecting = connectingPlatform === platform.id

    return (
      <Card key={platform.id} className={cn(
        "relative overflow-hidden transition-all",
        isConnected && "border-green-500/50 bg-green-500/5"
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${platform.color}20` }}
                dangerouslySetInnerHTML={{ __html: platform.icon }}
              />
              <div>
                <CardTitle className="text-base">{platform.displayName}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {platform.description}
                </CardDescription>
              </div>
            </div>
            {isConnected && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {platform.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>

            {/* Action Button */}
            {platform.comingSoon ? (
              <Button variant="outline" disabled className="w-full">
                Coming Soon
              </Button>
            ) : isConnected ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDisconnect(platform.id)}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Disconnect
                    </>
                  )}
                </Button>
                {/* Show reconnect for Gmail if there might be token issues */}
                {platform.id === 'gmail' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reconnect by forcing new authentication
                      handleConnect(platform.id)
                    }}
                    disabled={isConnecting}
                    className="px-3"
                    title="Re-authenticate Gmail"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => handleConnect(platform.id)}
                disabled={isConnecting}
                className="w-full"
                style={{ 
                  backgroundColor: platform.color,
                  color: platform.color === '#FFFFFF' || platform.color === '#FBBC05' ? '#000' : '#FFF'
                }}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect {platform.name}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categories = ['storage', 'music', 'social', 'distribution'] as const

  return (
    <div className={cn("space-y-6", className)}>
      {showCategories ? (
        categories.map(category => {
          const categoryPlatforms = getPlatformsByCategory(category)
          if (categoryPlatforms.length === 0) return null

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize">
                {category === 'storage' ? 'Cloud Storage' : category} Platforms
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryPlatforms.map(renderPlatformCard)}
              </div>
            </div>
          )
        })
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(PLATFORM_CONFIGS).map(renderPlatformCard)}
        </div>
      )}
    </div>
  )
}

// Helper function to store Google auth from callback
function storeGoogleAuth(authData: any) {
  if (typeof window === 'undefined') return
  
  const expiresAt = Date.now() + (authData.expires_in * 1000)
  localStorage.setItem('google_drive_auth', JSON.stringify({
    ...authData,
    expires_at: expiresAt
  }))
} 