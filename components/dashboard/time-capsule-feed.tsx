"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle,
  Clock,
  Music2,
  FileText,
  Users,
  Database,
  BarChart2,
  ExternalLink,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TimelineEvent {
  id: string
  type: "scout" | "legal" | "metadata" | "fan" | "release" | "insight"
  title: string
  description: string
  time: string
  icon: React.ReactNode
  agent: string
  status: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function TimeCapsuleFeed() {
  const [expanded, setExpanded] = useState(true)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use mock data
    const mockEvents: TimelineEvent[] = [
      {
        id: "event-1",
        type: "scout",
        title: "Discovered 3 trending artists in your genre",
        description:
          "Found Luna Ray, The Midnight Collective, and Neon Palms trending on TikTok with similar sound to your catalog.",
        time: "2 hours ago",
        icon: <Music2 className="h-4 w-4 text-cosmic-teal" />,
        agent: "Scout Agent",
        status: "Added to your Scout feed",
        action: {
          label: "Pitch to top playlists",
          href: "/dashboard/agents/scout",
        },
      },
      {
        id: "event-2",
        type: "legal",
        title: "Auto-renewed distribution agreement with SoundWave",
        description:
          "Your distribution agreement with SoundWave was set to expire in 3 days. Based on your preferences, Aria automatically generated and sent a renewal agreement.",
        time: "Yesterday",
        icon: <FileText className="h-4 w-4 text-cosmic-teal" />,
        agent: "Legal Agent",
        status: "Renewal agreement sent",
        action: {
          label: "Review contract",
          onClick: () => console.log("Review contract clicked"),
        },
      },
      {
        id: "event-3",
        type: "fan",
        title: "Scheduled 3 social media posts for upcoming release",
        description:
          "Created and scheduled Instagram, Twitter, and TikTok posts for your upcoming 'Midnight Dreams' EP release on Friday.",
        time: "Yesterday",
        icon: <Users className="h-4 w-4 text-cosmic-teal" />,
        agent: "Fan Agent",
        status: "Posts scheduled for optimal engagement times",
        action: {
          label: "Edit schedule",
          href: "/dashboard/agents/fan",
        },
      },
      {
        id: "event-4",
        type: "metadata",
        title: "Fixed missing metadata on 5 tracks",
        description:
          "Detected and fixed missing ISRC codes, composer credits, and publishing information on 5 tracks in your back catalog.",
        time: "3 days ago",
        icon: <Database className="h-4 w-4 text-cosmic-teal" />,
        agent: "Metadata Agent",
        status: "Updated metadata on all platforms",
        action: {
          label: "View changes",
          href: "/dashboard/agents/metadata",
        },
      },
      {
        id: "event-5",
        type: "insight",
        title: "Generated monthly performance report",
        description:
          "Created a comprehensive report of your catalog's performance across all platforms for April 2023. Streaming up 12% month-over-month.",
        time: "1 week ago",
        icon: <BarChart2 className="h-4 w-4 text-cosmic-teal" />,
        agent: "Insights Agent",
        status: "Report available in Insights tab",
        action: {
          label: "View report",
          href: "/dashboard/insights",
        },
      },
    ]

    // Simulate API call
    setTimeout(() => {
      setEvents(mockEvents)
      setLoading(false)
    }, 500)
  }, [])

  return (
    <Card className="glass-effect bg-gradient-to-r from-cosmic-midnight to-cosmic-purple/30 border-cosmic-teal/20 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-cosmic-teal/10">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-cosmic-teal/10 p-1">
            <Zap className="h-5 w-5 text-cosmic-teal" />
          </div>
          <h2 className="text-lg font-bold font-heading">Time Capsule</h2>
          <span className="text-xs text-muted-foreground">What Patchline Did Since Last We Jammed</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-cosmic-teal">Review All Logs</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <CardContent className="p-4">
          <Tabs defaultValue="all" className="mb-4">
            <TabsList className="bg-background/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-5 w-5 text-muted-foreground animate-pulse mr-2" />
              <span className="text-muted-foreground">Loading timeline...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="group">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-background/20 p-3 mt-0.5">{event.icon}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-base font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{event.time}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-background/20 text-xs px-2 py-1 rounded-full">{event.agent}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" /> {event.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
                          >
                            View Logs
                          </Button>

                          {event.action &&
                            (event.action.onClick ? (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 px-3 text-xs bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                                onClick={event.action.onClick}
                              >
                                {event.action.label}
                              </Button>
                            ) : (
                              <a href={event.action.href}>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-3 text-xs bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                                >
                                  {event.action.label}
                                </Button>
                              </a>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full mt-4 border-cosmic-teal/30 text-cosmic-teal hover:bg-cosmic-teal/10"
              >
                View All Agent Activities <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
