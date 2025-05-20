"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart2,
  TrendingUp,
  Globe,
  Users,
  DollarSign,
  Music2,
  Download,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Share2,
  X,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function InsightsPage() {
  const { userId } = useCurrentUser()
  const [showShareCard, setShowShareCard] = useState(true)
  const [embeds, setEmbeds] = useState<any[]>([])

  useEffect(() => {
    async function loadEmbeds() {
      if (!userId) return
      try {
        const res = await fetch(`/api/embed?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setEmbeds(data.embeds)
        }
      } catch (e) {
        console.error("Failed to fetch embeds", e)
      }
    }
    loadEmbeds()
  }, [userId])

  // Dummy data for visualizations
  const monthlyRevenue = [
    { month: "Jan", value: 3200 },
    { month: "Feb", value: 4100 },
    { month: "Mar", value: 3800 },
    { month: "Apr", value: 4500 },
    { month: "May", value: 5200 },
    { month: "Jun", value: 6100 },
    { month: "Jul", value: 5800 },
    { month: "Aug", value: 6500 },
    { month: "Sep", value: 7200 },
    { month: "Oct", value: 8100 },
    { month: "Nov", value: 7800 },
    { month: "Dec", value: 8500 },
  ]

  const platformDistribution = [
    { platform: "Spotify", percentage: 65, color: "bg-green-500" },
    { platform: "Apple Music", percentage: 20, color: "bg-red-500" },
    { platform: "YouTube", percentage: 10, color: "bg-red-400" },
    { platform: "Others", percentage: 5, color: "bg-orange-500" },
  ]

  const audienceAgeGroups = [
    { group: "18-24", percentage: 35 },
    { group: "25-34", percentage: 42 },
    { group: "35-44", percentage: 15 },
    { group: "45+", percentage: 8 },
  ]

  const topCountries = [
    { country: "United States", percentage: 42 },
    { country: "United Kingdom", percentage: 18 },
    { country: "Germany", percentage: 12 },
    { country: "Canada", percentage: 8 },
    { country: "Australia", percentage: 6 },
  ]

  const topTracks = [
    { title: "Midnight Dreams", streams: "1.2M" },
    { title: "Neon City", streams: "850K" },
    { title: "Summer Haze", streams: "720K" },
  ]

  const revenueBySource = [
    { source: "Streaming", percentage: 72, value: "$32,400", trend: "+8.2%" },
    { source: "Licensing", percentage: 18, value: "$8,100", trend: "+15.4%" },
    { source: "Merchandise", percentage: 10, value: "$4,500", trend: "+3.7%" },
  ]

  const getMaxValue = (data: any[]) => {
    return Math.max(...data.map((item) => item.value))
  }

  const maxRevenue = getMaxValue(monthlyRevenue)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Insights</h1>
          <p className="text-muted-foreground">Performance metrics and analytics for your music business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" /> Last 30 Days
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {showShareCard && (
        <Card className="glass-effect border-cosmic-teal/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-cosmic-teal/20 p-2">
                  <Share2 className="h-5 w-5 text-cosmic-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Share Insights Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export a PDF report to share with your team or stakeholders
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShareCard(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Export Report</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Embeds Card */}
      {embeds.length > 0 && (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>SoundCloud Embeds</CardTitle>
            <CardDescription>Your latest SoundCloud tracks & playlists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {embeds.map((embed) => (
                <div key={embed.embedId} dangerouslySetInnerHTML={{ __html: embed.html }} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Listeners</CardTitle>
            <TrendingUp className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350,412</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+15.3%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Users className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,827</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+18.7%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Catalog Size</CardTitle>
            <Music2 className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Tracks in your catalog</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        <TabsContent value="performance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue trend over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-1 mt-4 pb-6">
                  {monthlyRevenue.map((month, index) => {
                    // Calculate height as percentage of max value, but ensure it's at least 5px
                    const heightPercentage = (month.value / maxRevenue) * 100
                    const heightPx = Math.max((heightPercentage / 100) * 250, 5)

                    return (
                      <div key={index} className="flex flex-col items-center gap-1 w-full">
                        <div
                          className="bg-cosmic-teal w-full rounded-t-sm"
                          style={{
                            height: `${heightPx}px`,
                          }}
                        ></div>
                        <span className="text-xs text-muted-foreground mt-2">{month.month}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Stream count by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="relative h-48 w-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">2.35M</div>
                        <div className="text-xs text-muted-foreground">Total Streams</div>
                      </div>
                    </div>
                    <svg width="100%" height="100%" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="20"
                        strokeDasharray="251.2 0"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray="0 251.2 50.3 0"
                        strokeDashoffset="-251.2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f97316"
                        strokeWidth="20"
                        strokeDasharray="0 301.5 25.1 0"
                        strokeDashoffset="-301.5"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f87171"
                        strokeWidth="20"
                        strokeDasharray="0 326.6 12.6 0"
                        strokeDashoffset="-326.6"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {platformDistribution.map((platform, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${platform.color}`}></div>
                      <span className="text-xs">
                        {platform.platform} ({platform.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 mt-4">
            <CardHeader>
              <CardTitle>Top Performing Tracks</CardTitle>
              <CardDescription>Your most streamed tracks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topTracks.map((track, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                        <Music2 className="h-5 w-5 text-cosmic-teal" />
                      </div>
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-xs text-muted-foreground">Luna Echo</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{track.streams}</div>
                      <div className="text-xs text-muted-foreground">streams</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audience">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>Age and gender distribution of your listeners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8 h-full">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Age Groups</h3>
                    <div className="space-y-4">
                      {audienceAgeGroups.map((group, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{group.group}</span>
                            <span>{group.percentage}%</span>
                          </div>
                          <Progress value={group.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-4">Gender</h3>
                    <div className="relative h-40 w-40 mx-auto">
                      <svg viewBox="0 0 100 100" className="h-full w-full">
                        {/* Male 55% */}
                        <path d="M 50 50 L 50 0 A 50 50 0 0 1 95.1 71.3 Z" className="fill-cosmic-teal" />
                        {/* Female 45% */}
                        <path d="M 50 50 L 95.1 71.3 A 50 50 0 1 1 50 0 Z" className="fill-cosmic-pink" />
                      </svg>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-cosmic-teal"></div>
                        <span className="text-xs">Male (55%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-cosmic-pink"></div>
                        <span className="text-xs">Female (45%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Where your listeners are located</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium">Top Locations</h3>
                  {topCountries.map((country, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{country.country}</span>
                        <span>{country.percentage}%</span>
                      </div>
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" className="gap-1">
                    <Globe className="h-4 w-4" /> View Full Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 mt-4">
            <CardHeader>
              <CardTitle>Audience Growth</CardTitle>
              <CardDescription>Monthly listener growth over time</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <div className="h-full w-full flex items-end">
                <svg viewBox="0 0 1000 300" className="w-full h-full">
                  {/* Grid lines */}
                  <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="200" x2="1000" y2="200" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="150" x2="1000" y2="150" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeOpacity="0.1" />

                  {/* Line chart */}
                  <path
                    d="M0,250 L83,230 L166,210 L249,190 L332,200 L415,180 L498,150 L581,130 L664,100 L747,80 L830,60 L913,40 L1000,20"
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="3"
                  />

                  {/* Area under the line */}
                  <path
                    d="M0,250 L83,230 L166,210 L249,190 L332,200 L415,180 L498,150 L581,130 L664,100 L747,80 L830,60 L913,40 L1000,20 L1000,250 L0,250"
                    fill="url(#gradient)"
                    fillOpacity="0.2"
                  />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="revenue">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 mt-4">
                  {revenueBySource.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              index === 0 ? "bg-cosmic-teal" : index === 1 ? "bg-cosmic-pink" : "bg-purple-500"
                            }`}
                          ></div>
                          <span className="text-sm">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{source.value}</span>
                          <span className="text-xs text-green-500 flex items-center">
                            <ArrowUpRight className="h-3 w-3" />
                            {source.trend}
                          </span>
                        </div>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                      <div className="text-xs text-right text-muted-foreground">{source.percentage}% of total</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Projected revenue for the next 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full flex items-end mt-4">
                  <svg viewBox="0 0 1000 300" className="w-full h-full">
                    {/* Grid lines */}
                    <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="0" y1="200" x2="1000" y2="200" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="0" y1="150" x2="1000" y2="150" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="0" y1="100" x2="1000" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeOpacity="0.1" />

                    {/* Actual revenue line */}
                    <path d="M0,200 L166,180 L332,150 L500,120" fill="none" stroke="#00F0FF" strokeWidth="3" />

                    {/* Projected revenue line (dashed) */}
                    <path
                      d="M500,120 L666,100 L832,80 L1000,60"
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />

                    {/* Divider line */}
                    <line
                      x1="500"
                      y1="0"
                      x2="500"
                      y2="300"
                      stroke="#00F0FF"
                      strokeOpacity="0.3"
                      strokeDasharray="5,5"
                    />

                    {/* Labels */}
                    <text x="500" y="280" textAnchor="middle" fill="currentColor" fontSize="12">
                      Now
                    </text>
                    <text x="250" y="280" textAnchor="middle" fill="currentColor" fontSize="12">
                      Past
                    </text>
                    <text x="750" y="280" textAnchor="middle" fill="currentColor" fontSize="12">
                      Projected
                    </text>
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 mt-4">
            <CardHeader>
              <CardTitle>Track Performance</CardTitle>
              <CardDescription>Revenue by track</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Track</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Streams</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Revenue</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Trend</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">RPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          title: "Midnight Dreams",
                          artist: "Luna Echo",
                          streams: "1.2M",
                          revenue: "$4,850",
                          trend: "+12.5%",
                          rpm: "$4.04",
                          trending: "up",
                        },
                        {
                          title: "Neon City",
                          artist: "Luna Echo",
                          streams: "850K",
                          revenue: "$3,420",
                          trend: "+8.7%",
                          rpm: "$4.02",
                          trending: "up",
                        },
                        {
                          title: "Summer Haze",
                          artist: "Luna Echo",
                          streams: "720K",
                          revenue: "$2,880",
                          trend: "-2.3%",
                          rpm: "$4.00",
                          trending: "down",
                        },
                        {
                          title: "Digital Horizon",
                          artist: "Pulse Wave",
                          streams: "450K",
                          revenue: "$1,800",
                          trend: "+5.8%",
                          rpm: "$4.00",
                          trending: "up",
                        },
                        {
                          title: "Cosmic Journey",
                          artist: "Astral Drift",
                          streams: "380K",
                          revenue: "$1,520",
                          trend: "+3.2%",
                          rpm: "$4.00",
                          trending: "up",
                        },
                      ].map((track, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                                <Music2 className="h-4 w-4 text-cosmic-teal" />
                              </div>
                              <div>
                                <div className="font-medium">{track.title}</div>
                                <div className="text-xs text-muted-foreground">{track.artist}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{track.streams}</td>
                          <td className="p-4 align-middle">{track.revenue}</td>
                          <td className="p-4 align-middle">
                            <div
                              className={`flex items-center gap-1 ${
                                track.trending === "up" ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {track.trending === "up" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span>{track.trend}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{track.rpm}</td>
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

      {/* Custom Report Builder */}
      <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>Create custom reports with the metrics that matter to you</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <BarChart2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Build Your Own Reports</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop metrics to create custom reports tailored to your needs
            </p>
            <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Create Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
