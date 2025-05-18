"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, Globe, Music2, Video, Users, FileText, Zap, Star, Plus } from "lucide-react"

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")

  const featuredAgent = {
    name: "Sync Opportunities Agent",
    description: "Automatically match your catalog with sync briefs from film, TV, and advertising",
    longDescription:
      "The Sync Opportunities Agent continuously scans hundreds of music supervisors' briefs and matches them with your catalog based on mood, genre, tempo, and lyrical content. Get notified when there's a perfect match for your music.",
    price: "$29",
    period: "/month",
    rating: 4.8,
    reviews: 48,
    users: "1,200+",
    features: [
      "Access to 500+ active briefs from top music supervisors",
      "AI-powered matching based on audio analysis and brief requirements",
      "Automated pitch generation and submission tracking",
    ],
  }

  const availableAgents = [
    {
      icon: <Globe className="h-10 w-10 text-cosmic-teal" />,
      name: "Global Trends Agent",
      description: "Track emerging music trends across different markets",
      longDescription:
        "Identify emerging music trends across global markets before they go mainstream. Get insights on genre shifts, production techniques, and regional movements.",
      rating: 4.8,
      reviews: 32,
      users: "1,050",
      price: "$19",
      period: "/month",
      tag: "New",
    },
    {
      icon: <Music2 className="h-10 w-10 text-pink-500" />,
      name: "Remix Matchmaker",
      description: "Connect with remixers and producers for your tracks",
      longDescription:
        "Find the perfect remixer for your tracks based on style compatibility, past work, and audience overlap. Manage remix agreements and track progress.",
      rating: 4.7,
      reviews: 56,
      users: "2,340",
      price: "$24",
      period: "/month",
      tag: "Popular",
    },
    {
      icon: <Video className="h-10 w-10 text-cosmic-teal" />,
      name: "Video Content Creator",
      description: "Generate promotional videos for your releases",
      longDescription:
        "Automatically create eye-catching short-form videos for social media promotion. Includes audio visualization, lyric videos, and promo templates.",
      rating: 4.9,
      reviews: 78,
      users: "3,120",
      price: "$29",
      period: "/month",
      tag: "Popular",
    },
    {
      icon: <FileText className="h-10 w-10 text-red-500" />,
      name: "Royalty Auditor",
      description: "Verify and reconcile royalty statements automatically",
      longDescription:
        "Automatically audit royalty statements from DSPs and publishers. Identify discrepancies, track missing payments, and generate reconciliation reports.",
      rating: 4.6,
      reviews: 42,
      users: "850",
      price: "$49",
      period: "/month",
      tag: "Enterprise",
    },
    {
      icon: <Users className="h-10 w-10 text-blue-500" />,
      name: "Superfan Identifier",
      description: "Identify and engage your most valuable fans",
      longDescription:
        "Analyze fan behavior across platforms to identify superfans. Create targeted campaigns, exclusive offers, and personalized engagement strategies.",
      rating: 4.8,
      reviews: 28,
      users: "920",
      price: "$19",
      period: "/month",
      tag: "New",
    },
  ]

  const comingSoonAgents = [
    {
      icon: <Zap className="h-10 w-10 text-cosmic-teal" />,
      name: "Release Strategy Optimizer",
      description: "AI-powered release planning and optimization",
      longDescription:
        "Determine the optimal release strategy based on market trends, audience behavior, and competitive analysis. Get recommendations for release timing, marketing approach, and platform focus.",
    },
    {
      icon: <Zap className="h-10 w-10 text-cosmic-teal" />,
      name: "Tour Planner",
      description: "Data-driven tour routing and venue selection",
      longDescription:
        "Plan efficient tours based on fan demographics, streaming data, and venue analytics. Optimize routing, identify high-potential markets, and forecast ticket sales.",
    },
    {
      icon: <Zap className="h-10 w-10 text-cosmic-teal" />,
      name: "Collaboration Matchmaker",
      description: "Find the perfect collaborators for your projects",
      longDescription:
        "Discover compatible artists, producers, and songwriters based on style, audience overlap, and career stage. Facilitate introductions and manage collaboration workflows.",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Agent Marketplace</h1>
        <p className="text-muted-foreground">Discover and add specialized AI agents to enhance your workflow</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search agents..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Featured Agent */}
        <Card className="glass-effect bg-gradient-to-br from-cosmic-midnight to-cosmic-purple/30">
          <div className="p-2">
            <div className="rounded-sm px-3 py-1 text-xs font-medium bg-cosmic-pink text-black w-fit">Featured</div>
          </div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{featuredAgent.name}</h2>
                <p className="text-muted-foreground">{featuredAgent.longDescription}</p>

                <div className="space-y-2">
                  {featuredAgent.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="rounded-full bg-cosmic-teal/20 p-1 mr-2 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="#00F0FF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(featuredAgent.rating) ? "text-yellow-400" : "text-gray-400"}`}
                        fill={i < Math.floor(featuredAgent.rating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{featuredAgent.rating}</span>
                  <span className="text-sm text-muted-foreground">({featuredAgent.reviews})</span>
                </div>

                <div className="text-sm text-muted-foreground">Used by {featuredAgent.users} labels and artists</div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="flex justify-end">
                  <div className="text-right">
                    <div className="text-3xl font-bold">{featuredAgent.price}</div>
                    <div className="text-sm text-muted-foreground">{featuredAgent.period}</div>
                    <div className="text-xs text-muted-foreground mt-1">14-day free trial, cancel anytime</div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                    <Zap className="h-4 w-4 mr-2" /> Add to Workspace
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Agents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableAgents.map((agent, index) => (
            <Card
              key={index}
              className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 flex flex-col"
            >
              <CardContent className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="rounded-full bg-cosmic-midnight p-3">{agent.icon}</div>
                  {agent.tag && (
                    <div
                      className={`rounded-sm px-3 py-1 text-xs font-medium ${
                        agent.tag === "Popular"
                          ? "bg-cosmic-teal text-black"
                          : agent.tag === "New"
                            ? "bg-cosmic-teal/20 text-cosmic-teal"
                            : "bg-cosmic-pink/20 text-cosmic-pink"
                      }`}
                    >
                      {agent.tag}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
                <p className="text-muted-foreground mb-4">{agent.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(agent.rating) ? "text-yellow-400" : "text-gray-400"}`}
                        fill={i < Math.floor(agent.rating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{agent.rating}</span>
                  <span className="text-xs text-muted-foreground">({agent.reviews})</span>
                  <span className="text-xs text-muted-foreground ml-auto">{agent.users} users</span>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="font-bold">{agent.price}</span>
                    <span className="text-sm text-muted-foreground">{agent.period}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Coming Soon</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {comingSoonAgents.map((agent, index) => (
              <Card
                key={index}
                className="glass-effect border-dashed hover:border-cosmic-teal/30 transition-all duration-300 flex flex-col"
              >
                <CardContent className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="rounded-full bg-cosmic-midnight p-3">{agent.icon}</div>
                    <div className="rounded-sm px-3 py-1 text-xs font-medium bg-muted text-muted-foreground">
                      Coming Soon
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
                  <p className="text-muted-foreground mb-4">{agent.description}</p>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button variant="outline" className="w-full">
                    Join Waitlist
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Build Your Own Agent */}
        <Card className="glass-effect border-dashed hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader>
            <CardTitle>Build Your Own Agent</CardTitle>
            <CardDescription>Create custom agents for your specific workflow needs</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Have a unique workflow or specialized need? Build your own custom agent using our developer platform.
                Access our API, SDKs, and documentation to create agents tailored to your specific requirements.
              </p>

              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="rounded-full bg-cosmic-teal/20 p-1 mr-2 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#00F0FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Access to Patchline's AI models and data pipeline</span>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full bg-cosmic-teal/20 p-1 mr-2 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#00F0FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Developer documentation and sample code</span>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full bg-cosmic-teal/20 p-1 mr-2 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#00F0FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">Submit your agent to the marketplace and earn revenue</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="flex-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  Access Developer Portal
                </Button>
                <Button variant="outline" className="flex-1">
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
