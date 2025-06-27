"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Download, Loader2, Upload, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Release } from '@/lib/mock/release'
import { ImageGenerator } from '@/components/content/image-generation/image-generator'

interface ReleaseMarketingContentModalProps {
  release: Release
  isOpen: boolean
  onClose: () => void
  contentType: 'content' | 'campaign' | 'outreach'
}

export function ReleaseMarketingContentModal({ 
  release, 
  isOpen, 
  onClose,
  contentType 
}: ReleaseMarketingContentModalProps) {
  const [activeTab, setActiveTab] = useState('ai-generate')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      toast.success(`Selected: ${file.name}`)
    }
  }

  const handleUploadAndGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    setIsProcessing(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1] // Remove data URL prefix

        // Generate content with the uploaded image
        const response = await fetch('/api/nova-canvas/generate-with-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectImageData: base64Data,
            prompt: `${release.artist} ${release.genre} music promotional content for "${release.title}"`,
            style: 'vibrant',
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

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate content')
        }

        // Handle the generated image
        if (data.imageUrl) {
          toast.success('Content generated successfully!')
          // You could show the result in a preview or download it
          const link = document.createElement('a')
          link.href = data.imageUrl
          link.download = `${release.title}-marketing-content.png`
          link.click()
        }
      }

      reader.readAsDataURL(selectedFile)
    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Failed to generate content')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-cyan" />
            Generate Marketing Content for "{release.title}"
          </DialogTitle>
          <DialogDescription>
            Create AI-powered promotional content for your {release.type.toLowerCase()} release
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline">{release.genre}</Badge>
            <Badge variant="outline">{release.tracks} tracks</Badge>
            <Badge variant="outline">Releases {new Date(release.releaseDate).toLocaleDateString()}</Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai-generate">AI Generate</TabsTrigger>
              <TabsTrigger value="upload-custom">Upload & Edit</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="ai-generate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Content Generation</CardTitle>
                  <CardDescription>
                    Generate professional marketing visuals based on your release information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageGenerator
                    contentType="social"
                    contentData={{
                      title: release.title,
                      topic: `New ${release.type} release`,
                      description: `${release.artist} presents "${release.title}" - ${release.tracks} tracks of ${release.genre} music`,
                      genre: release.genre,
                      artistName: release.artist,
                      tone: 'exciting'
                    }}
                    onImageGenerated={(imageUrl) => {
                      toast.success('Image selected! You can now download it.')
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload-custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Photo</CardTitle>
                  <CardDescription>
                    Upload an artist photo to create personalized promotional content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload an image to remove background and place in a custom environment
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
                    {selectedFile && (
                      <p className="mt-2 text-sm font-medium">{selectedFile.name}</p>
                    )}
                  </div>

                  {selectedFile && (
                    <Button
                      onClick={handleUploadAndGenerate}
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
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Marketing Content
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Templates</CardTitle>
                  <CardDescription>
                    Use pre-designed templates for common marketing needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Instagram Post', desc: 'Square format announcement' },
                      { name: 'Twitter Banner', desc: 'Wide format for Twitter/X' },
                      { name: 'Press Release Header', desc: 'Professional press image' },
                      { name: 'Spotify Canvas', desc: 'Animated visual for Spotify' }
                    ].map((template) => (
                      <Card key={template.name} className="cursor-pointer hover:border-brand-cyan transition-colors">
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-sm">{template.desc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-32 bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 