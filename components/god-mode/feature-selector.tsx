"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Newspaper, Sparkles, ArrowRight, Brain, Zap, Target } from "lucide-react"
import { cn } from "@/lib/utils"

export type GodModeFeature = "documents" | "hr-recruiter" | "newsletter"

interface GodModeFeatureSelectorProps {
  selectedFeature: GodModeFeature | null
  onFeatureChange: (feature: GodModeFeature) => void
}

const GOD_MODE_FEATURES = [
  {
    id: "documents" as GodModeFeature,
    title: "Document Processing",
    description: "AI-powered document analysis for business expenses and tax preparation",
    icon: FileText,
    features: ["AWS Textract OCR", "Expense Categorization", "Tax Document Analysis", "Smart Filing System"],
    buttonText: "Process Documents",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400",
    available: true,
    stats: {
      label: "Documents Processed",
      value: "2,847"
    }
  },
  {
    id: "hr-recruiter" as GodModeFeature,
    title: "AI HR Recruiter",
    description: "Analyze LinkedIn profiles and match candidates to your requirements",
    icon: Users,
    features: ["LinkedIn Profile Analysis", "Skill Matching", "Culture Fit Scoring", "Bulk Processing"],
    buttonText: "Start Recruiting",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
    available: true,
    stats: {
      label: "Candidates Analyzed",
      value: "12,394"
    }
  },
  {
    id: "newsletter" as GodModeFeature,
    title: "Newsletter Generator",
    description: "Create engaging newsletters with AI-generated content and images",
    icon: Newspaper,
    features: ["AI Content Writing", "Image Generation", "Template Library", "Email Integration"],
    buttonText: "Create Newsletter",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
    available: true,
    stats: {
      label: "Newsletters Created",
      value: "847"
    }
  },
]

export function GodModeFeatureSelector({ selectedFeature, onFeatureChange }: GodModeFeatureSelectorProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <Brain className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">God Mode Features</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Choose Your Superpower
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Access advanced AI capabilities designed for power users. Each feature leverages cutting-edge AI and AWS infrastructure to automate complex workflows.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {GOD_MODE_FEATURES.map((feature) => {
          const isSelected = selectedFeature === feature.id
          const Icon = feature.icon

          return (
            <Card
              key={feature.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 cursor-pointer group",
                "hover:scale-105 hover:shadow-2xl",
                isSelected && "ring-2 ring-amber-400 shadow-lg shadow-amber-400/20",
                !feature.available && "opacity-60 cursor-not-allowed",
                "bg-gradient-to-br from-background/50 to-background/80 backdrop-blur-xl border-muted/30",
                "hover:border-amber-400/50"
              )}
              onClick={() => feature.available && onFeatureChange(feature.id)}
            >
              {/* Background Gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30 group-hover:opacity-40 transition-opacity", feature.gradient)} />

              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700" />
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping" />
                    <div className="relative w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-black" />
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="p-6 relative z-10 h-full flex flex-col">
                <div className="space-y-4 flex-1">
                  {/* Icon with glow effect */}
                  <div className="relative">
                    <div className={cn("absolute inset-0 rounded-lg blur-xl", feature.gradient, "opacity-60")} />
                    <div className="relative w-12 h-12 rounded-lg bg-background/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      <Icon className={cn("h-6 w-6", feature.iconColor)} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{feature.description}</p>
                  </div>

                  {/* Stats Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-background/50 backdrop-blur-sm border-white/10">
                      <Target className="w-3 h-3 mr-1" />
                      {feature.stats.label}: {feature.stats.value}
                    </Badge>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {feature.features.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={cn(
                    "w-full mt-6 transition-all duration-300 group/button bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                  )}
                  disabled={!feature.available}
                >
                  {feature.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Enhancement Note */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="text-sm text-amber-400">
            Powered by advanced AI models and enterprise-grade AWS infrastructure
          </span>
        </div>
      </div>
    </div>
  )
} 