"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Music2, Save, Check } from "lucide-react"
import { spotifyArtistAPI } from "@/lib/api-client"
import { useCurrentUser } from "@/hooks/use-current-user"

interface ArtistProfile {
  artistId: string
  artistName: string
  spotifyUrl: string
  storedAt: number
}

export function SpotifyArtistProfile() {
  const { userId } = useCurrentUser()
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    artistName: "",
    artistId: "",
    spotifyUrl: ""
  })

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await spotifyArtistAPI.getProfile(userId) as { artistProfile: ArtistProfile | null }
      if (response.artistProfile) {
        setProfile(response.artistProfile)
        setFormData({
          artistName: response.artistProfile.artistName,
          artistId: response.artistProfile.artistId,
          spotifyUrl: response.artistProfile.spotifyUrl
        })
      }
    } catch (error) {
      console.error("Failed to load artist profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!userId) return
    
    setSaving(true)
    try {
      await spotifyArtistAPI.storeProfile({
        userId,
        artistId: formData.artistId,
        artistName: formData.artistName,
        spotifyUrl: formData.spotifyUrl
      })
      
      // Reload profile
      await loadProfile()
      setEditMode(false)
    } catch (error) {
      console.error("Failed to save artist profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const setupAlgoryx = async () => {
    if (!userId) return
    
    setSaving(true)
    try {
      await spotifyArtistAPI.storeProfile({
        userId,
        artistId: "7ibWrazAoXwtMpiwDlpZ9k",
        artistName: "ALGORYX",
        spotifyUrl: "https://open.spotify.com/artist/7ibWrazAoXwtMpiwDlpZ9k"
      })
      
      // Reload profile
      await loadProfile()
    } catch (error) {
      console.error("Failed to setup ALGORYX profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-brand-cyan" />
            Spotify Artist Profile
          </CardTitle>
          <CardDescription>Loading artist profile...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="h-5 w-5 text-brand-cyan" />
          Spotify Artist Profile
        </CardTitle>
        <CardDescription>
          Configure your Spotify artist profile to ensure your tracks are displayed correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && !editMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{profile.artistName}</h3>
                <p className="text-sm text-muted-foreground">Artist ID: {profile.artistId}</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <Check className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(profile.spotifyUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on Spotify
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        ) : editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  value={formData.artistName}
                  onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                  placeholder="e.g., ALGORYX"
                />
              </div>
              <div>
                <Label htmlFor="artistId">Spotify Artist ID</Label>
                <Input
                  id="artistId"
                  value={formData.artistId}
                  onChange={(e) => setFormData(prev => ({ ...prev, artistId: e.target.value }))}
                  placeholder="e.g., 7ibWrazAoXwtMpiwDlpZ9k"
                />
              </div>
              <div>
                <Label htmlFor="spotifyUrl">Spotify URL</Label>
                <Input
                  id="spotifyUrl"
                  value={formData.spotifyUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, spotifyUrl: e.target.value }))}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={saveProfile}
                disabled={saving || !formData.artistName || !formData.artistId}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false)
                  if (profile) {
                    setFormData({
                      artistName: profile.artistName,
                      artistId: profile.artistId,
                      spotifyUrl: profile.spotifyUrl
                    })
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Artist Profile Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up your Spotify artist profile to see your tracks in the catalog
              </p>
              
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <Button
                  onClick={setupAlgoryx}
                  disabled={saving}
                  className="gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                >
                  <Music2 className="h-4 w-4" />
                  {saving ? "Setting up..." : "Setup ALGORYX Profile"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  size="sm"
                >
                  Or configure manually
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 