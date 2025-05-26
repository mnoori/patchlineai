"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/insights/kpi-card"
import { RevenueChart } from "@/components/insights/revenue-chart"
import { AudienceDistribution } from "@/components/insights/audience-distribution"
import { TopTracksIntelligence } from "@/components/insights/top-tracks-intelligence"
import { PatchyInsights } from "@/components/insights/patchy-insights"
import { CustomReportBuilder } from "@/components/insights/custom-report-builder"
import { InsightsDigest } from "@/components/insights/insights-digest"
import { PlatformIntegrations } from "@/components/insights/platform-integrations"
import { SoundCloudEmbeds } from "@/components/insights/soundcloud-embeds"
import { Button } from "@/components/ui/button"
import { Calendar, Download, Share2, Users, DollarSign, BarChart2, Music } from "lucide-react"
import { motion } from "framer-motion"
import { useCurrentUser } from "@/hooks/use-current-user"
import { embedAPI, fetchDashboardData } from "@/lib/api-client"

// Mock data for demonstration
const mockData = {
  kpis: [
    {
      title: "Monthly Listeners",
      value: 245789,
      change: 12.5,
      trend: "up",
      sparkline: [10, 15, 12, 18, 20, 25, 22, 30, 28, 35],
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Monthly Revenue",
      value: 12450,
      format: "currency",
      change: 8.3,
      trend: "up",
      sparkline: [800, 950, 900, 1100, 1050, 1200, 1150, 1300, 1250, 1450],
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Engagement Rate",
      value: 24.7,
      suffix: "%",
      change: -2.1,
      trend: "down",
      sparkline: [28, 26, 27, 25, 26, 24, 25, 23, 24, 22],
      icon: <BarChart2 className="h-4 w-4" />,
      alert: "Engagement is down 2.1% from last month. Consider posting more content.",
    },
    {
      title: "Catalog Size",
      value: 87,
      change: 4.8,
      trend: "up",
      sparkline: [70, 72, 75, 76, 78, 80, 82, 83, 85, 87],
      icon: <Music className="h-4 w-4" />,
      badge: "4 new releases",
    },
  ],
  revenueData: [
    { name: "Jan", spotify: 4500, apple: 2200, youtube: 1800, amazon: 800, other: 500, total: 9800 },
    { name: "Feb", spotify: 5000, apple: 2500, youtube: 2000, amazon: 900, other: 600, total: 11000 },
    {
      name: "Mar",
      spotify: 5500,
      apple: 2800,
      youtube: 2200,
      amazon: 1000,
      other: 700,
      total: 12200,
      campaign: "Album Release",
    },
    { name: "Apr", spotify: 6000, apple: 3000, youtube: 2400, amazon: 1100, other: 800, total: 13300 },
    { name: "May", spotify: 5800, apple: 2900, youtube: 2300, amazon: 1050, other: 750, total: 12800 },
    {
      name: "Jun",
      spotify: 6200,
      apple: 3100,
      youtube: 2500,
      amazon: 1150,
      other: 850,
      total: 13800,
      campaign: "Summer Tour",
    },
    { name: "Jul", spotify: 6500, apple: 3300, youtube: 2700, amazon: 1200, other: 900, total: 14600 },
    { name: "Aug", spotify: 6800, apple: 3500, youtube: 2900, amazon: 1300, other: 950, total: 15450 },
    {
      name: "Sep",
      spotify: 7000,
      apple: 3600,
      youtube: 3000,
      amazon: 1350,
      other: 1000,
      total: 15950,
      campaign: "Music Video",
    },
    { name: "Oct", spotify: 7200, apple: 3700, youtube: 3100, amazon: 1400, other: 1050, total: 16450 },
    { name: "Nov", spotify: 7500, apple: 3900, youtube: 3300, amazon: 1500, other: 1100, total: 17300 },
    {
      name: "Dec",
      spotify: 8000,
      apple: 4200,
      youtube: 3600,
      amazon: 1600,
      other: 1200,
      total: 18600,
      campaign: "Holiday EP",
    },
  ],
  campaigns: [
    { date: "Mar", name: "New Album 'Cosmic Dreams' Release", type: "Release" },
    { date: "Jun", name: "Summer Festival Tour", type: "Tour" },
    { date: "Sep", name: "Music Video for 'Neon City'", type: "Video" },
    { date: "Dec", name: "Holiday EP 'Winter Lights'", type: "Release" },
  ],
  audienceData: {
    platforms: [
      { name: "Spotify", value: 65, color: "#1DB954" },
      { name: "Apple Music", value: 20, color: "#FC3C44" },
      { name: "YouTube", value: 10, color: "#FF0000" },
      { name: "Amazon Music", value: 5, color: "#00A8E1" },
    ],
    geography: [
      { name: "United States", value: 45, color: "#3b82f6" },
      { name: "United Kingdom", value: 15, color: "#ef4444" },
      { name: "Germany", value: 12, color: "#f59e0b" },
      { name: "Canada", value: 8, color: "#10b981" },
      { name: "Australia", value: 7, color: "#8b5cf6" },
      { name: "Other", value: 13, color: "#6b7280" },
    ],
    demographics: [
      { name: "18-24", value: 35, color: "#3b82f6" },
      { name: "25-34", value: 40, color: "#10b981" },
      { name: "35-44", value: 15, color: "#f59e0b" },
      { name: "45+", value: 10, color: "#8b5cf6" },
    ],
  },
  topTracks: [
    {
      id: "track1",
      title: "Neon City",
      artist: "Artist Name",
      album: "Cosmic Dreams",
      coverArt: "/placeholder.svg?height=100&width=100&query=album%20cover%20neon%20city",
      streams: 1250000,
      change: 35,
      trend: "up",
      growthDrivers: ["Playlist", "TikTok"],
      dailyStreams: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        streams: 30000 + Math.floor(Math.random() * 20000),
      })),
      playlists: [
        { name: "Today's Top Hits", followers: 28000000, platform: "Spotify" },
        { name: "New Music Daily", followers: 12000000, platform: "Apple Music" },
        { name: "Viral Hits", followers: 8500000, platform: "Spotify" },
        { name: "Pop Rising", followers: 5200000, platform: "Spotify" },
        { name: "Future Hits", followers: 3800000, platform: "Apple Music" },
      ],
      syncOpportunities: [
        { type: "TV Show", match: 92, description: "Perfect for upcoming sci-fi drama series 'Neon Nights'" },
        {
          type: "Commercial",
          match: 85,
          description: "Tech company looking for futuristic sound for new product launch",
        },
        { type: "Video Game", match: 78, description: "Match for upcoming cyberpunk game soundtrack" },
      ],
      engagementRate: 68,
      saveRate: 42,
      shareRate: 15,
    },
    {
      id: "track2",
      title: "Midnight Dreams",
      artist: "Artist Name",
      album: "Cosmic Dreams",
      coverArt: "/placeholder.svg?height=100&width=100&query=album%20cover%20midnight%20dreams",
      streams: 980000,
      change: 22,
      trend: "up",
      growthDrivers: ["Radio", "Organic"],
      dailyStreams: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        streams: 25000 + Math.floor(Math.random() * 15000),
      })),
      playlists: [
        { name: "Chill Vibes", followers: 15000000, platform: "Spotify" },
        { name: "Indie Chill", followers: 7800000, platform: "Apple Music" },
        { name: "Late Night Feels", followers: 4200000, platform: "Spotify" },
        { name: "Indie Pop", followers: 3500000, platform: "YouTube Music" },
      ],
      syncOpportunities: [
        { type: "Film", match: 88, description: "Indie drama looking for emotional soundtrack" },
        { type: "Podcast", match: 75, description: "Popular storytelling podcast needs theme music" },
      ],
      engagementRate: 72,
      saveRate: 38,
      shareRate: 12,
    },
    {
      id: "track3",
      title: "Electric Soul",
      artist: "Artist Name",
      album: "Cosmic Dreams",
      coverArt: "/placeholder.svg?height=100&width=100&query=album%20cover%20electric%20soul",
      streams: 750000,
      change: -5,
      trend: "down",
      growthDrivers: ["Playlist"],
      dailyStreams: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        streams: 28000 - (i < 15 ? 0 : Math.floor(Math.random() * 8000)),
      })),
      playlists: [
        { name: "Dance Pop", followers: 9500000, platform: "Spotify" },
        { name: "Electronic Hits", followers: 6200000, platform: "Apple Music" },
        { name: "Workout Beats", followers: 4800000, platform: "Spotify" },
      ],
      syncOpportunities: [
        { type: "Fitness App", match: 95, description: "Perfect energy for workout app promotional video" },
        { type: "Sports", match: 82, description: "Match for sports highlight reels" },
      ],
      engagementRate: 58,
      saveRate: 25,
      shareRate: 8,
    },
    {
      id: "track4",
      title: "Cosmic Wave",
      artist: "Artist Name",
      album: "Cosmic Dreams",
      coverArt: "/placeholder.svg?height=100&width=100&query=album%20cover%20cosmic%20wave",
      streams: 620000,
      change: 8,
      trend: "up",
      growthDrivers: ["Organic"],
      dailyStreams: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        streams: 18000 + Math.floor(Math.random() * 5000),
      })),
      playlists: [
        { name: "Indie Discoveries", followers: 5800000, platform: "Spotify" },
        { name: "Fresh Finds", followers: 3200000, platform: "Apple Music" },
        { name: "New Music Friday", followers: 8500000, platform: "Spotify" },
      ],
      syncOpportunities: [
        { type: "Documentary", match: 78, description: "Science documentary series looking for atmospheric tracks" },
        { type: "Art Installation", match: 90, description: "Digital art exhibition needs ambient soundtrack" },
      ],
      engagementRate: 65,
      saveRate: 32,
      shareRate: 10,
    },
    {
      id: "track5",
      title: "Digital Love",
      artist: "Artist Name",
      album: "Cosmic Dreams",
      coverArt: "/placeholder.svg?height=100&width=100&query=album%20cover%20digital%20love",
      streams: 580000,
      change: 15,
      trend: "up",
      growthDrivers: ["TikTok", "Viral"],
      dailyStreams: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        streams: 15000 + (i < 20 ? Math.floor(Math.random() * 5000) : Math.floor(Math.random() * 15000)),
      })),
      playlists: [
        { name: "Viral 50", followers: 11000000, platform: "Spotify" },
        { name: "TikTok Hits", followers: 7500000, platform: "Spotify" },
        { name: "Trending Now", followers: 9200000, platform: "Apple Music" },
      ],
      syncOpportunities: [
        { type: "Social Media", match: 96, description: "Perfect for social media platform ad campaign" },
        { type: "Fashion", match: 85, description: "Online fashion retailer looking for trendy soundtrack" },
      ],
      engagementRate: 75,
      saveRate: 45,
      shareRate: 22,
    },
  ],
  patchyInsights: [
    {
      id: "insight1",
      type: "growth",
      title: "Spotify streams up 40% in Germany",
      description:
        "Your track 'Neon City' is gaining significant traction in Germany, with a 40% increase in streams over the last 30 days. This growth appears to be organic and not tied to any specific playlist or campaign.",
      icon: <Share2 />,
      actions: [
        { label: "Explore German Tour", action: "explore-tour" },
        { label: "Target German Ads", action: "target-ads" },
        { label: "Find Remix Partners", action: "find-partners" },
      ],
      date: "Today",
      priority: "high",
    },
    {
      id: "insight2",
      type: "viral",
      title: "TikTok trend emerging with 'Digital Love'",
      description:
        "Your track 'Digital Love' is being used in over 5,000 TikTok videos in the past week, showing signs of going viral. The trend appears to be centered around a dance challenge.",
      icon: <Share2 />,
      actions: [
        { label: "Boost TikTok Trend", action: "boost-tiktok" },
        { label: "Create Official Dance", action: "create-dance" },
        { label: "Contact Influencers", action: "contact-influencers" },
      ],
      date: "Yesterday",
      priority: "high",
    },
    {
      id: "insight3",
      type: "opportunity",
      title: "Sync licensing opportunity detected",
      description:
        "Based on the sound profile of 'Midnight Dreams', we've identified a potential sync opportunity with an upcoming Netflix series. The music supervisor is looking for tracks with a similar vibe.",
      icon: <Share2 />,
      actions: [
        { label: "View Opportunity", action: "view-opportunity" },
        { label: "Submit Track", action: "submit-track" },
      ],
      date: "2 days ago",
      priority: "medium",
    },
  ],
  insightsDigest: {
    summary:
      "In the past 30 days, your catalog has shown strong growth with a 12.5% increase in monthly listeners and an 8.3% increase in revenue. Your track 'Neon City' continues to be your top performer, with significant growth in Germany and strong playlist placements. TikTok has emerged as a key growth driver for 'Digital Love', showing early signs of viral potential.",
    date: "May 25, 2025",
    highlights: [
      {
        title: "Germany emerging as key market",
        description:
          "40% increase in streams from Germany, primarily on Spotify and Apple Music. Consider targeting this market with localized marketing and potentially planning tour dates.",
      },
      {
        title: "TikTok driving new audience growth",
        description:
          "5,000+ TikTok videos using 'Digital Love' in the past week, resulting in a 22% increase in streams for this track and bringing in a younger demographic (18-24).",
      },
    ],
    recommendations: [
      {
        title: "Capitalize on German market growth",
        description:
          "Consider a German remix or collaboration with a local artist. Target German playlists and potentially plan tour dates in major German cities.",
      },
      {
        title: "Leverage TikTok momentum",
        description:
          "Create official content around the emerging TikTok trend for 'Digital Love'. Consider a small ad spend to amplify the organic growth.",
      },
    ],
  },
  reportModules: [
    {
      id: "module1",
      type: "kpi",
      title: "Revenue Summary",
      description: "Overview of revenue across all platforms and time periods.",
      icon: <DollarSign />,
    },
    {
      id: "module2",
      type: "bar-chart",
      title: "Platform Comparison",
      description: "Compare performance across different streaming platforms.",
      icon: <BarChart2 />,
    },
    {
      id: "module3",
      type: "line-chart",
      title: "Growth Trends",
      description: "Track listener and revenue growth over time.",
      icon: <Share2 />,
    },
    {
      id: "module4",
      type: "pie-chart",
      title: "Audience Breakdown",
      description: "Detailed breakdown of your audience demographics.",
      icon: <Users />,
    },
    {
      id: "module5",
      type: "table",
      title: "Top Tracks Performance",
      description: "Detailed performance metrics for your top tracks.",
      icon: <Music />,
    },
    {
      id: "module6",
      type: "kpi",
      title: "Engagement Metrics",
      description: "Key engagement metrics across all platforms.",
      icon: <Share2 />,
    },
  ],
}

export default function InsightsPage() {
  const { userId } = useCurrentUser()
  const [isLoading, setIsLoading] = useState(true)
  const [embeds, setEmbeds] = useState<any[]>([])
  const [dashboardMetrics, setDashboardMetrics] = useState({
    revenue: 0,
    listeners: 0,
    engagement: 0,
  })

  useEffect(() => {
    async function loadData() {
      if (!userId) return
      
      setIsLoading(true)
      try {
        // Load embeds data
        const embedsData = await embedAPI.getAll(userId)
        setEmbeds(embedsData.embeds || [])

        // Load dashboard metrics
        const metrics = await fetchDashboardData()
        setDashboardMetrics({
          revenue: metrics.revenue || 45231.89,
          listeners: metrics.listeners || 2350412,
          engagement: metrics.engagement || 3827,
        })
      } catch (error) {
        console.error("Failed to load insights data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId])

  // Update KPI data with real metrics
  const kpiData = [
    {
      title: "Monthly Listeners",
      value: dashboardMetrics.listeners,
      change: 12.5,
      trend: "up",
      sparkline: [10, 15, 12, 18, 20, 25, 22, 30, 28, 35],
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Monthly Revenue",
      value: dashboardMetrics.revenue,
      format: "currency",
      change: 8.3,
      trend: "up",
      sparkline: [800, 950, 900, 1100, 1050, 1200, 1150, 1300, 1250, 1450],
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Engagement Rate",
      value: 24.7,
      suffix: "%",
      change: -2.1,
      trend: "down",
      sparkline: [28, 26, 27, 25, 26, 24, 25, 23, 24, 22],
      icon: <BarChart2 className="h-4 w-4" />,
      alert: "Engagement is down 2.1% from last month. Consider posting more content.",
    },
    {
      title: "Platform Embeds",
      value: embeds.length,
      change: 4.8,
      trend: "up",
      sparkline: [70, 72, 75, 76, 78, 80, 82, 83, 85, 87],
      icon: <Music className="h-4 w-4" />,
      badge: `${embeds.length} active embeds`,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cosmic-teal"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Insights</h1>
          <p className="text-muted-foreground">Comprehensive analytics and intelligence for your music business</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-background/20 rounded-lg overflow-hidden">
            <Button variant="ghost" className="rounded-none px-4 py-2 h-9 bg-background/30">
              7 Days
            </Button>
            <Button variant="ghost" className="rounded-none px-4 py-2 h-9 bg-cosmic-teal/20 text-cosmic-teal">
              30 Days
            </Button>
            <Button variant="ghost" className="rounded-none px-4 py-2 h-9 bg-background/30">
              90 Days
            </Button>
            <Button variant="ghost" className="rounded-none px-4 py-2 h-9 bg-background/30">
              1 Year
            </Button>
          </div>
          <Button variant="outline" className="h-9">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
          <Button variant="outline" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="h-9">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Executive Summary and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <InsightsDigest digest={mockData.insightsDigest} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PatchyInsights insights={mockData.patchyInsights} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
          >
            <KPICard
              title={kpi.title}
              value={kpi.value}
              format={kpi.format as any}
              suffix={kpi.suffix}
              change={kpi.change}
              trend={kpi.trend as any}
              sparkline={kpi.sparkline}
              icon={kpi.icon}
              alert={kpi.alert}
              badge={kpi.badge}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <PlatformIntegrations />
      </motion.div>

      {/* SoundCloud Embeds Section */}
      {embeds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <SoundCloudEmbeds embeds={embeds} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <RevenueChart data={mockData.revenueData} campaigns={mockData.campaigns} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <AudienceDistribution
            platformData={mockData.audienceData.platforms}
            geoData={mockData.audienceData.geography}
            demographicData={mockData.audienceData.demographics}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <TopTracksIntelligence tracks={mockData.topTracks} timeframe="30days" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        <CustomReportBuilder availableModules={mockData.reportModules} defaultActiveTab="library" />
      </motion.div>
    </div>
  )
}
