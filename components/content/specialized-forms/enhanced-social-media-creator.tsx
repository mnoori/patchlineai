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
  Plus
} from "lucide-react"
import type { EnhancedContentPrompt } from "@/lib/content-types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { contentPersistence } from "@/lib/content-persistence"
import { getPromptSuggestions, fillPromptTemplate, PROMPT_MODIFIERS, type DynamicPrompt } from "@/lib/prompt-library"
import { getNovaCanvasUtils } from "@/lib/nova-canvas-utils"

interface EnhancedSocialMediaCreatorProps {
  onContentGenerated?: (draftId: string) => void
  initialPrompt?: EnhancedContentPrompt | null
  currentStep?: number
  onStepChange?: (step: number) => void
}

// Platform configurations with proper branding
const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'from-pink-500 to-purple-500',
    aspectRatio: { width: 1080, height: 1080 },
    description: 'Square posts, stories & reels'
  },
  {
    id: 'twitter',
    name: 'X',
    icon: XIcon,
    color: 'from-black to-gray-800 dark:from-white dark:to-gray-200',
    aspectRatio: { width: 1200, height: 675 },
    description: 'Real-time updates & threads'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'from-black to-pink-500',
    aspectRatio: { width: 1080, height: 1920 },
    description: 'Short-form video content'
  }
] as const

export function EnhancedSocialMediaCreator({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: EnhancedSocialMediaCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'generate' | 'upload' | 'album'>('generate')
  const [suggestedPrompts, setSuggestedPrompts] = useState<DynamicPrompt[]>([])
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<DynamicPrompt | null>(null)
  const [generatedCaption, setGeneratedCaption] = useState<string>("")
  const [showGenerateButton, setShowGenerateButton] = useState(false)
  const [userPhotos, setUserPhotos] = useState<string[]>([]) // User's profile photos
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  const [albumCoverOptions, setAlbumCoverOptions] = useState({
    style: 'modern' as const,
    mood: '',
    genre: '',
    albumTitle: ''
  })

  // Predefined creative templates
  const CREATIVE_TEMPLATES = [
    {
      id: 'vibrant-album',
      name: 'Vibrant Album Cover',
      description: 'Eye-catching album cover for social media',
      prompt: 'Create a vibrant, colorful album cover with dynamic energy, abstract shapes, and modern design elements',
      requiresUserPhoto: true,
      style: 'vibrant'
    },
    {
      id: 'cinematic-release',
      name: 'Cinematic Release Teaser',
      description: 'Dramatic teaser image for upcoming release',
      prompt: 'Cinematic promotional image with dramatic lighting, moody atmosphere, depth of field, professional photography',
      requiresUserPhoto: true,
      style: 'cinematic'
    },
    {
      id: 'minimalist-announcement',
      name: 'Minimalist Announcement',
      description: 'Clean, modern design for announcements',
      prompt: 'Minimalist design with clean lines, plenty of white space, elegant typography, sophisticated color palette',
      requiresUserPhoto: false,
      style: 'minimalist'
    },
    {
      id: 'festival-ready',
      name: 'Festival Vibes',
      description: 'Energetic design for festival announcements',
      prompt: 'Festival-inspired design with bright colors, summer vibes, crowd energy, outdoor concert atmosphere',
      requiresUserPhoto: true,
      style: 'festival'
    }
  ]

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      const formState = await contentPersistence.loadFormState('social')
      if (formState) {
        setPrompt(prev => ({
          ...prev,
          platform: formState.platform || prev.platform,
          topic: formState.topic || prev.topic,
          postTone: formState.postTone || prev.postTone,
          targetAudience: formState.targetAudience || prev.targetAudience,
          includeHashtags: formState.includeHashtags ?? prev.includeHashtags,
          includeEmojis: formState.includeEmojis ?? prev.includeEmojis,
        }))
      }

      const images = await contentPersistence.loadImages('social')
      if (images) {
        setGeneratedImages(images.generated)
        setSelectedImageIndex(images.selected)
      }

      // Load user photos from profile or previous uploads
      const savedUserPhotos = await contentPersistence.loadUserPhotos()
      if (savedUserPhotos) {
        setUserPhotos(savedUserPhotos)
      }
    }

    loadPersistedData()
  }, [])

  // Apply initial prompt values
  useEffect(() => {
    if (initialPrompt) {
      setPrompt((prev) => ({
        ...prev,
        ...initialPrompt,
      }))
    }
  }, [initialPrompt])

  // Get prompt suggestions when platform or topic changes
  useEffect(() => {
    const suggestions = getPromptSuggestions({
      contentType: 'social',
      platform: prompt.platform,
      mood: prompt.postTone,
      genre: albumCoverOptions.genre
    })
    setSuggestedPrompts(suggestions)
  }, [prompt.platform, prompt.postTone, albumCoverOptions.genre])

  // Auto-generate caption when topic changes
  useEffect(() => {
    if (prompt.topic && prompt.topic.length > 3) {
      const debounceTimer = setTimeout(() => {
        handleGenerateCaption()
      }, 1000)
      return () => clearTimeout(debounceTimer)
    }
  }, [prompt.topic, prompt.platform, prompt.postTone, prompt.includeHashtags, prompt.includeEmojis])

  // Persist form state
  useEffect(() => {
    const saveState = async () => {
      await contentPersistence.saveFormState('social', {
        platform: prompt.platform,
        topic: prompt.topic,
        postTone: prompt.postTone,
        targetAudience: prompt.targetAudience,
        includeHashtags: prompt.includeHashtags,
        includeEmojis: prompt.includeEmojis,
      })
    }
    saveState()
  }, [prompt])

  // Persist images
  useEffect(() => {
    const saveImages = async () => {
      if (generatedImages.length > 0) {
        await contentPersistence.saveImages('social', generatedImages, selectedImageIndex)
      }
    }
    saveImages()
  }, [generatedImages, selectedImageIndex])

  const handleGenerateCaption = async () => {
    if (!prompt.topic?.trim()) return
    
    setIsGeneratingText(true)
    try {
      const response = await fetch('/api/content/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: prompt.topic,
          platform: prompt.platform,
          tone: prompt.postTone,
          targetAudience: prompt.targetAudience,
          includeHashtags: prompt.includeHashtags,
          includeEmojis: prompt.includeEmojis,
          contentType: 'social'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCaption(data.caption)
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      // Fallback to basic caption
      setGeneratedCaption(generateFallbackCaption())
    } finally {
      setIsGeneratingText(false)
    }
  }

  const generateFallbackCaption = () => {
    const emojis = prompt.includeEmojis ? " 🎵✨" : ""
    const hashtags = prompt.includeHashtags ? "\n\n#music #newrelease #artist" : ""
    return `${prompt.topic}${emojis}${hashtags}`
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newPhotos: string[] = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newPhotos.push(e.target.result as string)
          if (newPhotos.length === files.length) {
            if (activeTab === 'generate') {
              // Save as user photos for templates
              setUserPhotos(prev => [...prev, ...newPhotos])
              contentPersistence.saveUserPhotos([...userPhotos, ...newPhotos])
              toast.success('Photo uploaded for personalized templates!')
            } else {
              // Regular upload for other tabs
              setUploadedPhotos(prev => [...prev, ...newPhotos])
              toast.success(`${files.length} photo(s) uploaded successfully`)
            }
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleTemplateClick = async (template: typeof CREATIVE_TEMPLATES[0]) => {
    setSelectedPromptTemplate(template as any)
    
    // Generate image immediately with template
    await generateFromTemplate(template)
  }

  const generateFromTemplate = async (template: typeof CREATIVE_TEMPLATES[0]) => {
    setIsGenerating(true)
    
    try {
      let finalPrompt = template.prompt
      
      // If template requires user photo and we have one, prepare for background removal
      if (template.requiresUserPhoto && userPhotos.length > 0) {
        // Use the first user photo or let them select
        const userPhoto = userPhotos[0]
        
        // Call Nova Canvas with background removal and placement
        const response = await fetch('/api/nova-canvas/generate-with-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectImage: userPhoto,
            backgroundPrompt: template.prompt,
            style: template.style,
            removeBackground: true,
            platform: prompt.platform,
            options: {
              size: PLATFORMS.find(p => p.id === prompt.platform)?.aspectRatio,
              numberOfImages: 3
            }
          })
        })

        if (!response.ok) throw new Error('Failed to generate with user photo')
        
        const data = await response.json()
        setGeneratedImages(data.images)
        setSelectedImageIndex(0)
        
        // Generate caption based on template
        await generateCaptionForTemplate(template)
        
      } else {
        // Generate without user photo
        const response = await fetch('/api/nova-canvas/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
            options: {
              style: template.style,
              size: PLATFORMS.find(p => p.id === prompt.platform)?.aspectRatio,
              numberOfImages: 3,
              contentType: 'social'
            }
          })
        })

        if (!response.ok) throw new Error('Failed to generate images')
        
        const data = await response.json()
        setGeneratedImages(data.images)
        setSelectedImageIndex(0)
        
        // Generate caption
        await generateCaptionForTemplate(template)
      }
      
      toast.success('Content generated successfully!')
    } catch (error) {
      console.error('Template generation error:', error)
      toast.error('Failed to generate from template')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCaptionForTemplate = async (template: typeof CREATIVE_TEMPLATES[0]) => {
    setIsGeneratingText(true)
    
    try {
      const response = await fetch('/api/content/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${template.name} - ${template.description}`,
          platform: prompt.platform,
          tone: prompt.postTone,
          targetAudience: prompt.targetAudience,
          includeHashtags: prompt.includeHashtags,
          includeEmojis: prompt.includeEmojis,
          contentType: 'social',
          templateStyle: template.style
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedCaption(data.caption)
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      setGeneratedCaption(generateFallbackCaption())
    } finally {
      setIsGeneratingText(false)
    }
  }

  const handleGenerateFromTemplate = async (template: DynamicPrompt) => {
    // This is now deprecated - we use handleTemplateClick instead
    setSelectedPromptTemplate(template)
    await handleGenerateImages(template.template)
  }

  const handleGenerateImages = async (customPrompt?: string) => {
    setIsGenerating(true)
    setShowGenerateButton(false)

    try {
      const platform = PLATFORMS.find(p => p.id === prompt.platform)!
      const imagePrompt = customPrompt || prompt.topic || 'Social media content'

      const response = await fetch('/api/nova-canvas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          options: {
            style: 'premium',
            size: platform.aspectRatio,
            negativePrompt: 'low quality, blurry, text errors',
            numberOfImages: 3,
            contentType: 'social'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate images')
      }

      const data = await response.json()
      setGeneratedImages(data.images)
      setSelectedImageIndex(0)
      toast.success('Images generated successfully!')
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error('Failed to generate images')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateAlbumCover = async () => {
    if (!uploadedPhotos.length) {
      toast.error('Please upload at least one artist photo')
      return
    }

    setIsGenerating(true)
    try {
      const utils = getNovaCanvasUtils()
      const covers = await utils.createAlbumCover({
        artistPhotos: uploadedPhotos,
        ...albumCoverOptions
      })
      
      setGeneratedImages(covers)
      setSelectedImageIndex(0)
      toast.success('Album covers created successfully!')
    } catch (error) {
      console.error('Album cover creation error:', error)
      toast.error('Failed to create album covers')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.topic?.trim() && activeTab === 'generate') return

    if (activeTab === 'album') {
      await handleCreateAlbumCover()
    } else {
      await handleGenerateImages()
    }

    // Simulate content generation
    setTimeout(() => {
      if (onContentGenerated) {
        onContentGenerated("social")
      }
    }, 1000)
  }

  const selectedPlatform = PLATFORMS.find(p => p.id === prompt.platform)!

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <Sparkles className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <CardTitle>Social Media Creator</CardTitle>
                  <CardDescription>Create engaging posts with AI-powered visuals and captions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Compact Platform Selection */}
                <div className="space-y-3">
                  <Label>Platform</Label>
                  <div className="flex gap-2">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => setPrompt({ ...prompt, platform: platform.id as "instagram" | "twitter" | "tiktok" })}
                        className={cn(
                          "flex-1 p-3 rounded-lg border-2 transition-all",
                          prompt.platform === platform.id
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-muted hover:border-muted-foreground/50"
                        )}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center",
                            platform.color
                          )}>
                            <platform.icon className={cn(
                              "h-5 w-5",
                              platform.id === 'twitter' ? "text-black dark:text-white" : "text-white"
                            )} />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">{platform.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Image Generation Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="generate">AI Generate</TabsTrigger>
                    <TabsTrigger value="upload">Upload & Edit</TabsTrigger>
                    <TabsTrigger value="album">Album Cover</TabsTrigger>
                  </TabsList>

                  <TabsContent value="generate" className="space-y-4">
                    {/* Creative Templates First */}
                    <div className="space-y-3">
                      <Label>Choose a Creative Template</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {CREATIVE_TEMPLATES.map(template => (
                          <Card
                            key={template.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-lg group",
                              selectedPromptTemplate?.id === template.id
                                ? "ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950"
                                : "hover:border-teal-500/50"
                            )}
                            onClick={() => handleTemplateClick(template)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm">{template.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {template.description}
                                    </p>
                                  </div>
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    "bg-gradient-to-br from-teal-500/20 to-cyan-500/20",
                                    "group-hover:from-teal-500/30 group-hover:to-cyan-500/30"
                                  )}>
                                    <Sparkles className="h-4 w-4 text-teal-600" />
                                  </div>
                                </div>
                                {template.requiresUserPhoto && userPhotos.length === 0 && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    📸 Upload your photo for best results
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or create custom</span>
                      </div>
                    </div>

                    {/* Custom Topic Input */}
                    <div className="space-y-2">
                      <Label htmlFor="topic">Custom Topic</Label>
                      <div className="relative">
                        <Input
                          id="topic"
                          placeholder="e.g., New single release announcement"
                          value={prompt.topic}
                          onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                        />
                        {isGeneratingText && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <Type className="inline h-3 w-3 mr-1" />
                        AI will generate your caption automatically
                      </p>
                    </div>

                    {/* User Photo Upload for Templates */}
                    {userPhotos.length === 0 && (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4" />
                          <span>Upload your photo for personalized templates</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Photo
                        </Button>
                      </div>
                    )}

                    {/* Show uploaded user photos */}
                    {userPhotos.length > 0 && (
                      <div className="space-y-2">
                        <Label>Your Photos</Label>
                        <div className="flex gap-2">
                          {userPhotos.map((photo, idx) => (
                            <div key={idx} className="relative group">
                              <img 
                                src={photo} 
                                alt={`User ${idx + 1}`} 
                                className="w-16 h-16 object-cover rounded-lg border-2 border-muted"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPhotos = userPhotos.filter((_, i) => i !== idx)
                                  setUserPhotos(newPhotos)
                                  contentPersistence.saveUserPhotos(newPhotos)
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XIcon className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-16 w-16"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload photos to enhance or edit
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                    
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img src={photo} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setUploadedPhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="album" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Album Title</Label>
                        <Input
                          placeholder="e.g., Midnight Dreams"
                          value={albumCoverOptions.albumTitle}
                          onChange={(e) => setAlbumCoverOptions({...albumCoverOptions, albumTitle: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Style</Label>
                          <Select 
                            value={albumCoverOptions.style} 
                            onValueChange={(value: any) => setAlbumCoverOptions({...albumCoverOptions, style: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="vintage">Vintage</SelectItem>
                              <SelectItem value="minimalist">Minimalist</SelectItem>
                              <SelectItem value="abstract">Abstract</SelectItem>
                              <SelectItem value="cinematic">Cinematic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Genre</Label>
                          <Input
                            placeholder="e.g., Electronic"
                            value={albumCoverOptions.genre}
                            onChange={(e) => setAlbumCoverOptions({...albumCoverOptions, genre: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mood</Label>
                        <Input
                          placeholder="e.g., Dreamy, energetic"
                          value={albumCoverOptions.mood}
                          onChange={(e) => setAlbumCoverOptions({...albumCoverOptions, mood: e.target.value})}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Content Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Post Tone</Label>
                    <Select
                      value={prompt.postTone}
                      onValueChange={(value) => setPrompt({ ...prompt, postTone: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Input
                      placeholder="e.g., Gen Z music fans"
                      value={prompt.targetAudience || ""}
                      onChange={(e) => setPrompt({ ...prompt, targetAudience: e.target.value })}
                    />
                  </div>
                </div>

                {/* Compact Options */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="hashtags"
                      checked={prompt.includeHashtags}
                      onCheckedChange={(checked) => setPrompt({ ...prompt, includeHashtags: checked })}
                    />
                    <Label htmlFor="hashtags" className="text-sm cursor-pointer">
                      <Hash className="inline h-3 w-3 mr-1" />
                      Hashtags
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="emojis"
                      checked={prompt.includeEmojis}
                      onCheckedChange={(checked) => setPrompt({ ...prompt, includeEmojis: checked })}
                    />
                    <Label htmlFor="emojis" className="text-sm cursor-pointer">
                      <span className="mr-1">😊</span>
                      Emojis
                    </Label>
                  </div>
                </div>

                {/* Generated Images */}
                {generatedImages.length > 0 && (
                  <div className="space-y-3">
                    <Label>Generated Images</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {generatedImages.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          className={cn(
                            "relative rounded-lg overflow-hidden border-2 transition-all",
                            selectedImageIndex === index
                              ? "border-teal-500 shadow-lg"
                              : "border-muted hover:border-muted-foreground"
                          )}
                        >
                          <img
                            src={image}
                            alt={`Generated ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          {selectedImageIndex === index && (
                            <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                              <Badge className="bg-teal-500 text-white">Selected</Badge>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isGenerating || (!prompt.topic?.trim() && activeTab === 'generate' && uploadedPhotos.length === 0)}
                  className={cn(
                    "w-full transition-all duration-300",
                    showGenerateButton 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg" 
                      : "bg-teal-500 hover:bg-teal-600"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Custom Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Live Preview - 1 column - Now sticky and properly sized */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-teal-500" />
                  <CardTitle className="text-base">Live Preview</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingText || !prompt.topic}
                  className="h-8 px-2"
                >
                  <RefreshCw className={cn("h-3 w-3", isGeneratingText && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
                {/* Platform-specific preview with proper aspect ratios */}
                {prompt.platform === 'instagram' && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-sm mx-auto">
                    <div className="p-3 border-b flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                        <Music className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">your_artist_name</p>
                        <p className="text-xs text-muted-foreground">Music Artist</p>
                      </div>
                    </div>
                    <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                      {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                        <img 
                          src={generatedImages[selectedImageIndex]} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Your image will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        {isGeneratingText ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
                            <span className="text-xs text-muted-foreground">Generating caption...</span>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">
                            {generatedCaption || prompt.topic || "Your post caption will appear here..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {prompt.platform === 'twitter' && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-sm mx-auto p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                        <Music className="h-5 w-5 text-white dark:text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="font-semibold text-sm">Artist Name</p>
                          <p className="text-xs text-muted-foreground">@handle</p>
                        </div>
                        {isGeneratingText ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
                            <span className="text-xs text-muted-foreground">Generating...</span>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">
                            {generatedCaption || prompt.topic || "Your post will appear here..."}
                          </p>
                        )}
                        {selectedImageIndex !== null && generatedImages[selectedImageIndex] && (
                          <div className="mt-3 rounded-lg overflow-hidden border">
                            <img 
                              src={generatedImages[selectedImageIndex]} 
                              alt="Preview" 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {prompt.platform === 'tiktok' && (
                  <div className="bg-black rounded-xl max-w-[200px] mx-auto aspect-[9/16] relative overflow-hidden">
                    {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                      <img 
                        src={generatedImages[selectedImageIndex]} 
                        alt="Preview" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                        <div className="text-center">
                          <Music className="h-8 w-8 text-white mx-auto mb-2" />
                          <p className="text-white text-xs">Your video preview</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      {isGeneratingText ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                          <span className="text-xs text-white/70">Generating...</span>
                        </div>
                      ) : (
                        <p className="text-white text-xs leading-relaxed">
                          {generatedCaption || prompt.topic || "Your TikTok caption..."}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={activeTab !== 'generate'}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  )
} 