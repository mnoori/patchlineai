"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Music2, Play, MoreHorizontal, Clock, Calendar, Tag, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const tracks = [
    {
      title: "Midnight Dreams",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "3:45",
      releaseDate: "June 15, 2025",
      streams: "1.2M",
      revenue: "$4,850",
    },
    {
      title: "Neon City",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "4:12",
      releaseDate: "June 15, 2025",
      streams: "850K",
      revenue: "$3,420",
    },
    {
      title: "Summer Haze",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "3:28",
      releaseDate: "June 15, 2025",
      streams: "720K",
      revenue: "$2,880",
    },
    {
      title: "Digital Horizon",
      artist: "Pulse Wave",
      album: "Digital Dreams",
      duration: "5:02",
      releaseDate: "March 10, 2025",
      streams: "450K",
      revenue: "$1,800",
    },
    {
      title: "Cosmic Journey",
      artist: "Astral Drift",
      album: "Cosmic Journey",
      duration: "6:18",
      releaseDate: "January 22, 2025",
      streams: "380K",
      revenue: "$1,520",
    },
    {
      title: "Night Drive",
      artist: "Metro Beats",
      album: "Urban Jungle",
      duration: "4:35",
      releaseDate: "February 8, 2025",
      streams: "620K",
      revenue: "$2,480",
    },
  ]

  const albums = [
    {
      title: "Summer EP",
      artist: "Luna Echo",
      tracks: 3,
      releaseDate: "June 15, 2025",
      totalStreams: "2.77M",
      totalRevenue: "$11,150",
    },
    {
      title: "Digital Dreams",
      artist: "Pulse Wave",
      tracks: 8,
      releaseDate: "March 10, 2025",
      totalStreams: "1.2M",
      totalRevenue: "$4,800",
    },
    {
      title: "Cosmic Journey",
      artist: "Astral Drift",
      tracks: 10,
      releaseDate: "January 22, 2025",
      totalStreams: "950K",
      totalRevenue: "$3,800",
    },
    {
      title: "Urban Jungle",
      artist: "Metro Beats",
      tracks: 12,
      releaseDate: "February 8, 2025",
      totalStreams: "1.8M",
      totalRevenue: "$7,200",
    },
  ]

  const playlists = [
    {
      title: "Late Night Vibes",
      platform: "Spotify",
      followers: "1.2M",
      tracks: 2,
      lastUpdated: "May 5, 2025",
    },
    {
      title: "Electronic Essentials",
      platform: "Apple Music",
      followers: "850K",
      tracks: 1,
      lastUpdated: "May 10, 2025",
    },
    {
      title: "Chill Electronica",
      platform: "Spotify",
      followers: "2.3M",
      tracks: 3,
      lastUpdated: "May 8, 2025",
    },
    {
      title: "Future Beats",
      platform: "YouTube Music",
      followers: "450K",
      tracks: 2,
      lastUpdated: "May 12, 2025",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Catalog</h1>
        <p className="text-muted-foreground">Manage your music catalog and track performance</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tracks, albums, or artists..."
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
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
            <Plus className="h-4 w-4" /> Add Music
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tracks" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Tracks</CardTitle>
              <CardDescription>All tracks in your catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Track</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Album</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Duration</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Release Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Streams</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Revenue</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="rounded-md bg-cosmic-teal/10 p-2">
                                <Music2 className="h-4 w-4 text-cosmic-teal" />
                              </div>
                              <div>
                                <div className="font-medium">{track.title}</div>
                                <div className="text-xs text-muted-foreground">{track.artist}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{track.album}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {track.duration}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {track.releaseDate}
                            </div>
                          </td>
                          <td className="p-4 align-middle">{track.streams}</td>
                          <td className="p-4 align-middle">{track.revenue}</td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Play className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>Edit Metadata</DropdownMenuItem>
                                  <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Download</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="albums">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Albums</CardTitle>
              <CardDescription>All albums and EPs in your catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Album</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Tracks</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Release Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Total Streams</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Total Revenue</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {albums.map((album, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                                <Music2 className="h-5 w-5 text-cosmic-teal" />
                              </div>
                              <div>
                                <div className="font-medium">{album.title}</div>
                                <div className="text-xs text-muted-foreground">{album.artist}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{album.tracks}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              {album.releaseDate}
                            </div>
                          </td>
                          <td className="p-4 align-middle">{album.totalStreams}</td>
                          <td className="p-4 align-middle">{album.totalRevenue}</td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Play className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>View Tracks</DropdownMenuItem>
                                  <DropdownMenuItem>Edit Album</DropdownMenuItem>
                                  <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Download</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playlists">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Playlists</CardTitle>
              <CardDescription>Playlists featuring your music</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Playlist</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Platform</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Followers</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Your Tracks</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Last Updated</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playlists.map((playlist, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="font-medium">{playlist.title}</div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{playlist.platform}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{playlist.followers}</td>
                          <td className="p-4 align-middle">{playlist.tracks}</td>
                          <td className="p-4 align-middle">{playlist.lastUpdated}</td>
                          <td className="p-4 align-middle">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Catalog Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music2 className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Across all releases</p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Albums</CardTitle>
            <Music2 className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Including EPs and singles</p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Playlist Placements</CardTitle>
            <Tag className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.4%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Catalog Value</CardTitle>
            <DollarSign className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$128,450</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+8.7%</span> from last quarter
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Dollar sign icon component
function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
}

function ArrowUpRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7"></path>
      <path d="M7 7h10v10"></path>
    </svg>
  )
}
