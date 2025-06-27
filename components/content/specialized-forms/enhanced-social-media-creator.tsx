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
  Camera,
  ArrowLeft,
  Edit2
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

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
  const [activeTab, setActiveTab] = useState<'ready' | 'specific'>('ready')
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [imageEditPrompt, setImageEditPrompt] = useState('')
  const [captionEditPrompt, setCaptionEditPrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isLivePreviewReady, setIsLivePreviewReady] = useState(false)
  
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
    
    // Delay showing live preview to prevent jump
    const timer = setTimeout(() => {
      setIsLivePreviewReady(true)
    }, 50)
    return () => clearTimeout(timer)
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

  const handleQuickImageEdit = (editType: string) => {
    const prompts: Record<string, string> = {
      enhance: 'Enhance this image with better lighting, colors, and clarity',
      background: 'Remove the background and make it transparent',
      professional: 'Make this image look more professional and polished',
      artistic: 'Apply an artistic style to make it more creative and unique'
    }
    setImageEditPrompt(prompts[editType] || '')
    handleApplyImageEdit(prompts[editType])
  }

  const handleApplyImageEdit = async (prompt?: string) => {
    const editPrompt = prompt || imageEditPrompt
    if (!editPrompt.trim() || editingImageIndex === null) return

    setIsGeneratingImage(true)
    try {
      // Simulate AI image editing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In production, this would call an AI image editing API
      // For now, we'll just update with a placeholder
      const updatedImages = [...generatedImages]
      updatedImages[editingImageIndex] = `${generatedImages[editingImageIndex]}?edited=${Date.now()}`
      setGeneratedImages(updatedImages)
      
      toast.success('Image updated successfully!')
      setImageEditPrompt('')
    } catch (error) {
      console.error('Failed to edit image:', error)
      toast.error('Failed to edit image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleQuickCaptionEdit = (editType: string) => {
    const prompts: Record<string, string> = {
      engaging: 'Make this caption more engaging and attention-grabbing',
      cta: 'Add a clear call to action to this caption',
      shorter: 'Make this caption shorter and more concise',
      emojis: 'Add relevant emojis to make this caption more fun'
    }
    setCaptionEditPrompt(prompts[editType] || '')
    handleApplyCaptionEdit(prompts[editType])
  }

  const handleApplyCaptionEdit = async (prompt?: string) => {
    const editPrompt = prompt || captionEditPrompt
    if (!editPrompt.trim()) return

    setIsGeneratingText(true)
    try {
      const response = await fetch('/api/content/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${editPrompt}\n\nOriginal caption:\n${generatedCaption}`,
          platform: formState.platform,
          type: 'caption'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCaption(data.text)
        toast.success('Caption updated!')
        setCaptionEditPrompt('')
      }
    } catch (error) {
      console.error('Failed to update caption:', error)
      toast.error('Failed to update caption')
    } finally {
      setIsGeneratingText(false)
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4">
      {/* Grid layout: main content + live preview */}
      <div className="lg:grid lg:grid-cols-[1fr_24rem] lg:gap-4">
        {/* Main Content */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.history.back()}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <Sparkles className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <CardTitle>AI Social Media Creator</CardTitle>
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
              
              {/* Tab Navigation */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg mt-4">
                <button
                  onClick={() => setActiveTab('ready')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                    activeTab === 'ready'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Ready-to-Post
                </button>
                <button
                  onClick={() => setActiveTab('specific')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                    activeTab === 'specific'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Create Custom Content
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Ready-to-Post Tab Content */}
              {activeTab === 'ready' && (
                <>
                  {/* Pre-generated Content Blocks */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PRE_GENERATED_CONTENT.map((content, index) => (
                        <Card 
                          key={content.id}
                          className={cn(
                            "cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-cyan/20 hover:border-brand-cyan/50 group relative overflow-hidden will-change-transform",
                            hoveredCard === content.id && "ring-2 ring-brand-cyan/30",
                            formState.selectedTemplate === content.title && "border-brand-cyan border-2"
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
                            <h4 className="font-semibold mb-1 group-hover:text-brand-cyan transition-colors">{content.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{content.subtitle}</p>
                            <p className="text-xs line-clamp-2">{content.preview}</p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity h-4">
                              <Sparkles className="h-3 w-3" />
                              <span>Click to use this content</span>
                            </div>
                          </CardContent>
                          {/* Hover Overlay */}
                          <div
                            className={cn(
                              "absolute inset-0 bg-gradient-to-r from-brand-cyan/5 to-transparent transition-opacity duration-300 pointer-events-none",
                              hoveredCard === content.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Generated Content */}
                  {generatedImages.length > 0 && (
                    <div className="space-y-4" data-generated-content>
                      {/* Photo Selection and Editing */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {generatedImages.map((image, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                                selectedImageIndex === idx
                                  ? "border-teal-500 ring-2 ring-teal-500/20"
                                  : "border-muted hover:border-teal-500/50"
                              )}
                            >
                              <img
                                src={image}
                                alt={`Option ${idx + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                              {/* Click to select, button to edit */}
                              <button
                                onClick={() => setSelectedImageIndex(idx)}
                                className="absolute inset-0 bg-transparent"
                                aria-label={`Select image ${idx + 1}`}
                              />
                              {/* Edit button */}
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute bottom-2 right-2 h-8 px-3 bg-black/80 hover:bg-black/90 text-white border-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingImageIndex(idx)
                                  setShowEditDrawer(true)
                                }}
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              {selectedImageIndex === idx && (
                                <div className="absolute inset-0 ring-2 ring-teal-500 pointer-events-none rounded-lg" />
                              )}
                            </div>
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
                          onChange={(e) => {
                            setGeneratedCaption(e.target.value)
                            // Auto-resize on change
                            setTimeout(() => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.max(120, target.scrollHeight) + 'px';
                            }, 0);
                          }}
                          className="min-h-[120px] resize-none overflow-hidden"
                          placeholder="Your caption will appear here..."
                          style={{ 
                            height: Math.max(120, generatedCaption.split('\n').length * 24 + 40) + 'px',
                            minHeight: '120px'
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.max(120, target.scrollHeight) + 'px';
                          }}
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
                </>
              )}

              {/* Specific Tab Content */}
              {activeTab === 'specific' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-lg hover:border-brand-cyan/50 group"
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
                      className="cursor-pointer transition-all hover:shadow-lg hover:border-brand-cyan/50 group"
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
                      className="cursor-pointer transition-all hover:shadow-lg hover:border-brand-cyan/50 group"
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
                      className="cursor-pointer transition-all hover:shadow-lg hover:border-brand-cyan/50 group"
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview - sticky */}
        <div className={cn(
          "hidden lg:block w-[24rem] sticky top-24 transition-opacity duration-300",
          isLivePreviewReady ? "opacity-100" : "opacity-0"
        )}>
          <Card className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden shadow-xl">
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
                <div className="p-4">
                  <div className="max-w-sm mx-auto">
                    {/* Instagram Post Layout */}
                    {formState.platform === 'instagram-post' && (
                      <div className="bg-muted/30 rounded-lg p-4">
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
                      </div>
                    )}

                    {/* Instagram Story Layout - Full View */}
                    {formState.platform === 'instagram-story' && (
                      <div className="bg-black rounded-lg overflow-hidden mx-auto w-full max-w-[280px]">
                        {/* Full Vertical Story */}
                        <div className="aspect-[9/16] bg-black relative">
                          {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                            <img
                              src={generatedImages[selectedImageIndex]}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
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
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Edit Sheet - Wide drawer style like legal tab */}
      {showEditDrawer && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
          onClick={() => setShowEditDrawer(false)}
        />
      )}
      <Sheet open={showEditDrawer} onOpenChange={setShowEditDrawer} modal={false}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border/50" style={{ position: 'fixed' }}>
          {/* Glassmorphism background overlay */}
          <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
          <SheetHeader className="border-b border-brand-cyan/20 pb-4">
            <SheetTitle className="text-brand-cyan">AI Content Editor</SheetTitle>
            <SheetDescription>
              Edit your image and caption with AI-powered tools
            </SheetDescription>
          </SheetHeader>

          {editingImageIndex !== null && (
            <div className="py-6 space-y-6">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-brand-cyan">IMAGE</h3>
                  {isGeneratingImage && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  )}
                </div>
                
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={generatedImages[editingImageIndex]}
                    alt="Editing"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  {isGeneratingImage && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-cyan" />
                        <p className="text-sm text-muted-foreground">Applying AI edits...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Image Edit Options */}
                <div className="space-y-3">
                  <Label htmlFor="image-prompt">Describe how you want to modify this image</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="image-prompt"
                      placeholder="e.g., Make it more vibrant, add a sunset background, remove the background, make it look more professional..."
                      className="min-h-[80px] flex-1"
                      value={imageEditPrompt}
                      onChange={(e) => setImageEditPrompt(e.target.value)}
                    />
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickImageEdit('enhance')}
                      disabled={isGeneratingImage}
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Auto Enhance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickImageEdit('background')}
                      disabled={isGeneratingImage}
                    >
                      Remove Background
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickImageEdit('professional')}
                      disabled={isGeneratingImage}
                    >
                      Make Professional
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickImageEdit('artistic')}
                      disabled={isGeneratingImage}
                    >
                      Artistic Style
                    </Button>
                  </div>

                  <Button
                    className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                    onClick={() => handleApplyImageEdit()}
                    disabled={isGeneratingImage || !imageEditPrompt.trim()}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying Changes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Apply AI Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="border-t border-brand-cyan/20" />

              {/* Caption Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-brand-cyan">CAPTION</h3>
                  {isGeneratingText && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={generatedCaption}
                    onChange={(e) => setGeneratedCaption(e.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Your caption..."
                  />

                  <div className="space-y-3">
                    <Label htmlFor="caption-prompt">AI Caption Assistant</Label>
                    <Textarea
                      id="caption-prompt"
                      placeholder="e.g., Make it more engaging, add a call to action, make it shorter, add more emojis..."
                      className="min-h-[60px]"
                      value={captionEditPrompt}
                      onChange={(e) => setCaptionEditPrompt(e.target.value)}
                    />

                    {/* Quick Caption Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickCaptionEdit('engaging')}
                        disabled={isGeneratingText}
                      >
                        More Engaging
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickCaptionEdit('cta')}
                        disabled={isGeneratingText}
                      >
                        Add Call to Action
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickCaptionEdit('shorter')}
                        disabled={isGeneratingText}
                      >
                        Make Shorter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickCaptionEdit('emojis')}
                        disabled={isGeneratingText}
                      >
                        Add Emojis
                      </Button>
                    </div>

                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => handleApplyCaptionEdit()}
                      disabled={isGeneratingText || !captionEditPrompt.trim()}
                    >
                      {isGeneratingText ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating Caption...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Apply Caption Edit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-brand-cyan/20 pt-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowEditDrawer(false)
                    toast.success('Changes saved!')
                  }}
                >
                  Save & Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
} 