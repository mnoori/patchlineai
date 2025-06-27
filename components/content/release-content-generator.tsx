"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  Download,
  Loader2,
  ImageIcon,
  Music,
  Calendar,
  FolderOpen,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Release } from '@/lib/mock/release'
import { getStoredGoogleAuth, listDriveFiles, getDriveFile } from '@/lib/google-auth'

interface ReleaseContentGeneratorProps {
  release: Release
  userId: string
}

interface GeneratedContent {
  id: string
  imageUrl: string
  caption: string
  platform: 'instagram' | 'twitter' | 'facebook'
  style: string
}

export function ReleaseContentGenerator({ release, userId }: ReleaseContentGeneratorProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [driveImages, setDriveImages] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([])
  const [isLoadingDrive, setIsLoadingDrive] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState<'select' | 'generate' | 'preview'>('select')
  const [selectedStyle, setSelectedStyle] = useState<string>('vibrant')

  const getStyleOptions = () => {
    const baseStyles = [
      { id: 'vibrant', name: 'Vibrant Energy', desc: 'Bold colors, dynamic composition' },
      { id: 'cinematic', name: 'Cinematic Mood', desc: 'Dramatic lighting, film aesthetic' },
      { id: 'minimalist', name: 'Minimalist Chic', desc: 'Clean, sophisticated design' },
      { id: 'festival', name: 'Festival Ready', desc: 'Summer vibes, outdoor energy' }
    ]

    if (release.genre.toLowerCase().includes('electronic')) {
      baseStyles.push({ id: 'neon', name: 'Neon Dreams', desc: 'Cyberpunk aesthetic, glowing effects' })
    } else if (release.genre.toLowerCase().includes('acoustic') || release.genre.toLowerCase().includes('folk')) {
      baseStyles.push({ id: 'organic', name: 'Organic Warmth', desc: 'Natural textures, earthy tones' })
    }

    return baseStyles
  }

  const loadDriveImages = async () => {
    setIsLoadingDrive(true)
    try {
      const auth = getStoredGoogleAuth()
      if (!auth?.access_token) {
        toast.error('Please connect Google Drive first')
        return
      }

      const response = await listDriveFiles(auth.access_token, "mimeType contains 'image/'")
      setDriveImages(response.files || [])
      toast.success(`Found ${response.files?.length || 0} images in Google Drive`)
    } catch (error) {
      console.error('Error loading Drive images:', error)
      toast.error('Failed to load images from Google Drive')
    } finally {
      setIsLoadingDrive(false)
    }
  }

  const generateContent = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    setIsGenerating(true)
    setCurrentStep('generate')

    try {
      const contentPromises = selectedImages.map(async (imageId, index) => {
        const prompt = generatePromptForRelease(index)
        
        const response = await fetch('/api/nova-canvas/generate-with-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectImageId: imageId,
            prompt,
            style: selectedStyle,
            removeBackground: true,
            releaseContext: {
              title: release.title,
              artist: release.artist,
              genre: release.genre,
              releaseDate: release.releaseDate
            }
          })
        })

        const data = await response.json()
        
        return {
          id: `content-${index}`,
          imageUrl: data.imageUrl,
          caption: generateCaption(index),
          platform: getPlatformForIndex(index),
          style: selectedStyle
        } as GeneratedContent
      })

      const results = await Promise.all(contentPromises)
      setGeneratedContent(results)
      setCurrentStep('preview')
      toast.success('Content generated successfully!')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePromptForRelease = (index: number) => {
    const basePrompts = [
      `${release.artist} performing live, ${release.genre} concert atmosphere, ${release.title} album launch event`,
      `${release.artist} in studio, creating ${release.genre} music, ${release.title} recording session, professional music production`,
      `${release.artist} portrait, ${release.genre} artist aesthetic, ${release.title} album cover style, artistic photography`
    ]

    const styleModifiers = {
      vibrant: 'vibrant colors, high energy, dynamic composition',
      cinematic: 'cinematic lighting, dramatic atmosphere, film photography',
      minimalist: 'minimalist design, clean aesthetic, sophisticated',
      festival: 'outdoor festival, summer vibes, crowd energy',
      neon: 'neon lights, cyberpunk aesthetic, futuristic',
      organic: 'natural lighting, warm tones, authentic feel'
    }

    return `${basePrompts[index % basePrompts.length]}, ${styleModifiers[selectedStyle as keyof typeof styleModifiers]}, high quality, professional photography`
  }

  const generateCaption = (index: number) => {
    const templates = [
      ` "${release.title}" is here! Experience the ${release.genre} vibes that define this ${release.type}. Available ${new Date(release.releaseDate).toLocaleDateString()} on all platforms! \n\n#${release.artist.replace(/\s+/g, '')} #New${release.type} #${release.genre.replace(/\s+/g, '')}Music`,
      ` Get ready for "${release.title}"! ${release.artist} brings you ${release.tracks} tracks of pure ${release.genre} magic. Mark your calendars: ${new Date(release.releaseDate).toLocaleDateString()} \n\n#NewMusic #${release.artist.replace(/\s+/g, '')} #${release.title.replace(/\s+/g, '')}`,
      ` The wait is over! "${release.title}" by ${release.artist} drops ${new Date(release.releaseDate).toLocaleDateString()}. ${release.tracks} tracks of ${release.genre} perfection await! \n\n#MusicRelease #${release.genre.replace(/\s+/g, '')} #${release.artist.replace(/\s+/g, '')}`
    ]

    return templates[index % templates.length]
  }

  const getPlatformForIndex = (index: number): 'instagram' | 'twitter' | 'facebook' => {
    const platforms: ('instagram' | 'twitter' | 'facebook')[] = ['instagram', 'twitter', 'facebook']
    return platforms[index % platforms.length]
  }

  const downloadAllContent = async () => {
    for (const content of generatedContent) {
      const imageResponse = await fetch(content.imageUrl)
      const blob = await imageResponse.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${release.title}-${content.platform}-${content.id}.jpg`
      a.click()
      
      const captionBlob = new Blob([content.caption], { type: 'text/plain' })
      const captionUrl = URL.createObjectURL(captionBlob)
      const captionLink = document.createElement('a')
      captionLink.href = captionUrl
      captionLink.download = `${release.title}-${content.platform}-${content.id}-caption.txt`
      captionLink.click()
    }
    
    toast.success('All content downloaded successfully!')
  }

  useEffect(() => {
    const auth = getStoredGoogleAuth()
    if (auth?.access_token) {
      loadDriveImages()
    }
  }, [])

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-cyan" />
              AI Content Generator for "{release.title}"
            </CardTitle>
            <CardDescription>
              Create personalized social media content using your photos and AI
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {release.type}  {release.genre}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-cyan to-purple-500 rounded-lg flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{release.artist}</p>
            <p className="text-sm text-muted-foreground">{release.tracks} tracks  Releases {new Date(release.releaseDate).toLocaleDateString()}</p>
          </div>
        </div>

        {currentStep === 'select' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Your Photos</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDriveImages}
                disabled={isLoadingDrive}
              >
                {isLoadingDrive ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FolderOpen className="w-4 h-4 mr-2" />
                )}
                Refresh Google Drive
              </Button>
            </div>

            {!getStoredGoogleAuth()?.access_token ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your Google Drive in Settings to access your photos.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {isLoadingDrive ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-cyan mb-4" />
                    <p className="text-muted-foreground">Loading your photos...</p>
                  </div>
                ) : driveImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {driveImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => {
                          if (selectedImages.includes(image.id)) {
                            setSelectedImages(selectedImages.filter(id => id !== image.id))
                          } else if (selectedImages.length < 3) {
                            setSelectedImages([...selectedImages, image.id])
                          } else {
                            toast.error('You can select up to 3 images')
                          }
                        }}
                        className={cn(
                          "relative aspect-square rounded-lg border-2 cursor-pointer transition-all hover:scale-105",
                          selectedImages.includes(image.id) 
                            ? "border-brand-cyan ring-2 ring-brand-cyan/20" 
                            : "border-muted hover:border-brand-cyan/50"
                        )}
                      >
                        <img 
                          src={image.thumbnailLink || '/api/placeholder/200/200'} 
                          alt={image.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {selectedImages.includes(image.id) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-cyan rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-black" />
                          </div>
                        )}
                        <p className="text-xs text-center mt-1 truncate px-1">{image.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No images found in your Google Drive</p>
                  </div>
                )}

                {selectedImages.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Choose Your Style</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getStyleOptions().map((style) => (
                        <div
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all",
                            selectedStyle === style.id 
                              ? "border-brand-cyan bg-brand-cyan/10" 
                              : "border-muted hover:border-brand-cyan/50"
                          )}
                        >
                          <p className="font-medium">{style.name}</p>
                          <p className="text-sm text-muted-foreground">{style.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImages([])}
                    disabled={selectedImages.length === 0}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={generateContent}
                    disabled={selectedImages.length === 0}
                    className="bg-brand-cyan hover:bg-brand-cyan/80 text-black"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Content ({selectedImages.length}/3)
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {currentStep === 'generate' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-brand-cyan to-purple-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Magic in Progress</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Removing backgrounds, creating personalized environments, and generating captions...
            </p>
            <Progress value={66} className="w-64 mx-auto" />
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Generated Content</h3>
              <Button
                onClick={downloadAllContent}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {generatedContent.map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    Content {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {generatedContent.map((content, index) => (
                <TabsContent key={index} value={index.toString()} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img 
                        src={content.imageUrl} 
                        alt={`Generated content ${index + 1}`}
                        className="w-full rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Badge className="mb-2">{content.platform}</Badge>
                        <h4 className="font-medium mb-2">Caption</h4>
                        <div className="bg-muted rounded-lg p-4">
                          <p className="whitespace-pre-wrap text-sm">{content.caption}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(content.caption)
                            toast.success('Caption copied to clipboard!')
                          }}
                        >
                          Copy Caption
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const response = await fetch(content.imageUrl)
                            const blob = await response.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${release.title}-${content.platform}-${index + 1}.jpg`
                            a.click()
                          }}
                        >
                          Download Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep('select')
                  setSelectedImages([])
                  setGeneratedContent([])
                }}
              >
                Generate More Content
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
