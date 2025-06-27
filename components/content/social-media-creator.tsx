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

export function SocialMediaCreator() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const WORKFLOW_STEPS = [
    { id: 1, title: 'Connect', icon: Camera },
    { id: 2, title: 'Select', icon: ImageIcon },
    { id: 3, title: 'Template', icon: Palette },
    { id: 4, title: 'Process', icon: Sparkles },
    { id: 5, title: 'Download', icon: Download }
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Connect Google Drive</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Google Drive to access your photos. We'll only access the specific folder you choose.
            </p>
            <Button 
              onClick={() => {
                toast.success('Google Drive connected! (Demo mode)')
                setTimeout(() => nextStep(), 1000)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Google Drive
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-brand-cyan" />
              <h3 className="text-xl font-semibold mb-2">Select Your Photos</h3>
              <p className="text-muted-foreground">Choose 3 photos from your Google Drive folder</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg border-2 border-muted hover:border-brand-cyan/50 cursor-pointer transition-all hover:scale-105"
                >
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-xs text-center mt-2">photo-{i}.jpg</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Button onClick={() => {
                toast.success('3 images selected!')
                setTimeout(() => nextStep(), 500)
              }}>
                Select 3 Images
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <Palette className="w-16 h-16 mx-auto mb-4 text-purple-500" />
              <h3 className="text-xl font-semibold mb-2">Choose Your Style</h3>
              <p className="text-muted-foreground">Select a template that matches your vibe</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-6">
              {[
                { name: 'Vintage Concert Poster', desc: 'Retro-style with vintage aesthetics' },
                { name: 'Modern Album Art', desc: 'Clean, contemporary design' },
                { name: 'Neon Cyberpunk', desc: 'Futuristic with neon colors' },
                { name: 'Acoustic Indie', desc: 'Warm, organic folk aesthetic' }
              ].map((template) => (
                <Card key={template.name} className="cursor-pointer hover:scale-105 transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Palette className="w-12 h-12 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button onClick={() => {
                toast.success('Template selected!')
                setTimeout(() => nextStep(), 500)
              }}>
                Choose Template
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-brand-cyan to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className={cn("w-10 h-10 text-white", isProcessing && "animate-pulse")} />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Content Processing</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Our AI will remove backgrounds, generate custom environments, and create engaging captions.
            </p>
            
            {!isProcessing ? (
              <Button onClick={() => {
                setIsProcessing(true)
                toast.info('Processing your content...')
                setTimeout(() => {
                  setIsProcessing(false)
                  toast.success('Content processing complete!')
                  nextStep()
                }, 3000)
              }} className="bg-brand-cyan hover:bg-brand-cyan/80 text-black">
                <Sparkles className="w-4 h-4 mr-2" />
                Start AI Processing
              </Button>
            ) : (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
                <p className="text-sm text-muted-foreground">Processing your images...</p>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Content Ready!</h3>
              <p className="text-muted-foreground mb-6">Your AI-generated social media content is ready</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      🎵 Just dropped my latest track! The energy is unmatched. #NewMusic #Artist #Vibes
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button onClick={() => {
                toast.success('Content downloaded! 🎉')
              }} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download All Content
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-cyan" />
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
                  isCurrent && "bg-brand-cyan text-black",
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
          {renderStepContent()}
        </CardContent>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isProcessing}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            onClick={nextStep}
            disabled={currentStep === 5 || isProcessing}
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