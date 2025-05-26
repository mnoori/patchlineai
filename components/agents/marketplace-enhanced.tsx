"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  SlidersHorizontal,
  Zap,
  Globe,
  Music,
  Video,
  FileText,
  Users,
  CheckCircle2,
  Star,
  Plus,
  Sparkles,
  Headphones,
  Code,
  Layers,
  Briefcase,
  BarChart,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface AgentCard {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  iconColor: string
  category: string
  rating: number
  reviews: number
  users: number
  price: number
  features: string[]
  status?: "featured" | "popular" | "new" | "enterprise" | "coming-soon"
}

export function MarketplaceEnhanced() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<AgentCard | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const agents: AgentCard[] = [
    {
      id: "sync-opportunities",
      name: "Sync Opportunities Agent",
      description:
        "The Sync Opportunities Agent continuously scans hundreds of music supervisors' briefs and matches them with your catalog based on mood, genre, tempo, and lyrical content. Get notified when there's a perfect match for your music.",
      icon: <Music className="h-8 w-8" />,
      iconColor: "text-cyan-400",
      category: "Sync",
      rating: 4.8,
      reviews: 48,
      users: 1200,
      price: 29,
      status: "featured",
      features: [
        "Access to 500+ active briefs from top music supervisors",
        "AI-powered matching based on audio analysis and brief requirements",
        "Automated pitch generation and submission tracking",
        "Real-time notifications for high-match opportunities",
        "Performance analytics and success tracking",
      ],
    },
    {
      id: "global-trends",
      name: "Global Trends Agent",
      description: "Track emerging music trends across different markets",
      icon: <Globe className="h-8 w-8" />,
      iconColor: "text-cyan-400",
      category: "A&R",
      rating: 4.8,
      reviews: 32,
      users: 1050,
      price: 19,
      status: "new",
      features: [
        "Real-time trend analysis across 40+ countries",
        "Genre and sub-genre emergence detection",
        "Predictive analytics for trend forecasting",
        "Customizable alerts for specific markets",
        "Weekly trend reports and insights",
      ],
    },
    {
      id: "remix-matchmaker",
      name: "Remix Matchmaker",
      description: "Connect with remixers and producers for your tracks",
      icon: <Music className="h-8 w-8" />,
      iconColor: "text-pink-500",
      category: "Production",
      rating: 4.7,
      reviews: 56,
      users: 2340,
      price: 24,
      status: "popular",
      features: [
        "Access to network of 5,000+ verified remixers",
        "Style matching algorithm for perfect artist pairing",
        "Automated stem delivery and project management",
        "Contract and payment handling",
        "Release coordination with distributors",
      ],
    },
    {
      id: "video-content-creator",
      name: "Video Content Creator",
      description: "Generate promotional videos for your releases",
      icon: <Video className="h-8 w-8" />,
      iconColor: "text-cyan-400",
      category: "Marketing",
      rating: 4.9,
      reviews: 78,
      users: 3120,
      price: 29,
      status: "popular",
      features: [
        "AI-powered video generation from audio",
        "Customizable templates for different platforms",
        "Automatic resizing for social media formats",
        "Motion graphics synchronized to your music",
        "Lyric video generation",
      ],
    },
    {
      id: "royalty-auditor",
      name: "Royalty Auditor",
      description: "Verify and reconcile royalty statements automatically",
      icon: <FileText className="h-8 w-8" />,
      iconColor: "text-red-500",
      category: "Finance",
      rating: 4.6,
      reviews: 42,
      users: 850,
      price: 49,
      status: "enterprise",
      features: [
        "Automated statement ingestion and processing",
        "Cross-platform royalty verification",
        "Discrepancy detection and reporting",
        "Historical payment analysis",
        "Revenue forecasting and trend analysis",
      ],
    },
    {
      id: "superfan-identifier",
      name: "Superfan Identifier",
      description: "Identify and engage your most valuable fans",
      icon: <Users className="h-8 w-8" />,
      iconColor: "text-blue-500",
      category: "Fan",
      rating: 4.8,
      reviews: 28,
      users: 920,
      price: 19,
      status: "new",
      features: [
        "Cross-platform fan activity tracking",
        "Engagement scoring and segmentation",
        "Superfan behavior pattern recognition",
        "Targeted campaign recommendations",
        "Fan journey mapping and optimization",
      ],
    },
    {
      id: "release-strategy-optimizer",
      name: "Release Strategy Optimizer",
      description: "AI-powered release planning and optimization",
      icon: <Zap className="h-8 w-8" />,
      iconColor: "text-cyan-400",
      category: "Marketing",
      rating: 0,
      reviews: 0,
      users: 0,
      price: 0,
      status: "coming-soon",
      features: [
        "Optimal release date recommendations",
        "Platform-specific strategy planning",
        "Pre-save and marketing timeline generation",
        "Competitive release analysis",
        "Performance prediction modeling",
      ],
    },
    {
      id: "tour-planner",
      name: "Tour Planner",
      description: "Data-driven tour routing and venue selection",
      icon: <Zap className="h-8 w-8" />,
      iconColor: "text-cyan-400",
      category: "Live",
      rating: 0,
      reviews: 0,
      users: 0,
      price: 0,
      status: "coming-soon",
      features: [
        "Fan density mapping for optimal routing",
        "Venue matching based on audience size and demographics",
        "Budget optimization and revenue forecasting",
        "Local promotion strategy recommendations",
        "Tour performance analytics",
      ],
    },
    {
      id: "collaboration-matchmaker",
      name: "Collaboration Matchmaker",
      description: "Find the perfect collaborators for your projects",
      icon: <Zap className="h-8 w-8" />,
      iconColor: "text-cyan-400",
      category: "Production",
      rating: 0,
      reviews: 0,
      users: 0,
      price: 0,
      status: "coming-soon",
      features: [
        "Style and sound compatibility analysis",
        "Collaboration opportunity scoring",
        "Automated outreach and introduction",
        "Project management and file sharing",
        "Split sheet and rights management",
      ],
    },
    {
      id: "playlist-pitching-assistant",
      name: "Playlist Pitching Assistant",
      description: "Optimize your playlist submission strategy",
      icon: <Headphones className="h-8 w-8" />,
      iconColor: "text-green-500",
      category: "Marketing",
      rating: 4.5,
      reviews: 36,
      users: 1450,
      price: 19,
      features: [
        "Curator matching algorithm",
        "Personalized pitch generation",
        "Submission tracking and follow-up",
        "Performance analytics",
        "Playlist growth monitoring",
      ],
    },
    {
      id: "metadata-optimizer",
      name: "Metadata Optimizer",
      description: "Enhance your tracks' discoverability with optimized metadata",
      icon: <Layers className="h-8 w-8" />,
      iconColor: "text-purple-500",
      category: "Metadata",
      rating: 4.7,
      reviews: 41,
      users: 1680,
      price: 14,
      features: [
        "Genre and subgenre optimization",
        "Keyword analysis and recommendations",
        "Streaming platform-specific metadata enhancement",
        "ISRC and rights management",
        "Metadata consistency verification",
      ],
    },
    {
      id: "contract-analyzer",
      name: "Contract Analyzer",
      description: "AI-powered music contract analysis and negotiation assistance",
      icon: <Briefcase className="h-8 w-8" />,
      iconColor: "text-amber-500",
      category: "Legal",
      rating: 4.9,
      reviews: 52,
      users: 760,
      price: 39,
      features: [
        "Clause-by-clause contract analysis",
        "Industry standard comparison",
        "Term negotiation recommendations",
        "Rights and royalty verification",
        "Plain language contract summaries",
      ],
    },
    {
      id: "audience-insights",
      name: "Audience Insights",
      description: "Deep analytics on your audience demographics and behavior",
      icon: <BarChart className="h-8 w-8" />,
      iconColor: "text-blue-500",
      category: "Analytics",
      rating: 4.6,
      reviews: 38,
      users: 1240,
      price: 24,
      features: [
        "Cross-platform audience data aggregation",
        "Demographic and psychographic analysis",
        "Listening behavior patterns",
        "Geographic heat mapping",
        "Audience growth and retention metrics",
      ],
    },
  ]

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const featuredAgents = filteredAgents.filter((agent) => agent.status === "featured")
  const popularAgents = filteredAgents.filter((agent) => agent.status === "popular")
  const newAgents = filteredAgents.filter((agent) => agent.status === "new")
  const comingSoonAgents = filteredAgents.filter((agent) => agent.status === "coming-soon")
  const enterpriseAgents = filteredAgents.filter((agent) => agent.status === "enterprise")
  const otherAgents = filteredAgents.filter((agent) => !agent.status)

  const handleOpenAgentDetails = (agent: AgentCard) => {
    setSelectedAgent(agent)
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "featured":
        return <Badge className="bg-pink-500 hover:bg-pink-600">Featured</Badge>
      case "popular":
        return <Badge className="bg-cyan-500 hover:bg-cyan-600">Popular</Badge>
      case "new":
        return <Badge className="bg-cyan-500 hover:bg-cyan-600">New</Badge>
      case "enterprise":
        return <Badge className="bg-red-500 hover:bg-red-600">Enterprise</Badge>
      case "coming-soon":
        return (
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            Coming Soon
          </Badge>
        )
      default:
        return null
    }
  }

  const renderStarRating = (rating: number, reviews: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : i < rating ? "text-yellow-400 fill-yellow-400 opacity-50" : "text-gray-400"}`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
        {rating > 0 && <span className="ml-1 text-xs text-muted-foreground">({reviews})</span>}
      </div>
    )
  }

  const renderAgentCard = (agent: AgentCard, isLarge = false) => {
    if (isLarge) {
      return (
        <Card
          key={agent.id}
          className="w-full bg-[#0f0f1a] border-[#1f1f2f] overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] hover:border-cyan-500/30 hover:scale-[1.02]"
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {agent.status && getStatusBadge(agent.status)}
                <h2 className="text-2xl font-bold mt-2">{agent.name}</h2>
                <p className="text-muted-foreground">{agent.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${agent.price}</div>
                <div className="text-sm text-muted-foreground">/month</div>
                <div className="text-xs text-muted-foreground mt-1">14-day free trial, cancel anytime</div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {agent.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                {renderStarRating(agent.rating, agent.reviews)}
                {agent.rating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    Used by {agent.users.toLocaleString()}+ labels and artists
                  </span>
                )}
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
              onClick={() => handleOpenAgentDetails(agent)}
              disabled={agent.status === "coming-soon"}
            >
              {agent.status === "coming-soon" ? (
                "Join Waitlist"
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" /> Add to Workspace
                </>
              )}
            </Button>
          </div>
        </Card>
      )
    }

    return (
      <Card
        key={agent.id}
        className={`bg-[#0f0f1a] border-[#1f1f2f] overflow-hidden transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:border-cyan-500/30 hover:scale-[1.03] ${agent.status === "coming-soon" ? "opacity-80" : ""}`}
      >
        <div className="p-6 relative">
          {agent.status && <div className="absolute top-3 right-3">{getStatusBadge(agent.status)}</div>}

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${agent.iconColor} bg-opacity-10 mb-4`}
          >
            {agent.icon}
          </div>

          <h3 className="text-xl font-bold mb-2">{agent.name}</h3>
          <p className="text-muted-foreground text-sm mb-4 h-12 line-clamp-2">{agent.description}</p>

          {agent.rating > 0 ? (
            <div className="flex items-center justify-between mb-4">
              {renderStarRating(agent.rating, agent.reviews)}
              <span className="text-sm text-muted-foreground">{agent.users.toLocaleString()} users</span>
            </div>
          ) : (
            <div className="h-6 mb-4"></div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold">
              ${agent.price}
              {agent.price > 0 ? <span className="text-xs font-normal text-muted-foreground">/month</span> : ""}
            </div>

            {agent.status === "coming-soon" ? (
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 hover:bg-gray-800"
                onClick={() => handleOpenAgentDetails(agent)}
              >
                Join Waitlist
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => handleOpenAgentDetails(agent)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  const renderAgentSection = (title: string, agents: AgentCard[], isLarge = false) => {
    if (agents.length === 0) return null

    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className={isLarge ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {agents.map((agent) => renderAgentCard(agent, isLarge))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-[#090914] -mx-4 -mt-4 px-6 py-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Agent Marketplace</h1>
          <p className="text-muted-foreground">Discover and add specialized AI agents to enhance your workflow</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mt-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search agents..."
              className="pl-10 bg-[#0f0f1a] border-[#1f1f2f]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1 border-[#1f1f2f] bg-[#0f0f1a]">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="mt-8 space-y-8">
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">All Agents</h2>
            <div className="space-y-6">
              {/* Featured agents (large cards) */}
              {featuredAgents.map((agent) => renderAgentCard(agent, true))}

              {/* All other agents in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[...popularAgents, ...newAgents, ...enterpriseAgents, ...otherAgents, ...comingSoonAgents]
                  .filter((agent) => agent.status !== "featured")
                  .map((agent) => renderAgentCard(agent, false))}
              </div>
            </div>
          </div>

          {/* Build Your Own Agent Section */}
          <Card className="w-full bg-[#0f0f1a] border-[#1f1f2f] overflow-hidden mb-10">
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Build Your Own Agent</h2>
                <p className="text-muted-foreground">Create custom agents for your specific workflow needs</p>
              </div>

              <p className="text-sm">
                Have a unique workflow or specialized need? Build your own custom agent using our developer platform.
                Access our API, SDKs, and documentation to create agents tailored to your specific requirements.
              </p>

              <div className="space-y-3 mt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Access to Patchline's AI models and data pipeline</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Developer documentation and sample code</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Submit your agent to the marketplace and earn revenue</span>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <Button
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                  onClick={() => console.log("Access Developer Portal")}
                >
                  <Code className="mr-2 h-4 w-4" /> Access Developer Portal
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[#1f1f2f]"
                  onClick={() => console.log("View Documentation")}
                >
                  View Documentation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Agent Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#0f0f1a] border-[#1f1f2f]">
          {selectedAgent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAgent.iconColor} bg-opacity-10`}
                  >
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedAgent.name}</DialogTitle>
                    <DialogDescription>
                      {selectedAgent.category} •{" "}
                      {selectedAgent.status !== "coming-soon" ? `$${selectedAgent.price}/month` : "Coming Soon"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-[#1a1a2a]">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="reviews" disabled={selectedAgent.status === "coming-soon"}>
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <p>{selectedAgent.description}</p>

                  {selectedAgent.status !== "coming-soon" && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderStarRating(selectedAgent.rating, selectedAgent.reviews)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {selectedAgent.users.toLocaleString()}+ users
                      </span>
                    </div>
                  )}

                  <div className="rounded-md bg-[#1a1a2a] p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" /> Key Benefits
                    </h4>
                    <ul className="space-y-2">
                      {selectedAgent.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedAgent.status === "coming-soon" && (
                    <div className="rounded-md bg-[#1a1a2a] p-4">
                      <h4 className="font-medium mb-2">Release Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        This agent is currently in development and expected to launch in Q3 2023. Join the waitlist to
                        be notified when it becomes available and get early access.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="features" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">All Features</h4>
                    <ul className="space-y-3">
                      {selectedAgent.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="my-4 bg-[#1f1f2f]" />

                  <div className="space-y-4">
                    <h4 className="font-medium">Requirements</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Active Patchline subscription</li>
                      <li>• At least 10 tracks in your catalog</li>
                      <li>• Metadata must be properly formatted</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 mt-4">
                  {selectedAgent.status !== "coming-soon" ? (
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderStarRating(selectedAgent.rating, selectedAgent.reviews)}
                            <span className="text-sm">Based on {selectedAgent.reviews} reviews</span>
                          </div>
                        </div>

                        <Separator className="my-4 bg-[#1f1f2f]" />

                        {/* Sample reviews */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">Sarah J.</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              This agent has completely transformed our sync licensing strategy. We've secured three
                              placements in the first month alone!
                            </p>
                          </div>

                          <Separator className="my-4 bg-[#1f1f2f]" />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">Michael T.</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Great tool for discovering opportunities I would have otherwise missed. The interface
                              could use some improvements though.
                            </p>
                          </div>

                          <Separator className="my-4 bg-[#1f1f2f]" />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">Indie Label Co.</div>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              We've been using this for our entire catalog and the ROI has been incredible. The AI
                              matching is surprisingly accurate.
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      Reviews will be available once the agent is released.
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter>
                {selectedAgent.status === "coming-soon" ? (
                  <Button
                    className="w-full bg-[#1f1f2f] hover:bg-[#2a2a3a]"
                    onClick={() => {
                      console.log(`Join waitlist for ${selectedAgent.name}`)
                      setIsDialogOpen(false)
                    }}
                  >
                    Join Waitlist
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                    onClick={() => {
                      console.log(`Add ${selectedAgent.name} to workspace`)
                      setIsDialogOpen(false)
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4" /> Add to Workspace
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
