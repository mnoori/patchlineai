"use client"

import { ContentTypeSelector } from "../../../components/content/content-type-selector"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/brand'
import { EnhancedContentIdeaCarousel } from "../../../components/content/enhanced-content-idea-carousel"
import type { ContentType } from "@/lib/content-types"
import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { ContentPreview } from "../../../components/content-preview"
import { ContentCreatorForm } from "../../../components/content-creator-form"
import { cn } from "@/lib/utils"
import type { ContentDraft, ContentPrompt } from "@/lib/blog-types"
import { EPKCreatorForm } from "../../../components/content/specialized-forms/epk-creator-form"
import { EnhancedSocialMediaCreator } from "../../../components/content/specialized-forms/enhanced-social-media-creator"
import { SocialMediaCreator } from "../../../components/content/social-media-creator"
import { ShortVideoCreatorForm } from "../../../components/content/specialized-forms/short-video-creator-form"
import { MusicVideoCreatorForm } from "../../../components/content/specialized-forms/music-video-creator-form"
import { Button } from "@/components/ui/button"

// Helper function to get the image URL for a topic
function getImageForTopic(topic: string): string | undefined {
  const topics: Record<string, string> = {
    "The State of AI in Music: Beyond the Hype": "/music-industry-ai-blog.png",
    "How Independent Labels Can Compete Using AI": "/independent-labels-ai.png",
    "Metadata: The Hidden Value in Your Music Catalog": "/music-metadata-management.png",
    "Agent-Based Workflows: The Future of Creative Production": "/ai-agent-workflows.png",
  }

  return topics[topic]
}

export default function ContentPage() {
  const [draftId, setDraftId] = useState<string>("")
  const [selectedPrompt, setSelectedPrompt] = useState<ContentPrompt | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(0) // Start at 0 for type selection
  const [preserveScroll, setPreserveScroll] = useState(false)
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("blog")

  // Scroll to top on initial load, but only if not coming back from preview
  useEffect(() => {
    const hasStoredState =
      typeof window !== "undefined" && sessionStorage.getItem("content-creator-form-state") !== null

    if (!hasStoredState && !preserveScroll) {
      window.scrollTo(0, 0)
    }
  }, [preserveScroll])

  const handleContentGenerated = (
    data: string | {
      caption: string
      images: string[]
      platform: string
      selectedImageIndex: number | null
    },
  ) => {
    // For demo purposes, use content type as draft ID to show different previews
    const mockDraftId = selectedContentType
    setDraftId(mockDraftId)
  }

  const handleSelectIdea = (prompt: ContentPrompt) => {
    setSelectedPrompt(prompt)
    setCurrentStep(2) // Go directly to form with selected idea
  }

  // Handle "Write Your Own" selection
  const handleWriteYourOwn = () => {
    setSelectedPrompt(null) // No pre-filled prompt
    setCurrentStep(2) // Go directly to form with empty state
  }

  const handlePublish = async (draft: ContentDraft) => {
    try {
      const blogPost = {
        title: draft.prompt.topic,
        content: draft.content,
        author: {
          id: "user-1",
          name: "AI Creator",
        },
        status: "published",
        tags: draft.prompt.keywords || [],
        category: draft.prompt.contentType || "blog",
      }

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

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("content-creator-form-state")
      }

      setDraftId("")
      setSelectedPrompt(null)
      setCurrentStep(0)
      setPreserveScroll(false)

      alert(`Content published successfully!`)
    } catch (error) {
      console.error("Error publishing content:", error)
      alert("Error publishing content. Please try again.")
    }
  }

  const handleBackFromPreview = () => {
    setDraftId("")
    setCurrentStep(2) // Go back to form
    setPreserveScroll(true)
  }

  const handleContentTypeChange = (type: ContentType) => {
    setSelectedContentType(type)
    setSelectedPrompt(null)
    
    // Skip idea selection for social and social-ai, go directly to creator
    if (type === 'social' || type === 'social-ai') {
      setCurrentStep(2) // Go directly to form
    } else {
      setCurrentStep(1) // Move to idea selection for other types
    }
  }

  // Navigation functions
  const handleGoBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0) // Go back to content type selection
    } else if (currentStep >= 2) {
      // For social and social-ai, go directly back to content type selection since idea page is skipped
      if (selectedContentType === 'social' || selectedContentType === 'social-ai') {
        setCurrentStep(0)
      } else {
        setCurrentStep(1) // Go back to idea selection for other types
      }
      setSelectedPrompt(null)
      setDraftId("")
    }
  }

  return (
    <div className="space-y-8 container mx-auto px-4 min-h-[calc(100vh-64px)] overflow-x-hidden">
      {selectedContentType !== 'social' || currentStep < 2 ? (
        <div className="flex items-center justify-between pt-4 sticky top-0 z-20 bg-background pb-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            {currentStep > 0 && selectedContentType !== 'social' && (
              <Button variant="outline" onClick={handleGoBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">AI Content Studio</h1>
              <p className="text-muted-foreground">Create professional content with AI-powered assistance</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8">
        {/* Content Type Selection - Step 0 */}
        {currentStep === 0 && (
          <ContentTypeSelector selectedType={selectedContentType} onTypeChange={handleContentTypeChange} />
        )}

        {/* Content Ideas - Step 1 */}
        {currentStep === 1 && !draftId && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-0">
            <EnhancedContentIdeaCarousel
              contentType={selectedContentType}
              onSelectIdea={handleSelectIdea}
              onWriteYourOwn={handleWriteYourOwn}
            />
          </div>
        )}

        {/* Content Creator / Preview - Steps 2+ */}
        <div className="flex justify-center w-full">
          {draftId ? (
            <ContentPreview
              draftId={draftId}
              onPublish={handlePublish}
              originalImage={selectedPrompt?.topic ? getImageForTopic(selectedPrompt.topic) : undefined}
              onBack={handleBackFromPreview}
              useMockData={true} // Add this line
            />
          ) : currentStep >= 2 ? (
            <div
              id="content-form"
              className={cn("animate-in w-full", selectedPrompt ? "fade-in slide-in-from-bottom-4 duration-500" : "")}
            >
              {selectedContentType === "blog" ? (
                <ContentCreatorForm
                  onContentGenerated={handleContentGenerated}
                  initialPrompt={selectedPrompt}
                  currentStep={currentStep - 1}
                  onStepChange={(step) => setCurrentStep(step + 1)}
                />
              ) : selectedContentType === "epk" ? (
                <EPKCreatorForm
                  onContentGenerated={handleContentGenerated}
                  initialPrompt={selectedPrompt ? {
                    ...selectedPrompt,
                    contentType: "epk" as ContentType,
                    topic: selectedPrompt.topic || ""
                  } : null}
                  currentStep={currentStep - 1}
                  onStepChange={(step) => setCurrentStep(step + 1)}
                />
              ) : selectedContentType === "social" ? (
                <EnhancedSocialMediaCreator
                  onContentGenerated={handleContentGenerated}
                  initialPrompt={selectedPrompt?.topic || ""}
                  currentStep={currentStep - 1}
                  onStepChange={(step) => setCurrentStep(step + 1)}
                />
              ) : selectedContentType === "social-ai" ? (
                <SocialMediaCreator />
              ) : selectedContentType === "short-video" ? (
                <ShortVideoCreatorForm
                  onContentGenerated={handleContentGenerated}
                  initialPrompt={selectedPrompt ? {
                    ...selectedPrompt,
                    contentType: "short-video" as ContentType,
                    topic: selectedPrompt.topic || ""
                  } : null}
                  currentStep={currentStep - 1}
                  onStepChange={(step) => setCurrentStep(step + 1)}
                />
              ) : selectedContentType === "music-video" ? (
                <MusicVideoCreatorForm
                  onContentGenerated={handleContentGenerated}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
