"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Download, RefreshCw, Image as ImageIcon, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface ImageGeneratorProps {
  contentType: 'blog' | 'epk' | 'social' | 'short-video' | 'music-video'
  contentData: {
    title?: string
    topic?: string
    description?: string
    keywords?: string[]
    tone?: string
    artistName?: string
    genre?: string
  }
  onImageGenerated?: (imageUrl: string) => void
  className?: string
}

interface ImageStyle {
  id: string
  name: string
  description: string
  promptModifier: string
}

const IMAGE_STYLES: Record<string, ImageStyle[]> = {
  blog: [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Clean, modern design',
      promptModifier: 'professional, clean, modern, minimalist design, corporate aesthetic'
    },
    {
      id: 'artistic',
      name: 'Artistic',
      description: 'Creative and vibrant',
      promptModifier: 'artistic, creative, vibrant colors, abstract elements, eye-catching'
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Diagrams and infographics',
      promptModifier: 'technical diagram, infographic style, data visualization, clear typography'
    }
  ],
  epk: [
    {
      id: 'portrait',
      name: 'Portrait',
      description: 'Professional headshot',
      promptModifier: 'professional portrait, studio lighting, high-end photography, sharp focus'
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Live performance shot',
      promptModifier: 'dynamic performance, stage lighting, energetic, concert photography'
    },
    {
      id: 'lifestyle',
      name: 'Lifestyle',
      description: 'Candid lifestyle photo',
      promptModifier: 'candid lifestyle, natural lighting, authentic moment, documentary style'
    }
  ],
  social: [
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Square format, eye-catching',
      promptModifier: 'instagram post, square format, bold design, social media optimized'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      description: 'Horizontal banner',
      promptModifier: 'twitter banner, horizontal format, clean design, readable text'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Vertical thumbnail',
      promptModifier: 'tiktok thumbnail, vertical format, trendy, gen-z aesthetic'
    }
  ]
}

const ASPECT_RATIOS = {
  blog: { width: 1200, height: 630 }, // OG image
  epk: { width: 1024, height: 1024 }, // Square
  'instagram': { width: 1080, height: 1080 }, // Square
  'twitter': { width: 1500, height: 500 }, // Banner
  'tiktok': { width: 1080, height: 1920 }, // 9:16
  'short-video': { width: 1080, height: 1920 }, // 9:16
  'music-video': { width: 1920, height: 1080 } // 16:9
}

export function ImageGenerator({ 
  contentType, 
  contentData, 
  onImageGenerated,
  className 
}: ImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [autoPrompt, setAutoPrompt] = useState('')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const styles = IMAGE_STYLES[contentType] || IMAGE_STYLES.blog

  const SESSION_KEY = `image-gen-${contentType}`

  // Persist state whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      // Avoid quota issues: only persist lightweight data
      const payload: any = { selectedImage }
      // If the selected image is a remote URL (not base64) keep it, otherwise skip
      if (selectedImage !== null && generatedImages[selectedImage] && !generatedImages[selectedImage].startsWith('data:image')) {
        payload.selectedImageUrl = generatedImages[selectedImage]
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
    } catch (err) {
      // Silently ignore quota or serialization errors
      console.warn('Session storage persistence error', err)
    }
  }, [generatedImages, selectedImage])

  // Load cached state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setSelectedImage(parsed.selectedImage ?? null)
        // If we have a persisted URL and no images array yet, set it as single element
        if (parsed.selectedImageUrl && generatedImages.length === 0) {
          setGeneratedImages([parsed.selectedImageUrl])
        }
      } catch (_) {}
    }
  }, [])

  // Generate automatic prompt based on content
  const generateAutoPrompt = () => {
    const style = styles.find(s => s.id === selectedStyle)
    let basePrompt = ''

    switch (contentType) {
      case 'blog':
        basePrompt = `Blog header image about ${contentData.topic || contentData.title}, ${contentData.tone || 'professional'} tone`
        break
      case 'epk':
        basePrompt = `${contentData.genre || 'music'} artist ${contentData.artistName || 'musician'} photo`
        break
      case 'social':
        basePrompt = `Social media post visual about ${contentData.topic || contentData.title}`
        break
      case 'short-video':
        basePrompt = `Thumbnail for short video about ${contentData.topic || contentData.title}`
        break
      case 'music-video':
        basePrompt = `Music video concept art for ${contentData.title}, ${contentData.genre || 'music'} genre`
        break
    }

    if (style) {
      basePrompt += `, ${style.promptModifier}`
    }

    if (contentData.keywords?.length) {
      basePrompt += `, featuring ${contentData.keywords.slice(0, 3).join(', ')}`
    }

    setAutoPrompt(basePrompt)
    return basePrompt
  }

  const handleGenerate = async () => {
    const prompt = customPrompt || autoPrompt || generateAutoPrompt()
    
    if (!prompt) {
      toast.error('Please provide a prompt or select a style')
      return
    }

    setIsGenerating(true)

    try {
      const styleId = selectedStyle === 'instagram' || selectedStyle === 'twitter' || selectedStyle === 'tiktok' 
        ? selectedStyle 
        : contentType
      
      const aspectRatio = ASPECT_RATIOS[styleId as keyof typeof ASPECT_RATIOS] || ASPECT_RATIOS.blog

      const response = await fetch('/api/nova-canvas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          options: {
            style: 'premium',
            size: aspectRatio,
            negativePrompt: 'low quality, blurry, pixelated, distorted',
            numberOfImages: 3,
            contentType: contentType
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImages(data.images)
      
      if (data.mock) {
        toast.info('Using mock images. Enable Nova Canvas for real generation.')
      } else {
        toast.success('Images generated successfully!')
      }
    } catch (error: any) {
      console.error('Image generation error:', error)
      toast.error(error.message || 'Failed to generate images')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectImage = (index: number) => {
    setSelectedImage(index)
    if (onImageGenerated && generatedImages[index]) {
      onImageGenerated(generatedImages[index])
      toast.success('Image selected for your content')
    }
  }

  const handleDownload = (imageUrl: string, index: number) => {
    // Create a download link
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${contentType}-image-${index + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          AI Image Generation
        </CardTitle>
        <CardDescription>
          Generate professional visuals for your {contentType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Style Selection */}
        <div className="space-y-2">
          <Label>Visual Style</Label>
          <Select value={selectedStyle} onValueChange={(value) => {
            setSelectedStyle(value)
            generateAutoPrompt()
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent>
              {styles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  <div>
                    <div className="font-medium">{style.name}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-generated Prompt */}
        {autoPrompt && (
          <div className="space-y-2">
            <Label>Auto-generated Prompt</Label>
            <div className="p-3 rounded-md bg-muted/50 text-sm">
              {autoPrompt}
            </div>
          </div>
        )}

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label>Custom Prompt (Optional)</Label>
          <Textarea
            placeholder="Override with your own image description..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Images...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Images
            </>
          )}
        </Button>

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <div className="space-y-4">
            {/* Selected image live preview */}
            {selectedImage !== null && generatedImages[selectedImage] && (
              <div className="space-y-2">
                <Label>Selected Image Preview</Label>
                <img
                  src={generatedImages[selectedImage]}
                  alt="Selected preview"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            <Label>Generated Images</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generatedImages.map((image, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                    selectedImage === index 
                      ? "border-primary shadow-lg" 
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => handleSelectImage(index)}
                >
                  <img
                    src={image}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-auto"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectImage(index)
                      }}
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(image, index)
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selected badge */}
                  {selectedImage === index && (
                    <Badge className="absolute top-2 right-2" variant="outline">
                      Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Regenerate button */}
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate More Variations
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <p className="font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Pro Tips:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>Be specific about colors, mood, and style</li>
            <li>Include "professional", "high quality" for better results</li>
            <li>Avoid copyrighted characters or brands</li>
            <li>Generated images are optimized for {contentType} use</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 