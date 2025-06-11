"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Share2, Instagram, Twitter, Calendar, Send, Smartphone, ImageIcon } from "lucide-react"
import type { EnhancedContentPrompt } from "@/lib/content-types"
import { ImageGenerator } from "@/components/content/image-generation/image-generator"
import { toast } from "sonner"

interface SocialMediaCreatorFormProps {
  onContentGenerated?: (draftId: string) => void
  initialPrompt?: EnhancedContentPrompt | null
  currentStep?: number
  onStepChange?: (step: number) => void
}

export function SocialMediaCreatorForm({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: SocialMediaCreatorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [prompt, setPrompt] = useState<EnhancedContentPrompt>({
    topic: "",
    contentType: "social",
    tone: "enthusiastic",
    platform: "instagram",
    postTone: "casual",
    includeHashtags: true,
    includeEmojis: true,
    targetAudience: "music fans",
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
          onContentGenerated("social") // Use "social" as mock draft ID
        }
        setIsGenerating(false)
      }, 2000)

      return // Remove this line when enabling real API

      // Real API call (commented out for demo)
      /*
    // Generate social media specific prompt
    const socialPrompt = `
Create engaging social media content for ${prompt.platform} about: ${prompt.topic}

Platform: ${prompt.platform}
Tone: ${prompt.postTone}
Target Audience: ${prompt.targetAudience}
Include Hashtags: ${prompt.includeHashtags ? "Yes" : "No"}
Include Emojis: ${prompt.includeEmojis ? "Yes" : "No"}

Platform-specific requirements:
${prompt.platform === "instagram" ? "- Optimized for Instagram feed and stories\n- Visual-first approach\n- 2200 character limit" : ""}
${prompt.platform === "twitter" ? "- Twitter/X optimized\n- Concise and engaging\n- 280 character limit\n- Thread-friendly format" : ""}
${prompt.platform === "tiktok" ? "- TikTok optimized\n- Trend-aware content\n- Video description format\n- Hashtag challenges" : ""}

Create multiple post variations:
1. Main post with optimal engagement
2. Story/short-form version
3. Alternative angle/approach

${prompt.includeHashtags ? "Include relevant hashtags for maximum reach and discoverability." : ""}
${prompt.includeEmojis ? "Use appropriate emojis to enhance engagement and visual appeal." : ""}

Format the response as a comprehensive social media package ready for posting.
    `

    const finalPrompt = {
      topic: prompt.topic,
      contentType: "social",
      customPrompt: socialPrompt,
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
      throw new Error("Failed to generate social media content")
    }

    const data = await response.json()

    if (onContentGenerated) {
      onContentGenerated(data.draftId)
    }
    */
    } catch (error) {
      console.error("Error generating social media content:", error)
      // For demo, still show preview even if there's an error
      if (onContentGenerated) {
        onContentGenerated("social")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "twitter":
        return <Twitter className="h-4 w-4" />
      case "tiktok":
        return <Share2 className="h-4 w-4" />
      default:
        return <Share2 className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "from-pink-500 to-purple-500"
      case "twitter":
        return "from-blue-400 to-blue-600"
      case "tiktok":
        return "from-black to-pink-500"
      default:
        return "from-teal-500 to-cyan-500"
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
                <Share2 className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <CardTitle>Social Media Creator</CardTitle>
                <CardDescription>Create engaging posts optimized for your target platform</CardDescription>
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
              {/* Platform Selection */}
              <div className="space-y-4">
                <Label>Select Platform</Label>
                <div className="grid grid-cols-1 gap-3">
                  {["instagram", "twitter", "tiktok"].map((platform) => (
                    <Card
                      key={platform}
                      className={`cursor-pointer transition-all duration-200 ${
                        prompt.platform === platform
                          ? "ring-2 ring-teal-500 shadow-lg"
                          : "hover:shadow-md opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => setPrompt({ ...prompt, platform: platform as any })}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getPlatformColor(
                            platform,
                          )} flex items-center justify-center`}
                        >
                          {getPlatformIcon(platform)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold capitalize">{platform}</h3>
                          <p className="text-xs text-muted-foreground">
                            {platform === "instagram" && "Visual-first, stories & reels"}
                            {platform === "twitter" && "Concise, real-time updates"}
                            {platform === "tiktok" && "Short-form, trending content"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Content Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Post Topic/Message *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., New single release, Behind the scenes, Tour announcement"
                    value={prompt.topic}
                    onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postTone">Post Tone</Label>
                  <Select
                    value={prompt.postTone}
                    onValueChange={(value) => setPrompt({ ...prompt, postTone: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., music fans, indie rock lovers, young adults"
                    value={prompt.targetAudience || ""}
                    onChange={(e) => setPrompt({ ...prompt, targetAudience: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Include Hashtags</Label>
                    <p className="text-xs text-muted-foreground">Add relevant hashtags for discoverability</p>
                  </div>
                  <Switch
                    checked={prompt.includeHashtags}
                    onCheckedChange={(checked) => setPrompt({ ...prompt, includeHashtags: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Include Emojis</Label>
                    <p className="text-xs text-muted-foreground">Add emojis for visual appeal</p>
                  </div>
                  <Switch
                    checked={prompt.includeEmojis}
                    onCheckedChange={(checked) => setPrompt({ ...prompt, includeEmojis: checked })}
                  />
                </div>
              </div>

              <Separator />

              {/* Image Generation */}
              {prompt.topic && (
                <div className="space-y-4">
                  <ImageGenerator
                    contentType="social"
                    contentData={{
                      title: prompt.topic,
                      topic: prompt.topic,
                      keywords: prompt.includeHashtags ? ["music", "artist", prompt.platform || "social"] : [],
                      tone: prompt.postTone
                    }}
                    onImageGenerated={(imageUrl) => {
                      setGeneratedImage(imageUrl)
                      toast.success('Image selected for your post!')
                    }}
                  />
                  
                  {generatedImage && (
                    <div className="mt-4">
                      <Label>Selected Image for Post</Label>
                      <img 
                        src={generatedImage} 
                        alt="Generated social media image" 
                        className="w-full rounded-lg border mt-2"
                      />
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Agent Actions Info */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  AI Agent Actions
                </h3>
                <p className="text-sm text-muted-foreground mb-3">After generating your content, our AI agent can:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>Schedule posts for optimal engagement times</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Cross-post to multiple platforms automatically</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Monitor engagement and suggest optimizations</span>
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
                    Creating Posts...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate & Preview Posts
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold">Live Preview</h3>
          </div>

          {/* Platform Preview Mockup */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-6">
              {prompt.platform === "instagram" && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm mx-auto">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                      <div>
                        <p className="font-semibold text-sm">your_artist_name</p>
                        <p className="text-xs text-muted-foreground">Music Artist</p>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900 flex items-center justify-center overflow-hidden">
                    {generatedImage ? (
                      <img src={generatedImage} alt="Post visual" className="w-full h-full object-cover" />
                    ) : (
                      <p className="text-sm text-muted-foreground">Your content image</p>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm">
                      <span className="font-semibold">your_artist_name</span>{" "}
                      {prompt.topic || "Your post content will appear here..."}
                      {prompt.includeEmojis && " 🎵✨"}
                    </p>
                    {prompt.includeHashtags && <p className="text-sm text-blue-600 mt-2">#music #newrelease #artist</p>}
                  </div>
                </div>
              )}

              {prompt.platform === "twitter" && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md mx-auto">
                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">Your Artist Name</p>
                          <p className="text-xs text-muted-foreground">@your_handle</p>
                          <p className="text-xs text-muted-foreground">• 2m</p>
                        </div>
                        <p className="text-sm mt-1">
                          {prompt.topic || "Your tweet content will appear here..."}
                          {prompt.includeEmojis && " 🎵✨"}
                        </p>
                        {prompt.includeHashtags && (
                          <p className="text-sm text-blue-600 mt-2">#music #newrelease #artist</p>
                        )}
                        {generatedImage && (
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <img src={generatedImage} alt="Post visual" className="w-full h-48 object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {prompt.platform === "tiktok" && (
                <div className="bg-black rounded-lg shadow-lg max-w-sm mx-auto aspect-[9/16] relative overflow-hidden">
                  {generatedImage ? (
                    <img src={generatedImage} alt="TikTok background" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                      <p className="text-white text-sm text-center">Your TikTok video preview</p>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm">
                      {prompt.topic || "Your TikTok description will appear here..."}
                      {prompt.includeEmojis && " 🎵✨"}
                    </p>
                    {prompt.includeHashtags && <p className="text-white text-sm mt-1">#music #fyp #viral</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Preview updates as you modify your content settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}
