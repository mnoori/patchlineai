"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  Wand2, 
  Download, 
  Loader2, 
  Check, 
  X,
  Image as ImageIcon,
  FolderOpen,
  Sparkles,
  ArrowRight,
  Palette,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { cleanBase64, resizeImageForNovaCanvas } from '@/lib/image-utils'
import { compositeImagesClient } from '@/lib/client-composite'
import { getStoredGoogleAuth, getDriveFile } from '@/lib/google-auth'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  progress?: number
}

// Extended theme options
const CONTENT_THEMES = [
  { id: 'vibrant', name: 'Vibrant', description: 'Colorful and energetic', icon: '🎨' },
  { id: 'cinematic', name: 'Cinematic', description: 'Dramatic and moody', icon: '🎬' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean and elegant', icon: '⚪' },
  { id: 'futuristic', name: 'Futuristic', description: 'Sci-fi and tech-inspired', icon: '🚀' },
  { id: 'nature', name: 'Nature', description: 'Organic and earthy', icon: '🌿' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon and dystopian', icon: '🌃' },
  { id: 'vintage', name: 'Vintage', description: 'Retro and nostalgic', icon: '📻' },
  { id: 'abstract', name: 'Abstract', description: 'Artistic and conceptual', icon: '🎭' },
  { id: 'festival', name: 'Festival', description: 'Party and celebration', icon: '🎪' }
]

interface PersonalizedContentWorkflowProps {
  releaseId?: string
  releaseTitle?: string
  releaseGenre?: string
  releaseDate?: string
  artistName?: string
}

export function PersonalizedContentWorkflow({
  releaseId,
  releaseTitle = "New Release",
  releaseGenre = "Music",
  releaseDate,
  artistName = "Artist"
}: PersonalizedContentWorkflowProps) {
  const [activeTab, setActiveTab] = useState('google-drive')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [loadingDrive, setLoadingDrive] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'select',
      title: 'Select Image',
      description: 'Choose an image from Google Drive or upload',
      status: 'active'
    },
    {
      id: 'theme',
      title: 'Choose Themes',
      description: 'Select up to 3 themes for your content',
      status: 'pending'
    },
    {
      id: 'process',
      title: 'Processing',
      description: 'AI removes background and generates content',
      status: 'pending'
    },
    {
      id: 'finalize',
      title: 'Export',
      description: 'Download your content',
      status: 'pending'
    }
  ])

  useEffect(() => {
    if (activeTab === 'google-drive') {
      loadGoogleDriveFiles()
    }
  }, [activeTab])

  const loadGoogleDriveFiles = async () => {
    setLoadingDrive(true)
    try {
      const auth = await getStoredGoogleAuth()
      if (!auth) {
        toast.error('Please connect Google Drive first')
        return
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType contains 'image/'&pageSize=20&fields=files(id,name,mimeType,thumbnailLink)`, {
        headers: {
          'Authorization': `Bearer ${auth.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDriveFiles(data.files || [])
      } else {
        throw new Error('Failed to load files')
      }
    } catch (error) {
      console.error('Error loading Drive files:', error)
      toast.error('Failed to load Google Drive files')
    } finally {
      setLoadingDrive(false)
    }
  }

  const updateStep = (stepId: string, status: WorkflowStep['status'], data?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, ...data } : step
    ))
  }

  const handleImageSelect = (image: any) => {
    setSelectedImage(image)
    updateStep('select', 'completed')
    updateStep('theme', 'active')
    setCurrentStepIndex(1)
  }

  const proceedToGenerate = () => {
    if (selectedThemes.length === 0) {
      toast.error('Please select at least one theme')
      return
    }
    
    updateStep('theme', 'completed')
    setCurrentStepIndex(2)
    generateContent()
  }

  const generateContent = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first')
      return
    }

    if (selectedThemes.length === 0) {
      toast.error('Please select at least one theme')
      return
    }

    setIsProcessing(true)
    updateStep('process', 'active')

    try {
      // Get image data
      let imageBase64 = selectedImage.base64
      
      if (selectedImage.source === 'google-drive' && selectedImage.id) {
        const auth = await getStoredGoogleAuth()
        if (!auth) {
          throw new Error('Google Drive authentication required')
        }
        const fileBlob = await getDriveFile(auth.access_token, selectedImage.id)
        // Convert blob to base64
        const arrayBuffer = await fileBlob.arrayBuffer()
        const base64String = Buffer.from(arrayBuffer).toString('base64')
        imageBase64 = `data:${fileBlob.type};base64,${base64String}`
      }

      // Clean and resize the image for Nova Canvas
      const cleanedBase64 = cleanBase64(imageBase64)
      const resizedBase64 = await resizeImageForNovaCanvas(cleanedBase64)

      // Generate content for selected themes
      const contentPromises = selectedThemes.map(theme => 
        generateSingleContent(resizedBase64, theme)
      )

      const results = await Promise.all(contentPromises)
      const validResults = results.filter(r => r !== null)
      setGeneratedContent(validResults)

      updateStep('process', 'completed')
      updateStep('finalize', 'active')
      setCurrentStepIndex(3)

      toast.success('Content generated successfully!')

    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate content')
      updateStep('process', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateSingleContent = async (imageData: string, style: string) => {
    try {
      // Get theme details
      const theme = CONTENT_THEMES.find(t => t.id === style)
      
      // Create theme-specific prompts
      const themePrompts = {
        vibrant: 'vibrant colors, dynamic energy, abstract shapes, modern design, bright and colorful',
        cinematic: 'cinematic lighting, dramatic atmosphere, depth of field, professional photography, moody',
        minimalist: 'minimalist design, clean lines, white space, elegant, sophisticated',
        futuristic: 'futuristic sci-fi environment, neon lights, holographic elements, technology, cybernetic, space age',
        nature: 'natural environment, organic elements, forest, mountains, water, earthy tones, peaceful',
        cyberpunk: 'cyberpunk cityscape, neon signs, rain, dystopian, dark atmosphere, purple and pink lights',
        vintage: 'vintage aesthetic, retro style, film grain, nostalgic, warm tones, classic design',
        abstract: 'abstract art, geometric shapes, surreal, creative patterns, artistic expression',
        festival: 'music festival atmosphere, crowds, stage lights, outdoor concert, summer vibes, energetic'
      }
      
      const response = await fetch('/api/nova-canvas/generate-with-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectImageData: imageData,
          prompt: `${themePrompts[style as keyof typeof themePrompts]} background for ${releaseTitle || 'music'} release marketing`,
          style,
          removeBackground: true,
          releaseContext: {
            title: releaseTitle,
            genre: releaseGenre,
            artist: artistName,
            description: 'Professional music release marketing content'
          },
          compositeMethod: 'client'
        })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const result = await response.json()
      
      // Determine which method was actually used
      let finalImage: string
      
      // If we have a mock result or the server couldn't composite,
      // do client-side compositing
      if (result.imageUrl) {
        // Check if we have the processed subject (background removed)
        if (result.processedSubject && result.backgroundImage) {
          // Use the transparent subject for compositing
          const transparentSubject = result.processedSubject
          const backgroundBase64 = result.backgroundImage
          
          try {
            const compositeBase64 = await compositeImagesClient(
              backgroundBase64,
              transparentSubject, // Now using the background-removed version!
              {
                position: style === 'minimalist' 
                  ? { x: 0.7, y: 0.6 } 
                  : { x: 0.5, y: 0.5 },
                scale: style === 'cinematic' ? 0.9 : 0.8
              }
            )
            finalImage = `data:image/png;base64,${compositeBase64}`
          } catch (error) {
            console.error('Client-side compositing failed:', error)
            // Fall back to server result
            finalImage = result.imageUrl
          }
        } else {
          // Server handled the compositing
          finalImage = result.imageUrl
        }
        
        return {
          url: finalImage,
          style,
          theme: theme?.name || style,
          s3Url: result.s3Url
        }
      }
      
      return null
    } catch (error) {
      console.error(`Failed to generate ${style} content:`, error)
      return null
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      handleImageSelect({
        name: file.name,
        base64,
        source: 'upload'
      })
    }
    reader.readAsDataURL(file)
  }

  const selectDriveFile = (file: any) => {
    handleImageSelect({
      id: file.id,
      name: file.name,
      source: 'google-drive',
      thumbnailLink: file.thumbnailLink
    })
  }

  const downloadContent = (content: any) => {
    const imageUrl = typeof content === 'string' ? content : content.url
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${releaseTitle}-${content.style || 'content'}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloaded successfully!')
  }

  const downloadAll = () => {
    generatedContent.forEach((content, index) => {
      setTimeout(() => {
        downloadContent(content)
      }, index * 500) // Stagger downloads
    })
  }

  const resetWorkflow = () => {
    setCurrentStepIndex(0)
    setSelectedImage(null)
    setSelectedThemes([])
    setGeneratedContent([])
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending'
    })))
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <Progress value={(currentStepIndex + 1) / steps.length * 100} className="h-2" />
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={cn(
                "flex flex-col items-center",
                index <= currentStepIndex ? "opacity-100" : "opacity-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step.status === 'completed' ? "bg-green-500 text-white" : 
                step.status === 'active' ? "bg-primary text-primary-foreground" :
                step.status === 'error' ? "bg-red-500 text-white" :
                "bg-muted text-muted-foreground"
              )}>
                {step.status === 'completed' ? <Check className="h-4 w-4" /> : 
                 step.status === 'error' ? <X className="h-4 w-4" /> : 
                 index + 1}
              </div>
              <span className="text-xs mt-1 text-center max-w-[80px]">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Image Selection */}
      {currentStepIndex === 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Select Your Image</CardTitle>
            <CardDescription>
              Choose an image from Google Drive or upload from your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="google-drive" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Google Drive
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="google-drive" className="mt-0">
                {loadingDrive ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {driveFiles.map((file) => (
                      <Card
                        key={file.id}
                        className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg overflow-hidden group"
                        onClick={() => selectDriveFile(file)}
                      >
                        <div className="aspect-square relative">
                          {file.thumbnailLink ? (
                            <img 
                              src={file.thumbnailLink}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No images found in Google Drive</p>
                    <Button variant="outline" className="mt-4" onClick={loadGoogleDriveFiles}>
                      Retry
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop an image here, or click to select
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload">
                    <Button variant="secondary" className="cursor-pointer" asChild>
                      <span>Choose File</span>
                    </Button>
                  </Label>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Theme Selection */}
      {currentStepIndex === 1 && selectedImage && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Choose Your Themes
            </CardTitle>
            <CardDescription>
              Select up to 3 themes for your content variations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Image Preview */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-background">
                  {selectedImage.thumbnailLink ? (
                    <img 
                      src={selectedImage.thumbnailLink}
                      alt={selectedImage.name}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedImage.base64 ? (
                    <img 
                      src={selectedImage.base64}
                      alt={selectedImage.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedImage.name}</p>
                  <p className="text-sm text-muted-foreground">Ready for processing</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetWorkflow}>
                  Change Image
                </Button>
              </div>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-3 gap-3">
              {CONTENT_THEMES.map((theme) => (
                <Button
                  key={theme.id}
                  variant={selectedThemes.includes(theme.id) ? 'default' : 'outline'}
                  onClick={() => {
                    if (selectedThemes.includes(theme.id)) {
                      setSelectedThemes(selectedThemes.filter(t => t !== theme.id))
                    } else if (selectedThemes.length < 3) {
                      setSelectedThemes([...selectedThemes, theme.id])
                    } else {
                      toast.error('You can select up to 3 themes')
                    }
                  }}
                  className={cn(
                    "h-auto flex-col py-4 transition-all",
                    selectedThemes.includes(theme.id) && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <span className="text-2xl mb-2">{theme.icon}</span>
                  <span className="text-sm font-medium">{theme.name}</span>
                  <span className="text-xs text-muted-foreground">{theme.description}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {selectedThemes.length === 0 
                  ? "Select at least one theme to continue" 
                  : `${selectedThemes.length} theme${selectedThemes.length > 1 ? 's' : ''} selected`}
              </p>
              <Button
                onClick={proceedToGenerate}
                disabled={selectedThemes.length === 0}
                size="lg"
                className="gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Processing */}
      {currentStepIndex === 2 && isProcessing && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="relative inline-flex">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Creating Your Content</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  AI is removing the background and generating {selectedThemes.length} themed variations
                </p>
              </div>
              <Progress value={50} className="w-32 mx-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {currentStepIndex === 3 && generatedContent.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Your Content is Ready!</CardTitle>
                <CardDescription>
                  {generatedContent.length} variations generated successfully
                </CardDescription>
              </div>
              <Button onClick={resetWorkflow} variant="outline" size="sm">
                Start Over
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {generatedContent.map((content, index) => (
                <Card key={index} className="overflow-hidden group">
                  <div className="aspect-square relative">
                    <img 
                      src={content.url} 
                      alt={`${content.style} style`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-white font-medium">{content.theme}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => downloadContent(content)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button onClick={downloadAll} size="lg" className="gap-2">
                <Download className="h-4 w-4" />
                Download All ({generatedContent.length} images)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

