"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Video, Play, Clock, Upload } from "lucide-react"
import type { EnhancedContentPrompt } from "@/lib/content-types"

interface ShortVideoCreatorFormProps {
  onContentGenerated?: (draftId: string) => void
  initialPrompt?: EnhancedContentPrompt | null
  currentStep?: number
  onStepChange?: (step: number) => void
}

export function ShortVideoCreatorForm({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: ShortVideoCreatorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState<EnhancedContentPrompt>({
    topic: "",
    contentType: "short-video",
    aspectRatio: "9:16",
    duration: "30s",
    videoTheme: "vibrant",
    budget: "low",
  })

  // Apply initial prompt values
  useEffect(() => {
    if (initialPrompt) {
      setPrompt((prev) => ({
        ...prev,
        ...initialPrompt,
      }))
    }
  }, [initialPrompt])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.topic?.trim()) return

    setIsGenerating(true)

    try {
      // For demo purposes, use mock data instead of API call
      // When backend is ready, uncomment the API call below

      // Mock response simulation
      setTimeout(() => {
        if (onContentGenerated) {
          onContentGenerated("short-video") // Use "short-video" as mock draft ID
        }
        setIsGenerating(false)
      }, 2000)

      return // Remove this line when enabling real API

      // Real API call (commented out for demo)
      /*
      // Generate short video specific prompt
      const videoPrompt = `
Create a short-form video concept for: ${prompt.topic}

Video Specifications:
- Duration: ${prompt.duration}
- Aspect Ratio: ${prompt.aspectRatio}
- Theme: ${prompt.videoTheme || "Engaging and trendy"}
- Budget Level: ${prompt.budget}

Content Requirements:
1. Hook (first 3 seconds) - attention-grabbing opening
2. Main content - core message delivery
3. Call-to-action - engagement driver

Video Elements to Include:
- Storyboard with shot-by-shot breakdown
- Text overlay suggestions
- Music/audio recommendations
- Visual effects and transitions
- Optimal posting times and hashtags

Platform Optimization:
${prompt.aspectRatio === "9:16" ? "- Optimized for TikTok, Instagram Reels, YouTube Shorts" : ""}
${prompt.aspectRatio === "1:1" ? "- Optimized for Instagram feed posts" : ""}
${prompt.aspectRatio === "16:9" ? "- Optimized for YouTube, Facebook, Twitter" : ""}

Create a comprehensive video production guide that includes:
1. Pre-production checklist
2. Shot list and storyboard
3. Post-production notes
4. Distribution strategy

Format as a professional video brief ready for production.
      `

      const finalPrompt = {
        topic: prompt.topic,
        contentType: "short-video",
        customPrompt: videoPrompt,
        modelId: "amazon.nova-micro-v1:0",
        ...prompt
      }

      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPrompt),
      })

      if (!response.ok) {
        throw new Error("Failed to generate video concept")
      }

      const data = await response.json()

      if (onContentGenerated) {
        onContentGenerated(data.draftId)
      }
      */
    } catch (error) {
      console.error("Error generating video concept:", error)
      // For demo, still show preview even if there's an error
      if (onContentGenerated) {
        onContentGenerated("short-video")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Video className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <CardTitle>Short Video Creator</CardTitle>
                <CardDescription>Create engaging short-form videos for social platforms</CardDescription>
                {initialPrompt && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs text-teal-600">
                      Based on: {initialPrompt.topic}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Video Concept */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Video Concept/Theme *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Behind the scenes studio session, New song teaser, Day in the life"
                    value={prompt.topic}
                    onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Video Message/Hook</Label>
                  <Textarea
                    placeholder="What's the main message or hook for your video? What should grab viewers' attention in the first 3 seconds?"
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Format Settings */}
              <div className="space-y-4">
                <Label>Aspect Ratio</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: "9:16", label: "Vertical (9:16)", desc: "TikTok, Reels, Shorts", platforms: "📱" },
                    { value: "1:1", label: "Square (1:1)", desc: "Instagram Feed", platforms: "⬜" },
                    { value: "16:9", label: "Horizontal (16:9)", desc: "YouTube, Facebook", platforms: "📺" },
                  ].map((ratio) => (
                    <Card
                      key={ratio.value}
                      className={`cursor-pointer transition-all duration-200 ${
                        prompt.aspectRatio === ratio.value
                          ? "ring-2 ring-teal-500 shadow-lg"
                          : "hover:shadow-md opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => setPrompt({ ...prompt, aspectRatio: ratio.value as any })}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="text-2xl">{ratio.platforms}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{ratio.label}</h3>
                          <p className="text-xs text-muted-foreground">{ratio.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={prompt.duration}
                    onValueChange={(value) => setPrompt({ ...prompt, duration: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15s">15 seconds (Quick & Punchy)</SelectItem>
                      <SelectItem value="30s">30 seconds (Standard)</SelectItem>
                      <SelectItem value="60s">60 seconds (Detailed)</SelectItem>
                      <SelectItem value="90s">90 seconds (Extended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visual Theme</Label>
                  <Select
                    value={prompt.videoTheme}
                    onValueChange={(value) => setPrompt({ ...prompt, videoTheme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a visual theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimalist">Minimalist & Clean</SelectItem>
                      <SelectItem value="vibrant">Vibrant & Colorful</SelectItem>
                      <SelectItem value="dark-moody">Dark & Moody</SelectItem>
                      <SelectItem value="retro">Retro & Vintage</SelectItem>
                      <SelectItem value="futuristic">Futuristic & Tech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Agent Actions Info */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-teal-500" />
                  AI Agent Actions
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  After generating your video concept, our AI agent will:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>Generate detailed storyboard and shot list</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Create video using AI generation tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Auto-upload to selected platforms</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating || !prompt.topic?.trim()}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Video...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate & Preview Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Storyboard Preview */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold">Storyboard Preview</h3>
          </div>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Video Frame Preview */}
                <div
                  className={`mx-auto bg-black rounded-lg overflow-hidden shadow-lg ${
                    prompt.aspectRatio === "9:16"
                      ? "aspect-[9/16] max-w-[200px]"
                      : prompt.aspectRatio === "1:1"
                        ? "aspect-square max-w-[250px]"
                        : "aspect-video max-w-[350px]"
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center relative">
                    <Play className="h-12 w-12 text-white/80" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/50 rounded px-2 py-1">
                        <p className="text-white text-xs truncate">{prompt.topic || "Your video concept"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storyboard Frames */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Storyboard Frames</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((frame) => (
                      <div
                        key={frame}
                        className="aspect-video bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center"
                      >
                        <div className="text-center">
                          <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {frame === 1 ? "0-3s" : frame === 2 ? "3-15s" : "15-30s"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Details */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{prompt.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format:</span>
                    <span>{prompt.aspectRatio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Theme:</span>
                    <span className="capitalize">{prompt.videoTheme}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">AI will generate a detailed storyboard and production guide</p>
          </div>
        </div>
      </div>
    </div>
  )
}
