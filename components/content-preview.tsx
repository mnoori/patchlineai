"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ContentDraft } from "@/lib/blog-types"
import { Loader2, Edit, Copy, Save, Sparkles, Check, Calendar, ChevronLeft } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import Image from "next/image"
import { EPKPreview } from "./content/previews/epk-preview"
import { SocialMediaPreview } from "./content/previews/social-media-preview"
import { VideoPreview } from "./content/previews/video-preview"

interface ContentPreviewProps {
  draftId: string
  onPublish?: (draft: ContentDraft) => void
  originalImage?: string
  onBack?: () => void
  useMockData?: boolean // Add this new prop
}

export function ContentPreview({ draftId, onPublish, originalImage, onBack, useMockData = true }: ContentPreviewProps) {
  const [draft, setDraft] = useState<ContentDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")

  useEffect(() => {
    // If using mock data, set up mock draft immediately
    if (useMockData) {
      const mockDraft: ContentDraft = {
        id: draftId || "mock-draft-123",
        content: `# ${draftId === "epk" ? "Artist Biography" : draftId === "social" ? "🎵 New track dropping soon!" : draftId === "short-video" ? "Video Treatment: Behind the Scenes" : draftId === "music-video" ? "Music Video Concept: Neon Dreams" : "The Future of AI in Music Production"}

${
  draftId === "epk"
    ? `
## About the Artist

Rising from the underground music scene, this innovative artist has been pushing boundaries and creating unique soundscapes that blend electronic elements with organic instrumentation.

### Career Highlights
- Featured on Spotify's "New Music Friday" playlist
- Over 1M streams across all platforms
- Performed at major festivals including SXSW and Electric Forest
- Collaborated with Grammy-nominated producers

### Press Coverage
"A visionary artist who's redefining what modern music can be" - Rolling Stone

### Contact Information
Management: contact@artistname.com
Booking: booking@artistname.com
Press: press@artistname.com
`
    : draftId === "social"
      ? `
🎵 New track dropping this Friday! 

Been working on this one for months and I can't wait for you all to hear it. The energy is absolutely insane 🔥

What genre do you think this is? Drop your guesses below! 👇

#NewMusic #ComingSoon #StudioLife #MusicProducer #IndieArtist #NewRelease #MusicIsLife
`
      : draftId === "short-video"
        ? `
# Behind the Scenes: Studio Session

## Video Concept
A fast-paced timelapse showing the creation of a track from start to finish.

### Shot List:
1. **Opening (0-3s)**: Close-up of hands on keyboard
2. **Build-up (3-15s)**: Multiple angles of recording process
3. **Climax (15-25s)**: Final mix playback with artist reaction
4. **Outro (25-30s)**: Track title reveal with release date

### Technical Notes:
- Aspect Ratio: 9:16 (TikTok/Instagram Reels)
- Duration: 30 seconds
- Style: High-energy, vibrant colors
- Music: Preview of the actual track being created
`
        : draftId === "music-video"
          ? `
# Music Video Treatment: "Neon Dreams"

## Concept Overview
A cyberpunk-inspired visual journey through a neon-lit cityscape, following the artist as they navigate between reality and digital worlds.

### Visual Style
- **Color Palette**: Electric blues, hot pinks, and neon greens
- **Cinematography**: Dynamic camera movements with drone shots
- **Lighting**: Heavy use of practical neon lighting and LED panels

### Narrative Structure
1. **Act I**: Artist in mundane reality (desaturated colors)
2. **Act II**: Transition into digital world (colors intensify)
3. **Act III**: Fusion of both worlds (full neon explosion)

### Production Requirements
- **Budget**: Medium ($50K-$100K)
- **Crew**: 15-20 people
- **Locations**: Urban rooftops, underground tunnels, LED studio
- **Duration**: 3-4 minutes
`
          : `
The music industry is experiencing a revolutionary transformation with the integration of artificial intelligence. From composition to distribution, AI is reshaping how we create, consume, and interact with music.

## The Current Landscape

AI tools are now capable of generating melodies, harmonies, and even complete compositions. Artists like Holly Herndon and YACHT have embraced AI as a creative collaborator, while platforms like AIVA and Amper Music democratize music creation.

## Key Applications

### 1. Music Composition
AI algorithms can analyze vast databases of musical patterns to generate original compositions in any style or genre.

### 2. Audio Mastering
Automated mastering services like LANDR use machine learning to optimize audio quality, making professional-grade mastering accessible to independent artists.

### 3. Personalized Recommendations
Streaming platforms leverage AI to curate personalized playlists, helping listeners discover new music while giving artists better exposure opportunities.

## The Future Outlook

As AI technology continues to evolve, we can expect even more sophisticated tools that will augment human creativity rather than replace it. The key is finding the right balance between technological innovation and artistic authenticity.

The artists who thrive in this new landscape will be those who embrace AI as a powerful creative tool while maintaining their unique artistic voice.
`
}`,
        prompt: {
          topic:
            draftId === "epk"
              ? "Professional Artist EPK"
              : draftId === "social"
                ? "New Music Release Announcement"
                : draftId === "short-video"
                  ? "Studio Session Timelapse"
                  : draftId === "music-video"
                    ? "Neon Dreams Music Video"
                    : "The Future of AI in Music Production",
          contentType: (draftId as any) || "blog",
          tone: "professional",
          length: "medium",
          keywords: draftId === "social" ? ["NewMusic", "ComingSoon", "StudioLife"] : ["AI", "music", "technology"],
          // EPK specific mock data
          artistName: draftId === "epk" ? "Nova Sound" : undefined,
          artistBio: draftId === "epk" ? "Innovative electronic artist blending organic and digital sounds" : undefined,
          featuredTracks:
            draftId === "epk"
              ? [
                  { title: "Digital Dreams", duration: "3:42", streamingLinks: ["spotify", "apple"] },
                  { title: "Neon Nights", duration: "4:15", streamingLinks: ["spotify", "apple"] },
                  { title: "Synthetic Soul", duration: "3:28", streamingLinks: ["spotify", "apple"] },
                ]
              : undefined,
          pressQuotes:
            draftId === "epk"
              ? [
                  {
                    quote: "A visionary artist redefining electronic music",
                    source: "Music Weekly",
                    publication: "Electronic Beats",
                  },
                  {
                    quote: "Innovative soundscapes that transport listeners",
                    source: "DJ Mag",
                    publication: "Future Music",
                  },
                ]
              : undefined,
          contactInfo:
            draftId === "epk"
              ? {
                  manager: "Sarah Johnson - sarah@novasound.com",
                  booking: "Mike Chen - booking@novasound.com",
                  press: "Alex Rivera - press@novasound.com",
                  email: "info@novasound.com",
                }
              : undefined,
          // Social media specific
          platform: draftId === "social" ? "instagram" : undefined,
          postTone: draftId === "social" ? "enthusiastic" : undefined,
          // Video specific
          aspectRatio: draftId === "short-video" || draftId === "music-video" ? "9:16" : undefined,
          duration: draftId === "short-video" ? "30s" : draftId === "music-video" ? "full-length" : undefined,
          videoTheme: draftId === "short-video" || draftId === "music-video" ? "vibrant" : undefined,
        },
        status: "ready",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setDraft(mockDraft)
      setIsLoading(false)
      return
    }

    // Original backend fetching logic (when useMockData is false)
    if (!draftId) {
      setIsLoading(false)
      return
    }

    // Poll for content until it's ready
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/content?id=${draftId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch draft")
        }

        const data = await response.json()
        setDraft(data)

        // If status is no longer "generating", stop polling
        if (data.status !== "generating") {
          setIsLoading(false)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error("Error fetching draft:", error)
        setIsLoading(false)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds

    // Clean up on unmount
    return () => clearInterval(pollInterval)
  }, [draftId, useMockData])

  const handleCopyContent = () => {
    if (draft?.content) {
      navigator.clipboard.writeText(draft.content)
      toast.success("Content copied to clipboard")
    }
  }

  const handleBackClick = () => {
    if (onBack && typeof onBack === "function") {
      onBack()
    }
  }

  const handleAgentAction = (draft: ContentDraft) => {
    // Handle the agent action completion
    if (onPublish) {
      onPublish(draft)
    }
  }

  const handlePublish = async () => {
    if (!draft) return

    try {
      setIsPublishing(true)

      // Get current date for the post
      const now = new Date()
      const publishedDate = now.toISOString()

      // Format a human-readable date for display
      const formattedDate = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      // Generate a more unique title if needed
      const title = draft.prompt.topic

      // Get keywords as an array
      const keywords = draft.prompt.keywords || []

      // Generate a clean slug without timestamp suffix
      const cleanSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      // Add timestamp suffix to ensure uniqueness (6 digits format)
      const timestamp = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")
      const uniqueSlug = `${cleanSlug}-${timestamp}`

      // Convert draft to BlogPost format
      const blogPost = {
        title: title,
        content: draft.content,
        author: {
          id: "system-user", // TODO: Use actual user ID from authentication
          name: "AI Content Creator",
        },
        status: "published",
        tags: keywords,
        category: draft.prompt.contentType || "blog",
        publishedDate: publishedDate,
        // Use unique slug with timestamp to avoid duplicate content URLs
        slug: uniqueSlug,
        seoDescription: draft.content.substring(0, 160), // First 160 chars as description
        heroImage: originalImage || "/music-industry-ai-blog.png", // Use the original image if provided
      }

      // Post to the blog API
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogPost),
      })

      if (!response.ok) {
        throw new Error("Failed to publish blog post")
      }

      const publishedPost = await response.json()

      // Update draft status to "approved"
      await fetch(`/api/content?id=${draft.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...draft,
          status: "approved",
        }),
      })

      // Update local state
      setDraft({
        ...draft,
        status: "approved",
      })

      // Store the published post URL for future reference
      const postUrl = `/blog/${publishedPost.slug}`
      localStorage.setItem("lastPublishedPostUrl", postUrl)

      // Show success message
      toast.success("Published successfully!", {
        description: "Your post is now live on the blog",
        action: {
          label: "View Post",
          onClick: () => window.open(postUrl, "_blank"),
        },
      })

      // Call the onPublish callback if provided
      if (onPublish) {
        onPublish(draft)
      }
    } catch (error) {
      console.error("Error publishing blog post:", error)
      toast.error("Failed to publish", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // If no draft ID, show a placeholder
  if (!draftId) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <CardDescription>Generate content to preview it here</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No content generated yet
        </CardContent>
      </Card>
    )
  }

  // Show loading state
  if (isLoading || !draft) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <CardDescription>Generating your content...</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">We're working on your content. This may take a few moments.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Route to specialized preview components based on content type
  if (draft.prompt.contentType === "epk") {
    return <EPKPreview draft={draft} onBack={handleBackClick} onSubmit={handleAgentAction} />
  }

  if (draft.prompt.contentType === "social") {
    return <SocialMediaPreview draft={draft} onBack={handleBackClick} onSubmit={handleAgentAction} />
  }

  if (draft.prompt.contentType === "short-video") {
    return <VideoPreview draft={draft} onBack={handleBackClick} onSubmit={handleAgentAction} isShortVideo={true} />
  }

  if (draft.prompt.contentType === "music-video") {
    return <VideoPreview draft={draft} onBack={handleBackClick} onSubmit={handleAgentAction} isShortVideo={false} />
  }

  // Default blog post preview (existing implementation)
  // Get model information
  const modelId = (draft.prompt as any).modelId || "default"
  const modelName = modelId.includes("claude")
    ? `Claude ${modelId.includes("3-7") ? "3.7" : "3.5"}`
    : modelId.includes("nova-premier")
      ? "Nova Premier"
      : modelId.includes("nova-micro")
        ? "Nova Micro"
        : "AI"

  // Format current date for display
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Get category from prompt or default to "Blog"
  const category = draft.prompt.contentType
    ? draft.prompt.contentType.charAt(0).toUpperCase() + draft.prompt.contentType.slice(1)
    : "Blog"

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Content Preview</CardTitle>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground rounded-full px-2 py-1 bg-muted">
            <Sparkles className="h-3 w-3 mr-1" />
            Generated with {modelName}
          </div>
        </div>
        <CardDescription>{draft.status === "ready" ? "Your content is ready" : draft.status}</CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="markdown" className="pt-2">
          <CardContent>
            <div className="max-h-[28rem] overflow-y-auto p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-xs">{draft.content}</pre>
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent value="preview" className="pt-2">
          <CardContent>
            <div className="max-h-[28rem] overflow-y-auto">
              {/* Blog post preview in website style */}
              <div className="space-y-4">
                {/* Featured Blog Post Card - Similar to blog page */}
                <div className="glass-effect rounded-xl overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative h-64 md:h-full">
                      <Image
                        src={originalImage || "/music-industry-ai-blog.png"}
                        alt={draft.prompt.topic}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan">
                          {category}
                        </span>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {currentDate}
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">{draft.prompt.topic}</h2>
                      <div className="text-muted-foreground mb-6 flex-grow line-clamp-3">
                        {draft.content.substring(0, 150)}...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actual content below */}
                <div className="mt-8 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{draft.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyContent}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <Button onClick={handlePublish} disabled={isPublishing || draft.status === "approved"}>
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : draft.status === "approved" ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Published
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Publish to Blog
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
