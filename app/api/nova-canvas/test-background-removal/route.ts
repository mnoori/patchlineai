import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getNovaCanvasClient } from '@/lib/nova-canvas-api'
import { getS3Uploader } from '@/lib/s3-upload'
import { resizeImageForNovaCanvasServer, cleanBase64 } from '@/lib/image-utils'

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
    
    // Get Nova Canvas client
    const novaCanvas = getNovaCanvasClient()
    
    // Step 2: Remove background using Nova Canvas
    console.log('Removing background...')
    // Clean and resize the image before processing
    const cleanedImage = cleanBase64(imageBase64)
    const resizedImage = await resizeImageForNovaCanvasServer(cleanedImage)
    const [backgroundRemovedImage] = await novaCanvas.removeBackground(resizedImage)
    
    // Step 3: Generate a new background based on release context
    console.log('Generating new background...')
    const [newBackground] = await generateReleaseBackground(releaseTitle, releaseGenre, style)
    
    // Test different compositing methods
    const { compositeMethod = 'client' } = data
    
    // Step 3: Create composite based on method
    console.log(`Creating composite using ${compositeMethod} method...`)
    let compositeImage = backgroundRemovedImage
    let methodUsed = compositeMethod
    
    try {
      if (compositeMethod === 'client') {
        // Client-side compositing - return both images
        console.log('Using client-side compositing')
      } else if (compositeMethod === 'inpainting') {
        // Inpainting method
        console.log('Attempting inpainting...')
        const inpaintResult = await novaCanvas.inpaint({
          imageBase64: cleanBase64(backgroundRemovedImage),
          prompt: 'Place the person naturally in the center of the scene',
          maskPrompt: 'center area',
          negativePrompt: 'distorted, blurry'
        })
        compositeImage = inpaintResult[0] || backgroundRemovedImage
      } else if (compositeMethod === 'variation') {
        // Image variation method
        console.log('Attempting image variation...')
        const variationResult = await novaCanvas.createVariation({
          imageBase64: cleanBase64(imageBase64), // Use original image
          prompt: 'Transform into cinematic professional photo with dramatic lighting',
          similarityStrength: 0.7,
          negativePrompt: 'low quality, amateur'
        })
        compositeImage = variationResult[0] || imageBase64
      } else if (compositeMethod === 'outpainting') {
        // Outpainting method
        console.log('Attempting outpainting...')
        // Nova Canvas outpainting using the client's outpaint method
        const outpaintResult = await novaCanvas.outpaint({
          imageBase64: cleanBase64(imageBase64),
          prompt: 'Extend the environment with cinematic background',
          maskPrompt: 'keep the center person',
          outPaintingMode: 'DEFAULT'
        })
        compositeImage = outpaintResult[0] || imageBase64
      }
    } catch (error) {
      console.error(`${compositeMethod} method failed:`, error)
      methodUsed = 'client' // Fallback to client-side
    }
    
    // Upload results to S3 if enabled
    let results: any = {
      message: 'Background removal test completed successfully',
      backgroundRemoved: `data:image/png;base64,${backgroundRemovedImage}`,
      newBackground: `data:image/png;base64,${newBackground}`,
      composite: `data:image/png;base64,${compositeImage}`,
      methodUsed
    }
    
    if (process.env.ENABLE_S3_UPLOAD === 'true') {
      try {
        const s3Uploader = getS3Uploader()
        const uploadResults = await s3Uploader.uploadMultipleImages(
          [backgroundRemovedImage, newBackground, compositeImage],
          'test-background-removal',
          { 
            metadata: { 
              test: 'true', 
              releaseTitle, 
              releaseGenre, 
              style 
            } 
          }
        )
        const [bgRemovedUrl, newBgUrl, compositeUrl] = uploadResults.map(result => result.url)
        
        results.s3Urls = {
          backgroundRemoved: bgRemovedUrl,
          newBackground: newBgUrl,
          composite: compositeUrl
        }
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error)
        // Don't fail the entire request if S3 upload fails
        results.s3UploadError = 'S3 upload failed but images were generated successfully'
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

async function generateReleaseBackground(title: string, genre: string, style: string): Promise<string[]> {
  const novaCanvas = getNovaCanvasClient()
  
  const stylePrompts = {
    vibrant: 'vibrant colors, dynamic energy, abstract shapes, modern design',
    cinematic: 'cinematic lighting, dramatic atmosphere, depth of field',
    minimalist: 'minimalist design, clean lines, white space, elegant',
    festival: 'festival atmosphere, bright colors, summer vibes, outdoor concert'
  }

  const prompt = `${genre} music album background, ${title} theme, ${stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.vibrant}, professional album artwork, no people, abstract background`

  return novaCanvas.generateImage({
    prompt,
    negativePrompt: 'people, faces, text, watermark, low quality',
    numberOfImages: 1,
    size: { width: 1024, height: 1024 },
    cfgScale: 8.0
  })
}

async function createComposite(subjectImage: string, backgroundImage: string, releaseTitle: string): Promise<string[]> {
  // For this test, we'll return the background image
  // In production, you'd use a proper image manipulation library like Sharp or Canvas
  // to composite the background-removed subject onto the new background
  
  console.log('Note: Full compositing requires additional image manipulation libraries')
  console.log('Returning generated background for demonstration purposes')
  
  return [backgroundImage]
} 