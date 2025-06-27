"use client"

import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Play,
  Bookmark,
  BarChart2,
  ArrowUpRight,
  Download,
  Music2,
  Send,
  ListMusic,
} from "lucide-react"
import { ActionCard } from "@/components/agents/action-card"
import { PATCHLINE_CONFIG } from "@/lib/config"

export function ScoutAgentEnhanced() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("discovery")

  const artists = [
    {
      id: "artist-1",
      name: "Cosmic Waves",
      track: "Nebula Dreams",
      genre: "Electronic",
      growthScore: 87,
      matchScore: 92,
      streams: "12.4K",
      growth: "+156%",
      image: "/electronic-artist-avatar.png",
      playlistMatches: ["Late Night Vibes", "Electronic Essentials", "Future Beats"],
      playlistMatchScore: 89,
    },
    {
      id: "artist-2",
      name: "Luna Ray",
      track: "Midnight Glow",
      genre: "Indie Pop",
      growthScore: 82,
      matchScore: 88,
      streams: "8.7K",
      growth: "+124%",
      image: "/placeholder.svg?height=40&width=40&query=female%20indie%20artist%20avatar",
      playlistMatches: ["Indie Discoveries", "Chill Vibes"],
      playlistMatchScore: 76,
    },
    {
      id: "artist-3",
      name: "The Echoes",
      track: "Distant Memories",
      genre: "Alternative",
      growthScore: 79,
      matchScore: 85,
      streams: "15.2K",
      growth: "+98%",
      image: "/placeholder.svg?height=40&width=40&query=alternative%20band%20avatar",
      playlistMatches: ["Alternative Hits", "New Rock"],
      playlistMatchScore: 72,
    },
    {
      id: "artist-4",
      name: "Metro Beats",
      track: "Urban Jungle",
      genre: "Hip Hop",
      growthScore: 76,
      matchScore: 81,
      streams: "22.8K",
      growth: "+87%",
      image: "/placeholder.svg?height=40&width=40&query=hip%20hop%20producer%20avatar",
      playlistMatches: ["Hip Hop Essentials"],
      playlistMatchScore: 68,
    },
    {
      id: "artist-5",
      name: "Skyline Collective",
      track: "Higher Ground",
      genre: "House",
      growthScore: 74,
      matchScore: 79,
      streams: "9.3K",
      growth: "+112%",
      image: "/placeholder.svg?height=40&width=40&query=house%20music%20dj%20avatar",
      playlistMatches: ["House Party", "EDM Workout"],
      playlistMatchScore: 81,
    },
  ]

  // Simulate playlist pitch action
  const handlePitchToPlaylists = async (artistId: string) => {
    return new Promise<void>((resolve) => {
      // Simulate API call
      setTimeout(() => {
        console.log(`Pitched artist ${artistId} to playlists`)
        resolve()
      }, 1500)
    })
  }

  // Simulate draft email action
  const handleDraftEmail = async (artistId: string) => {
    return new Promise<void>((resolve) => {
      // Simulate API call
      setTimeout(() => {
        console.log(`Drafted email for artist ${artistId}`)
        resolve()
      }, 1500)
    })
  }

  // Simulate add to watchlist action
  const handleAddToWatchlist = async (artistId: string) => {
    return new Promise<void>((resolve) => {
      // Simulate API call
      setTimeout(() => {
        console.log(`Added artist ${artistId} to watchlist`)
        resolve()
      }, 1500)
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">Scout Agent</h1>
        <p className="text-muted-foreground">
          Discover promising unsigned talent based on growth metrics, sound profile, and genre match.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search artists, tracks, or genres..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="discovery" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="discovery">
          <BrandCard className="glass-effect">
            <CardHeader>
              <CardTitle>Artist Discovery</CardTitle>
              <CardDescription>
                Artists with high growth potential that match your label's sound profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PATCHLINE_CONFIG.features.enableAgentSuperLoop ? (
                <div className="space-y-4">
                  {artists.map((artist) => (
                    <ActionCard
                      key={artist.id}
                      title={`${artist.name} - ${artist.track}`}
                      description={`${artist.genre} • ${artist.streams} streams • ${artist.growth} growth`}
                      icon={<Music2 className="h-5 w-5 text-brand-cyan" />}
                      actions={[
                        {
                          label: `Pitch to ${artist.playlistMatches.length} playlists`,
                          onClick: () => handlePitchToPlaylists(artist.id),
                          icon: <ListMusic className="h-3.5 w-3.5" />,
                          autoAction: true,
                        },
                        {
                          label: "Draft email",
                          onClick: () => handleDraftEmail(artist.id),
                          variant: "outline",
                          icon: <Send className="h-3.5 w-3.5" />,
                        },
                        {
                          label: "Add to watchlist",
                          onClick: () => handleAddToWatchlist(artist.id),
                          variant: "outline",
                          icon: <Bookmark className="h-3.5 w-3.5" />,
                        },
                      ]}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Artist</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Genre</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">
                            <div className="flex items-center gap-1">
                              Growth Score
                              <ArrowUpRight className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Match Score</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Growth</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artists.map((artist) => (
                          <tr key={artist.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-3">
                                <img
                                  src={artist.image || "/placeholder.svg"}
                                  alt={artist.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                <div>
                                  <div className="font-medium">{artist.name}</div>
                                  <div className="text-xs text-muted-foreground">{artist.track}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-middle">{artist.genre}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-brand-cyan to-gradient-middle"
                                  style={{ width: `${artist.growthScore}%` }}
                                ></div>
                                <span className="ml-2">{artist.growthScore}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center">
                                <div
                                  className="h-2 rounded-full bg-brand-cyan"
                                  style={{ width: `${artist.matchScore}%` }}
                                ></div>
                                <span className="ml-2">{artist.matchScore}</span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="text-green-500 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {artist.growth}
                              </div>
                              <div className="text-xs text-muted-foreground">{artist.streams} streams</div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Bookmark className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </BrandCard>
        </TabsContent>

        {/* Other tabs remain the same */}
        <TabsContent value="watchlist">
          <BrandCard className="glass-effect">
            <CardHeader>
              <CardTitle>Your Watchlist</CardTitle>
              <CardDescription>Artists you're tracking for potential signing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Save artists you're interested in to track their growth over time.
                  </p>
                  <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">Browse Discovery</Button>
                </div>
              </div>
            </CardContent>
          </BrandCard>
        </TabsContent>

        <TabsContent value="analytics">
          <BrandCard className="glass-effect">
            <CardHeader>
              <CardTitle>Growth Analytics</CardTitle>
              <CardDescription>Trend analysis across genres and growth patterns.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Detailed analytics will be available once you've saved artists to your watchlist.
                  </p>
                  <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">Browse Discovery</Button>
                </div>
              </div>
            </CardContent>
          </BrandCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
