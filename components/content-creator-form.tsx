"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, Loader2, Sparkles, RefreshCw } from "lucide-react"
import type { ContentPrompt } from "@/lib/blog-types"
import { BEDROCK_MODELS } from "@/lib/bedrock-client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ImageGenerator } from "@/components/content/image-generation/image-generator"

// Define a type for our session storage form state
interface FormSessionState {
  prompt: ContentPrompt
  keywords: string
  editablePrompt: string
  generatedPrompt: string
  hasGeneratedOnce: boolean
}

// Storage key for consistent retrieval
const FORM_STORAGE_KEY = "content-creator-form-state"

interface ContentCreatorFormProps {
  onContentGenerated?: (draftId: string) => void
  initialPrompt?: ContentPrompt | null
  currentStep?: number
  onStepChange?: (step: number) => void
}

export function ContentCreatorForm({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: ContentCreatorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [prompt, setPrompt] = useState<ContentPrompt>({
    topic: "",
    tone: "professional",
    length: "medium",
    contentType: "blog",
    modelId: BEDROCK_MODELS[0].id,
  })
  const [keywords, setKeywords] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [editablePrompt, setEditablePrompt] = useState("")
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false)
  const [featuredImage, setFeaturedImage] = useState("")

  // Flag to track if we've initialized from session storage
  const [initializedFromSession, setInitializedFromSession] = useState(false)

  // Refs for scrolling to sections
  const formRef = useRef<HTMLDivElement>(null)
  const contentSectionRef = useRef<HTMLDivElement>(null)
  const promptSectionRef = useRef<HTMLDivElement>(null)

  // Load state from session storage on initial render
  useEffect(() => {
    // Only try to load if we haven't initialized and we're in a browser environment
    if (!initializedFromSession && typeof window !== "undefined") {
      try {
        const savedState = sessionStorage.getItem(FORM_STORAGE_KEY)
        if (savedState) {
          const parsedState = JSON.parse(savedState) as FormSessionState

          // Only restore if we have valid state
          if (parsedState && parsedState.prompt && parsedState.hasGeneratedOnce) {
            setPrompt(parsedState.prompt)
            setKeywords(parsedState.keywords || "")
            setEditablePrompt(parsedState.editablePrompt || "")
            setGeneratedPrompt(parsedState.generatedPrompt || "")
            setHasGeneratedOnce(parsedState.hasGeneratedOnce)

            // If we had a generated prompt before, go to step 3
            if (currentStep === 3 && parsedState.hasGeneratedOnce) {
              onStepChange(3)
            }

            setInitializedFromSession(true)
          }
        }
      } catch (error) {
        console.error("Error loading form state from session storage:", error)
      }
    }
  }, [])

  // Apply initial prompt values when provided (only if not already loaded from session)
  useEffect(() => {
    if (initialPrompt && !initializedFromSession) {
      setPrompt({
        ...prompt,
        ...initialPrompt,
        // Ensure we always have a modelId
        modelId: initialPrompt.modelId || prompt.modelId,
      })

      // Set keywords from initialPrompt if available
      if (initialPrompt.keywords && initialPrompt.keywords.length > 0) {
        setKeywords(initialPrompt.keywords.join(", "))
      }
    }
  }, [initialPrompt, initializedFromSession])

  // Save form state to session storage whenever key values change
  useEffect(() => {
    if (typeof window !== "undefined" && prompt.topic) {
      try {
        const stateToSave: FormSessionState = {
          prompt,
          keywords,
          editablePrompt,
          generatedPrompt,
          hasGeneratedOnce,
        }
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(stateToSave))
      } catch (error) {
        console.error("Error saving form state to session storage:", error)
      }
    }
  }, [prompt, keywords, editablePrompt, generatedPrompt, hasGeneratedOnce])

  // Scroll to the appropriate section when step changes
  useEffect(() => {
    // Don't auto-scroll on initial render
    const shouldScroll = document.readyState === "complete"

    if (!shouldScroll) return

    setTimeout(() => {
      if (currentStep === 1 && formRef.current) {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else if (currentStep === 2 && contentSectionRef.current) {
        contentSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      } else if (currentStep === 3 && promptSectionRef.current) {
        promptSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }, [currentStep])

  // Generate AI prompt based on user inputs
  const handleGeneratePrompt = () => {
    setIsGeneratingPrompt(true)

    try {
      // Prepare the prompt with keywords as array
      const finalPrompt: ContentPrompt = {
        ...prompt,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k),
      }

      // Create a prompt template
      const promptTemplate = `
You are creating a detailed prompt for an AI model to generate content about "${finalPrompt.topic}".

The content should be:
- Type: ${finalPrompt.contentType || "blog post"}
- Tone: ${finalPrompt.tone || "professional"} 
- Length: ${finalPrompt.length || "medium"} (roughly ${finalPrompt.length === "short" ? "500" : finalPrompt.length === "medium" ? "1000" : "2000"} words)
${finalPrompt.targetAudience ? `- Target audience: ${finalPrompt.targetAudience}` : ""}
${finalPrompt.keywords?.length ? `- Include these keywords: ${finalPrompt.keywords.join(", ")}` : ""}
${finalPrompt.callToAction ? `- Include this call to action: ${finalPrompt.callToAction}` : ""}

Create a well-structured ${finalPrompt.contentType || "blog post"} that provides valuable insights about ${finalPrompt.topic}.
The content should be engaging, informative, and tailored to the specified audience.
Include a compelling introduction, well-organized sections with headers, and a conclusion.

Your content should follow proper markdown formatting with headers, lists, and emphasis where appropriate.
      `

      setGeneratedPrompt(promptTemplate)
      setEditablePrompt(promptTemplate)
      setHasGeneratedOnce(true)

      // Move to next step
      onStepChange(3)
    } catch (error) {
      console.error("Error generating prompt:", error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  // Generate content with the finalized prompt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Only allow submission if we have a prompt
    if (!editablePrompt.trim()) return
    setIsGenerating(true)

    try {
      // For demo/mock mode, simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API delay

      const mockDraftId = prompt.contentType // Use content type as ID for different previews

      // Call the callback with the mock draft ID
      if (onContentGenerated) {
        onContentGenerated(mockDraftId)
      }

      // Show a success toast notification
      toast.success("Content generation started", {
        description: "Your content is being generated in the background",
      })
    } catch (error) {
      console.error("Error generating content:", error)
      // Show error toast notification
      toast.error("Failed to generate content", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
        action: {
          label: "Try Again",
          onClick: () => handleSubmit(e),
        },
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = (nextStep: number) => {
    onStepChange(nextStep)
  }

  const regeneratePrompt = () => {
    handleGeneratePrompt()
  }

  // Vertical step indicator
  const StepIndicator = () => (
    <div className="hidden lg:block h-auto fixed right-10 top-1/2 -translate-y-1/2 z-10">
      <div className="flex flex-col items-center gap-4 p-3 rounded-lg relative">
        {/* Background patchline */}
        <div className={cn("absolute w-[2px] h-full top-0 left-1/2 transform -translate-x-1/2 bg-muted")}></div>

        {/* Colored progress patchline */}
        <div
          className={cn(
            "absolute w-[2px] top-0 left-1/2 transform -translate-x-1/2 bg-brand-cyan transition-all duration-300",
            currentStep === 1 ? "h-[16.67%]" : currentStep === 2 ? "h-[50%]" : "h-[83.33%]",
          )}
        ></div>

        {/* TRS-jack style connectors */}
        <div
          className={cn("absolute w-1 top-[33%] left-1/2 transform -translate-x-1/2 h-1 rounded-full bg-muted z-[5]")}
        ></div>

        <div
          className={cn("absolute w-1 top-[66%] left-1/2 transform -translate-x-1/2 h-1 rounded-full bg-muted z-[5]")}
        ></div>

        {/* TRS-jack gold tips - only visible for completed connections */}
        <div
          className={cn(
            "absolute w-1 top-[33%] left-1/2 transform -translate-x-1/2 h-1 rounded-full transition-colors z-[9]",
            currentStep >= 2 ? "bg-yellow-400" : "bg-transparent",
          )}
        ></div>

        <div
          className={cn(
            "absolute w-1 top-[66%] left-1/2 transform -translate-x-1/2 h-1 rounded-full transition-colors z-[9]",
            currentStep >= 3 ? "bg-yellow-400" : "bg-transparent",
          )}
        ></div>

        {/* Step indicators */}
        <Button
          variant="ghost"
          className={cn(
            "w-10 h-10 rounded-full p-0 flex items-center justify-center text-sm font-medium transition-colors z-10 border",
            currentStep >= 1
              ? "bg-brand-cyan text-black border-transparent"
              : "bg-muted text-muted-foreground border-muted",
          )}
          onClick={() => handleNext(1)}
        >
          1
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-10 h-10 rounded-full p-0 flex items-center justify-center text-sm font-medium transition-colors z-10 border",
            currentStep >= 2
              ? "bg-brand-cyan text-black border-transparent"
              : "bg-muted text-muted-foreground border-muted",
          )}
          onClick={() => handleNext(2)}
          disabled={!prompt.topic}
        >
          2
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-10 h-10 rounded-full p-0 flex items-center justify-center text-sm font-medium transition-colors z-10 border",
            currentStep >= 3
              ? "bg-brand-cyan text-black border-transparent"
              : "bg-muted text-muted-foreground border-muted",
          )}
          onClick={() => handleNext(3)}
          disabled={!hasGeneratedOnce}
        >
          3
        </Button>
      </div>
    </div>
  )

  return (
    <div ref={formRef} className="relative w-full pt-6">
      {/* Vertical step indicator */}
      <StepIndicator />

      <Card className="w-full max-w-5xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Content Creator</CardTitle>
          <CardDescription>Create AI-generated content with your specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Content Editor Section - Combines step 1 & 2 */}
            <div
              ref={contentSectionRef}
              className={cn(
                "space-y-6 transition-opacity duration-300",
                currentStep === 1 || currentStep === 2 ? "opacity-100" : "opacity-70",
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-brand-cyan text-black">
                  {currentStep <= 2 ? currentStep : "✓"}
                </div>
                <h3 className="text-lg font-medium">
                  {currentStep === 1 ? "Define Your Content" : "Content Specification"}
                </h3>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="The State of AI in Music"
                      value={prompt.topic}
                      onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma separated)</Label>
                    <Input
                      id="keywords"
                      placeholder="AI, music production, artists, music industry"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tone</Label>
                      <Select value={prompt.tone} onValueChange={(value: any) => setPrompt({ ...prompt, tone: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="length">Length</Label>
                      <Select
                        value={prompt.length}
                        onValueChange={(value: any) => setPrompt({ ...prompt, length: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (~500 words)</SelectItem>
                          <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                          <SelectItem value="long">Long (~2000 words)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="advanced" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="Music producers, indie artists, record labels"
                      value={prompt.targetAudience || ""}
                      onChange={(e) => setPrompt({ ...prompt, targetAudience: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="callToAction">Call to Action</Label>
                    <Input
                      id="callToAction"
                      placeholder="Sign up for our newsletter"
                      value={prompt.callToAction || ""}
                      onChange={(e) => setPrompt({ ...prompt, callToAction: e.target.value })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Image Generation for Blog */}
              {prompt.topic && (
                <div className="space-y-4 pt-4">
                  <ImageGenerator
                    contentType="blog"
                    contentData={{
                      title: prompt.topic,
                      topic: prompt.topic,
                      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
                      tone: prompt.tone
                    }}
                    onImageGenerated={(imageUrl) => {
                      setFeaturedImage(imageUrl)
                      toast.success('Featured image selected for your blog post!')
                    }}
                  />
                  
                  {featuredImage && (
                    <div className="mt-4">
                      <Label>Selected Featured Image</Label>
                      <img 
                        src={featuredImage} 
                        alt="Featured" 
                        className="w-full max-w-md rounded-lg border mt-2"
                      />
                    </div>
                  )}
                </div>
              )}

              {currentStep === 1 ? (
                <Button type="button" onClick={() => handleNext(2)} disabled={!prompt.topic} className="min-w-[140px]">
                  Continue
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex-1 rounded-lg border border-brand-cyan/20 bg-brand-black/30 p-3 text-sm">
                  <p>
                    After clicking "Generate Prompt", you'll see the prompt that will be sent to the AI. You can review
                    and edit it before generating content.
                  </p>
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleNext(1)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGeneratePrompt}
                    disabled={!prompt.topic || isGeneratingPrompt}
                    className="min-w-[140px]"
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Prompt
                        <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* AI Prompt Section */}
            <div
              ref={promptSectionRef}
              className={cn(
                "space-y-6 transition-opacity duration-300 mt-12",
                currentStep === 3 ? "opacity-100" : hasGeneratedOnce ? "opacity-70" : "opacity-50 pointer-events-none",
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-brand-cyan text-black">
                  3
                </div>
                <h3 className="text-lg font-medium">AI Prompt & Generation</h3>
              </div>

              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2 col-span-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="ai-prompt" className="text-base font-medium">
                        AI Prompt
                      </Label>
                      {hasGeneratedOnce && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={regeneratePrompt}
                          disabled={isGeneratingPrompt}
                          className="h-8 gap-1"
                        >
                          {isGeneratingPrompt ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Regenerate
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Textarea
                        id="ai-prompt"
                        className="min-h-[220px] font-mono text-sm w-full"
                        value={editablePrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                        placeholder="The AI prompt will appear here after you click 'Generate Prompt'..."
                      />
                      {isGeneratingPrompt && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
                            <p className="text-sm font-medium">Generating prompt...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-model" className="text-sm font-medium">
                      AI Model
                    </Label>
                    <Select
                      value={prompt.modelId}
                      onValueChange={(value: string) => setPrompt({ ...prompt, modelId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[220px] overflow-y-auto">
                        {BEDROCK_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <span>{model.name}</span>
                              {model.id.includes("claude") && <Sparkles className="h-3 w-3 text-yellow-400" />}
                            </div>
                            <p className="text-xs text-gray-500">{model.description}</p>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 rounded-lg border border-brand-cyan/20 bg-brand-black/30 p-3 text-sm">
                    <p>
                      This is the prompt that will be sent to the AI model. You can edit it to customize the content
                      generation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={() => handleNext(2)} disabled={isGenerating}>
                  Back to Content
                </Button>
                <Button type="submit" className="min-w-[140px]" disabled={isGenerating || !editablePrompt.trim()}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Content
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
