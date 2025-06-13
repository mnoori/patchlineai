'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Upload, Sparkles, Image as ImageIcon, Type, RefreshCw, Send, Eye, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

interface SocialMediaCreatorV2Props {
  onContentGenerated?: (content: {
    caption: string
    images: string[]
    platform: string
    selectedImageIndex: number | null
  }) => void
  initialPrompt?: string
}

// Platform configurations with icons from platform-integrations.tsx
const PLATFORM_ICONS = {
  instagram: (
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
  twitter: (
    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
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
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    </div>
  ),
  tiktok: (
    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.321 5.562a5.124 5.124 0 0 1-3.414-1.267 5.124 5.124 0 0 1-1.537-2.723H10.5v10.99c0 1.42-1.193 2.56-2.64 2.56-1.45 0-2.64-1.14-2.64-2.56 0-1.42 1.19-2.56 2.64-2.56.287 0 .573.046.84.138v-3.86a6.3 6.3 0 0 0-.84-.057C4.15 6.227 1 9.376 1 13.276c0 3.9 3.15 7.05 7.02 7.05 3.87 0 7.02-3.15 7.02-7.05v-3.995a8.783 8.783 0 0 0 4.282 1.092V6.517a5.234 5.234 0 0 1-1-.955Z" />
      </svg>
    </div>
  )
}

const PLATFORMS = [
  { id: 'instagram', aspectRatio: { width: 1080, height: 1080 } },
  { id: 'twitter', aspectRatio: { width: 1200, height: 675 } },
  { id: 'tiktok', aspectRatio: { width: 1080, height: 1920 } }
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

export function SocialMediaCreatorV2({
  onContentGenerated,
  initialPrompt
}: SocialMediaCreatorV2Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workflowMode, setWorkflowMode] = useState<'template' | 'custom'>('template')
  const [platform, setPlatform] = useState<'instagram' | 'twitter' | 'tiktok'>('instagram')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customTopic, setCustomTopic] = useState(initialPrompt || '')
  const [customCaption, setCustomCaption] = useState('')
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [userPhotos, setUserPhotos] = useState<string[]>([])
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingText, setIsGeneratingText] = useState(false)

  const debouncedTopic = useDebounce(customTopic, 500)

  // Load user photos on mount
  useEffect(() => {
    loadUserPhotos()
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

  // Generate AI caption for custom mode
  useEffect(() => {
    if (debouncedTopic && workflowMode === 'custom') {
      generateAICaption(debouncedTopic)
    }
  }, [debouncedTopic, workflowMode])

  const generateAICaption = async (topic: string) => {
    if (!topic.trim()) return

    setIsGeneratingText(true)
    try {
      const response = await fetch('/api/content/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: topic,
          platform: platform,
          type: 'caption',
          artistName: 'ALGORYX',
          trackTitle: 'Solitude'
        })
      })

      if (!response.ok) throw new Error('Failed to generate caption')

      const data = await response.json()
      setGeneratedCaption(data.text)
    } catch (error) {
      console.error('Failed to generate caption:', error)
      // Fallback caption
      setGeneratedCaption(`${topic} 🎵✨\n\n#music #newrelease #artist`)
    } finally {
      setIsGeneratingText(false)
    }
  }

  const handleTemplateSelect = (template: typeof CREATIVE_TEMPLATES[0]) => {
    setSelectedTemplate(template.id)
    
    // Generate caption based on template
    const caption = template.captionTemplate
      .replace('{artistName}', 'ALGORYX')
      .replace('{trackTitle}', 'Solitude')
      .replace('{playlistName}', 'New Music Friday')
    
    setGeneratedCaption(caption)
  }

  const handleGenerateImages = async () => {
    if (workflowMode === 'template' && !selectedTemplate) {
      toast.error('Please select a template first')
      return
    }
    if (workflowMode === 'custom' && !customCaption.trim()) {
      toast.error('Please write a caption first')
      return
    }

    setIsGenerating(true)
    try {
      const prompt = workflowMode === 'template' 
        ? CREATIVE_TEMPLATES.find(t => t.id === selectedTemplate)?.name || ''
        : customCaption

      // Mock image generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock images
      const mockImages = [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop'
      ]
      
      setGeneratedImages(mockImages)
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

    const finalCaption = workflowMode === 'template' ? generatedCaption : customCaption

    onContentGenerated?.({
      caption: finalCaption,
      images: generatedImages,
      platform: platform,
      selectedImageIndex
    })

    toast.success('Draft created successfully!')
  }

  const handleReset = () => {
    setWorkflowMode('template')
    setPlatform('instagram')
    setSelectedTemplate(null)
    setCustomTopic('')
    setCustomCaption('')
    setGeneratedCaption('')
    setGeneratedImages([])
    setSelectedImageIndex(null)
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
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2 columns */}
        <div className="lg:col-span-2">
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
              {/* Step 1: Workflow Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Choose Your Workflow</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setWorkflowMode('template')}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      workflowMode === 'template'
                        ? "border-teal-500 bg-teal-500/10"
                        : "border-muted hover:border-teal-500/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-teal-500" />
                      <span className="font-medium">Use Templates</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI generates both caption and visuals
                    </p>
                  </button>

                  <button
                    onClick={() => setWorkflowMode('custom')}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      workflowMode === 'custom'
                        ? "border-teal-500 bg-teal-500/10"
                        : "border-muted hover:border-teal-500/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="h-5 w-5 text-teal-500" />
                      <span className="font-medium">Custom Caption</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You write caption, AI creates visuals
                    </p>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Step 2: Platform Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Platform</Label>
                <div className="flex gap-4">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id as any)}
                      className={cn(
                        "relative transition-all",
                        platform === p.id
                          ? "scale-110"
                          : "opacity-60 hover:opacity-100"
                      )}
                    >
                      {PLATFORM_ICONS[p.id as keyof typeof PLATFORM_ICONS]}
                      {platform === p.id && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Step 3: Content Creation */}
              {workflowMode === 'template' ? (
                <div className="space-y-6">
                  {/* Template Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Select a Template</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {CREATIVE_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all text-left",
                            selectedTemplate === template.id
                              ? "border-teal-500 bg-teal-500/10"
                              : "border-muted hover:border-teal-500/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{template.icon}</span>
                            <span className="font-medium text-sm">{template.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                          {userPhotos.length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                              📸 Upload your photo for best results
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Photo */}
                  <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload your photo for personalized content
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {userPhotos.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {userPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={photo}
                              alt="Uploaded"
                              className="h-16 w-16 object-cover rounded"
                            />
                            <button
                              onClick={() => {
                                const newPhotos = userPhotos.filter((_, i) => i !== idx)
                                setUserPhotos(newPhotos)
                                saveUserPhotos(newPhotos)
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generated Caption */}
                  {generatedCaption && (
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Generated Caption</Label>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="whitespace-pre-wrap">{generatedCaption}</p>
                      </div>
                    </div>
                  )}

                  {/* Generate Draft Button */}
                  {selectedTemplate && (
                    <Button
                      onClick={handleGenerateImages}
                      disabled={isGenerating}
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
                          Generate Draft
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Custom Topic */}
                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-base font-medium">
                      Custom Topic
                    </Label>
                    <Textarea
                      id="topic"
                      placeholder="The state of AI in Music Industry"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      AI will generate your caption automatically
                    </p>
                    {isGeneratingText && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating caption...
                      </div>
                    )}
                  </div>

                  {/* Generated Caption Preview */}
                  {generatedCaption && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{generatedCaption}</p>
                    </div>
                  )}

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
                  </div>

                  {/* Custom Caption */}
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

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className="space-y-4">
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

                  {/* Create Draft Button */}
                  {selectedImageIndex !== null && (
                    <Button
                      onClick={handleCreateDraft}
                      className="w-full"
                      size="lg"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Create Draft
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview - 1 column */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-teal-500" />
                <CardTitle className="text-base">Live Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-muted/50 p-4">
                <div className="max-w-sm mx-auto">
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

                  {/* Image Preview */}
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

                  {/* Caption Preview */}
                  <div className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">
                      {workflowMode === 'template' 
                        ? generatedCaption || "Your caption will appear here..."
                        : customCaption || generatedCaption || "Your caption will appear here..."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 