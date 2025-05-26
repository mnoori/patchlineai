"use client"

import { useState } from "react"
import { TrendingUp, Zap, Target, Edit3, Sparkles, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ContentPrompt } from "@/lib/blog-types"
import { cn } from "@/lib/utils"
import type { ContentType } from "@/lib/content-types"

interface ContentIdeaCardProps {
  idea: {
    topic: string
    tone: string
    length: string
    targetAudience: string
    keywords: string[]
    image: string
    trending?: boolean
    engagement?: string
    excerpt?: string
  }
  contentType: ContentType
  onClick: () => void
}

function ContentIdeaCard({ idea, contentType, onClick }: ContentIdeaCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "blog":
        return "Blog Post"
      case "epk":
        return "EPK"
      case "social":
        return "Social Post"
      case "short-video":
        return "Short Video"
      case "music-video":
        return "Music Video"
      default:
        return "Content"
    }
  }

  const getContentTypeColor = (type: ContentType) => {
    switch (type) {
      case "blog":
        return "cosmic-teal"
      case "epk":
        return "purple-500"
      case "social":
        return "blue-500"
      case "short-video":
        return "pink-500"
      case "music-video":
        return "orange-500"
      default:
        return "cosmic-teal"
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 transform relative group overflow-hidden",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-cosmic-teal/20",
        "border border-muted/30 hover:border-cosmic-teal/50",
        isHovered && "ring-2 ring-cosmic-teal/30",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-4 p-4">
        {/* Image Section */}
        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={idea.image || "/placeholder.svg"}
            alt={idea.topic}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Trending Indicator */}
          {idea.trending && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs font-medium px-1.5 py-0.5">
                <TrendingUp className="h-2.5 w-2.5 mr-1" />
                Hot
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <Badge
              className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full",
                `bg-${getContentTypeColor(contentType)}/20 text-${getContentTypeColor(contentType)}`,
              )}
            >
              {getContentTypeLabel(contentType)}
            </Badge>

            {idea.engagement && (
              <Badge variant="secondary" className="text-xs bg-muted/50">
                <Target className="h-2.5 w-2.5 mr-1" />
                {idea.engagement}
              </Badge>
            )}
          </div>

          <h3 className="text-base font-bold mb-2 line-clamp-2 font-heading group-hover:text-cosmic-teal transition-colors">
            {idea.topic}
          </h3>

          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{idea.excerpt}</p>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1 mb-3">
            {idea.keywords.slice(0, 3).map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs px-2 py-0.5">
                {keyword}
              </Badge>
            ))}
          </div>

          {/* Hover Action */}
          <div
            className={cn(
              "flex items-center gap-2 text-xs transition-all duration-300",
              isHovered ? "text-cosmic-teal opacity-100" : "text-muted-foreground opacity-70",
            )}
          >
            <Sparkles className="h-3 w-3" />
            <span>Click to start creating</span>
            <ArrowRight className={cn("h-3 w-3 transition-transform duration-300", isHovered && "translate-x-1")} />
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-cosmic-teal/5 to-transparent transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      />
    </Card>
  )
}

// Write Your Own Card Component
function WriteYourOwnCard({ contentType, onClick }: { contentType: ContentType; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "blog":
        return "Write Your Own Blog Post"
      case "epk":
        return "Create Custom EPK"
      case "social":
        return "Write Custom Social Post"
      case "short-video":
        return "Create Custom Video Concept"
      case "music-video":
        return "Design Custom Music Video"
      default:
        return "Write Your Own"
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 transform relative group",
        "border-2 border-dashed border-cosmic-teal/30 hover:border-cosmic-teal/60",
        "bg-gradient-to-br from-cosmic-teal/5 to-cosmic-teal/10 hover:from-cosmic-teal/10 hover:to-cosmic-teal/20",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-cosmic-teal/20",
        isHovered && "ring-2 ring-cosmic-teal/30",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-cosmic-teal/20 flex items-center justify-center group-hover:bg-cosmic-teal/30 transition-colors flex-shrink-0">
          <Edit3 className="h-6 w-6 text-cosmic-teal" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold font-heading group-hover:text-cosmic-teal transition-colors mb-1">
            {getContentTypeLabel(contentType)}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Start with a blank canvas and create your own unique content from scratch
          </p>

          <div
            className={cn(
              "flex items-center gap-2 text-xs transition-all duration-300",
              isHovered ? "text-cosmic-teal opacity-100" : "text-muted-foreground opacity-70",
            )}
          >
            <Zap className="h-3 w-3" />
            <span>Full creative control</span>
            <ArrowRight className={cn("h-3 w-3 transition-transform duration-300", isHovered && "translate-x-1")} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EnhancedContentIdeaCarouselProps {
  contentType: ContentType
  onSelectIdea: (idea: ContentPrompt) => void
  onWriteYourOwn?: () => void
}

export function EnhancedContentIdeaCarousel({
  contentType,
  onSelectIdea,
  onWriteYourOwn,
}: EnhancedContentIdeaCarouselProps) {
  // Get ideas based on content type
  const getIdeasForContentType = (type: ContentType) => {
    switch (type) {
      case "blog":
        return [
          {
            topic: "The State of AI in Music: Beyond the Hype",
            tone: "professional",
            length: "long",
            targetAudience: "music industry professionals",
            keywords: ["AI", "music industry", "technology", "innovation"],
            image: "/music-industry-ai-blog.png",
            trending: true,
            engagement: "High",
            excerpt:
              "How artificial intelligence is transforming the music industry landscape and what it means for artists, labels, and fans.",
          },
          {
            topic: "How Independent Labels Can Compete Using AI",
            tone: "informative",
            length: "medium",
            targetAudience: "label owners",
            keywords: ["independent labels", "AI tools", "competition", "strategy"],
            image: "/independent-labels-ai.png",
            trending: false,
            engagement: "Medium",
            excerpt: "Leveling the playing field with major labels through strategic AI implementation.",
          },
          {
            topic: "Metadata: The Hidden Value in Your Music Catalog",
            tone: "educational",
            length: "medium",
            targetAudience: "artists and labels",
            keywords: ["metadata", "music catalog", "value", "optimization"],
            image: "/music-metadata-management.png",
            trending: false,
            engagement: "High",
            excerpt: "Why proper metadata management is crucial for maximizing your music's potential.",
          },
          {
            topic: "Agent-Based Workflows: The Future of Creative Production",
            tone: "visionary",
            length: "long",
            targetAudience: "creative professionals",
            keywords: ["AI agents", "workflows", "creative production", "automation"],
            image: "/ai-agent-workflows.png",
            trending: true,
            engagement: "High",
            excerpt: "How AI agents are transforming creative workflows in the music industry.",
          },
        ]
      case "epk":
        return [
          {
            topic: "Emerging Artist Professional EPK",
            tone: "professional",
            length: "comprehensive",
            targetAudience: "media outlets and venues",
            keywords: ["press kit", "artist bio", "media coverage"],
            image: "/music-talent-discovery.png",
            trending: true,
            engagement: "High",
            excerpt: "Complete press kit for breakthrough artists seeking media coverage and booking opportunities.",
          },
          {
            topic: "Festival-Ready Artist Package",
            tone: "professional",
            length: "comprehensive",
            targetAudience: "festival programmers",
            keywords: ["festival", "live performance", "booking"],
            image: "/music-education-dashboard.png",
            trending: false,
            engagement: "High",
            excerpt: "Comprehensive EPK designed for festival submissions and major venue bookings.",
          },
          {
            topic: "Label Showcase EPK",
            tone: "professional",
            length: "comprehensive",
            targetAudience: "industry professionals",
            keywords: ["label", "roster", "showcase"],
            image: "/music-analytics-dashboard.png",
            trending: false,
            engagement: "Medium",
            excerpt: "Multi-artist press kit for record labels showcasing their roster to industry professionals.",
          },
        ]
      case "social":
        return [
          {
            topic: "New Release Announcement Campaign",
            tone: "enthusiastic",
            length: "short",
            targetAudience: "fans and followers",
            keywords: ["new release", "announcement", "excitement"],
            image: "/music-industry-ai-blog.png",
            trending: true,
            engagement: "Very High",
            excerpt: "Multi-platform social media strategy for announcing and promoting new music releases.",
          },
          {
            topic: "Behind-the-Scenes Content Series",
            tone: "casual",
            length: "medium",
            targetAudience: "engaged fans",
            keywords: ["behind scenes", "authentic", "process"],
            image: "/music-education-technology.png",
            trending: false,
            engagement: "High",
            excerpt: "Authentic, engaging content showing the creative process and artist personality.",
          },
          {
            topic: "Fan Engagement Challenge",
            tone: "playful",
            length: "short",
            targetAudience: "active community",
            keywords: ["challenge", "engagement", "community"],
            image: "/ai-ethics-music.png",
            trending: true,
            engagement: "Very High",
            excerpt: "Interactive social media campaign designed to boost fan participation and community building.",
          },
        ]
      case "short-video":
        return [
          {
            topic: "Music Production Process Timelapse",
            tone: "educational",
            length: "30s",
            targetAudience: "aspiring producers",
            keywords: ["production", "timelapse", "educational"],
            image: "/music-education-technology.png",
            trending: true,
            engagement: "Very High",
            excerpt: "Engaging short-form content showing the creation of a track from start to finish.",
          },
          {
            topic: "Artist Challenge Response",
            tone: "playful",
            length: "15s",
            targetAudience: "social media users",
            keywords: ["challenge", "trending", "viral"],
            image: "/ai-agent-workflows.png",
            trending: true,
            engagement: "Very High",
            excerpt: "Trending challenge adaptation that showcases artist personality and creativity.",
          },
        ]
      case "music-video":
        return [
          {
            topic: "Narrative-Driven Music Video",
            tone: "cinematic",
            length: "full-length",
            targetAudience: "music video enthusiasts",
            keywords: ["narrative", "storytelling", "cinematic"],
            image: "/music-industry-ai-blog.png",
            trending: true,
            engagement: "Very High",
            excerpt: "Story-based music video concept with character development and visual storytelling.",
          },
          {
            topic: "Performance-Based Visual Concept",
            tone: "energetic",
            length: "full-length",
            targetAudience: "live music fans",
            keywords: ["performance", "energy", "live"],
            image: "/music-analytics-dashboard.png",
            trending: false,
            engagement: "High",
            excerpt: "High-energy performance video with dynamic cinematography and lighting design.",
          },
        ]
      default:
        return []
    }
  }

  const ideas = getIdeasForContentType(contentType)

  const handleSelectIdea = (ideaData: any) => {
    // Convert idea to content prompt and immediately proceed
    const prompt: ContentPrompt = {
      topic: ideaData.topic,
      keywords: ideaData.keywords,
      contentType: contentType,
      tone: ideaData.tone as any,
      length: ideaData.length as any,
      targetAudience: ideaData.targetAudience,
    }

    onSelectIdea(prompt)
  }

  const handleWriteYourOwn = () => {
    if (onWriteYourOwn) {
      onWriteYourOwn()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-heading">AI-Curated Content Ideas</h2>
        <p className="text-sm text-muted-foreground">
          Choose from trending topics optimized for your content, or start from scratch
        </p>
      </div>

      <div className="space-y-4">
        {/* Write Your Own Card - FIRST */}
        <WriteYourOwnCard contentType={contentType} onClick={handleWriteYourOwn} />

        {/* AI-Generated Ideas */}
        {ideas.map((idea) => (
          <ContentIdeaCard
            key={idea.topic}
            idea={idea}
            contentType={contentType}
            onClick={() => handleSelectIdea(idea)}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Estimated creation time: 3-5 minutes</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>AI-optimized for maximum impact</span>
        </div>
      </div>
    </div>
  )
}
