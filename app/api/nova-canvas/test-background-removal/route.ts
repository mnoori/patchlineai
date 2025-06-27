import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getNovaCanvasClient } from '@/lib/nova-canvas-api'
import { getS3Uploader } from '@/lib/s3-upload'

// Initialize Bedrock client
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined
})

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { releaseTitle = "Summer Vibes", releaseGenre = "Electronic", style = "vibrant" } = data

    // Check if we're in mock mode
    const useMockData = process.env.ENABLE_NOVA_CANVAS !== 'true'
    
    if (useMockData) {
      return NextResponse.json({
        message: 'Running in mock mode. Set ENABLE_NOVA_CANVAS=true to test real background removal',
        mockResults: {
          originalImage: '/api/placeholder/400/400',
          backgroundRemoved: '/api/placeholder/400/400?bg=transparent',
          newBackground: '/api/placeholder/1024/1024?style=vibrant',
          finalComposite: '/api/placeholder/1024/1024?composite=true'
        }
      })
    }

    // Step 1: Read the test image
    const testImagePath = join(process.cwd(), 'temp', 'test.jpg')
    let imageBuffer: Buffer
    
    try {
      imageBuffer = readFileSync(testImagePath)
    } catch (error) {
      return NextResponse.json({
        error: 'Could not read test.jpg from temp folder',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 404 })
    }

    // Convert to base64
    const imageBase64 = imageBuffer.toString('base64')
    
    // Step 2: Remove background using Nova Canvas
    console.log('Removing background...')
    const backgroundRemovedImage = await removeBackground(imageBase64)
    
    // Step 3: Generate a new background based on release context
    console.log('Generating new background...')
    const newBackground = await generateReleaseBackground(releaseTitle, releaseGenre, style)
    
    // Step 4: Composite the images (for now, we'll return both separately)
    // In production, we'd use Nova Canvas inpainting to properly composite
    console.log('Creating composite...')
    const compositeImage = await createComposite(backgroundRemovedImage, newBackground, releaseTitle)
    
    // Upload results to S3 if enabled
    let results: any = {
      message: 'Background removal test completed successfully',
      backgroundRemoved: `data:image/png;base64,${backgroundRemovedImage}`,
      newBackground: `data:image/png;base64,${newBackground}`,
      composite: `data:image/png;base64,${compositeImage}`
    }
    
    if (process.env.ENABLE_S3_UPLOAD === 'true') {
      const s3Uploader = getS3Uploader()
      const [bgRemovedUrl, newBgUrl, compositeUrl] = await s3Uploader.uploadMultipleImages(
        [backgroundRemovedImage, newBackground, compositeImage],
        'test-background-removal',
        { test: 'true', releaseTitle, releaseGenre, style }
      )
      
      results.s3Urls = {
        backgroundRemoved: bgRemovedUrl,
        newBackground: newBgUrl,
        composite: compositeUrl
      }
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Background removal test error:', error)
    return NextResponse.json({
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function removeBackground(imageBase64: string): Promise<string> {
  try {
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'BACKGROUND_REMOVAL',
        backgroundRemovalParams: {
          image: imageBase64
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No image returned from background removal')
    }
    
    return responseBody.images[0]
  } catch (error) {
    console.error('Background removal error:', error)
    throw error
  }
}

async function generateReleaseBackground(title: string, genre: string, style: string): Promise<string> {
  const stylePrompts = {
    vibrant: 'vibrant colors, dynamic energy, abstract shapes, modern design',
    cinematic: 'cinematic lighting, dramatic atmosphere, depth of field',
    minimalist: 'minimalist design, clean lines, white space, elegant',
    festival: 'festival atmosphere, bright colors, summer vibes, outdoor concert'
  }

  const prompt = `${genre} music album background, ${title} theme, ${stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.vibrant}, professional album artwork, no people, abstract background`

  try {
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: prompt,
          negativeText: 'people, faces, text, watermark, low quality'
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: 1024,
          width: 1024,
          cfgScale: 8.0,
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    return responseBody.images[0]
  } catch (error) {
    console.error('Background generation error:', error)
    throw error
  }
}

async function createComposite(subjectImage: string, backgroundImage: string, releaseTitle: string): Promise<string> {
  // For now, we'll use inpainting to blend the subject into the background
  // In a full implementation, we'd use proper image compositing libraries
  
  try {
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'INPAINTING',
        inPaintingParams: {
          image: backgroundImage,
          text: `professional music artist portrait integrated into the scene, ${releaseTitle} album cover`,
          maskPrompt: 'center area where the subject should be placed'
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    // For now, return the background as we need proper compositing
    // In production, we'd use a proper image manipulation library
    return responseBody.images?.[0] || backgroundImage
  } catch (error) {
    console.error('Composite creation error:', error)
    // Return the background if compositing fails
    return backgroundImage
  }
} 