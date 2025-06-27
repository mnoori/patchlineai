"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Video, Play, Upload, Loader2, Check, ChevronLeft, Clock, Camera, Music } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import type { ContentDraft } from "@/lib/blog-types"

interface VideoPreviewProps {
  draft: ContentDraft
  onBack?: () => void
  onSubmit?: (draft: ContentDraft) => void
  isShortVideo?: boolean
}

export function VideoPreview({ draft, onBack, onSubmit, isShortVideo = true }: VideoPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [activeTab, setActiveTab] = useState("storyboard")

  const aspectRatio = draft.prompt.aspectRatio || "9:16"
  const duration = draft.prompt.duration || "30s"
  const videoTheme = draft.prompt.videoTheme || "vibrant"

  const handleGenerateVideo = async () => {
    setIsGenerating(true)

    // Simulate AI video generation process
    await new Promise((resolve) => setTimeout(resolve, 4000))

    setIsGenerated(true)
    setIsGenerating(false)

    const videoType = isShortVideo ? "short video" : "music video treatment"
    toast.success(`${videoType} generated successfully!`, {
      description: isShortVideo
        ? "Your video has been created and uploaded to your selected platforms"
        : "Your treatment has been sent to 12 video production companies",
      action: {
        label: isShortVideo ? "View Video" : "View Submissions",
        onClick: () => console.log("View results"),
      },
    })

    if (onSubmit) {
      onSubmit(draft)
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20">
              {isShortVideo ? <Video className="h-5 w-5 text-teal-500" /> : <Music className="h-5 w-5 text-teal-500" />}
            </div>
            <div>
              <CardTitle>{isShortVideo ? "Short Video" : "Music Video"} Preview</CardTitle>
              <CardDescription>
                {aspectRatio} • {duration} • {videoTheme} theme
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground rounded-full px-2 py-1 bg-muted">
            <Video className="h-3 w-3 mr-1" />
            {isShortVideo ? "Short Video" : "Music Video"}
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="content">Full Content</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="storyboard" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto">
              <div className="space-y-6">
                {/* Video Preview */}
                <div className="flex justify-center">
                  <div
                    className={`bg-black rounded-lg overflow-hidden shadow-xl relative ${
                      aspectRatio === "9:16"
                        ? "aspect-[9/16] max-w-[280px]"
                        : aspectRatio === "1:1"
                          ? "aspect-square max-w-[320px]"
                          : "aspect-video max-w-[480px]"
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-sm">{draft.prompt.topic}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {duration} • {videoTheme}
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/50 rounded px-3 py-2">
                        <p className="text-white text-sm truncate">{draft.prompt.topic}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storyboard Frames */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-teal-500" />
                    Storyboard Frames
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { time: "0-3s", title: "Hook", desc: "Attention-grabbing opening" },
                      { time: "3-15s", title: "Content", desc: "Main message delivery" },
                      { time: "15-30s", title: "CTA", desc: "Call to action" },
                    ].map((frame, index) => (
                      <Card key={index} className="p-4">
                        <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded mb-3 flex items-center justify-center">
                          <div className="text-center">
                            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{frame.time}</p>
                          </div>
                        </div>
                        <h4 className="font-medium text-sm">{frame.title}</h4>
                        <p className="text-xs text-muted-foreground">{frame.desc}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Production Notes */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Production Notes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <Video className="h-6 w-6 mx-auto mb-2 text-teal-500" />
                      <p className="text-sm font-medium">{aspectRatio}</p>
                      <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-teal-500" />
                      <p className="text-sm font-medium">{duration}</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <Camera className="h-6 w-6 mx-auto mb-2 text-teal-500" />
                      <p className="text-sm font-medium capitalize">{videoTheme}</p>
                      <p className="text-xs text-muted-foreground">Theme</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-teal-500" />
                      <p className="text-sm font-medium">Auto-Upload</p>
                      <p className="text-xs text-muted-foreground">Platforms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="treatment" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{`${draft.content.substring(0, 1000)}...`}</ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="content" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-xs">{draft.content}</pre>
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
            {/* Agent Action Info */}
            <div className="text-right">
              <p className="text-sm font-medium">AI Agent Action</p>
              <p className="text-xs text-muted-foreground">
                {isShortVideo ? "Generate & upload video" : "Connect with producers"}
              </p>
            </div>

            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || isGenerated}
              className="bg-teal-500 hover:bg-teal-600 text-white min-w-[160px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isShortVideo ? "Generating..." : "Connecting..."}
                </>
              ) : isGenerated ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isShortVideo ? "Generated" : "Connected"}
                </>
              ) : (
                <>
                  {isShortVideo ? <Upload className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  {isShortVideo ? "Generate Video" : "Connect Producers"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
