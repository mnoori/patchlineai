"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, TrendingUp, Zap, Clock, Target, Edit3 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
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
  isActive: boolean
  onClick: () => void
}

function ContentIdeaCard({ idea, isActive, onClick }: ContentIdeaCardProps) {
  return (
    <div
      className={cn(
        "glass-effect rounded-xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 transform relative group",
        isActive
          ? "scale-105 ring-2 ring-brand-cyan shadow-lg shadow-brand-cyan/20"
          : "hover:scale-102 opacity-85 hover:opacity-100 hover:shadow-md",
      )}
      onClick={onClick}
    >
      {/* Trending Indicator */}
      {idea.trending && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs font-medium">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </Badge>
        </div>
      )}

      <div className="relative h-36">
        <Image
          src={idea.image || "/placeholder.svg"}
          alt={idea.topic}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Engagement Indicator */}
        {idea.engagement && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
              <Target className="h-3 w-3 mr-1" />
              {idea.engagement} Engagement
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <Badge className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan">
            Blog Post
          </Badge>
        </div>

        <h3 className="text-base font-bold mb-2 line-clamp-2 font-heading group-hover:text-brand-cyan transition-colors">
          {idea.topic}
        </h3>

        <p className="text-muted-foreground text-xs line-clamp-2 flex-grow">{idea.excerpt}</p>

        {/* AI Enhancement Indicator */}
        <div className="mt-3 pt-3 border-t border-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            AI-optimized for maximum impact
          </div>
        </div>
      </div>
    </div>
  )
}

// Write Your Own Card Component
function WriteYourOwnCard({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 transform relative group h-full",
        "border-2 border-dashed border-brand-cyan/30 hover:border-brand-cyan/60",
        "bg-gradient-to-br from-brand-cyan/5 to-brand-cyan/10 hover:from-brand-cyan/10 hover:to-brand-cyan/20",
        isActive && "ring-2 ring-brand-cyan shadow-lg shadow-brand-cyan/20 scale-105",
        !isActive && "hover:scale-102",
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-cyan/20 flex items-center justify-center group-hover:bg-brand-cyan/30 transition-colors">
          <Edit3 className="h-8 w-8 text-brand-cyan" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold font-heading group-hover:text-brand-cyan transition-colors">
            Write Your Own
          </h3>
          <p className="text-sm text-muted-foreground">
            Start with a blank canvas and create your own unique content from scratch
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>Full creative control</span>
        </div>
      </CardContent>
    </Card>
  )
}

interface ContentIdeaCarouselProps {
  contentType: ContentType
  onSelectIdea: (idea: ContentPrompt) => void
  selectedIdea?: string
  onWriteYourOwn?: () => void
}

export function ContentIdeaCarousel({
  contentType,
  onSelectIdea,
  selectedIdea = "",
  onWriteYourOwn,
}: ContentIdeaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0) // Start with "Write Your Own" selected
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
          // ... other blog ideas
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
        ]
      // Add more content type ideas...
      default:
        return []
    }
  }

  const ideas = getIdeasForContentType(contentType)

  // Update the content type label in the UI
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

  // Find and set active index based on selected idea
  useEffect(() => {
    if (selectedIdea) {
      const index = ideas.findIndex((idea) => idea.topic === selectedIdea)
      if (index >= 0) {
        setActiveIndex(index + 1) // +1 because "Write Your Own" is at index 0
      }
    }
  }, [selectedIdea, ideas])

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : ideas.length)) // ideas.length because "Write Your Own" is at the end when cycling
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < ideas.length ? prev + 1 : 0))
  }

  const handleSelect = (index: number) => {
    setActiveIndex(index)
  }

  // Scroll to active item
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const totalItems = ideas.length + 1 // +1 for "Write Your Own" card

      if (activeIndex < totalItems) {
        const activeItem = container.children[activeIndex] as HTMLElement

        if (activeItem) {
          const containerWidth = container.offsetWidth
          const itemWidth = activeItem.offsetWidth
          const scrollLeft = activeItem.offsetLeft - (containerWidth - itemWidth) / 2

          container.scrollTo({
            left: scrollLeft,
            behavior: "smooth",
          })
        }
      }
    }
  }, [activeIndex, ideas.length])

  const handleUseIdea = () => {
    if (activeIndex === 0) {
      // "Write Your Own" selected
      if (onWriteYourOwn) {
        onWriteYourOwn()
      }
      return
    }

    const selectedIdeaData = ideas[activeIndex - 1] // -1 because "Write Your Own" is at index 0

    // Convert idea to content prompt
    const prompt: ContentPrompt = {
      topic: selectedIdeaData.topic,
      keywords: selectedIdeaData.keywords,
      contentType: contentType,
      tone: selectedIdeaData.tone as any,
      length: selectedIdeaData.length as any,
      targetAudience: selectedIdeaData.targetAudience,
    }

    onSelectIdea(prompt)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-heading">AI-Curated Content Ideas</h2>
          <p className="text-sm text-muted-foreground">
            Trending topics optimized for your blog content, or start from scratch
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            className="h-8 w-8 rounded-full hover:bg-brand-cyan/20 hover:border-brand-cyan/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8 rounded-full hover:bg-brand-cyan/20 hover:border-brand-cyan/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-4 pb-2 snap-x scroll-smooth hide-scrollbar">
        {/* Write Your Own Card - FIRST */}
        <div className="snap-center min-w-[280px] w-[280px] flex-shrink-0">
          <WriteYourOwnCard isActive={activeIndex === 0} onClick={() => handleSelect(0)} />
        </div>

        {/* AI-Generated Ideas */}
        {ideas.map((idea, index) => (
          <div key={idea.topic} className="snap-center min-w-[280px] w-[280px] flex-shrink-0">
            <ContentIdeaCard
              idea={idea}
              isActive={index + 1 === activeIndex} // +1 because "Write Your Own" is at index 0
              onClick={() => handleSelect(index + 1)} // +1 because "Write Your Own" is at index 0
            />
          </div>
        ))}
      </div>

      {/* Enhanced Action Section */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleUseIdea}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-black font-medium px-6"
          >
            {activeIndex === 0 ? (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Start Writing
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Use This Idea
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Estimated creation time: 3-5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
