"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  Upload, 
  FolderOpen,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  ArrowRight,
  Wand2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { listDriveFiles, getDriveFile, getStoredGoogleAuth } from '@/lib/google-auth'
import { resizeImageForNovaCanvas, cleanBase64 } from '@/lib/image-utils'
import { compositeImagesClient } from '@/lib/client-composite'

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  result?: any
}

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
  const [compositeMethod, setCompositeMethod] = useState('client')
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'select',
      title: 'Select Image',
      description: 'Choose an image from Google Drive or upload',
      status: 'active'
    },
    {
      id: 'process',
      title: 'Remove Background',
      description: 'AI removes background from your image',
      status: 'pending'
    },
    {
      id: 'generate',
      title: 'Generate Environments',
      description: 'Create personalized backgrounds',
      status: 'pending'
    },
    {
      id: 'finalize',
      title: 'Export Content',
      description: 'Download ready-to-post content',
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
        toast.error('Please connect Google Drive in Settings')
        return
      }

      const files = await listDriveFiles(auth.access_token, "mimeType contains 'image/'")
      const imageFiles = files.filter((file: any) => 
        file.mimeType?.startsWith('image/')
      )
      setDriveFiles(imageFiles)
    } catch (error) {
      console.error('Failed to load Drive files:', error)
      toast.error('Failed to load Google Drive files')
    } finally {
      setLoadingDrive(false)
    }
  }

  const updateStep = (stepId: string, status: WorkflowStep['status'], result?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result } : step
    ))
  }

  const handleImageSelect = async (file: any) => {
    setSelectedImage(file)
    updateStep('select', 'completed', { file })
    updateStep('process', 'active')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        handleImageSelect({
          name: file.name,
          mimeType: file.type,
          base64: reader.result as string,
          source: 'upload'
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const generateContent = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first')
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

      updateStep('process', 'completed')
      updateStep('generate', 'active')

      // Generate multiple content variations
      const styles = ['vibrant', 'cinematic', 'minimalist']
      const contentPromises = styles.map(style => 
        generateSingleContent(resizedBase64, style)
      )

      const results = await Promise.all(contentPromises)
      const validResults = results.filter(r => r !== null)
      setGeneratedContent(validResults)

      updateStep('generate', 'completed', { count: validResults.length })
      updateStep('finalize', 'active')

      toast.success('Content generated successfully!')

    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate content')
      updateStep(steps.find(s => s.status === 'active')?.id || 'process', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateSingleContent = async (imageData: string, style: string) => {
    try {
      const response = await fetch('/api/nova-canvas/generate-with-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectImageData: imageData,
          prompt: `Professional background for ${releaseTitle || 'music'} release marketing`,
          style,
          removeBackground: true,
          releaseContext: {
            title: releaseTitle,
            genre: releaseGenre,
            artist: artistName,
            description: 'Professional music release marketing content'
          },
          compositeMethod: compositeMethod
        })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const result = await response.json()
      
      // Determine which method was actually used
      let finalImage: string
      let methodUsed = compositeMethod
      
      // If we have a mock result or the server couldn't composite,
      // do client-side compositing
      if (result.imageUrl) {
        // Check if we have the processed subject (background removed)
        if (compositeMethod === 'client' && result.processedSubject && result.backgroundImage) {
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
            methodUsed = 'client'
          } catch (error) {
            console.error('Client-side compositing failed:', error)
            // Fall back to server result
            finalImage = result.imageUrl
            methodUsed = 'fallback'
          }
        } else {
          // Server handled the compositing (inpainting/outpainting)
          finalImage = result.imageUrl
          // Check if it actually used the requested method or fell back
          if (compositeMethod !== 'client' && result.processedSubject) {
            // If we still got processedSubject back, it means server compositing failed
            methodUsed = 'fallback'
          }
        }
        
        return {
          url: finalImage,
          style,
          methodUsed,
          s3Url: result.s3Url
        }
      }
      
      return null
    } catch (error) {
      console.error(`Failed to generate ${style} content:`, error)
      return null
    }
  }

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadContent = (content: any, style?: string) => {
    const imageUrl = typeof content === 'string' ? content : content.url
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${releaseTitle}-${style || content.style || 'content'}-${Date.now()}.png`
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

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    step.status === 'completed' && "bg-green-500 text-white",
                    step.status === 'active' && "bg-brand-cyan text-white animate-pulse",
                    step.status === 'pending' && "bg-muted text-muted-foreground",
                    step.status === 'error' && "bg-red-500 text-white"
                  )}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground max-w-[120px]">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className={cn(
                    "h-4 w-4 mx-4 mt-[-20px]",
                    steps[index + 1].status !== 'pending' 
                      ? "text-brand-cyan" 
                      : "text-muted-foreground"
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Selection */}
      {steps[0].status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Your Image</CardTitle>
            <CardDescription>
              Choose an artist photo from Google Drive or upload a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="google-drive">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Google Drive
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="google-drive" className="space-y-4">
                {loadingDrive ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {driveFiles.map((file) => (
                      <Card
                        key={file.id}
                        className="cursor-pointer hover:border-brand-cyan transition-colors"
                        onClick={() => handleImageSelect(file)}
                      >
                        <CardContent className="p-4">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-center truncate">{file.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No images found in Google Drive. Upload some photos first!
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an artist photo to create personalized content
                  </p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Selected Image Preview */}
      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{selectedImage.name}</p>
                <p className="text-sm text-muted-foreground">
                  Ready for background removal
                </p>
              </div>
              {steps[0].status === 'completed' && steps[3].status !== 'active' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compositing Method</label>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant={compositeMethod === 'client' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCompositeMethod('client')}
                        className="justify-start"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Quick Preview (Client-side)
                      </Button>
                      <Button
                        variant={compositeMethod === 'inpainting' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCompositeMethod('inpainting')}
                        className="justify-start"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Natural Blend (AI Inpainting)
                      </Button>
                      <Button
                        variant={compositeMethod === 'variation' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCompositeMethod('variation')}
                        className="justify-start"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Transform Style (AI Variation)
                      </Button>
                      <Button
                        variant={compositeMethod === 'outpainting' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCompositeMethod('outpainting')}
                        className="justify-start"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Environment Extension (AI Outpainting)
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {compositeMethod === 'client' && 'Fast preview by placing your image on generated backgrounds'}
                      {compositeMethod === 'inpainting' && 'AI blends your subject naturally into new backgrounds'}
                      {compositeMethod === 'variation' && 'AI transforms your entire image into a new style'}
                      {compositeMethod === 'outpainting' && 'AI extends the environment around your subject'}
                    </p>
                  </div>
                  
                  <Button
                    onClick={generateContent}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              Your personalized marketing content is ready!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {generatedContent.map((content, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img 
                      src={content.url} 
                      alt={`${content.style} style`}
                      className="w-full h-full object-cover"
                    />
                    {content.methodUsed && content.methodUsed !== compositeMethod && (
                      <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                        Fallback: {content.methodUsed}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{content.style} Style</p>
                        <p className="text-xs text-muted-foreground">
                          Method: {content.methodUsed === 'client' ? 'Client Composite' : 
                                  content.methodUsed === 'inpainting' ? 'AI Inpainting' :
                                  content.methodUsed === 'variation' ? 'AI Variation' :
                                  content.methodUsed === 'outpainting' ? 'AI Outpainting' :
                                  'Fallback'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(content.url, `${releaseTitle}-${content.style}-${Date.now()}.png`)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={downloadAll} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

