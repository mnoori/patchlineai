"use client"
import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ArrowUp, ArrowDown, Music, PlayCircle, BarChart2, TrendingUp, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { CHART_COLORS } from "@/lib/brand"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  coverArt: string
  streams: number
  change: number
  trend: "up" | "down" | "flat"
  growthDrivers: string[]
  dailyStreams: { date: string; streams: number }[]
  playlists: { name: string; followers: number; platform: string }[]
  syncOpportunities: { type: string; match: number; description: string }[]
  engagementRate: number
  saveRate: number
  shareRate: number
}

interface TopTracksIntelligenceProps {
  tracks: Track[]
  timeframe: string
}

export function TopTracksIntelligence({ tracks, timeframe }: TopTracksIntelligenceProps) {
  const [selectedTrack, setSelectedTrack] = useState<Track>(tracks[0])
  const [activeTab, setActiveTab] = useState("overview")

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const trendColor = {
    up: "text-green-500",
    down: "text-red-500",
    flat: "text-muted-foreground",
  }

  const trendIcon = {
    up: <ArrowUp className="h-3.5 w-3.5" />,
    down: <ArrowDown className="h-3.5 w-3.5" />,
    flat: null,
  }

  return (
    <BrandCard className="glass-effect hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Top Tracks Intelligence</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Calendar className="h-4 w-4 mr-1" /> {timeframe}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {tracks.map((track) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`border rounded-lg p-3 cursor-pointer hover:border-brand-cyan/30 hover:scale-[1.02] transition-all duration-200 ${
                    selectedTrack.id === track.id ? "border-brand-cyan/50 bg-brand-cyan/5" : "border-border/50"
                  }`}
                  onClick={() => setSelectedTrack(track)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={track.coverArt || "/placeholder.svg"}
                      alt={track.title}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{track.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{track.album}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">{formatNumber(track.streams)} streams</span>
                        <div className={`flex items-center gap-0.5 text-xs ${trendColor[track.trend]}`}>
                          {trendIcon[track.trend]}
                          <span>
                            {track.change > 0 ? "+" : ""}
                            {track.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="border border-border/50 rounded-lg p-4">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={selectedTrack.coverArt || "/placeholder.svg"}
                  alt={selectedTrack.title}
                  className="w-20 h-20 rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedTrack.title}</h3>
                  <p className="text-muted-foreground">{selectedTrack.album}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Music className="h-4 w-4 text-brand-cyan" />
                      <span className="text-sm">{formatNumber(selectedTrack.streams)} streams</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${trendColor[selectedTrack.trend]}`}>
                      {trendIcon[selectedTrack.trend]}
                      <span>
                        {selectedTrack.change > 0 ? "+" : ""}
                        {selectedTrack.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTrack.growthDrivers.map((driver) => (
                      <Badge
                        key={driver}
                        variant="outline"
                        className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20"
                      >
                        {driver}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full">
                  <PlayCircle className="h-5 w-5" />
                </Button>
              </div>

              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="playlists">Playlists</TabsTrigger>
                  <TabsTrigger value="sync">Sync Opportunities</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-0">
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={selectedTrack.dailyStreams}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            border: "none",
                            borderRadius: "4px",
                          }}
                        />
                        <Area type="monotone" dataKey="streams" stroke={CHART_COLORS.primary} fill={`${CHART_COLORS.primary}33`} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-border/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Engagement Rate</span>
                        <BarChart2 className="h-3.5 w-3.5 text-brand-cyan" />
                      </div>
                      <div className="text-lg font-bold">{selectedTrack.engagementRate}%</div>
                    </div>
                    <div className="border border-border/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Save Rate</span>
                        <BarChart2 className="h-3.5 w-3.5 text-brand-cyan" />
                      </div>
                      <div className="text-lg font-bold">{selectedTrack.saveRate}%</div>
                    </div>
                    <div className="border border-border/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Share Rate</span>
                        <TrendingUp className="h-3.5 w-3.5 text-brand-cyan" />
                      </div>
                      <div className="text-lg font-bold">{selectedTrack.shareRate}%</div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="playlists" className="mt-0">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTrack.playlists.map((playlist, index) => (
                      <div
                        key={index}
                        className="border border-border/50 rounded-lg p-3 hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{playlist.name}</h4>
                            <p className="text-xs text-muted-foreground">{playlist.platform}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatNumber(playlist.followers)}</div>
                            <p className="text-xs text-muted-foreground">followers</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="sync" className="mt-0">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTrack.syncOpportunities.map((opportunity, index) => (
                      <div
                        key={index}
                        className="border border-border/50 rounded-lg p-3 hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{opportunity.type}</Badge>
                            <div className="text-sm font-medium">{opportunity.match}% match</div>
                          </div>
                          <Button variant="outline" size="sm" className="h-7">
                            View
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{opportunity.description}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </CardContent>
    </BrandCard>
  )
}
