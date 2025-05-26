"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Share2, Video, Music, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContentType } from "@/lib/content-types"

interface ContentTypeSelectorProps {
  selectedType: ContentType
  onTypeChange: (type: ContentType) => void
}

const CONTENT_TYPES = [
  {
    id: "blog" as ContentType,
    title: "Blog Post",
    description: "Professional articles and thought leadership content",
    icon: FileText,
    features: ["SEO Optimized", "Industry Insights", "Thought Leadership"],
    buttonText: "Create Blog Post",
    gradient: "from-blue-500/20 to-purple-500/20",
    iconColor: "text-blue-400",
    available: true,
  },
  {
    id: "epk" as ContentType,
    title: "Electronic Press Kit",
    description: "Professional artist presentation and media kit",
    icon: User,
    features: ["Press Database Submission", "Media Outlet Distribution", "Professional PDF"],
    buttonText: "Create EPK",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
    available: true,
  },
  {
    id: "social" as ContentType,
    title: "Social Media",
    description: "Engaging posts for Instagram, Twitter, and TikTok",
    icon: Share2,
    features: ["Multi-Platform Posting", "Auto-Scheduling", "Hashtag Optimization"],
    buttonText: "Create Social Posts",
    gradient: "from-green-500/20 to-teal-500/20",
    iconColor: "text-green-400",
    available: true,
  },
  {
    id: "short-video" as ContentType,
    title: "Short Video",
    description: "Brief, impactful videos for social platforms",
    icon: Video,
    features: ["AI Video Generation", "Auto-Upload", "Platform Optimization"],
    buttonText: "Create Short Video",
    gradient: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
    available: true,
  },
  {
    id: "music-video" as ContentType,
    title: "Music Video",
    description: "Conceptual music videos with AI-generated visuals",
    icon: Music,
    features: ["Producer Matching", "Treatment Generation", "Budget Planning"],
    buttonText: "Create Music Video",
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
    available: true,
  },
]

export function ContentTypeSelector({ selectedType, onTypeChange }: ContentTypeSelectorProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cosmic-teal/10 border border-cosmic-teal/20">
          <Sparkles className="h-4 w-4 text-cosmic-teal" />
          <span className="text-sm font-medium text-cosmic-teal">AI-Powered Content Creation</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">What would you like to create?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose your content type and let our AI agents guide you through creating professional, industry-standard
          content tailored for the music industry.
        </p>
      </div>

      {/* Content Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {CONTENT_TYPES.map((type) => {
          const isSelected = selectedType === type.id
          const Icon = type.icon

          return (
            <Card
              key={type.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 cursor-pointer group",
                "hover:scale-105 hover:shadow-xl",
                isSelected && "ring-2 ring-cosmic-teal shadow-lg shadow-cosmic-teal/20",
                !type.available && "opacity-60 cursor-not-allowed",
                "bg-gradient-to-br from-background/50 to-background/80 backdrop-blur-sm border-muted/30",
              )}
              onClick={() => type.available && onTypeChange(type.id)}
            >
              {/* Background Gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", type.gradient)} />

              {/* Coming Soon Badge */}
              {!type.available && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-muted text-muted-foreground border-0">Coming Soon</Badge>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-6 h-6 rounded-full bg-cosmic-teal flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>
                </div>
              )}

              <CardContent className="p-6 relative z-10 h-full flex flex-col">
                <div className="space-y-4 flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center">
                    <Icon className={cn("h-6 w-6", type.iconColor)} />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{type.title}</h3>
                    <p className="text-muted-foreground text-sm">{type.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {type.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-cosmic-teal" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={cn(
                    "w-full mt-6 transition-all duration-300",
                    isSelected
                      ? "bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                      : "bg-cosmic-teal/20 hover:bg-cosmic-teal hover:text-black text-cosmic-teal",
                    !type.available && "opacity-50 cursor-not-allowed",
                  )}
                  disabled={!type.available}
                >
                  {type.available ? (
                    <>
                      {type.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Coming Soon"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Enhancement Note */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm text-purple-400">
            Each content type is optimized with AI-powered insights and industry best practices
          </span>
        </div>
      </div>
    </div>
  )
}
