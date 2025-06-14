/**
 * MCP Tools for Social Media Content Creation Workflow
 * 
 * This file defines custom MCP tools that integrate with Zapier, Google Drive,
 * and AWS services to create a seamless social media content creation pipeline.
 */

import { CONFIG } from '@/lib/config'
import type {
  GoogleDriveFile,
  ProcessedImage,
  SocialMediaTemplate,
  ImageProcessingStep,
  MCPSocialMediaTool
} from '@/lib/social-media-types'

// Google Drive MCP Tools
export const GOOGLE_DRIVE_TOOLS: MCPSocialMediaTool[] = [
  {
    name: 'google_drive_list_files',
    description: 'List image files from a specific Google Drive folder using Zapier MCP',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'Google Drive folder ID to list files from'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of files to return',
          default: 20
        },
        mimeTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'MIME types to filter (e.g., image/jpeg, image/png)',
          default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        }
      },
      required: ['folderId']
    }
  },
  {
    name: 'google_drive_download_file',
    description: 'Download a file from Google Drive and upload to temporary S3 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'Google Drive file ID to download'
        },
        fileName: {
          type: 'string',
          description: 'Name for the downloaded file'
        },
        tempBucket: {
          type: 'string',
          description: 'S3 bucket for temporary storage',
          default: CONFIG.SOCIAL_MEDIA_WORKFLOW.TEMP_S3_BUCKET
        }
      },
      required: ['fileId', 'fileName']
    }
  }
]

// Image Processing MCP Tools
export const IMAGE_PROCESSING_TOOLS: MCPSocialMediaTool[] = [
  {
    name: 'remove_background',
    description: 'Remove background from an image using Nova Canvas or AWS Bedrock',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to process'
        },
        outputBucket: {
          type: 'string',
          description: 'S3 bucket for processed image',
          default: CONFIG.SOCIAL_MEDIA_WORKFLOW.TEMP_S3_BUCKET
        },
        quality: {
          type: 'string',
          enum: ['high', 'medium', 'fast'],
          description: 'Processing quality level',
          default: 'high'
        }
      },
      required: ['imageUrl']
    }
  },
  {
    name: 'generate_background',
    description: 'Generate a background image based on template visual prompt using AWS Bedrock',
    inputSchema: {
      type: 'object',
      properties: {
        visualPrompt: {
          type: 'string',
          description: 'Detailed prompt for background generation'
        },
        style: {
          type: 'string',
          description: 'Art style for the background'
        },
        dimensions: {
          type: 'object',
          properties: {
            width: { type: 'number', default: 1080 },
            height: { type: 'number', default: 1080 }
          },
          description: 'Output dimensions for social media'
        },
        outputBucket: {
          type: 'string',
          description: 'S3 bucket for generated background',
          default: CONFIG.SOCIAL_MEDIA_WORKFLOW.TEMP_S3_BUCKET
        }
      },
      required: ['visualPrompt']
    }
  },
  {
    name: 'compose_image',
    description: 'Compose subject image onto generated background using Nova Canvas',
    inputSchema: {
      type: 'object',
      properties: {
        subjectImageUrl: {
          type: 'string',
          description: 'URL of the subject image (background removed)'
        },
        backgroundImageUrl: {
          type: 'string',
          description: 'URL of the generated background'
        },
        composition: {
          type: 'object',
          properties: {
            position: {
              type: 'object',
              properties: {
                x: { type: 'number', description: 'X position (0-1)' },
                y: { type: 'number', description: 'Y position (0-1)' }
              }
            },
            scale: { type: 'number', description: 'Scale factor (0-2)', default: 1 },
            rotation: { type: 'number', description: 'Rotation in degrees', default: 0 }
          }
        },
        outputBucket: {
          type: 'string',
          description: 'S3 bucket for final composed image',
          default: CONFIG.SOCIAL_MEDIA_WORKFLOW.FINAL_S3_BUCKET
        }
      },
      required: ['subjectImageUrl', 'backgroundImageUrl']
    }
  }
]

// Caption Generation MCP Tools
export const CAPTION_GENERATION_TOOLS: MCPSocialMediaTool[] = [
  {
    name: 'generate_social_caption',
    description: 'Generate engaging social media captions using AWS Bedrock',
    inputSchema: {
      type: 'object',
      properties: {
        captionPrompt: {
          type: 'string',
          description: 'Template-specific prompt for caption generation'
        },
        context: {
          type: 'object',
          properties: {
            artistName: { type: 'string' },
            songTitle: { type: 'string' },
            genre: { type: 'string' },
            mood: { type: 'string' },
            platform: { 
              type: 'string', 
              enum: ['instagram', 'twitter', 'facebook', 'tiktok'],
              default: 'instagram'
            }
          },
          description: 'Additional context for personalized captions'
        },
        variations: {
          type: 'number',
          description: 'Number of caption variations to generate',
          default: 3,
          minimum: 1,
          maximum: 5
        },
        maxLength: {
          type: 'number',
          description: 'Maximum character length for the caption',
          default: 280
        }
      },
      required: ['captionPrompt']
    }
  }
]

// Workflow Orchestration Tools
export const WORKFLOW_ORCHESTRATION_TOOLS: MCPSocialMediaTool[] = [
  {
    name: 'process_social_media_workflow',
    description: 'Orchestrate the complete social media content creation workflow',
    inputSchema: {
      type: 'object',
      properties: {
        selectedImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              downloadUrl: { type: 'string' }
            }
          },
          description: 'Array of selected Google Drive images'
        },
        template: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            visualPrompt: { type: 'string' },
            captionPrompt: { type: 'string' }
          },
          description: 'Selected social media template'
        },
        userContext: {
          type: 'object',
          properties: {
            artistName: { type: 'string' },
            songTitle: { type: 'string' },
            genre: { type: 'string' }
          },
          description: 'User-specific context for personalization'
        }
      },
      required: ['selectedImages', 'template']
    }
  }
]

// Combined tool registry
export const SOCIAL_MEDIA_MCP_TOOLS = [
  ...GOOGLE_DRIVE_TOOLS,
  ...IMAGE_PROCESSING_TOOLS,
  ...CAPTION_GENERATION_TOOLS,
  ...WORKFLOW_ORCHESTRATION_TOOLS
]

// Tool execution functions
export class SocialMediaMCPExecutor {
  constructor(private mcpClient: any) {}

  async executeGoogleDriveListFiles(params: {
    folderId: string
    maxResults?: number
    mimeTypes?: string[]
  }): Promise<GoogleDriveFile[]> {
    try {
      const result = await this.mcpClient.callTool('google_drive_list_files', params)
      return result.files || []
    } catch (error) {
      console.error('Error listing Google Drive files:', error)
      throw new Error(`Failed to list Google Drive files: ${error}`)
    }
  }

  async executeGoogleDriveDownloadFile(params: {
    fileId: string
    fileName: string
    tempBucket?: string
  }): Promise<{ url: string; key: string }> {
    try {
      const result = await this.mcpClient.callTool('google_drive_download_file', params)
      return {
        url: result.url,
        key: result.key
      }
    } catch (error) {
      console.error('Error downloading Google Drive file:', error)
      throw new Error(`Failed to download file: ${error}`)
    }
  }

  async executeRemoveBackground(params: {
    imageUrl: string
    outputBucket?: string
    quality?: 'high' | 'medium' | 'fast'
  }): Promise<{ processedUrl: string; processingTime: number }> {
    try {
      const result = await this.mcpClient.callTool('remove_background', params)
      return {
        processedUrl: result.processedUrl,
        processingTime: result.processingTime || 0
      }
    } catch (error) {
      console.error('Error removing background:', error)
      throw new Error(`Failed to remove background: ${error}`)
    }
  }

  async executeGenerateBackground(params: {
    visualPrompt: string
    style?: string
    dimensions?: { width: number; height: number }
    outputBucket?: string
  }): Promise<{ backgroundUrl: string; generationTime: number }> {
    try {
      const result = await this.mcpClient.callTool('generate_background', params)
      return {
        backgroundUrl: result.backgroundUrl,
        generationTime: result.generationTime || 0
      }
    } catch (error) {
      console.error('Error generating background:', error)
      throw new Error(`Failed to generate background: ${error}`)
    }
  }

  async executeComposeImage(params: {
    subjectImageUrl: string
    backgroundImageUrl: string
    composition?: any
    outputBucket?: string
  }): Promise<{ composedUrl: string; compositionTime: number }> {
    try {
      const result = await this.mcpClient.callTool('compose_image', params)
      return {
        composedUrl: result.composedUrl,
        compositionTime: result.compositionTime || 0
      }
    } catch (error) {
      console.error('Error composing image:', error)
      throw new Error(`Failed to compose image: ${error}`)
    }
  }

  async executeGenerateSocialCaption(params: {
    captionPrompt: string
    context?: any
    variations?: number
    maxLength?: number
  }): Promise<{ captions: string[]; generationTime: number }> {
    try {
      const result = await this.mcpClient.callTool('generate_social_caption', params)
      return {
        captions: result.captions || [],
        generationTime: result.generationTime || 0
      }
    } catch (error) {
      console.error('Error generating captions:', error)
      throw new Error(`Failed to generate captions: ${error}`)
    }
  }

  async executeCompleteWorkflow(params: {
    selectedImages: any[]
    template: SocialMediaTemplate
    userContext?: any
  }): Promise<{
    processedImages: ProcessedImage[]
    captions: string[]
    totalProcessingTime: number
  }> {
    try {
      const result = await this.mcpClient.callTool('process_social_media_workflow', params)
      return {
        processedImages: result.processedImages || [],
        captions: result.captions || [],
        totalProcessingTime: result.totalProcessingTime || 0
      }
    } catch (error) {
      console.error('Error executing complete workflow:', error)
      throw new Error(`Failed to execute workflow: ${error}`)
    }
  }
} 