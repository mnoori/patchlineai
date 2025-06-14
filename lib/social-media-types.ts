/**
 * Social Media Content Creation Workflow Types
 * 
 * This file defines all the TypeScript interfaces and types needed for the
 * social media content creation workflow that integrates with MCP, Zapier,
 * Google Drive, and AWS services.
 */

// Google Drive Integration Types
export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  thumbnailLink?: string
  webViewLink?: string
  downloadUrl?: string
  createdTime: string
  modifiedTime: string
}

export interface GoogleDriveConnection {
  isConnected: boolean
  userEmail?: string
  folderId?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

// Template Types
export interface SocialMediaTemplate {
  id: string
  name: string
  description: string
  visualPrompt: string
  captionPrompt: string
  category?: 'music' | 'general' | 'promotional'
  tags?: string[]
  previewImage?: string
}

// Image Processing Types
export interface ImageProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  error?: string
  result?: string
}

export interface ProcessedImage {
  id: string
  originalUrl: string
  processedUrl: string
  thumbnailUrl?: string
  metadata: {
    width: number
    height: number
    format: string
    size: number
  }
  processingSteps: ImageProcessingStep[]
}

// Workflow State Types
export interface SocialMediaWorkflowState {
  // Step 1: Authentication & Connection
  googleDriveConnection: GoogleDriveConnection
  
  // Step 2: Image Selection
  availableImages: GoogleDriveFile[]
  selectedImages: GoogleDriveFile[]
  
  // Step 3: Template Selection
  selectedTemplate: SocialMediaTemplate | null
  
  // Step 4: Content Generation
  processedImages: ProcessedImage[]
  generatedCaptions: string[]
  
  // Step 5: Review & Publish
  finalContent: {
    images: ProcessedImage[]
    caption: string
    selectedImageIndex: number
  } | null
  
  // Workflow Status
  currentStep: number
  isProcessing: boolean
  error?: string
}

// MCP Tool Types for Social Media Workflow
export interface MCPSocialMediaTool {
  name: string
  description: string
  inputSchema: Record<string, any>
}

export interface GoogleDriveMCPTool extends MCPSocialMediaTool {
  name: 'google_drive_list_files' | 'google_drive_download_file'
}

export interface ImageProcessingMCPTool extends MCPSocialMediaTool {
  name: 'remove_background' | 'compose_image' | 'generate_background'
}

export interface CaptionGenerationMCPTool extends MCPSocialMediaTool {
  name: 'generate_social_caption'
}

// API Response Types
export interface SocialMediaWorkflowResponse {
  success: boolean
  data?: any
  error?: string
  step?: number
}

export interface ImageUploadResponse {
  success: boolean
  url?: string
  key?: string
  error?: string
}

// Component Props Types
export interface SocialMediaWorkflowProps {
  onComplete?: (result: SocialMediaWorkflowState['finalContent']) => void
  onStepChange?: (step: number) => void
  initialState?: Partial<SocialMediaWorkflowState>
}

export interface GoogleDriveConnectorProps {
  onConnectionChange: (connection: GoogleDriveConnection) => void
  currentConnection: GoogleDriveConnection
}

export interface ImageSelectorProps {
  images: GoogleDriveFile[]
  selectedImages: GoogleDriveFile[]
  onSelectionChange: (images: GoogleDriveFile[]) => void
  maxSelection: number
}

export interface TemplateSelectorProps {
  templates: SocialMediaTemplate[]
  selectedTemplate: SocialMediaTemplate | null
  onTemplateSelect: (template: SocialMediaTemplate) => void
}

export interface ContentPreviewProps {
  processedImages: ProcessedImage[]
  captions: string[]
  onImageSelect: (index: number) => void
  onCaptionEdit: (caption: string) => void
  selectedImageIndex: number
}

// Utility Types
export type WorkflowStep = 1 | 2 | 3 | 4 | 5

export interface WorkflowStepConfig {
  step: WorkflowStep
  title: string
  description: string
  component: string
  isComplete: (state: SocialMediaWorkflowState) => boolean
  canProceed: (state: SocialMediaWorkflowState) => boolean
}

// Error Types
export interface WorkflowError {
  step: WorkflowStep
  type: 'connection' | 'processing' | 'api' | 'validation'
  message: string
  details?: any
}

// Configuration Types
export interface SocialMediaWorkflowConfig {
  zapierMcpEndpoint: string
  zapierApiKey: string
  googleDriveFolderId: string
  googleDriveMaxImages: number
  selectedImagesCount: number
  tempS3Bucket: string
  finalS3Bucket: string
  templatesS3Bucket: string
  defaultTemplates: SocialMediaTemplate[]
} 