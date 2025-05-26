"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  Calendar,
  Instagram,
  Twitter,
  Facebook,
  Edit,
  Check,
  Download,
  BarChart3,
  Sparkles,
  MessageCircle,
  Zap,
  Megaphone,
  Eye,
  TrendingUp,
  Users,
  Heart,
  Share2,
  Bell,
  Youtube,
  Music,
  Reply,
  MessageSquare,
  AtSign,
} from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { handoff } from "@/lib/agent-bridge"

export default function FanAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("engagement")
  const [openDrawer, setOpenDrawer] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [drawerType, setDrawerType] = useState("")

  const platformEngagements = [
    {
      id: 1,
      platform: "Instagram",
      icon: <Instagram className="h-6 w-6 text-pink-500" />,
      metrics: {
        followers: "24.8K",
        growth: "+3.2%",
        engagement: "5.7%",
        impressions: "142K",
        reachRate: "68%",
      },
      recentActivity: [
        {
          type: "comment",
          user: "musicproducer_official",
          verified: true,
          influential: true,
          content: "Love the new sound! Would be down to collab sometime.",
          post: "Studio session sneak peek",
          time: "2 hours ago",
        },
        {
          type: "mention",
          user: "playlist.curator",
          verified: true,
          influential: true,
          content: "Just added your latest track to our weekly picks playlist! @your_handle",
          post: "Story mention",
          time: "5 hours ago",
        },
        {
          type: "message",
          user: "music_blog_daily",
          verified: true,
          influential: true,
          content: "We'd love to feature your upcoming EP in our next issue. Can we set up an interview?",
          time: "1 day ago",
        },
      ],
      suggestedActions: [
        {
          type: "reply",
          to: "musicproducer_official",
          priority: "high",
          suggestion: "Thank them and express interest in the collaboration opportunity",
        },
        {
          type: "content",
          suggestion: "Create a thank you story for playlist.curator featuring their playlist",
          priority: "medium",
        },
        {
          type: "message",
          to: "music_blog_daily",
          suggestion: "Accept the interview offer and suggest available dates",
          priority: "high",
        },
      ],
      insights: [
        "Comments from verified accounts have increased by 45% this month",
        "Your behind-the-scenes content receives 2.3x more engagement than promotional posts",
        "Responding to comments within 2 hours increases follower retention by 28%",
      ],
    },
    {
      id: 2,
      platform: "TikTok",
      icon: <Music className="h-6 w-6 text-black" />,
      metrics: {
        followers: "56.2K",
        growth: "+12.8%",
        engagement: "9.3%",
        impressions: "890K",
        reachRate: "74%",
      },
      recentActivity: [
        {
          type: "trend",
          content: "Your song is being used in over 2,400 videos this week",
          trending: true,
          time: "Trending now",
        },
        {
          type: "comment",
          user: "viral_dancer",
          verified: true,
          influential: true,
          content: "Used your song in my latest choreography! My followers are loving it!",
          post: "Song teaser video",
          time: "3 hours ago",
        },
        {
          type: "duet",
          user: "tiktok_star",
          verified: true,
          influential: true,
          followers: "2.4M",
          content: "Created a duet with your latest video",
          time: "1 day ago",
        },
      ],
      suggestedActions: [
        {
          type: "content",
          suggestion: "Create a compilation of top fan videos using your song",
          priority: "high",
        },
        {
          type: "collaboration",
          with: "viral_dancer",
          suggestion: "Reach out for a potential dance challenge collaboration",
          priority: "medium",
        },
        {
          type: "trend",
          suggestion: "Launch a hashtag challenge based on your trending song",
          priority: "high",
        },
      ],
      insights: [
        "Your sound has been used in 240% more videos compared to last month",
        "Videos posted between 7-9pm get 3.2x more views than other times",
        "Short clips (< 15 seconds) of your music perform best for discovery",
      ],
    },
    {
      id: 3,
      platform: "YouTube",
      icon: <Youtube className="h-6 w-6 text-red-600" />,
      metrics: {
        subscribers: "105K",
        growth: "+2.1%",
        engagement: "4.2%",
        views: "1.2M",
        watchTime: "86K hours",
      },
      recentActivity: [
        {
          type: "comment",
          user: "music_reviewer",
          verified: true,
          influential: true,
          content: "One of the best productions I've heard this year. I'll be covering this in my next review.",
          post: "Official Music Video",
          time: "6 hours ago",
        },
        {
          type: "mention",
          user: "guitar_tutorials",
          verified: true,
          influential: true,
          content: "Just posted a tutorial for your latest track! Check it out: [link]",
          time: "2 days ago",
        },
        {
          type: "subscription",
          content: "5 music channels with 100K+ subscribers subscribed this week",
          time: "This week",
        },
      ],
      suggestedActions: [
        {
          type: "comment",
          to: "music_reviewer",
          suggestion: "Thank them and offer an exclusive for their channel",
          priority: "high",
        },
        {
          type: "collaboration",
          with: "guitar_tutorials",
          suggestion: "Offer to feature their tutorial on your channel",
          priority: "medium",
        },
        {
          type: "content",
          suggestion: "Create a 'Responding to Comments' video for your most popular upload",
          priority: "medium",
        },
      ],
      insights: [
        "Your audience retention is 45% higher on acoustic performances",
        "Subscribers from music review channels have a 3.2x higher engagement rate",
        "Adding timestamps to your longer videos increases watch time by 28%",
      ],
    },
    {
      id: 4,
      platform: "Twitter",
      icon: <Twitter className="h-6 w-6 text-blue-400" />,
      metrics: {
        followers: "18.5K",
        growth: "+1.8%",
        engagement: "3.4%",
        impressions: "210K",
        mentions: "342",
      },
      recentActivity: [
        {
          type: "mention",
          user: "music_journalist",
          verified: true,
          influential: true,
          content:
            "Working on a piece about emerging artists reshaping the indie scene. @your_handle is definitely one to watch.",
          time: "4 hours ago",
        },
        {
          type: "reply",
          user: "playlist_service",
          verified: true,
          influential: true,
          content: "We'd love to feature your music in our discovery playlist. DM us!",
          post: "EP announcement",
          time: "1 day ago",
        },
        {
          type: "trend",
          content: "Your EP hashtag has been used in over 500 tweets this week",
          time: "This week",
        },
      ],
      suggestedActions: [
        {
          type: "reply",
          to: "music_journalist",
          suggestion: "Thank them and offer to provide quotes for their article",
          priority: "high",
        },
        {
          type: "message",
          to: "playlist_service",
          suggestion: "Follow up on their playlist feature offer",
          priority: "high",
        },
        {
          type: "content",
          suggestion: "Create a Twitter thread highlighting your creative process",
          priority: "medium",
        },
      ],
      insights: [
        "Questions in your tweets receive 78% more engagement than statements",
        "Tweets with behind-the-scenes photos get 2.1x more retweets",
        "Your audience is most active between 12-2pm on weekdays",
      ],
    },
    {
      id: 5,
      platform: "Facebook",
      icon: <Facebook className="h-6 w-6 text-blue-600" />,
      metrics: {
        followers: "32.1K",
        growth: "+0.9%",
        engagement: "2.8%",
        impressions: "95K",
        eventResponses: "1.2K",
      },
      recentActivity: [
        {
          type: "event",
          content: "Your upcoming show has 1,200+ interested/going responses",
          post: "Summer Tour Event",
          time: "Active now",
        },
        {
          type: "comment",
          user: "venue_official",
          verified: true,
          influential: true,
          content: "We're excited to host you next month! The pre-sales are looking great.",
          post: "Tour announcement",
          time: "1 day ago",
        },
        {
          type: "share",
          user: "local_radio",
          verified: true,
          influential: true,
          content: "Shared your tour dates with their 50K followers",
          time: "2 days ago",
        },
      ],
      suggestedActions: [
        {
          type: "content",
          suggestion: "Create a 'Getting ready for tour' behind-the-scenes post",
          priority: "medium",
        },
        {
          type: "event",
          suggestion: "Add a pre-show Q&A session to your event page",
          priority: "medium",
        },
        {
          type: "collaboration",
          with: "local_radio",
          suggestion: "Reach out about a possible interview before the show",
          priority: "high",
        },
      ],
      insights: [
        "Event posts receive 3.4x more engagement than regular updates",
        "Your audience on Facebook skews older (35-55) than other platforms",
        "Video content gets 68% more reach than image posts on your page",
      ],
    },
  ]

  const audienceSegments = [
    {
      id: 1,
      name: "Core Fans",
      size: "12,450",
      growth: "+8.3% this month",
      engagement: "High",
      description: "Dedicated listeners who engage with most content",
      platforms: ["Spotify", "Instagram", "YouTube"],
      demographics: {
        age: "25-34 (62%)",
        gender: "Female (58%), Male (40%), Non-binary (2%)",
        topLocations: ["Los Angeles", "New York", "London", "Toronto", "Berlin"],
      },
      behaviors: {
        listenFrequency: "4.2 days per week",
        avgSessionLength: "38 minutes",
        contentPreference: "Behind-the-scenes and personal updates",
        peakActivity: "Evenings and weekends",
      },
      aiInsights: [
        "This segment has grown 8.3% since your latest EP release",
        "They're 4x more likely to attend live shows than casual listeners",
        "Content mentioning creative process gets 2.3x more engagement from this group",
      ],
    },
    {
      id: 2,
      name: "Casual Listeners",
      size: "45,320",
      growth: "+12.7% this month",
      engagement: "Medium",
      description: "Stream occasionally, low social engagement",
      platforms: ["Spotify", "Apple Music"],
      demographics: {
        age: "18-24 (48%), 25-34 (32%)",
        gender: "Male (52%), Female (46%), Non-binary (2%)",
        topLocations: ["Chicago", "Austin", "Seattle", "Portland", "Miami"],
      },
      behaviors: {
        listenFrequency: "1.8 days per week",
        avgSessionLength: "22 minutes",
        contentPreference: "New releases and playlist features",
        peakActivity: "Commute hours (8-9am, 5-6pm)",
      },
      aiInsights: [
        "This segment discovers your music primarily through playlists (72%)",
        "They're most responsive to video content on TikTok and Instagram",
        "Conversion to core fans increases 3x when engaged with 3+ pieces of content",
      ],
    },
    {
      id: 3,
      name: "New Discoverers",
      size: "8,760",
      growth: "+27.5% this month",
      engagement: "Low",
      description: "Recently discovered your music through playlists",
      platforms: ["Spotify", "TikTok"],
      demographics: {
        age: "16-24 (73%)",
        gender: "Female (61%), Male (37%), Non-binary (2%)",
        topLocations: ["Mexico City", "São Paulo", "Madrid", "Paris", "Sydney"],
      },
      behaviors: {
        listenFrequency: "1.2 days per week",
        avgSessionLength: "18 minutes",
        contentPreference: "Short-form video content",
        peakActivity: "Late evenings (9pm-12am)",
      },
      aiInsights: [
        "Your recent TikTok trend drove 68% of this segment's growth",
        "They're discovering you primarily through the 'Summer Vibes' playlist",
        "Content in Spanish could engage the growing Mexico City audience (27% of new fans)",
      ],
    },
    {
      id: 4,
      name: "Event Attendees",
      size: "3,240",
      growth: "+2.1% this month",
      engagement: "Medium",
      description: "Attended live shows but limited streaming",
      platforms: ["Instagram", "Facebook"],
      demographics: {
        age: "30-45 (58%)",
        gender: "Female (54%), Male (45%), Non-binary (1%)",
        topLocations: ["Boston", "Philadelphia", "Denver", "Minneapolis", "Nashville"],
      },
      behaviors: {
        listenFrequency: "0.8 days per week",
        avgSessionLength: "25 minutes",
        contentPreference: "Event announcements and live footage",
        peakActivity: "Weekends and evenings",
      },
      aiInsights: [
        "This segment is 5x more likely to purchase merchandise at events",
        "They primarily follow you for event updates rather than music discovery",
        "Email marketing has 3.2x higher conversion rate with this segment than social media",
      ],
    },
  ]

  const campaigns = [
    {
      id: 1,
      name: "Summer EP Launch",
      status: "Active",
      audience: "All Segments",
      engagement: "24.5%",
      posts: "12/15",
      timeline: "May 15 - June 30, 2023",
      performance: {
        impressions: "245,320",
        clicks: "32,450",
        conversions: "8,760",
        roi: "3.2x",
      },
      platforms: ["Instagram", "TikTok", "Spotify", "YouTube"],
      aiInsights: [
        "Video content is outperforming static posts by 3.2x",
        "Core fans are sharing content at 2x the rate of previous campaigns",
        "Consider adding behind-the-scenes content to boost engagement further",
      ],
      upcomingPosts: [
        {
          platform: "Instagram",
          type: "Reel",
          date: "June 12, 2023",
          content: "EP Track Preview",
        },
        {
          platform: "TikTok",
          type: "Video",
          date: "June 15, 2023",
          content: "Dance Challenge",
        },
        {
          platform: "Instagram",
          type: "Post",
          date: "June 20, 2023",
          content: "Release Day Announcement",
        },
      ],
    },
    {
      id: 2,
      name: "Acoustic Sessions Promo",
      status: "Scheduled",
      audience: "Core Fans, Event Attendees",
      engagement: "N/A",
      posts: "0/8",
      timeline: "July 10 - August 5, 2023",
      performance: {
        impressions: "0",
        clicks: "0",
        conversions: "0",
        roi: "N/A",
      },
      platforms: ["YouTube", "Instagram", "Facebook"],
      aiInsights: [
        "Based on previous acoustic content, expect 30% higher engagement than studio recordings",
        "Schedule posts during evening hours (7-10pm) for optimal reach",
        "Consider adding captions in Spanish to engage growing Latin American audience",
      ],
      upcomingPosts: [
        {
          platform: "YouTube",
          type: "Video",
          date: "July 10, 2023",
          content: "Acoustic Session Teaser",
        },
        {
          platform: "Instagram",
          type: "Post",
          date: "July 12, 2023",
          content: "Behind the Scenes Photos",
        },
        {
          platform: "Facebook",
          type: "Event",
          date: "July 15, 2023",
          content: "Live Stream Announcement",
        },
      ],
    },
    {
      id: 3,
      name: "Remix Contest",
      status: "Draft",
      audience: "Core Fans, Music Producers",
      engagement: "N/A",
      posts: "0/10",
      timeline: "August 15 - September 30, 2023",
      performance: {
        impressions: "0",
        clicks: "0",
        conversions: "0",
        roi: "N/A",
      },
      platforms: ["Instagram", "SoundCloud", "Twitter"],
      aiInsights: [
        "Similar contests from comparable artists have generated 5-10x normal engagement",
        "Offering stems for multiple tracks increases participation by 45%",
        "Partner with a music production software company to increase reach and prizes",
      ],
      upcomingPosts: [
        {
          platform: "Instagram",
          type: "Post",
          date: "August 15, 2023",
          content: "Contest Announcement",
        },
        {
          platform: "SoundCloud",
          type: "Upload",
          date: "August 16, 2023",
          content: "Stem Files Release",
        },
        {
          platform: "Twitter",
          type: "Tweet",
          date: "August 20, 2023",
          content: "Submission Guidelines",
        },
      ],
    },
  ]

  const calendarEvents = [
    {
      id: 1,
      date: "2023-06-10",
      platform: "Instagram",
      type: "Post",
      content: "EP Cover Art Reveal",
      status: "Scheduled",
      time: "18:00",
      contentType: "social-media",
    },
    {
      id: 2,
      date: "2023-06-12",
      platform: "TikTok",
      type: "Video",
      content: "Studio Session Snippet",
      status: "Draft",
      time: "12:00",
      contentType: "short-video",
    },
    {
      id: 3,
      date: "2023-06-15",
      platform: "Twitter",
      type: "Tweet",
      content: "EP Release Countdown",
      status: "Scheduled",
      time: "09:00",
      contentType: "social-media",
    },
    {
      id: 4,
      date: "2023-06-15",
      platform: "Instagram",
      type: "Story",
      content: "24 Hour Countdown",
      status: "Scheduled",
      time: "12:00",
      contentType: "social-media",
    },
    {
      id: 5,
      date: "2023-06-16",
      platform: "All Platforms",
      type: "Release",
      content: "EP Release Day",
      status: "Scheduled",
      time: "00:00",
      contentType: "release",
    },
    {
      id: 6,
      date: "2023-06-16",
      platform: "Instagram",
      type: "Post",
      content: "EP Release Announcement",
      status: "Scheduled",
      time: "09:00",
      contentType: "social-media",
    },
    {
      id: 7,
      date: "2023-06-16",
      platform: "Facebook",
      type: "Live",
      content: "Release Day Q&A",
      status: "Scheduled",
      time: "19:00",
      contentType: "live-stream",
    },
    {
      id: 8,
      date: "2023-06-18",
      platform: "YouTube",
      type: "Video",
      content: "Music Video Premiere",
      status: "Draft",
      time: "15:00",
      contentType: "music-video",
    },
    {
      id: 9,
      date: "2023-06-20",
      platform: "Instagram",
      type: "Reel",
      content: "Fan Reactions Compilation",
      status: "Idea",
      time: null,
      contentType: "short-video",
    },
    {
      id: 10,
      date: "2023-06-22",
      platform: "Spotify",
      type: "Playlist",
      content: "Add to Artist Playlist",
      status: "Idea",
      time: null,
      contentType: "playlist",
    },
  ]

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-500" />
      case "twitter":
        return <Twitter className="h-5 w-5 text-blue-400" />
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />
      case "youtube":
        return <Youtube className="h-5 w-5 text-red-600" />
      case "tiktok":
        return <Music className="h-5 w-5 text-black" />
      case "spotify":
        return <Music className="h-5 w-5 text-green-500" />
      case "soundcloud":
        return <Music className="h-5 w-5 text-orange-500" />
      case "all platforms":
        return <Globe className="h-5 w-5 text-purple-500" />
      default:
        return <MessageCircle className="h-5 w-5 text-purple-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/10 text-green-500"
      case "scheduled":
        return "bg-amber-500/10 text-amber-500"
      case "draft":
        return "bg-blue-500/10 text-blue-500"
      case "idea":
        return "bg-purple-500/10 text-purple-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement.toLowerCase()) {
      case "high":
        return "bg-green-500/10 text-green-500"
      case "medium":
        return "bg-amber-500/10 text-amber-500"
      case "low":
        return "bg-blue-500/10 text-blue-500"
      case "very high":
        return "bg-purple-500/10 text-purple-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-500"
      case "medium":
        return "bg-amber-500/10 text-amber-500"
      case "low":
        return "bg-blue-500/10 text-blue-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "mention":
        return <AtSign className="h-4 w-4 text-purple-500" />
      case "message":
        return <MessageCircle className="h-4 w-4 text-green-500" />
      case "trend":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "duet":
        return <Users className="h-4 w-4 text-pink-500" />
      case "subscription":
        return <Bell className="h-4 w-4 text-amber-500" />
      case "reply":
        return <Reply className="h-4 w-4 text-blue-400" />
      case "event":
        return <Calendar className="h-4 w-4 text-green-600" />
      case "share":
        return <Share2 className="h-4 w-4 text-blue-600" />
      default:
        return <Heart className="h-4 w-4 text-red-500" />
    }
  }

  const getActionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "reply":
        return <Reply className="h-4 w-4" />
      case "content":
        return <Edit className="h-4 w-4" />
      case "message":
        return <MessageCircle className="h-4 w-4" />
      case "collaboration":
        return <Users className="h-4 w-4" />
      case "trend":
        return <TrendingUp className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const handleItemClick = (item, type) => {
    setSelectedItem(item)
    setDrawerType(type)
    setOpenDrawer(true)
  }

  const handleCreateContent = (platform, contentType) => {
    // Navigate to content creation page with pre-filled platform
    console.log(`Create ${contentType} content for ${platform}`)
    // This would typically use router.push or similar to navigate
    handoff("Content", contentType, { platform: platform })
  }

  const handleTakeAction = (action, platform) => {
    console.log(`Taking action: ${action.type} on ${platform}`)

    // Handle different action types
    switch (action.type.toLowerCase()) {
      case "reply":
      case "message":
        console.log(`Drafting response to ${action.to}`)
        // Could open a message composer or similar
        break
      case "content":
        handleCreateContent(platform, "social-media")
        break
      case "collaboration":
        console.log(`Setting up collaboration with ${action.with}`)
        break
      case "trend":
        console.log("Creating trend-based content")
        handleCreateContent(platform, "short-video")
        break
      case "event":
        console.log("Setting up event")
        break
      default:
        console.log("Generic action")
    }
  }

  const handleViewCalendarItem = (item) => {
    if (item.contentType && item.status.toLowerCase() !== "idea") {
      console.log(`Navigate to content editor for ${item.contentType}`)
      handoff("Content", item.contentType, {
        platform: item.platform,
        title: item.content,
        scheduledDate: item.date,
        scheduledTime: item.time,
      })
    } else if (item.status.toLowerCase() === "idea") {
      console.log(`Create new content from idea: ${item.content}`)
      handoff("Content", item.contentType || "social-media", {
        platform: item.platform,
        title: item.content,
        isIdea: true,
      })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Fan Agent</h1>
        <p className="text-muted-foreground">Optimize fan engagement and social media strategy</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search engagements..."
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
            <Calendar className="h-4 w-4" /> Schedule
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="engagement" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="w-full max-w-2xl mb-6 overflow-x-auto flex-nowrap">
          <TabsTrigger value="engagement" className="px-4 min-w-[100px] whitespace-nowrap text-xs md:text-sm">
            Engagement
          </TabsTrigger>
          <TabsTrigger value="fan-insights" className="px-4 min-w-[100px] whitespace-nowrap text-xs md:text-sm">
            Fan Insights
          </TabsTrigger>
          <TabsTrigger value="content-calendar" className="px-4 min-w-[100px] whitespace-nowrap text-xs md:text-sm">
            Content Calendar
          </TabsTrigger>
          <TabsTrigger value="agent-settings" className="px-4 min-w-[100px] whitespace-nowrap text-xs md:text-sm">
            Agent Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="engagement">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platformEngagements.map((platform) => (
              <Card
                key={platform.id}
                className="glass-effect transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                onClick={() => handleItemClick(platform, "platform")}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {platform.icon}
                      <CardTitle>{platform.platform}</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-cosmic-teal/10 text-cosmic-teal">
                      {platform.metrics.engagement} Engagement
                    </Badge>
                  </div>
                  <CardDescription>Recent activity and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{platform.metrics.followers}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-500">{platform.metrics.growth}</div>
                      <div className="text-xs text-muted-foreground">Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{platform.metrics.impressions}</div>
                      <div className="text-xs text-muted-foreground">Impressions</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Recent Activity</h4>
                    {platform.recentActivity.slice(0, 2).map((activity, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-1">
                            {activity.user && (
                              <>
                                <span className="font-medium">{activity.user}</span>
                                {activity.verified && <Check className="h-3 w-3 text-blue-500" />}
                                {activity.influential && <Star className="h-3 w-3 text-amber-500" />}
                              </>
                            )}
                            {activity.trending && <TrendingUp className="h-3 w-3 text-red-500" />}
                          </div>
                          <p className="mt-0.5 text-muted-foreground line-clamp-1">{activity.content}</p>
                          <div className="mt-0.5 text-muted-foreground">{activity.time}</div>
                        </div>
                      </div>
                    ))}

                    {platform.recentActivity.length > 2 && (
                      <div className="text-xs text-cosmic-teal font-medium">
                        +{platform.recentActivity.length - 2} more activities
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium">Priority Actions</h4>
                      <span className="text-xs text-muted-foreground">
                        {platform.suggestedActions.filter((a) => a.priority === "high").length} high priority
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTakeAction(platform.suggestedActions[0], platform.platform)
                        }}
                      >
                        {getActionIcon(platform.suggestedActions[0].type)}
                        <span className="ml-1 truncate">
                          {platform.suggestedActions[0].type.charAt(0).toUpperCase() +
                            platform.suggestedActions[0].type.slice(1)}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateContent(platform.platform, "social-media")
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fan-insights">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Audience Segments</CardTitle>
                <CardDescription>Fan groups based on engagement patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {audienceSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="rounded-lg border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                      onClick={() => handleItemClick(segment, "segment")}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{segment.name}</h3>
                          <p className="text-sm text-muted-foreground">{segment.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{segment.size}</div>
                          <div className="text-xs text-green-500">{segment.growth}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1 flex-wrap">
                          {segment.platforms.map((platform, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-cosmic-teal/10 text-cosmic-teal">
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getEngagementColor(segment.engagement)}`}>
                          {segment.engagement} Engagement
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>Coordinated content strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="rounded-lg border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                      onClick={() => handleItemClick(campaign, "campaign")}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">Targeting: {campaign.audience}</p>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          Posts: <span className="font-medium">{campaign.posts}</span>
                        </div>
                        <div className="text-sm">
                          Engagement: <span className="font-medium">{campaign.engagement}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                    onClick={() => {
                      console.log("Create new campaign")
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Create New Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content-calendar">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
              <CardDescription>Scheduled and published content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <Badge variant="outline" className="bg-cosmic-teal/10 text-cosmic-teal">
                    All Platforms
                  </Badge>
                  <Badge variant="outline">Instagram</Badge>
                  <Badge variant="outline">Twitter</Badge>
                  <Badge variant="outline">Facebook</Badge>
                  <Badge variant="outline">TikTok</Badge>
                  <Badge variant="outline">YouTube</Badge>
                  <Badge variant="outline">Spotify</Badge>
                </div>

                <div className="space-y-2">
                  {calendarEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                      onClick={() => handleViewCalendarItem(event)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-[80px] text-sm font-medium">
                          {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {event.time && <div className="text-xs text-muted-foreground">{event.time}</div>}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(event.platform)}
                            <span className="text-sm font-medium">{event.platform}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{event.content}</p>
                        </div>

                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent-settings">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>Configure your Fan Agent preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Engagement Monitoring</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Notification Frequency</label>
                        <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                          <option>Real-time</option>
                          <option>Hourly Digest</option>
                          <option>Daily Digest</option>
                          <option>Weekly Summary</option>
                        </select>
                        <p className="text-xs text-muted-foreground">How often to receive engagement notifications</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority Threshold</label>
                        <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                          <option>All Engagements</option>
                          <option>Verified Accounts Only</option>
                          <option>Influential Accounts Only</option>
                          <option>High Engagement Potential Only</option>
                        </select>
                        <p className="text-xs text-muted-foreground">Which engagements to prioritize</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monitored Platforms</label>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-cosmic-teal/10 text-cosmic-teal cursor-pointer">Instagram</Badge>
                        <Badge className="bg-cosmic-teal/10 text-cosmic-teal cursor-pointer">TikTok</Badge>
                        <Badge className="bg-cosmic-teal/10 text-cosmic-teal cursor-pointer">YouTube</Badge>
                        <Badge className="bg-cosmic-teal/10 text-cosmic-teal cursor-pointer">Twitter</Badge>
                        <Badge className="bg-cosmic-teal/10 text-cosmic-teal cursor-pointer">Facebook</Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          Spotify
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          SoundCloud
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          Apple Music
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Select platforms to monitor for engagement</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">AI Assistant Preferences</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Insight Frequency</label>
                        <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>After Campaigns</option>
                        </select>
                        <p className="text-xs text-muted-foreground">How often to receive AI insights</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Insight Focus</label>
                        <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                          <option>Balanced</option>
                          <option>Growth Opportunities</option>
                          <option>Engagement Analysis</option>
                          <option>Content Performance</option>
                          <option>Audience Trends</option>
                        </select>
                        <p className="text-xs text-muted-foreground">What to prioritize in AI insights</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Auto-Response Settings</label>
                      <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                        <option>Draft Only (Require Approval)</option>
                        <option>Auto-respond to Comments</option>
                        <option>Auto-respond to Messages</option>
                        <option>Auto-respond to All</option>
                        <option>Disabled</option>
                      </select>
                      <p className="text-xs text-muted-foreground">Configure automated engagement responses</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Platform Engagement Drawer */}
      <Sheet open={openDrawer && drawerType === "platform"} onOpenChange={setOpenDrawer}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-2">
              {selectedItem?.icon}
              <SheetTitle>{selectedItem?.platform}</SheetTitle>
            </div>
            <SheetDescription>Engagement insights and actions</SheetDescription>
          </SheetHeader>

          {selectedItem && drawerType === "platform" && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border text-center">
                  <div className="text-2xl font-bold">{selectedItem.metrics.followers}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                  <div className="text-xs text-green-500 mt-1">{selectedItem.metrics.growth}</div>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <div className="text-2xl font-bold">{selectedItem.metrics.engagement}</div>
                  <div className="text-xs text-muted-foreground">Engagement Rate</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    vs. {(Number.parseFloat(selectedItem.metrics.engagement) * 0.7).toFixed(1)}% avg
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Impressions</span>
                      <span className="font-medium">{selectedItem.metrics.impressions}</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  {selectedItem.metrics.reachRate && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Reach Rate</span>
                        <span className="font-medium">{selectedItem.metrics.reachRate}</span>
                      </div>
                      <Progress value={Number.parseInt(selectedItem.metrics.reachRate)} className="h-2" />
                    </div>
                  )}
                  {selectedItem.metrics.watchTime && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Watch Time</span>
                        <span className="font-medium">{selectedItem.metrics.watchTime}</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                  )}
                  {selectedItem.metrics.mentions && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mentions</span>
                        <span className="font-medium">{selectedItem.metrics.mentions}</span>
                      </div>
                      <Progress value={58} className="h-2" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {selectedItem.recentActivity.map((activity, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-sm">
                            {activity.user && (
                              <>
                                <span className="font-medium">{activity.user}</span>
                                {activity.verified && <Check className="h-3 w-3 text-blue-500" />}
                                {activity.influential && <Star className="h-3 w-3 text-amber-500" />}
                              </>
                            )}
                            {activity.trending && (
                              <span className="font-medium flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-red-500" /> Trending
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm">{activity.content}</p>
                          {activity.post && (
                            <div className="mt-1 text-xs text-muted-foreground">On: {activity.post}</div>
                          )}
                          <div className="mt-1 text-xs text-muted-foreground">{activity.time}</div>
                        </div>
                      </div>
                      {activity.user && (
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              console.log(`View profile: ${activity.user}`)
                            }}
                          >
                            <Eye className="mr-1 h-3 w-3" /> Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              console.log(`Reply to: ${activity.user}`)
                            }}
                          >
                            <Reply className="mr-1 h-3 w-3" /> Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Suggested Actions</h4>
                <div className="space-y-3">
                  {selectedItem.suggestedActions.map((action, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded-full ${getPriorityColor(action.priority)} flex-shrink-0`}>
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h5 className="text-sm font-medium">
                              {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                              {action.to && <span> to {action.to}</span>}
                              {action.with && <span> with {action.with}</span>}
                            </h5>
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm">{action.suggestion}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            console.log(`Draft action: ${action.type}`)
                            handleTakeAction(action, selectedItem.platform)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Draft
                        </Button>
                        <Button
                          className="h-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                          size="sm"
                          onClick={() => {
                            console.log(`Take action: ${action.type}`)
                            handleTakeAction(action, selectedItem.platform)
                            setOpenDrawer(false)
                          }}
                        >
                          <Zap className="mr-2 h-4 w-4" /> Take Action
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-cosmic-teal/10 border border-cosmic-teal/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cosmic-teal" />
                  <span>AI Insights</span>
                </h4>
                <ul className="space-y-2">
                  {selectedItem.insights.map((insight, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Zap className="h-4 w-4 text-cosmic-teal mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                  onClick={() => {
                    handleCreateContent(selectedItem.platform, "social-media")
                    setOpenDrawer(false)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Create Content
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    console.log(`View detailed analytics for ${selectedItem.platform}`)
                  }}
                >
                  <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Segment Drawer */}
      <Sheet open={openDrawer && drawerType === "segment"} onOpenChange={setOpenDrawer}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Audience Segment</SheetTitle>
            <SheetDescription>Detailed fan segment analysis</SheetDescription>
          </SheetHeader>

          {selectedItem && drawerType === "segment" && (
            <div className="mt-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getEngagementColor(selectedItem.engagement)}`}>
                  {selectedItem.engagement} Engagement
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedItem.size}</div>
                  <div className="text-xs text-muted-foreground">Total Fans</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">{selectedItem.growth}</div>
                  <div className="text-xs text-muted-foreground">Growth Rate</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Demographics</h4>
                <div className="space-y-2 p-4 rounded-lg border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Age:</span>
                    <span>{selectedItem.demographics.age}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="text-right">{selectedItem.demographics.gender}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-muted-foreground">Top Locations:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.demographics.topLocations.map((location, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Behavior Patterns</h4>
                <div className="space-y-2 p-4 rounded-lg border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Listen Frequency:</span>
                    <span>{selectedItem.behaviors.listenFrequency}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Avg Session:</span>
                    <span>{selectedItem.behaviors.avgSessionLength}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Content Preference:</span>
                    <span className="text-right">{selectedItem.behaviors.contentPreference}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Peak Activity:</span>
                    <span>{selectedItem.behaviors.peakActivity}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-cosmic-teal/10 border border-cosmic-teal/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cosmic-teal" />
                  <span>AI Insights</span>
                </h4>
                <ul className="space-y-2">
                  {selectedItem.aiInsights.map((insight, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Zap className="h-4 w-4 text-cosmic-teal mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    // Handle view detailed analytics
                    console.log("View detailed analytics for segment:", selectedItem.id)
                  }}
                >
                  <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                </Button>
                <Button
                  className="flex-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                  onClick={() => {
                    // Handle create targeted campaign
                    console.log("Create targeted campaign for segment:", selectedItem.id)
                  }}
                >
                  <Megaphone className="mr-2 h-4 w-4" /> Create Campaign
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Campaign Drawer */}
      <Sheet open={openDrawer && drawerType === "campaign"} onOpenChange={setOpenDrawer}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Campaign Details</SheetTitle>
            <SheetDescription>Coordinated content strategy</SheetDescription>
          </SheetHeader>

          {selectedItem && drawerType === "campaign" && (
            <div className="mt-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.timeline}</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Target Audience</h4>
                <p className="text-sm">{selectedItem.audience}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Platforms</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.platforms.map((platform, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedItem.status === "Active" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold">{selectedItem.performance.impressions}</div>
                      <div className="text-xs text-muted-foreground">Impressions</div>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold">{selectedItem.performance.clicks}</div>
                      <div className="text-xs text-muted-foreground">Clicks</div>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold">{selectedItem.performance.conversions}</div>
                      <div className="text-xs text-muted-foreground">Conversions</div>
                    </div>
                    <div className="p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-green-500">{selectedItem.performance.roi}</div>
                      <div className="text-xs text-muted-foreground">ROI</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Upcoming Posts</h4>
                <div className="space-y-2">
                  {selectedItem.upcomingPosts.map((post, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(post.platform)}
                          <span className="text-sm">{post.platform}</span>
                          <Badge variant="outline" className="text-xs">
                            {post.type}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{post.content}</p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-cosmic-teal/10 border border-cosmic-teal/20">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cosmic-teal" />
                  <span>AI Insights</span>
                </h4>
                <ul className="space-y-2">
                  {selectedItem.aiInsights.map((insight, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Zap className="h-4 w-4 text-cosmic-teal mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    // Handle view analytics
                    console.log("View analytics for campaign:", selectedItem.id)
                  }}
                >
                  <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                </Button>
                <Button
                  className="flex-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                  onClick={() => {
                    // Handle edit campaign
                    console.log("Edit campaign:", selectedItem.id)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Import missing icons
import { Star, Globe } from "lucide-react"
