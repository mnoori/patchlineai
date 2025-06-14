"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Camera, 
  Image as ImageIcon, 
  Palette, 
  Sparkles, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Import our types and tools
import type {
  SocialMediaWorkflowState,
  SocialMediaWorkflowProps,
  GoogleDriveFile,
  SocialMediaTemplate,
  ProcessedImage
} from '@/lib/social-media-types'
import { CONFIG } from '@/lib/config'

// Import sub-components (we'll create these next)
import { GoogleDriveConnector } from './social-media/google-drive-connector'
import { ImageSelector } from './social-media/image-selector'
import { TemplateSelector } from './social-media/template-selector'
import { ContentProcessor } from './social-media/content-processor'
import { ContentPreview } from './social-media/content-preview'

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Connect Google Drive',
    description: 'Connect your Google Drive to access your photos',
    icon: Camera,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Select Images',
    description: 'Choose 3 photos for your social media content',
    icon: ImageIcon,
    color: 'bg-green-500'
  },
  {
    id: 3,
    title: 'Choose Template',
    description: 'Pick a style template for your content',
    icon: Palette,
    color: 'bg-purple-500'
  },
  {
    id: 4,
    title: 'AI Processing',
    description: 'AI creates your social media content',
    icon: Sparkles,
    color: 'bg-cosmic-teal'
  },
  {
    id: 5,
    title: 'Review & Download',
    description: 'Review and download your final content',
    icon: Download,
    color: 'bg-yellow-500'
  }
]

export function SocialMediaWorkflow({ 
  onComplete, 
  onStepChange,
  initialState 
}: SocialMediaWorkflowProps) {
  // Initialize workflow state
  const [workflowState, setWorkflowState] = useState<SocialMediaWorkflowState>({
    googleDriveConnection: { isConnected: false },
    availableImages: [],
    selectedImages: [],
    selectedTemplate: null,
    processedImages: [],
    generatedCaptions: [],
    finalContent: null,
    currentStep: 1,
    isProcessing: false,
    ...initialState
  })

  // Update parent component when step changes
  useEffect(() => {
    onStepChange?.(workflowState.currentStep)
  }, [workflowState.currentStep, onStepChange])

  // Step navigation functions
  const goToStep = (step: number) => {
    if (canNavigateToStep(step)) {
      setWorkflowState(prev => ({ ...prev, currentStep: step }))
    }
  }

  const nextStep = () => {
    if (workflowState.currentStep < 5) {
      goToStep(workflowState.currentStep + 1)
    }
  }

  const prevStep = () => {
    if (workflowState.currentStep > 1) {
      goToStep(workflowState.currentStep - 1)
    }
  }

  // Check if user can navigate to a specific step
  const canNavigateToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true
      case 2:
        return workflowState.googleDriveConnection.isConnected
      case 3:
        return workflowState.selectedImages.length === CONFIG.SOCIAL_MEDIA_WORKFLOW.SELECTED_IMAGES_COUNT
      case 4:
        return workflowState.selectedTemplate !== null
      case 5:
        return workflowState.processedImages.length > 0
      default:
        return false
    }
  }

  // Get step completion status
  const getStepStatus = (step: number): 'completed' | 'current' | 'pending' | 'disabled' => {
    if (step < workflowState.currentStep) return 'completed'
    if (step === workflowState.currentStep) return 'current'
    if (canNavigateToStep(step)) return 'pending'
    return 'disabled'
  }

  // Calculate overall progress
  const getProgress = (): number => {
    let progress = 0
    if (workflowState.googleDriveConnection.isConnected) progress += 20
    if (workflowState.selectedImages.length === 3) progress += 20
    if (workflowState.selectedTemplate) progress += 20
    if (workflowState.processedImages.length > 0) progress += 20
    if (workflowState.finalContent) progress += 20
    return progress
  }

  // Event handlers for sub-components
  const handleGoogleDriveConnection = (connection: any, images: GoogleDriveFile[]) => {
    setWorkflowState(prev => ({
      ...prev,
      googleDriveConnection: connection,
      availableImages: images
    }))
    
    if (connection.isConnected) {
      toast.success('Google Drive connected successfully!')
      nextStep()
    }
  }

  const handleImageSelection = (selectedImages: GoogleDriveFile[]) => {
    setWorkflowState(prev => ({
      ...prev,
      selectedImages
    }))
    
    if (selectedImages.length === CONFIG.SOCIAL_MEDIA_WORKFLOW.SELECTED_IMAGES_COUNT) {
      toast.success(`${selectedImages.length} images selected!`)
      nextStep()
    }
  }

  const handleTemplateSelection = (template: SocialMediaTemplate) => {
    setWorkflowState(prev => ({
      ...prev,
      selectedTemplate: template
    }))
    
    toast.success(`Template "${template.name}" selected!`)
    nextStep()
  }

  const handleProcessingComplete = (processedImages: ProcessedImage[], captions: string[]) => {
    setWorkflowState(prev => ({
      ...prev,
      processedImages,
      generatedCaptions: captions,
      isProcessing: false
    }))
    
    toast.success('Content processing complete!')
    nextStep()
  }

  const handleFinalContentReady = (finalContent: any) => {
    setWorkflowState(prev => ({
      ...prev,
      finalContent
    }))
    
    onComplete?.(finalContent)
    toast.success('Social media content is ready!')
  }

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {WORKFLOW_STEPS.map((step, index) => {
        const status = getStepStatus(step.id)
        const Icon = step.icon
        
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                className={cn(
                  "w-12 h-12 rounded-full p-0 flex items-center justify-center transition-all duration-200",
                  status === 'completed' && "bg-green-500 text-white hover:bg-green-600",
                  status === 'current' && "bg-cosmic-teal text-black hover:bg-cosmic-teal/80",
                  status === 'pending' && "bg-muted text-muted-foreground hover:bg-muted/80",
                  status === 'disabled' && "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                )}
                onClick={() => goToStep(step.id)}
                disabled={status === 'disabled'}
              >
                {status === 'completed' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </Button>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            
            {index < WORKFLOW_STEPS.length - 1 && (
              <div className={cn(
                "w-16 h-0.5 mx-4 transition-colors duration-200",
                step.id < workflowState.currentStep ? "bg-green-500" : "bg-muted"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
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
              Step {workflowState.currentStep} of 5
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          {workflowState.currentStep === 1 && (
            <GoogleDriveConnector
              currentConnection={workflowState.googleDriveConnection}
              onConnectionChange={handleGoogleDriveConnection}
            />
          )}

          {workflowState.currentStep === 2 && (
            <ImageSelector
              images={workflowState.availableImages}
              selectedImages={workflowState.selectedImages}
              onSelectionChange={handleImageSelection}
              maxSelection={CONFIG.SOCIAL_MEDIA_WORKFLOW.SELECTED_IMAGES_COUNT}
            />
          )}

          {workflowState.currentStep === 3 && (
            <TemplateSelector
              templates={CONFIG.SOCIAL_MEDIA_WORKFLOW.DEFAULT_TEMPLATES}
              selectedTemplate={workflowState.selectedTemplate}
              onTemplateSelect={handleTemplateSelection}
            />
          )}

          {workflowState.currentStep === 4 && (
            <ContentProcessor
              selectedImages={workflowState.selectedImages}
              selectedTemplate={workflowState.selectedTemplate!}
              onProcessingComplete={handleProcessingComplete}
              isProcessing={workflowState.isProcessing}
            />
          )}

          {workflowState.currentStep === 5 && (
            <ContentPreview
              processedImages={workflowState.processedImages}
              captions={workflowState.generatedCaptions}
              onImageSelect={(index) => {}}
              onCaptionEdit={(caption) => {}}
              selectedImageIndex={0}
              onFinalContentReady={handleFinalContentReady}
            />
          )}
        </CardContent>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={workflowState.currentStep === 1 || workflowState.isProcessing}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {workflowState.isProcessing && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </>
            )}
          </div>

          <Button
            onClick={nextStep}
            disabled={!canNavigateToStep(workflowState.currentStep + 1) || workflowState.isProcessing}
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