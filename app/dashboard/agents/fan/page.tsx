"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter, Calendar, Instagram, Twitter, Facebook, Edit, Check, X, Download } from "lucide-react"

export default function FanAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const contentSuggestions = [
    {
      platform: "Instagram",
      type: "Post",
      content:
        "Just wrapped up an incredible studio session for the upcoming EP. Can't wait to share what we've been working on! #NewMusic #StudioLife",
      suggestedTime: "Tuesday, 6:00 PM",
    },
    {
      platform: "Twitter",
      type: "Tweet",
      content: "Which track from the 'Midnight Dreams' EP has been on repeat for you? Let me know in the replies! 🎧",
      suggestedTime: "Wednesday, 12:00 PM",
    },
    {
      platform: "Instagram",
      type: "Story",
      content: "24 hours until the new single drops! Set your reminders now - link in bio.",
      suggestedTime: "Thursday, 7:00 PM",
    },
    {
      platform: "Facebook",
      type: "Post",
      content:
        "Excited to announce we'll be performing at the Summer Festival on July 15th! Tickets available now - who's coming to see us?",
      suggestedTime: "Monday, 10:00 AM",
    },
    {
      platform: "Instagram",
      type: "Reel",
      content: "Behind the scenes of our latest music video shoot. Full video premieres next Friday!",
      suggestedTime: "Saturday, 2:00 PM",
    },
  ]

  const audienceSegments = [
    {
      name: "Core Fans",
      size: "12,450",
      engagement: "High",
      description: "Dedicated listeners who engage with most content",
      platforms: ["Spotify", "Instagram", "YouTube"],
    },
    {
      name: "Casual Listeners",
      size: "45,320",
      engagement: "Medium",
      description: "Stream occasionally, low social engagement",
      platforms: ["Spotify", "Apple Music"],
    },
    {
      name: "New Discoverers",
      size: "8,760",
      engagement: "Low",
      description: "Recently discovered your music through playlists",
      platforms: ["Spotify", "TikTok"],
    },
    {
      name: "Event Attendees",
      size: "3,240",
      engagement: "Medium",
      description: "Attended live shows but limited streaming",
      platforms: ["Instagram", "Facebook"],
    },
  ]

  const campaigns = [
    {
      name: "Summer EP Launch",
      status: "Active",
      audience: "All Segments",
      engagement: "24.5%",
      posts: "12/15",
    },
    {
      name: "Acoustic Sessions Promo",
      status: "Scheduled",
      audience: "Core Fans, Event Attendees",
      engagement: "N/A",
      posts: "0/8",
    },
    {
      name: "Remix Contest",
      status: "Draft",
      audience: "Core Fans, Music Producers",
      engagement: "N/A",
      posts: "0/10",
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
      default:
        return null
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
            placeholder="Search content..."
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

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full max-w-2xl mb-6 overflow-x-auto flex-nowrap">
          <TabsTrigger value="content" className="px-4 min-w-[100px] whitespace-nowrap text-xs md:text-sm">
            Content
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

        <TabsContent value="content">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Content Suggestions</CardTitle>
              <CardDescription>AI-generated content ideas for your social media platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Platform</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Content</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Suggested Time</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentSuggestions.map((suggestion, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(suggestion.platform)}
                              <div>
                                <div className="font-medium">{suggestion.platform}</div>
                                <div className="text-xs text-muted-foreground">{suggestion.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <p className="max-w-md">{suggestion.content}</p>
                          </td>
                          <td className="p-4 align-middle">{suggestion.suggestedTime}</td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Generate More Content</Button>
              </div>
            </CardContent>
          </Card>
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
                  {audienceSegments.map((segment, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{segment.name}</h3>
                          <p className="text-sm text-muted-foreground">{segment.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{segment.size}</div>
                          <div className="text-xs text-muted-foreground">Fans</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          {segment.platforms.map((platform, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-cosmic-teal/10 text-cosmic-teal">
                              {platform}
                            </span>
                          ))}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            segment.engagement === "High"
                              ? "bg-green-500/10 text-green-500"
                              : segment.engagement === "Medium"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
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
                  {campaigns.map((campaign, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">Targeting: {campaign.audience}</p>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            campaign.status === "Active"
                              ? "bg-green-500/10 text-green-500"
                              : campaign.status === "Scheduled"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
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
                  <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                    Create New Campaign
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
            <CardContent className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Content Calendar</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage your scheduled content across all platforms.
                </p>
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">View Calendar</Button>
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
                  <h3 className="text-lg font-medium mb-2">Content Generation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Content Tone</div>
                        <div className="text-sm text-muted-foreground">Set the tone for generated content</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>Professional</option>
                        <option>Casual</option>
                        <option>Enthusiastic</option>
                        <option>Informative</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Content Frequency</div>
                        <div className="text-sm text-muted-foreground">How often to generate new content</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Platform Connections</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <div>Instagram</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-5 w-5 text-blue-400" />
                        <div>Twitter</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <div>Facebook</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
