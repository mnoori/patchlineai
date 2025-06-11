/**
 * Amazon Nova Canvas API Client
 * Handles all image generation capabilities
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime"
import { CONFIG, IS_DEVELOPMENT_MODE } from "@/lib/config"

export interface ImageGenerationParams {
  prompt: string
  negativePrompt?: string
  style?: 'standard' | 'premium'
  size?: { width: number; height: number }
  seed?: number
  numberOfImages?: number
  cfgScale?: number
}

export interface ImageVariationParams {
  imageBase64: string
  prompt?: string
  negativePrompt?: string
  similarityStrength?: number
  seed?: number
}

export interface ColorConditioningParams {
  prompt: string
  colors: string[] // Hex color codes
  negativePrompt?: string
  seed?: number
}

export interface InpaintingParams {
  imageBase64: string
  prompt: string
  maskPrompt?: string
  maskImageBase64?: string
  negativePrompt?: string
  seed?: number
}

export interface OutpaintingParams {
  imageBase64: string
  prompt: string
  maskPrompt?: string
  outPaintingMode?: 'PRECISE' | 'DEFAULT'
  seed?: number
}

export interface ImageConditioningParams {
  prompt: string
  conditionImageBase64: string
  controlMode: 'CANNY_EDGE' | 'SEGMENTATION'
  controlStrength?: number
  negativePrompt?: string
  seed?: number
}

export class NovaCanvasClient {
  private client: BedrockRuntimeClient
  private modelId = "amazon.nova-canvas-v1:0"
  
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: CONFIG.AWS_REGION,
      credentials: IS_DEVELOPMENT_MODE ? {
        accessKeyId: CONFIG.AWS_ACCESS_KEY_ID!,
        secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY!,
      } : undefined,
    })
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(params: ImageGenerationParams): Promise<string[]> {
    const body = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: params.prompt,
        ...(params.negativePrompt && { negativeText: params.negativePrompt })
      },
      imageGenerationConfig: {
        numberOfImages: params.numberOfImages || 1,
        quality: params.style || "standard",
        // Nova Canvas currently supports square outputs; clamp to 1024 x 1024
        width: 1024,
        height: 1024,
        cfgScale: params.cfgScale || 7.5,
        ...(params.seed !== undefined && { seed: params.seed })
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Create variations of an existing image
   */
  async createVariation(params: ImageVariationParams): Promise<string[]> {
    const body = {
      taskType: "IMAGE_VARIATION",
      imageVariationParams: {
        images: [params.imageBase64],
        ...(params.prompt && { text: params.prompt }),
        ...(params.negativePrompt && { negativeText: params.negativePrompt }),
        ...(params.similarityStrength !== undefined && { 
          similarityStrength: params.similarityStrength 
        })
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        quality: "premium",
        ...(params.seed !== undefined && { seed: params.seed })
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Remove background from an image
   */
  async removeBackground(imageBase64: string): Promise<string[]> {
    const body = {
      taskType: "BACKGROUND_REMOVAL",
      backgroundRemovalParams: {
        image: imageBase64
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Generate image with specific color palette
   */
  async generateWithColors(params: ColorConditioningParams): Promise<string[]> {
    const body = {
      taskType: "COLOR_GUIDED_GENERATION",
      colorGuidedGenerationParams: {
        text: params.prompt,
        colors: params.colors,
        ...(params.negativePrompt && { negativeText: params.negativePrompt })
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        ...(params.seed !== undefined && { seed: params.seed })
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Edit specific parts of an image (inpainting)
   */
  async inpaint(params: InpaintingParams): Promise<string[]> {
    const body = {
      taskType: "INPAINTING",
      inPaintingParams: {
        image: params.imageBase64,
        ...(params.prompt && { text: params.prompt }),
        ...(params.negativePrompt && { negativeText: params.negativePrompt }),
        ...(params.maskPrompt && { maskPrompt: params.maskPrompt }),
        ...(params.maskImageBase64 && { maskImage: params.maskImageBase64 })
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        ...(params.seed !== undefined && { seed: params.seed })
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Expand image beyond its borders (outpainting)
   */
  async outpaint(params: OutpaintingParams): Promise<string[]> {
    const body = {
      taskType: "OUTPAINTING",
      outPaintingParams: {
        image: params.imageBase64,
        text: params.prompt,
        ...(params.maskPrompt && { maskPrompt: params.maskPrompt }),
        outPaintingMode: params.outPaintingMode || "DEFAULT"
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        ...(params.seed !== undefined && { seed: params.seed })
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Generate image with style conditioning
   */
  async generateWithStyle(params: ImageConditioningParams): Promise<string[]> {
    const body = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: params.prompt,
        conditionImage: params.conditionImageBase64,
        controlMode: params.controlMode,
        controlStrength: params.controlStrength || 0.7,
        ...(params.negativePrompt && { negativeText: params.negativePrompt })
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        ...(params.seed !== undefined && { seed: params.seed })
      }
    }

    return this.invokeModel(body)
  }

  /**
   * Common method to invoke the model
   */
  private async invokeModel(body: any): Promise<string[]> {
    const input: InvokeModelCommandInput = {
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body)
    }

    try {
      const command = new InvokeModelCommand(input)
      const response = await this.client.send(command)
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      
      // Check for validation errors
      if (response.$metadata.httpStatusCode === 400) {
        throw new Error(`Validation error: ${responseBody.message}`)
      }
      
      // Return array of base64 encoded images
      return responseBody.images || []
    } catch (error: any) {
      console.error("Nova Canvas API error:", error)
      
      // Handle specific error types
      if (error.name === 'ValidationException') {
        throw new Error(`Content policy violation: ${error.message}`)
      }
      
      if (error.name === 'ResourceNotFoundException') {
        throw new Error('Nova Canvas model not available in your region')
      }
      
      if (error.name === 'AccessDeniedException') {
        throw new Error('Access denied. Please check your Bedrock permissions for Nova Canvas')
      }
      
      throw error
    }
  }

  /**
   * Upload base64 image to S3 and return URL
   */
  async uploadImageToS3(base64Image: string, key: string): Promise<string> {
    // This would be implemented based on your S3 setup
    // For now, return a placeholder
    console.log('S3 upload would happen here')
    return `/api/images/${key}`
  }
}

// Singleton instance
let novaCanvasClient: NovaCanvasClient | null = null

export function getNovaCanvasClient(): NovaCanvasClient {
  if (!novaCanvasClient) {
    novaCanvasClient = new NovaCanvasClient()
  }
  return novaCanvasClient
} 