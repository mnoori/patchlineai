"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Image as ImageIcon, 
  Palette, 
  Sparkles, 
  Download,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CONFIG } from '@/lib/config'

// Placeholder components for immediate functionality
const GoogleDriveConnector = ({ onConnectionChange }: any) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
      <Camera className="w-10 h-10 text-white" />
    </div>
    <h3 className="text-xl font-semibold mb-3">Connect Google Drive</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
      Connect your Google Drive to access your photos. We'll only access the specific folder you choose.
    </p>
    <div className="space-y-3">
      <Button 
        onClick={() => {
          toast.success('Google Drive connected! (Demo mode)')
          setTimeout(() => onConnectionChange({ isConnected: true }, []), 1000)
        }}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Connect Google Drive
      </Button>
      <p className="text-xs text-muted-foreground">
        Demo mode: This will simulate a Google Drive connection
      </p>
    </div>
  </div>
)

const ImageSelector = ({ onSelectionChange }: any) => {
  const [selectedCount, setSelectedCount] = useState(0)
  
  const mockImages = [
    { id: '1', name: 'artist-photo-1.jpg', thumbnail: '/api/placeholder/150/150' },
    { id: '2', name: 'artist-photo-2.jpg', thumbnail: '/api/placeholder/150/150' },
    { id: '3', name: 'artist-photo-3.jpg', thumbnail: '/api/placeholder/150/150' },
    { id: '4', name: 'artist-photo-4.jpg', thumbnail: '/api/placeholder/150/150' },
    { id: '5', name: 'artist-photo-5.jpg', thumbnail: '/api/placeholder/150/150' },
    { id: '6', name: 'artist-photo-6.jpg', thumbnail: '/api/placeholder/150/150' }
  ]

  const handleImageClick = (imageId: string) => {
    const newCount = selectedCount < 3 ? selectedCount + 1 : selectedCount
    setSelectedCount(newCount)
    
    if (newCount === 3) {
      toast.success('3 images selected!')
      setTimeout(() => onSelectionChange([{}, {}, {}]), 500)
    }
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-cosmic-teal" />
        <h3 className="text-xl font-semibold mb-2">Select Your Photos</h3>
        <p className="text-muted-foreground">Choose 3 photos from your Google Drive folder</p>
        <Badge variant="outline" className="mt-2">
          {selectedCount} / 3 selected
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {mockImages.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              "relative aspect-square rounded-lg border-2 cursor-pointer transition-all hover:scale-105",
              index < selectedCount ? "border-cosmic-teal bg-cosmic-teal/10" : "border-muted hover:border-cosmic-teal/50"
            )}
            onClick={() => handleImageClick(image.id)}
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            {index < selectedCount && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-cosmic-teal rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-black" />
              </div>
            )}
            <p className="text-xs text-center mt-2 truncate">{image.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const TemplateSelector = ({ onTemplateSelect }: any) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  const templates = CONFIG.SOCIAL_MEDIA_WORKFLOW.DEFAULT_TEMPLATES

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id)
    toast.success(`Template "${template.name}" selected!`)
    setTimeout(() => onTemplateSelect(template), 500)
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <Palette className="w-16 h-16 mx-auto mb-4 text-purple-500" />
        <h3 className="text-xl font-semibold mb-2">Choose Your Style</h3>
        <p className="text-muted-foreground">Select a template that matches your vibe</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
              selectedTemplate === template.id && "ring-2 ring-cosmic-teal"
            )}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {selectedTemplate === template.id && (
                  <CheckCircle className="w-5 h-5 text-cosmic-teal" />
                )}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-12 h-12 text-gray-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Visual Style:</p>
                <p className="text-xs text-muted-foreground">{template.visualPrompt}</p>
                <p className="text-sm font-medium">Caption Style:</p>
                <p className="text-xs text-muted-foreground">{template.captionPrompt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const ContentProcessor = ({ onProcessingComplete }: any) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const startProcessing = () => {
    setIsProcessing(true)
    setProgress(0)
    
    // Simulate processing steps
    const steps = [
      { name: 'Downloading images from Google Drive...', duration: 1000 },
      { name: 'Removing backgrounds with AI...', duration: 2000 },
      { name: 'Generating custom backgrounds...', duration: 2000 },
      { name: 'Composing final images...', duration: 1500 },
      { name: 'Generating captions...', duration: 1000 }
    ]
    
    let currentStep = 0
    const processStep = () => {
      if (currentStep < steps.length) {
        toast.info(steps[currentStep].name)
        setTimeout(() => {
          currentStep++
          setProgress((currentStep / steps.length) * 100)
          if (currentStep < steps.length) {
            processStep()
          } else {
            setIsProcessing(false)
            toast.success('Content processing complete!')
            onProcessingComplete([], [])
          }
        }, steps[currentStep].duration)
      }
    }
    
    processStep()
  }

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cosmic-teal to-purple-500 rounded-full flex items-center justify-center">
        <Sparkles className={cn("w-10 h-10 text-white", isProcessing && "animate-pulse")} />
      </div>
      <h3 className="text-xl font-semibold mb-3">AI Content Processing</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Our AI will remove backgrounds, generate custom environments, and create engaging captions for your photos.
      </p>
      
      {!isProcessing ? (
        <Button onClick={startProcessing} className="bg-cosmic-teal hover:bg-cosmic-teal/80 text-black">
          <Sparkles className="w-4 h-4 mr-2" />
          Start AI Processing
        </Button>
      ) : (
        <div className="space-y-4">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-cosmic-teal" />
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
          </div>
        </div>
      )}
    </div>
  )
}

const ContentPreview = ({ onFinalContentReady }: any) => (
  <div className="py-8">
    <div className="text-center mb-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
        <Download className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-3">Content Ready!</h3>
      <p className="text-muted-foreground mb-6">Your AI-generated social media content is ready for download</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-cosmic-teal/20 to-purple-500/20 flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              🎵 Just dropped my latest track! The energy is unmatched and I can't wait for you all to vibe with it. What's your favorite part? #NewMusic #Artist #Vibes
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="text-center space-y-4">
      <Button onClick={() => {
        toast.success('Content downloaded! (Demo mode)')
        onFinalContentReady({})
      }} className="bg-green-600 hover:bg-green-700">
        <Download className="w-4 h-4 mr-2" />
        Download All Content
      </Button>
      <p className="text-xs text-muted-foreground">
        Demo mode: This will simulate downloading your generated content
      </p>
    </div>
  </div>
)

export function SocialMediaWorkflowSimple() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const WORKFLOW_STEPS = [
    { id: 1, title: 'Connect', icon: Camera, color: 'bg-blue-500' },
    { id: 2, title: 'Select', icon: ImageIcon, color: 'bg-green-500' },
    { id: 3, title: 'Template', icon: Palette, color: 'bg-purple-500' },
    { id: 4, title: 'Process', icon: Sparkles, color: 'bg-cosmic-teal' },
    { id: 5, title: 'Download', icon: Download, color: 'bg-yellow-500' }
  ]

  const nextStep = () => {
    if (currentStep < 5) {
      setCompletedSteps(prev => [...prev, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getProgress = () => (completedSteps.length / 5) * 100

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cosmic-teal" />
                Social Media Content Creator
              </CardTitle>
              <CardDescription>
                Transform your photos into stunning social media content with AI
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep} of 5
            </Badge>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-cosmic-teal text-black",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-medium mt-2">{step.title}</p>
              </div>
              
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  "w-16 h-0.5 mx-4 transition-colors duration-200",
                  isCompleted ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <GoogleDriveConnector onConnectionChange={() => nextStep()} />
          )}
          {currentStep === 2 && (
            <ImageSelector onSelectionChange={() => nextStep()} />
          )}
          {currentStep === 3 && (
            <TemplateSelector onTemplateSelect={() => nextStep()} />
          )}
          {currentStep === 4 && (
            <ContentProcessor onProcessingComplete={() => nextStep()} />
          )}
          {currentStep === 5 && (
            <ContentPreview onFinalContentReady={() => toast.success('Workflow complete! 🎉')} />
          )}
        </CardContent>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            onClick={nextStep}
            disabled={currentStep === 5}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
} 