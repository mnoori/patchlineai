"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Download, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export default function TestBackgroundRemovalPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [releaseTitle, setReleaseTitle] = useState('Summer Vibes')
  const [releaseGenre, setReleaseGenre] = useState('Electronic')
  const [style, setStyle] = useState('vibrant')

  const handleTest = async () => {
    setIsProcessing(true)
    setResults(null)

    try {
      const response = await fetch('/api/nova-canvas/test-background-removal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseTitle,
          releaseGenre,
          style
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image')
      }

      setResults(data)
      
      if (data.mockResults) {
        toast.info('Running in mock mode. Set ENABLE_NOVA_CANVAS=true for real processing.')
      } else {
        toast.success('Background removal completed successfully!')
      }
    } catch (error: any) {
      console.error('Test error:', error)
      toast.error(error.message || 'Failed to test background removal')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Background Removal Test</h1>
        <p className="text-muted-foreground mt-2">
          Test Nova Canvas background removal with your test.jpg file
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Configure the release context for background generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Release Title</Label>
              <Input
                value={releaseTitle}
                onChange={(e) => setReleaseTitle(e.target.value)}
                placeholder="Enter release title"
              />
            </div>

            <div className="space-y-2">
              <Label>Genre</Label>
              <Select value={releaseGenre} onValueChange={setReleaseGenre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronic">Electronic</SelectItem>
                  <SelectItem value="Pop">Pop</SelectItem>
                  <SelectItem value="Rock">Rock</SelectItem>
                  <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                  <SelectItem value="Acoustic">Acoustic</SelectItem>
                  <SelectItem value="Jazz">Jazz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleTest}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing test.jpg...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Test Background Removal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {results.message || 'Processing complete'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.mockResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Mock Results</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Original Image</p>
                      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Background Removed</p>
                      <div className="w-full h-64 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed">
                        <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Generated Content</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">New Background</p>
                      <div className="w-full h-64 bg-gradient-to-br from-brand-cyan to-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Final Composite</p>
                      <div className="w-full h-64 bg-gradient-to-br from-brand-cyan/50 to-purple-500/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                          <p className="font-semibold">{releaseTitle}</p>
                          <p className="text-sm">{releaseGenre}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.backgroundRemoved && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Background Removed</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(results.backgroundRemoved, 'background-removed.png')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <img
                      src={results.backgroundRemoved}
                      alt="Background removed"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                {results.newBackground && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">New Background</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(results.newBackground, 'new-background.png')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <img
                      src={results.newBackground}
                      alt="New background"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                {results.composite && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Final Composite</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(results.composite, 'final-composite.png')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <img
                      src={results.composite}
                      alt="Final composite"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                {results.s3Urls && (
                  <div className="col-span-full mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">S3 URLs</h4>
                    <div className="space-y-1 text-sm">
                      <p>Background Removed: <a href={results.s3Urls.backgroundRemoved} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">View</a></p>
                      <p>New Background: <a href={results.s3Urls.newBackground} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">View</a></p>
                      <p>Composite: <a href={results.s3Urls.composite} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">View</a></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. The test reads <code>temp/test.jpg</code> from your project</p>
          <p>2. Removes the background using Nova Canvas BACKGROUND_REMOVAL</p>
          <p>3. Generates a new background based on release context</p>
          <p>4. Creates a composite image (currently returns the generated background)</p>
          <p className="text-muted-foreground mt-4">
            Note: Full compositing requires additional image manipulation libraries.
            This test demonstrates the core Nova Canvas capabilities.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 