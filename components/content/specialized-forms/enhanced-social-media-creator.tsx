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
  Hash
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
    id: 'x',
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
]

export function EnhancedSocialMediaCreator({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: EnhancedSocialMediaCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'generate' | 'upload' | 'album'>('generate')
  const [suggestedPrompts, setSuggestedPrompts] = useState<DynamicPrompt[]>([])
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<DynamicPrompt | null>(null)
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
            setUploadedPhotos(prev => [...prev, ...newPhotos])
            toast.success(`${files.length} photo(s) uploaded successfully`)
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleGenerateFromTemplate = async (template: DynamicPrompt) => {
    setSelectedPromptTemplate(template)
    
    // Auto-fill variables with smart defaults
    const variables: Record<string, string> = {}
    template.variables.forEach(variable => {
      switch (variable) {
        case 'genre':
          variables[variable] = albumCoverOptions.genre || 'contemporary'
          break
        case 'artistName':
          variables[variable] = prompt.targetAudience || 'the artist'
          break
        case 'mood':
          variables[variable] = prompt.postTone || 'energetic'
          break
        default:
          variables[variable] = `[${variable}]`
      }
    })

    const filledPrompt = fillPromptTemplate(template.template, variables)
    await handleGenerateImages(filledPrompt)
  }

  const handleGenerateImages = async (customPrompt?: string) => {
    setIsGenerating(true)

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
                  <CardDescription>Create engaging posts with AI-powered visuals</CardDescription>
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
                        onClick={() => setPrompt({ ...prompt, platform: platform.id as any })}
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
                              platform.id === 'x' ? "text-black dark:text-white" : "text-white"
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
                    <div className="space-y-2">
                      <Label htmlFor="topic">Post Topic *</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., New single release announcement"
                        value={prompt.topic}
                        onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                        required
                      />
                    </div>

                    {/* Smart Prompt Suggestions */}
                    {suggestedPrompts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Suggested Templates</Label>
                        <ScrollArea className="h-32 rounded-md border p-2">
                          <div className="space-y-2">
                            {suggestedPrompts.map(template => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => handleGenerateFromTemplate(template)}
                                className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                              >
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
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
                  className="w-full bg-teal-500 hover:bg-teal-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Live Preview - 1 column */}
        <div className="lg:sticky lg:top-20 h-fit">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-teal-500" />
                <CardTitle className="text-base">Live Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4">
                {/* Platform-specific preview */}
                {prompt.platform === 'instagram' && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg h-full flex flex-col">
                    <div className="p-3 border-b flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">your_artist_name</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                        <img 
                          src={generatedImages[selectedImageIndex]} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm line-clamp-3">
                        {prompt.topic || "Your post caption..."}
                        {prompt.includeEmojis && " 🎵✨"}
                      </p>
                      {prompt.includeHashtags && (
                        <p className="text-xs text-blue-600 mt-1">#music #newrelease</p>
                      )}
                    </div>
                  </div>
                )}

                {prompt.platform === 'x' && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg h-full p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm">Artist Name</p>
                          <p className="text-xs text-muted-foreground">@handle</p>
                        </div>
                        <p className="text-sm mt-1">
                          {prompt.topic || "Your post..."}
                          {prompt.includeEmojis && " 🎵"}
                        </p>
                        {selectedImageIndex !== null && generatedImages[selectedImageIndex] && (
                          <div className="mt-2 rounded-lg overflow-hidden">
                            <img 
                              src={generatedImages[selectedImageIndex]} 
                              alt="Preview" 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        {prompt.includeHashtags && (
                          <p className="text-xs text-blue-600 mt-2">#music #artist</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {prompt.platform === 'tiktok' && (
                  <div className="bg-black rounded-lg h-full relative overflow-hidden">
                    {selectedImageIndex !== null && generatedImages[selectedImageIndex] ? (
                      <img 
                        src={generatedImages[selectedImageIndex]} 
                        alt="Preview" 
                        className="absolute inset-0 w-full h-full object-cover opacity-70"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm">
                        {prompt.topic || "Your TikTok caption..."}
                        {prompt.includeEmojis && " 🎵✨"}
                      </p>
                      {prompt.includeHashtags && (
                        <p className="text-white text-xs mt-1">#fyp #music</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 