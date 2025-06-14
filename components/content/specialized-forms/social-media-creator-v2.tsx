'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Upload, Sparkles, Image as ImageIcon, Type, RefreshCw, Send, Eye, XIcon, Wand2, Download, Copy, Share2, ChevronRight, Clock, TrendingUp, Calendar, Music, Camera, Palette, Check, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { isGoogleDriveConnected, listDriveFiles, getStoredGoogleAuth } from '@/lib/google-auth'

interface SocialMediaCreatorV2Props {
  onContentGenerated?: (content: any) => void
  initialPrompt?: any
  currentStep?: number
  onStepChange?: (step: number) => void
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

// Pre-generated content based on user's release schedule
const PRE_GENERATED_CONTENT = [
  {
    id: 'new-release-algoryx',
    title: 'New Release: "Solitude" by ALGORYX',
    type: 'release-announcement',
    releaseDate: 'Tomorrow',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    caption: `🎵 NEW MUSIC ALERT! 🎵

"Solitude" by ALGORYX drops TOMORROW! 🔥

This track is a journey through electronic soundscapes that will transport you to another dimension. 

Pre-save now and be the first to experience it 🎧
Link in bio!

#ALGORYX #Solitude #NewMusic #ElectronicMusic #ComingSoon`,
    template: 'new-release',
    selectedImageIndex: 0,
    status: 'ready'
  },
  {
    id: 'tour-announcement',
    title: 'Summer Tour 2024 Announcement',
    type: 'tour-announcement',
    tourDate: 'June 2024',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    caption: `🎤 TOUR ANNOUNCEMENT 🎤

ALGORYX Summer Tour 2024 is HERE! 🚌

Join us for an unforgettable journey across 15 cities:
📍 Los Angeles - June 5
📍 San Francisco - June 8
📍 Seattle - June 12
...and more!

Tickets on sale Friday at 10AM PST 🎫
Don't miss out!

#ALGORYXTour #SummerTour2024 #LiveMusic`,
    template: 'tour-announcement',
    selectedImageIndex: 1,
    status: 'ready'
  },
  {
    id: 'behind-scenes',
    title: 'Studio Sessions: Making of "Echoes"',
    type: 'behind-scenes',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    caption: `Behind the magic ✨

Spent the last 48 hours in the studio crafting something special for you all. "Echoes" started as a simple melody at 3AM and evolved into something much deeper.

Can't wait to share the full track with you next month 🎵

What's your favorite part of the creative process?

#StudioLife #BehindTheScenes #ALGORYX #MusicProduction`,
    template: 'behind-scenes',
    selectedImageIndex: 2,
    status: 'ready'
  }
]

// Task-specific templates
const TASK_TEMPLATES = [
  {
    id: 'flyer',
    name: 'Event Flyer',
    description: 'Create stunning flyers for your events',
    icon: <Calendar className="h-5 w-5" />,
    color: 'bg-purple-500',
    requiresPhotos: true
  },
  {
    id: 'artist-photo',
    name: 'Artist Photo',
    description: 'Transform photos into professional artist shots',
    icon: <Camera className="h-5 w-5" />,
    color: 'bg-pink-500',
    requiresPhotos: true
  },
  {
    id: 'album-art',
    name: 'Album Artwork',
    description: 'Design eye-catching album covers',
    icon: <Music className="h-5 w-5" />,
    color: 'bg-blue-500',
    requiresPhotos: true
  },
  {
    id: 'quote-card',
    name: 'Quote Card',
    description: 'Create shareable quote graphics',
    icon: <Type className="h-5 w-5" />,
    color: 'bg-green-500',
    requiresPhotos: false
  }
]

export function SocialMediaCreatorV2({
  onContentGenerated,
  initialPrompt,
  currentStep = 0,
  onStepChange
}: SocialMediaCreatorV2Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workflowMode, setWorkflowMode] = useState<'template' | 'custom'>('template')
  const [platform, setPlatform] = useState<'instagram' | 'twitter' | 'tiktok'>('instagram')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [customTopic, setCustomTopic] = useState(initialPrompt || '')
  const [customCaption, setCustomCaption] = useState('')
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [userPhotos, setUserPhotos] = useState<string[]>([])
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [customMode, setCustomMode] = useState(false)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [drivePhotos, setDrivePhotos] = useState<any[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [generatingContent, setGeneratingContent] = useState(false)
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  const debouncedTopic = useDebounce(customTopic, 500)

  // Load user photos on mount
  useEffect(() => {
    loadUserPhotos()
    checkGoogleDriveConnection()
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
    setSelectedTemplate(template)
    
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
        ? CREATIVE_TEMPLATES.find(t => t.id === selectedTemplate?.id)?.name || ''
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

  const checkGoogleDriveConnection = async () => {
    const connected = isGoogleDriveConnected()
    setGoogleDriveConnected(connected)
    
    if (connected) {
      await loadDrivePhotos()
    }
  }

  const loadDrivePhotos = async () => {
    try {
      const auth = getStoredGoogleAuth()
      if (!auth) return

      const response = await listDriveFiles(auth.access_token)
      setDrivePhotos(response.files || [])
    } catch (error) {
      console.error('Failed to load Google Drive photos:', error)
      toast.error('Failed to load photos from Google Drive')
    }
  }

  const handleSelectPreGenerated = (content: any) => {
    setSelectedContent(content)
    setCustomMode(false)
    setSelectedTemplate(null)
  }

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template)
    setSelectedContent(null)
    setCustomMode(false)
  }

  const handleCustomCreation = () => {
    setCustomMode(true)
    setSelectedContent(null)
    setSelectedTemplate(null)
  }

  const handlePhotoSelection = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(selectedPhotos.filter(id => id !== photoId))
    } else if (selectedPhotos.length < 3) {
      setSelectedPhotos([...selectedPhotos, photoId])
    }
  }

  const handleGenerateContent = async () => {
    setGeneratingContent(true)
    
    // Simulate content generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate 3 variants
    const variants = [
      {
        id: 1,
        image: '/api/placeholder/400/400',
        style: 'Modern'
      },
      {
        id: 2,
        image: '/api/placeholder/400/400',
        style: 'Classic'
      },
      {
        id: 3,
        image: '/api/placeholder/400/400',
        style: 'Bold'
      }
    ]
    
    setGeneratedVariants(variants)
    setGeneratingContent(false)
  }

  const handlePublish = () => {
    const finalContent = {
      caption: selectedContent?.caption || customCaption,
      image: generatedVariants[selectedVariantIndex]?.image || selectedContent?.images[selectedContent.selectedImageIndex],
      template: selectedContent?.template || selectedTemplate?.id || 'custom'
    }
    
    onContentGenerated?.(finalContent)
    toast.success('Content created successfully!')
  }

  // Pre-generated content section
  const renderPreGeneratedContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ready-to-Post Content</h3>
        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Generated
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {PRE_GENERATED_CONTENT.map((content) => (
          <motion.div
            key={content.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all",
                "hover:shadow-lg hover:border-cosmic-teal/50",
                selectedContent?.id === content.id && "border-cosmic-teal ring-2 ring-cosmic-teal/20"
              )}
              onClick={() => handleSelectPreGenerated(content)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Preview Images */}
                  <div className="flex -space-x-2">
                    {content.images.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border-2 border-background",
                          idx === content.selectedImageIndex && "ring-2 ring-cosmic-teal"
                        )}
                      >
                        <Image
                          src={img}
                          alt=""
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Content Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{content.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {content.type === 'release-announcement' && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Releases {content.releaseDate}
                            </span>
                          )}
                          {content.type === 'tour-announcement' && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {content.tourDate}
                            </span>
                          )}
                          {content.type === 'behind-scenes' && (
                            <span className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Behind the Scenes
                            </span>
                          )}
                        </p>
                      </div>
                      {content.status === 'ready' && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                    </div>
                    
                    {/* Caption Preview */}
                    <p className="text-sm mt-2 line-clamp-2">{content.caption}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Task-specific templates section
  const renderTaskTemplates = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Create Specific Content</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {TASK_TEMPLATES.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all",
                "hover:shadow-lg hover:border-cosmic-teal/50",
                selectedTemplate?.id === template.id && "border-cosmic-teal ring-2 ring-cosmic-teal/20"
              )}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={cn("p-3 rounded-lg text-white", template.color)}>
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  {template.requiresPhotos && !googleDriveConnected && (
                    <Badge variant="outline" className="text-xs">
                      Requires Google Drive
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Custom creation section
  const renderCustomCreation = () => (
    <div className="space-y-4">
      <Card
        className={cn(
          "cursor-pointer transition-all border-dashed",
          "hover:shadow-lg hover:border-cosmic-teal/50",
          customMode && "border-cosmic-teal ring-2 ring-cosmic-teal/20"
        )}
        onClick={handleCustomCreation}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cosmic-teal/20 text-cosmic-teal">
              <Wand2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Create Your Own</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Full creative control with AI assistance
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Main content area based on selection
  const renderMainContent = () => {
    // If pre-generated content is selected
    if (selectedContent) {
      return (
        <div className="space-y-6">
          {/* Selected Images */}
          <div className="space-y-3">
            <Label>Selected Design</Label>
            <div className="grid grid-cols-3 gap-4">
              {selectedContent.images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden cursor-pointer",
                    "border-2 transition-all",
                    idx === selectedContent.selectedImageIndex 
                      ? "border-cosmic-teal ring-2 ring-cosmic-teal/20" 
                      : "border-muted hover:border-cosmic-teal/50"
                  )}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  {idx === selectedContent.selectedImageIndex && (
                    <div className="absolute inset-0 bg-cosmic-teal/20 flex items-center justify-center">
                      <Check className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-3">
            <Label>Caption</Label>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap text-sm">{selectedContent.caption}</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
              onClick={handlePublish}
            >
              <Download className="h-4 w-4 mr-2" />
              Use This Content
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      )
    }

    // If template is selected or custom mode
    if (selectedTemplate || customMode) {
      return (
        <div className="space-y-6">
          {/* Photo Selection (if needed) */}
          {(selectedTemplate?.requiresPhotos || customMode) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Photos (Choose up to 3)</Label>
                <Badge variant="outline">
                  {selectedPhotos.length}/3 selected
                </Badge>
              </div>
              
              {googleDriveConnected ? (
                <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                  {drivePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer",
                        "border-2 transition-all",
                        selectedPhotos.includes(photo.id)
                          ? "border-cosmic-teal ring-2 ring-cosmic-teal/20"
                          : "border-muted hover:border-cosmic-teal/50"
                      )}
                      onClick={() => handlePhotoSelection(photo.id)}
                    >
                      <Image
                        src={photo.thumbnailLink || '/api/placeholder/150/150'}
                        alt={photo.name}
                        fill
                        className="object-cover"
                      />
                      {selectedPhotos.includes(photo.id) && (
                        <div className="absolute inset-0 bg-cosmic-teal/20 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect Google Drive to access your photos
                    </p>
                    <Button variant="outline" size="sm">
                      Connect Google Drive
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Caption Input (for custom mode) */}
          {customMode && (
            <div className="space-y-3">
              <Label>Write Your Caption</Label>
              <Textarea
                placeholder="Write your caption here..."
                value={customCaption}
                onChange={(e) => setCustomCaption(e.target.value)}
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground">
                AI will generate visuals based on your caption
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
            onClick={handleGenerateContent}
            disabled={generatingContent || (selectedTemplate?.requiresPhotos && selectedPhotos.length === 0)}
          >
            {generatingContent ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Generating Content...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>

          {/* Generated Variants */}
          {generatedVariants.length > 0 && (
            <div className="space-y-3">
              <Label>Choose Your Favorite Style</Label>
              <div className="grid grid-cols-3 gap-4">
                {generatedVariants.map((variant, idx) => (
                  <div
                    key={variant.id}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer",
                      "border-2 transition-all",
                      idx === selectedVariantIndex
                        ? "border-cosmic-teal ring-2 ring-cosmic-teal/20"
                        : "border-muted hover:border-cosmic-teal/50"
                    )}
                    onClick={() => setSelectedVariantIndex(idx)}
                  >
                    <Image
                      src={variant.image}
                      alt={variant.style}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium">{variant.style}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                onClick={handlePublish}
              >
                <Check className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20">
              <Share2 className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <CardTitle>Social Media Creator</CardTitle>
              <CardDescription>
                AI-powered content creation for your social channels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid lg:grid-cols-[1fr,400px] gap-8">
            {/* Left Column - Selection Area */}
            <div className="space-y-8">
              {renderPreGeneratedContent()}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              {renderTaskTemplates()}
              {renderCustomCreation()}
            </div>

            {/* Right Column - Content Area */}
            <div className="lg:border-l lg:pl-8">
              {(selectedContent || selectedTemplate || customMode) ? (
                renderMainContent()
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select content to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 