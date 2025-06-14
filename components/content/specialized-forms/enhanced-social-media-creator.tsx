"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Loader2, 
  Instagram, 
  Send, 
  Smartphone, 
  Upload,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  ChevronRight,
  X as XIcon,
  Music,
  Hash,
  Type,
  Zap,
  Eye,
  RefreshCw,
  Plus,
  Calendar,
  Camera
} from "lucide-react"
import type { EnhancedContentPrompt } from "@/lib/content-types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { contentPersistence } from "@/lib/content-persistence"
import { getPromptSuggestions, fillPromptTemplate, PROMPT_MODIFIERS, type DynamicPrompt } from "@/lib/prompt-library"
import { getNovaCanvasUtils } from "@/lib/nova-canvas-utils"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from "@/hooks/use-debounce"
import { PRE_GENERATED_CONTENT } from "@/lib/social-media-templates-system"

interface EnhancedSocialMediaCreatorProps {
  onContentGenerated?: (content: {
    caption: string
    images: string[]
    platform: string
    selectedImageIndex: number | null
  }) => void
  initialPrompt?: string
  currentStep?: number
  onStepChange?: (step: number) => void
}

interface FormState {
  platform: 'instagram-post' | 'instagram-story'
  topic: string
  caption: string
  workflowMode: 'template' | 'custom'
  selectedTemplate: string | null
}

// Platform configurations with icons from platform-integrations.tsx
const PLATFORM_ICONS = {
  'instagram-post': (
    <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    </div>
  ),
  'instagram-story': (
    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        <path d="M16 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        <path d="M12 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    </div>
  )
  // TODO: Commented out platforms for future use
  // twitter: (
  //   <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
  //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  //     </svg>
  //   </div>
  // ),
  // tiktok: (
  //   <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
  //     <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
  //       <path d="M19.321 5.562a5.124 5.124 0 0 1-3.414-1.267 5.124 5.124 0 0 1-1.537-2.723H10.5v10.99c0 1.42-1.193 2.56-2.64 2.56-1.45 0-2.64-1.14-2.64-2.56 0-1.42 1.19-2.56 2.64-2.56.287 0 .573.046.84.138v-3.86a6.3 6.3 0 0 0-.84-.057C4.15 6.227 1 9.376 1 13.276c0 3.9 3.15 7.05 7.02 7.05 3.87 0 7.02-3.15 7.02-7.05v-3.995a8.783 8.783 0 0 0 4.282 1.092V6.517a5.234 5.234 0 0 1-1-.955Z" />
  //     </svg>
  //   </div>
  // )
}

// Platform configurations
const PLATFORMS = [
  {
    id: 'instagram-post',
    aspectRatio: { width: 1080, height: 1080 },
    description: 'Square posts'
  },
  {
    id: 'instagram-story',
    aspectRatio: { width: 1080, height: 1920 },
    description: 'Vertical stories'
  }
  // TODO: Add more platforms as needed
  // {
  //   id: 'twitter',
  //   aspectRatio: { width: 1200, height: 675 },
  //   description: 'Real-time updates & threads'
  // },
  // {
  //   id: 'tiktok',
  //   aspectRatio: { width: 1080, height: 1920 },
  //   description: 'Short-form video content'
  // }
] as const

const CREATIVE_TEMPLATES = [
  {
    id: 'new-release',
    name: 'New Release Announcement',
    description: 'Eye-catching announcement for your new track',
    icon: '🎵',
    captionTemplate: '🎵 NEW MUSIC ALERT! 🎵\n\n"{trackTitle}" by {artistName} is OUT NOW! 🔥\n\nStream it everywhere 🎧'
  },
  {
    id: 'behind-scenes',
    name: 'Behind the Scenes',
    description: 'Share your creative process',
    icon: '🎬',
    captionTemplate: 'Behind the magic ✨\n\nCreating "{trackTitle}" with {artistName} 🎵\n\n#StudioLife #BehindTheScenes'
  },
  {
    id: 'tour-announcement',
    name: 'Tour Announcement',
    description: 'Announce upcoming shows and tours',
    icon: '🎤',
    captionTemplate: '🎤 TOUR ANNOUNCEMENT 🎤\n\n{artistName} is hitting the road! 🚌\n\nGet your tickets now 🎫'
  },
  {
    id: 'playlist-feature',
    name: 'Playlist Feature',
    description: 'Celebrate playlist additions',
    icon: '📻',
    captionTemplate: '🎉 BIG NEWS! 🎉\n\n"{trackTitle}" by {artistName} just got added to {playlistName}! 📻\n\nListen now 🎧'
  }
]

export function EnhancedSocialMediaCreator({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: EnhancedSocialMediaCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [userPhotos, setUserPhotos] = useState<string[]>([])
  const [generatedCaption, setGeneratedCaption] = useState<string>("")
  const [customCaption, setCustomCaption] = useState<string>("")
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  const [formState, setFormState] = useState<FormState>({
    platform: 'instagram-post',
    topic: initialPrompt || '',
    caption: '',
    workflowMode: 'template',
    selectedTemplate: null
  })

  const debouncedTopic = useDebounce(formState.topic, 500)

  // Load user photos on mount
  useEffect(() => {
    loadUserPhotos()
    
    // Auto-select the first pre-generated content
    const firstContent = PRE_GENERATED_CONTENT[0]
    setFormState(prev => ({ 
      ...prev, 
      workflowMode: 'template',
      selectedTemplate: firstContent.title
    }))
    setGeneratedCaption(firstContent.caption)
    setGeneratedImages(firstContent.images)
    setSelectedImageIndex(0)
  }, [])

  const loadUserPhotos = async () => {
    try {
      const response = await fetch('/api/upload/user-photos')
      if (response.ok) {
        const data = await response.json()
        setUserPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Failed to load user photos:', error)
    }
  }

  const saveUserPhotos = async (photos: string[]) => {
    try {
      await fetch('/api/upload/user-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos })
      })
    } catch (error) {
      console.error('Failed to save user photos:', error)
    }
  }

  // Generate AI caption when topic changes (custom mode)
  useEffect(() => {
    if (debouncedTopic && formState.workflowMode === 'custom') {
      generateAICaption(debouncedTopic)
    }
  }, [debouncedTopic, formState.workflowMode])

  const generateAICaption = async (topic: string) => {
    if (!topic.trim()) return

    setIsGeneratingText(true)
    try {
      const response = await fetch('/api/content/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: topic,
          platform: formState.platform,
          type: 'caption',
          artistName: 'ALGORYX',
          trackTitle: 'Solitude'
        })
      })

      if (!response.ok) throw new Error('Failed to generate caption')

      const data = await response.json()
      setGeneratedCaption(data.text)
      setFormState(prev => ({ ...prev, caption: data.text }))
    } catch (error) {
      console.error('Failed to generate caption:', error)
      toast.error('Failed to generate caption')
    } finally {
      setIsGeneratingText(false)
    }
  }

  const handleTemplateSelect = async (template: typeof CREATIVE_TEMPLATES[0]) => {
    setFormState(prev => ({ ...prev, selectedTemplate: template.name }))
    
    // Generate caption based on template
    const caption = template.captionTemplate
      .replace('{artistName}', 'ALGORYX')
      .replace('{trackTitle}', 'Solitude')
      .replace('{playlistName}', 'New Music Friday')
    
    setGeneratedCaption(caption)
    setFormState(prev => ({ ...prev, caption: caption }))
  }

  const handleGenerateImages = async () => {
    if (!formState.caption && !formState.selectedTemplate && !customCaption) {
      toast.error('Please select a template or write a caption first')
      return
    }

    setIsGenerating(true)
    try {
      const prompt = formState.workflowMode === 'template' 
        ? formState.selectedTemplate || formState.topic
        : customCaption || formState.topic

      // If user has uploaded a photo, use background removal
      if (userPhotos.length > 0) {
        const response = await fetch('/api/nova-canvas/generate-with-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectImageUrl: userPhotos[0],
            prompt: prompt,
            platform: formState.platform,
            artistName: 'ALGORYX'
          })
        })

        if (!response.ok) throw new Error('Failed to generate images')

        const data = await response.json()
        setGeneratedImages(data.images || [])
      } else {
        // Regular image generation - Mock 3 images for now
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const mockImages = [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop'
        ]
        
        setGeneratedImages(mockImages)
      }

      setSelectedImageIndex(0)
      toast.success('Images generated successfully!')
    } catch (error) {
      console.error('Failed to generate images:', error)
      toast.error('Failed to generate images')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateDraft = () => {
    if (selectedImageIndex === null) {
      toast.error('Please select an image')
      return
    }

    onContentGenerated?.({
      caption: formState.workflowMode === 'template' ? generatedCaption : customCaption,
      images: generatedImages,
      platform: formState.platform,
      selectedImageIndex
    })

    toast.success('Draft created successfully!')
  }

  const handleReset = () => {
    setFormState({
      platform: 'instagram-post',
      topic: '',
      caption: '',
      workflowMode: 'template',
      selectedTemplate: null
    })
    setGeneratedImages([])
    setSelectedImageIndex(null)
    setGeneratedCaption('')
    setCustomCaption('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      const newPhotos = [...userPhotos, data.url]
      setUserPhotos(newPhotos)
      await saveUserPhotos(newPhotos)
      toast.success('Photo uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto relative">
      <div className="space-y-6 lg:pr-[20rem]">
        {/* Main Form */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <Sparkles className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <CardTitle>Social Media Creator</CardTitle>
                    <CardDescription>Create engaging posts with AI-powered visuals and captions</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pre-generated Content Blocks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ready-to-Post Content</h3>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRE_GENERATED_CONTENT.map((content, index) => (
                    <Card 
                      key={content.id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-cosmic-teal/20 hover:border-cosmic-teal/50 group relative overflow-hidden will-change-transform",
                        hoveredCard === content.id && "ring-2 ring-cosmic-teal/30",
                        formState.selectedTemplate === content.title && "border-cosmic-teal border-2"
                      )}
                      style={{ backfaceVisibility: 'hidden', perspective: '1000px' }}
                      onMouseEnter={() => setHoveredCard(content.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => {
                        setFormState(prev => ({ 
                          ...prev, 
                          workflowMode: 'template',
                          selectedTemplate: content.title
                        }))
                        setGeneratedCaption(content.caption)
                        setGeneratedImages(content.images)
                        setSelectedImageIndex(0)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex -space-x-2 mb-3">
                          {content.images.slice(0, 3).map((image, idx) => (
                            <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-background">
                              <img src={`${image}&w=100&h=100`} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <h4 className="font-semibold mb-1 group-hover:text-cosmic-teal transition-colors">{content.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{content.subtitle}</p>
                        <p className="text-xs line-clamp-2">{content.preview}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-cosmic-teal opacity-0 group-hover:opacity-100 transition-opacity h-4">
                          <Sparkles className="h-3 w-3" />
                          <span>Click to use this content</span>
                        </div>
                      </CardContent>
                      {/* Hover Overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-r from-cosmic-teal/5 to-transparent transition-opacity duration-300 pointer-events-none",
                          hoveredCard === content.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Task-Specific Templates */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Create Specific Content</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-cosmic-teal/50 group"
                    onClick={() => {
                      setFormState(prev => ({ 
                        ...prev, 
                        workflowMode: 'template',
                        selectedTemplate: 'Event Flyer'
                      }))
                      toast.info('Event Flyer template selected - Upload your photos to continue')
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center mx-auto mb-2">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <h5 className="font-medium text-sm">Event Flyer</h5>
                      <p className="text-xs text-muted-foreground mt-1">Create stunning flyers</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-cosmic-teal/50 group"
                    onClick={() => {
                      setFormState(prev => ({ 
                        ...prev, 
                        workflowMode: 'template',
                        selectedTemplate: 'Artist Photo'
                      }))
                      toast.info('Artist Photo template selected - Upload your photos to continue')
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-pink-500 text-white flex items-center justify-center mx-auto mb-2">
                        <Camera className="h-5 w-5" />
                      </div>
                      <h5 className="font-medium text-sm">Artist Photo</h5>
                      <p className="text-xs text-muted-foreground mt-1">Professional shots</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-cosmic-teal/50 group"
                    onClick={() => {
                      setFormState(prev => ({ 
                        ...prev, 
                        workflowMode: 'template',
                        selectedTemplate: 'Album Artwork'
                      }))
                      toast.info('Album Artwork template selected - Upload your photos to continue')
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center mx-auto mb-2">
                        <Music className="h-5 w-5" />
                      </div>
                      <h5 className="font-medium text-sm">Album Art</h5>
                      <p className="text-xs text-muted-foreground mt-1">Eye-catching covers</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-cosmic-teal/50 group"
                    onClick={() => {
                      setFormState(prev => ({ 
                        ...prev, 
                        workflowMode: 'custom'
                      }))
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center mx-auto mb-2">
                        <Type className="h-5 w-5" />
                      </div>
                      <h5 className="font-medium text-sm">Quote Card</h5>
                      <p className="text-xs text-muted-foreground mt-1">Shareable quotes</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Custom Workflow */}
              {formState.workflowMode === 'custom' && (
                <div className="space-y-6">
                  {/* Custom Topic Input */}
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-base font-medium">
                      Custom Topic
                    </Label>
                    <Textarea
                      id="topic"
                      placeholder="The state of AI in Music Industry"
                      value={formState.topic}
                      onChange={(e) => setFormState(prev => ({ ...prev, topic: e.target.value }))}
                      className="min-h-[100px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      AI will generate your caption automatically
                    </p>
                  </div>

                  {/* Upload Photo */}
                  <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload your photo for personalized templates
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Photo
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Custom Caption Input */}
                  <div className="space-y-2">
                    <Label htmlFor="caption" className="text-base font-medium">
                      Your Caption
                    </Label>
                    <Textarea
                      id="caption"
                      placeholder="Write your caption here..."
                      value={customCaption}
                      onChange={(e) => setCustomCaption(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Write your caption and we'll generate matching visuals
                    </p>
                  </div>

                  {/* Generate Images Button */}
                  <Button
                    onClick={handleGenerateImages}
                    disabled={isGenerating || !customCaption.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Images...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Images
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Generated Content */}
              {generatedImages.length > 0 && (
                <div className="space-y-4" data-generated-content>
                  {/* Generated Images */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Generated Images</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {generatedImages.map((image, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                            selectedImageIndex === idx
                              ? "border-teal-500 ring-2 ring-teal-500/20"
                              : "border-muted hover:border-teal-500/50"
                          )}
                        >
                          <img
                            src={image}
                            alt={`Generated ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {selectedImageIndex === idx && (
                            <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                              <Badge className="bg-teal-500 text-white">Selected</Badge>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generated Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Generated Caption</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={async () => {
                          const prompt = window.prompt('How would you like to modify this caption?', 'Make it more engaging')
                          if (prompt) {
                            setIsGeneratingText(true)
                            try {
                              const response = await fetch('/api/content/generate-text', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  prompt: `Modify this caption based on the instruction: "${prompt}"\n\nOriginal caption:\n${generatedCaption}`,
                                  platform: formState.platform,
                                  type: 'caption'
                                })
                              })
                              if (response.ok) {
                                const data = await response.json()
                                setGeneratedCaption(data.text)
                                toast.success('Caption updated!')
                              }
                            } catch (error) {
                              toast.error('Failed to update caption')
                            } finally {
                              setIsGeneratingText(false)
                            }
                          }
                        }}
                        disabled={isGeneratingText}
                      >
                        {isGeneratingText ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Edit with AI
                      </Button>
                    </div>
                    <Textarea
                      value={generatedCaption}
                      onChange={(e) => setGeneratedCaption(e.target.value)}
                      className="min-h-[120px] resize-none"
                      placeholder="Your caption will appear here..."
                    />
                  </div>

                  {/* Schedule Button */}
                  {selectedImageIndex !== null && (
                    <Button
                      onClick={handleCreateDraft}
                      className="w-full"
                      size="lg"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview - fixed on large screens */}
        <div className="hidden lg:block fixed top-24 right-8 w-80 z-30">
          <div className="h-[calc(100vh-7rem)] flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
              {/* Compact Platform Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setFormState(prev => ({ ...prev, platform: 'instagram-post' }))}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                    formState.platform === 'instagram-post'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Post
                </button>
                <button
                  onClick={() => setFormState(prev => ({ ...prev, platform: 'instagram-story' }))}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
                    formState.platform === 'instagram-story'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Story
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {/* Dynamic Platform Mock */}
              <div className="bg-muted/50 p-4">
                <div className="max-w-sm mx-auto">
                  {/* Instagram Post Layout */}
                  {formState.platform === 'instagram-post' && (
                    <>
                      {/* Profile Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          A
                        </div>
                        <div>
                          <p className="font-semibold">ALGORYX</p>
                          <p className="text-xs text-muted-foreground">Music Artist</p>
                        </div>
                      </div>

                      {/* Square Image */}
                      <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                        {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                          <img
                            src={generatedImages[selectedImageIndex]}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}
                      </div>

                      {/* Caption */}
                      <div className="space-y-2">
                        <p className="text-sm whitespace-pre-wrap">
                          {(generatedImages.length > 0 && (formState.workflowMode === 'template' ? generatedCaption : customCaption)) || "Your caption will appear here..."}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Instagram Story Layout - Full View */}
                  {formState.platform === 'instagram-story' && (
                    <div className="bg-black rounded-lg overflow-hidden mx-auto max-w-[250px]">
                      {/* Full Vertical Story */}
                      <div className="aspect-[9/16] bg-muted relative">
                        {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                          <img
                            src={generatedImages[selectedImageIndex]}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-16 w-16" />
                          </div>
                        )}
                        
                        {/* Story UI Elements */}
                        <div className="absolute top-4 left-4 right-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                              A
                            </div>
                            <p className="text-white font-semibold text-sm">algoryx_music</p>
                            <p className="text-white/70 text-xs ml-auto">now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TODO: Commented out platforms for future use */}
                  {/* Twitter/X Layout */}
                  {/* {formState.platform === 'twitter' && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          A
                        </div>
                        <div>
                          <p className="font-semibold">ALGORYX</p>
                          <p className="text-xs text-muted-foreground">@algoryx_music</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {(generatedImages.length > 0 && (formState.workflowMode === 'template' ? generatedCaption : customCaption)) || "Your tweet will appear here..."}
                        </p>
                      </div>
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                          <img src={generatedImages[selectedImageIndex]} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}

                  {/* TikTok Layout */}
                  {/* {formState.platform === 'tiktok' && (
                    <div className="bg-black rounded-lg overflow-hidden max-w-[200px] mx-auto">
                      <div className="aspect-[9/16] bg-muted relative">
                        {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                          <img src={generatedImages[selectedImageIndex]} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">A</div>
                            <p className="text-white font-semibold text-xs">@algoryx_music</p>
                          </div>
                          <p className="text-white text-xs line-clamp-3">
                            {(generatedImages.length > 0 && (formState.workflowMode === 'template' ? generatedCaption : customCaption)) || "Your TikTok caption will appear here..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 