import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Play, Bookmark, BarChart2, ArrowUpRight, Download } from "lucide-react"

export default function ScoutAgentPage() {
  const artists = [
    {
      name: "Cosmic Waves",
      track: "Nebula Dreams",
      genre: "Electronic",
      growthScore: 87,
      matchScore: 92,
      streams: "12.4K",
      growth: "+156%",
      image: "/placeholder.svg?height=40&width=40&query=electronic%20artist%20avatar",
    },
    {
      name: "Luna Ray",
      track: "Midnight Glow",
      genre: "Indie Pop",
      growthScore: 82,
      matchScore: 88,
      streams: "8.7K",
      growth: "+124%",
      image: "/placeholder.svg?height=40&width=40&query=female%20indie%20artist%20avatar",
    },
    {
      name: "The Echoes",
      track: "Distant Memories",
      genre: "Alternative",
      growthScore: 79,
      matchScore: 85,
      streams: "15.2K",
      growth: "+98%",
      image: "/placeholder.svg?height=40&width=40&query=alternative%20band%20avatar",
    },
    {
      name: "Metro Beats",
      track: "Urban Jungle",
      genre: "Hip Hop",
      growthScore: 76,
      matchScore: 81,
      streams: "22.8K",
      growth: "+87%",
      image: "/placeholder.svg?height=40&width=40&query=hip%20hop%20producer%20avatar",
    },
    {
      name: "Skyline Collective",
      track: "Higher Ground",
      genre: "House",
      growthScore: 74,
      matchScore: 79,
      streams: "9.3K",
      growth: "+112%",
      image: "/placeholder.svg?height=40&width=40&query=house%20music%20dj%20avatar",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Scout Agent</h1>
        <p className="text-muted-foreground">
          Discover promising unsigned talent based on growth metrics, sound profile, and genre match.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search artists, tracks, or genres..." className="pl-10" />
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

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="discovery">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Artist Discovery</CardTitle>
              <CardDescription>
                Artists with high growth potential that match your label's sound profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      {artists.map((artist, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
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
                                className="h-2 rounded-full bg-gradient-to-r from-cosmic-teal to-cosmic-pink"
                                style={{ width: `${artist.growthScore}%` }}
                              ></div>
                              <span className="ml-2">{artist.growthScore}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center">
                              <div
                                className="h-2 rounded-full bg-cosmic-teal"
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="watchlist">
          <Card className="glass-effect">
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
                  <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Browse Discovery</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card className="glass-effect">
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
                  <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Browse Discovery</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
