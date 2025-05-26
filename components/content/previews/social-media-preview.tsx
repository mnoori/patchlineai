"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share2, Instagram, Twitter, Calendar, Loader2, Check, ChevronLeft, Smartphone } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import type { ContentDraft } from "@/lib/blog-types"

interface SocialMediaPreviewProps {
  draft: ContentDraft
  onBack?: () => void
  onSubmit?: (draft: ContentDraft) => void
}

export function SocialMediaPreview({ draft, onBack, onSubmit }: SocialMediaPreviewProps) {
  const [isPosting, setIsPosting] = useState(false)
  const [isPosted, setIsPosted] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")

  const platform = draft.prompt.platform || "instagram"
  const postTone = draft.prompt.postTone || "casual"

  const handleSchedulePost = async () => {
    setIsPosting(true)

    // Simulate agent posting process
    await new Promise((resolve) => setTimeout(resolve, 2500))

    setIsPosted(true)
    setIsPosting(false)

    toast.success("Posts scheduled successfully!", {
      description: `Your content has been scheduled across ${platform === "instagram" ? "Instagram" : platform === "twitter" ? "Twitter" : "TikTok"} for optimal engagement times`,
      action: {
        label: "View Schedule",
        onClick: () => console.log("View schedule"),
      },
    })

    if (onSubmit) {
      onSubmit(draft)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "twitter":
        return <Twitter className="h-4 w-4" />
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

  // Parse content to extract main post and hashtags
  const contentLines = draft.content.split("\n").filter((line) => line.trim())
  const mainContent =
    contentLines.find((line) => !line.startsWith("#") && !line.startsWith("**") && line.length > 20) ||
    draft.prompt.topic
  const hashtags = contentLines.filter((line) => line.includes("#")).join(" ")

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <Share2 className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <CardTitle>Social Media Preview</CardTitle>
              <CardDescription>
                {platform.charAt(0).toUpperCase() + platform.slice(1)} post • {postTone} tone
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground rounded-full px-2 py-1 bg-muted">
            {getPlatformIcon(platform)}
            <span className="ml-1 capitalize">{platform}</span>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Platform Preview</TabsTrigger>
            <TabsTrigger value="content">Generated Content</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="preview" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto">
              <div className="flex justify-center">
                {/* Platform-specific mockups */}
                {platform === "instagram" && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full">
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                        <div>
                          <p className="font-semibold text-sm">your_artist_name</p>
                          <p className="text-xs text-muted-foreground">Music Artist</p>
                        </div>
                      </div>
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Smartphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Your content image</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm">
                        <span className="font-semibold">your_artist_name</span> {mainContent}
                      </p>
                      {hashtags && <p className="text-sm text-blue-600 mt-2">{hashtags}</p>}
                      <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                    </div>
                  </div>
                )}

                {platform === "twitter" && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">Your Artist Name</p>
                            <p className="text-xs text-muted-foreground">@your_handle</p>
                            <p className="text-xs text-muted-foreground">• 2h</p>
                          </div>
                          <p className="text-sm mt-1">{mainContent}</p>
                          {hashtags && <p className="text-sm text-blue-600 mt-2">{hashtags}</p>}
                          <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                            <span className="text-xs">💬 12</span>
                            <span className="text-xs">🔄 34</span>
                            <span className="text-xs">❤️ 156</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {platform === "tiktok" && (
                  <div className="bg-black rounded-lg shadow-xl max-w-sm w-full aspect-[9/16] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Share2 className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Your TikTok video</p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm">{mainContent}</p>
                      {hashtags && <p className="text-white text-sm mt-1">{hashtags}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="content" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{draft.content}</ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Edit
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Scheduling Info */}
            <div className="text-right">
              <p className="text-sm font-medium">AI Agent Action</p>
              <p className="text-xs text-muted-foreground">Schedule for optimal engagement</p>
            </div>

            <Button
              onClick={handleSchedulePost}
              disabled={isPosting || isPosted}
              className="bg-teal-500 hover:bg-teal-600 text-white min-w-[160px]"
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : isPosted ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Scheduled
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Posts
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
