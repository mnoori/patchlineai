import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { getS3Uploader } from '@/lib/s3-upload'
import { resizeImageForNovaCanvasServer, cleanBase64, isBase64Valid } from '@/lib/image-utils'

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
    const { 
      subjectImageId, 
      prompt, 
      style = 'vibrant',
      removeBackground = true,
      releaseContext,
      subjectImageData, // Allow direct base64 image data
      compositeMethod = 'client' // 'client', 'inpainting', 'outpainting'
    } = data

    // Check if we're in mock mode
    const useMockData = process.env.ENABLE_NOVA_CANVAS !== 'true'
    
    if (useMockData) {
      // Return mock result
      const mockImage = generateMockImage(style)
      return NextResponse.json({
        imageUrl: mockImage,
        mock: true
      })
    }

    // Get the subject image
    let subjectImage = subjectImageData
    
    if (!subjectImage && subjectImageId) {
      // If it's a Google Drive ID, fetch from Drive
      // For now, we'll assume it's already base64
      subjectImage = subjectImageId
    }

    if (!subjectImage) {
      return NextResponse.json(
        { error: 'No subject image provided' },
        { status: 400 }
      )
    }

    // Clean the base64 image
    const cleanedBase64 = cleanBase64(subjectImage)
    
    if (!isBase64Valid(cleanedBase64)) {
      throw new Error('Invalid base64 image data')
    }

    // Step 1: Remove background from the subject (if requested)
    console.log('Processing subject image...')
    let processedSubject = cleanedBase64
    let originalSubject = cleanedBase64  // Keep the original for outpainting
    
    if (removeBackground) {
      processedSubject = await removeImageBackground(cleanedBase64)
      console.log('Background removed successfully')
    }

    // Step 2: Generate new background using Nova Canvas
    console.log('Generating background...')
    const newBackground = await generateBackground(
      `${style} style background for ${prompt}`,
      style,
      { releaseContext }
    )

    // Step 3: Composite the images based on method
    console.log('Creating composite...')
    let compositeImage = newBackground
    
    if (compositeMethod === 'variation') {
      // Use image variation to transform the style
      compositeImage = await createImageVariation(
        originalSubject,  // Use the original image (with background)
        style,
        releaseContext
      )
    } else if (compositeMethod === 'outpainting') {
      // Use outpainting to extend the environment
      compositeImage = await createOutpaintingComposite(
        originalSubject,  // Use the original image (with background)
        style,
        releaseContext
      )
    } else if (compositeMethod === 'inpainting') {
      // Use inpainting for more natural blending
      compositeImage = await createAdvancedComposite(
        processedSubject,
        newBackground,
        prompt,
        releaseContext
      )
    } else {
      // Default: Client-side compositing (return both images)
      // The client will handle the actual compositing
      console.log('Using client-side compositing')
    }

    // Try to upload to S3, but don't fail if it doesn't work
    let s3Url: string | null = null
    try {
      const s3Uploader = getS3Uploader()
      const uploadResult = await s3Uploader.uploadBase64Image(
        compositeImage, 
        style,
        {
          metadata: {
            releaseId: releaseContext?.id || 'unknown',
            releaseTitle: releaseContext?.title || 'unknown',
            style: style
          }
        }
      )
      s3Url = uploadResult.key // Return the key, not the URL since bucket is private
      console.log('S3 upload successful:', s3Url)
    } catch (s3Error) {
      console.error('S3 upload failed:', s3Error)
      // Continue without S3 URL
    }

    // Return base64 data URL
    return NextResponse.json({
      imageUrl: `data:image/png;base64,${compositeImage}`,
      mock: false,
      // Also return the background-removed subject so client can composite properly
      processedSubject: removeBackground ? `data:image/png;base64,${processedSubject}` : null,
      backgroundImage: `data:image/png;base64,${newBackground.replace(/^data:image\/\w+;base64,/, '')}`,
      s3Url
    })
    
  } catch (error) {
    console.error('Generate with subject error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

async function removeImageBackground(imageBase64: string): Promise<string> {
  try {
    // Clean and validate the base64 image
    const cleaned = cleanBase64(imageBase64)
    
    if (!isBase64Valid(cleaned)) {
      throw new Error('Invalid base64 image data')
    }
    
    // Resize image if needed before processing
    const resizedImage = await resizeImageForNovaCanvasServer(cleaned)
    
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'BACKGROUND_REMOVAL',
        backgroundRemovalParams: {
          image: resizedImage
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

async function generateBackground(prompt: string, style: string, options: any): Promise<string> {
  try {
    // Enhanced theme-specific prompts with better details
    const stylePrompts = {
      vibrant: 'vibrant colors, dynamic energy, abstract shapes, modern design, bright neon gradients, music festival atmosphere, energetic composition',
      cinematic: 'cinematic lighting, dramatic atmosphere, depth of field, professional photography, moody shadows, film noir aesthetic, volumetric fog',
      minimalist: 'minimalist design, clean lines, negative space, elegant simplicity, sophisticated monochrome, zen aesthetic, geometric precision',
      futuristic: 'futuristic sci-fi environment, holographic displays, neon circuits, cybernetic patterns, space station interior, advanced technology, metallic surfaces',
      nature: 'natural outdoor environment, organic elements, lush vegetation, mountain vistas, water reflections, golden hour lighting, peaceful wilderness',
      cyberpunk: 'cyberpunk cityscape at night, neon signs in rain, dystopian megacity, purple and pink lighting, blade runner aesthetic, urban decay',
      vintage: 'vintage retro aesthetic, film grain texture, nostalgic warm tones, art deco patterns, 1970s color palette, analog photography feel',
      abstract: 'abstract art composition, flowing liquid shapes, surreal geometry, creative color patterns, artistic expression, contemporary art gallery',
      festival: 'music festival main stage, concert lighting rigs, outdoor summer festival, crowd energy, pyrotechnics, festival decorations, vibrant atmosphere'
    }

    // Create a more specific prompt based on release context
    const releaseContext = options?.releaseContext || {}
    const genre = releaseContext.genre || 'music'
    const title = releaseContext.title || ''
    const artist = releaseContext.artist || 'artist'
    
    // Build a contextual prompt that creates backgrounds suitable for the artist
    let contextualPrompt = ''
    
    // Get the base style prompt
    const baseStylePrompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.vibrant
    
    // Add genre-specific elements
    const genreElements = {
      'Electronic': 'synthesizer waves, digital patterns, LED displays',
      'Rock': 'amplifiers, stage lighting, concert venue',
      'Hip-Hop': 'urban landscape, graffiti art, street culture',
      'Pop': 'colorful backdrops, glamorous settings, studio lights',
      'Jazz': 'intimate club atmosphere, warm spotlights, vintage instruments',
      'Classical': 'concert hall, elegant architecture, refined atmosphere'
    }
    
    const genreElement = genreElements[genre as keyof typeof genreElements] || ''
    
    // Combine all elements into a comprehensive prompt
    contextualPrompt = `${baseStylePrompt}, ${genreElement}, professional music industry promotional background, no people or faces, high quality 8k render, perfect for ${genre} artist marketing`
    
    // Add any additional prompt details if they don't conflict
    if (prompt && !prompt.toLowerCase().includes('background')) {
      contextualPrompt = `${contextualPrompt}, ${prompt}`
    }

    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: contextualPrompt,
          negativeText: 'people, faces, text, watermark, low quality, blurry, distorted, crowded, busy, amateur, ugly, deformed',
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: options?.size?.height || 1024,
          width: options?.size?.width || 1024,
          cfgScale: 8.5, // Slightly higher for better prompt adherence
          seed: Math.floor(Math.random() * 1000000)
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    // Better error handling
    if (!responseBody.images || !Array.isArray(responseBody.images) || responseBody.images.length === 0) {
      console.error('Invalid response from Nova Canvas:', responseBody)
      throw new Error('No images returned from background generation')
    }
    
    console.log(`Generated ${style} background successfully`)
    return responseBody.images[0]
  } catch (error) {
    console.error('Background generation error:', error)
    throw error
  }
}

async function createAdvancedComposite(
  subjectImage: string, 
  backgroundImage: string, 
  prompt: string,
  releaseContext?: any
): Promise<string> {
  try {
    console.log('Attempting advanced composite method...')
    
    // Clean base64 strings
    const cleanSubject = subjectImage.replace(/^data:image\/\w+;base64,/, '')
    const cleanBackground = backgroundImage.replace(/^data:image\/\w+;base64,/, '')
    
    // IMPORTANT: Nova Canvas doesn't support direct compositing of two images
    // We need to use a different approach:
    
    // Option 1: Try using Sharp for server-side compositing (if available)
    try {
      // Check if Sharp is available
      const sharp = await import('sharp').catch(() => null)
      
      if (sharp) {
        console.log('Using Sharp for server-side compositing')
        
        // Convert base64 to buffers
        const backgroundBuffer = Buffer.from(cleanBackground, 'base64')
        const subjectBuffer = Buffer.from(cleanSubject, 'base64')
        
        // Get background dimensions
        const bgMetadata = await sharp.default(backgroundBuffer).metadata()
        const bgWidth = bgMetadata.width || 1024
        const bgHeight = bgMetadata.height || 1024
        
        // Resize subject to fit nicely (about 60% of background size)
        const subjectResized = await sharp.default(subjectBuffer)
          .resize({
            width: Math.round(bgWidth * 0.6),
            height: Math.round(bgHeight * 0.6),
            fit: 'inside',
            position: 'center',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer()
        
        // Calculate position (center-bottom for artist placement)
        const left = Math.round((bgWidth - Math.round(bgWidth * 0.6)) / 2)
        const top = Math.round(bgHeight * 0.3) // Place in lower 70% of image
        
        // Composite the images
        const composite = await sharp.default(backgroundBuffer)
          .composite([
            {
              input: subjectResized,
              top,
              left,
              blend: 'over'
            }
          ])
          .toBuffer()
        
        // Convert back to base64
        const compositeBase64 = composite.toString('base64')
        console.log('Sharp compositing successful')
        return compositeBase64
      }
    } catch (sharpError) {
      console.log('Sharp not available or compositing failed:', sharpError)
    }
    
    // Option 2: Use IMAGE_VARIATION with the original image for style transformation
    // This creates a more cohesive result by transforming the entire scene
    try {
      console.log('Falling back to IMAGE_VARIATION for advanced styling')
      
      const stylePrompt = `Professional ${releaseContext?.genre || 'music'} artist promotional photo, ${prompt}, high quality photography, perfect lighting`
      
      const command = new InvokeModelCommand({
        modelId: 'amazon.nova-canvas-v1:0',
        body: JSON.stringify({
          taskType: 'IMAGE_VARIATION',
          imageVariationParams: {
            text: stylePrompt,
            negativeText: 'amateur, low quality, distorted, multiple people',
            images: [cleanBackground], // Use the generated background
            similarityStrength: 0.3  // Low similarity to allow more creative freedom
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
      
      if (responseBody.images && responseBody.images.length > 0) {
        console.log('Image variation successful for styling')
        return responseBody.images[0]
      }
    } catch (variationError) {
      console.error('Image variation failed:', variationError)
    }
    
    // Final fallback: Return the background for client-side compositing
    console.warn('All server-side compositing methods failed, returning background for client-side composition')
    return cleanBackground
    
  } catch (error) {
    console.error('Advanced composite error:', error)
    const cleanBackground = backgroundImage.replace(/^data:image\/\w+;base64,/, '')
    return cleanBackground
  }
}

// Alternative: Use Image Variation for style transformation
async function createImageVariation(
  originalImage: string,
  style: string,
  releaseContext?: any
): Promise<string> {
  try {
    console.log('Using IMAGE_VARIATION for style transformation...')
    
    // Use the original image (with background) for variation
    const cleanOriginal = originalImage.replace(/^data:image\/\w+;base64,/, '')
    
    const variationPrompt = style === 'vibrant' 
      ? 'Transform into vibrant music festival scene with colorful abstract background, dynamic energy, bright colors'
      : style === 'cinematic'
      ? 'Transform into cinematic scene with dramatic lighting, moody atmosphere, professional photoshoot'
      : 'Transform into minimalist scene with clean design, elegant white space, sophisticated background'
    
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'IMAGE_VARIATION',
        imageVariationParams: {
          text: `${variationPrompt}, professional music marketing content`,
          negativeText: 'bad quality, low resolution, blurry, distorted',
          images: [cleanOriginal],
          similarityStrength: 0.7  // Keep the subject recognizable
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: 1024,
          width: 1024,
          cfgScale: 8.0
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No image returned from image variation')
    }
    
    console.log('Image variation successful')
    return responseBody.images[0]
    
  } catch (error) {
    console.error('Image variation failed:', error)
    throw error
  }
}

// Alternative: Use Canvas Outpainting to extend environment
async function createOutpaintingComposite(
  originalImage: string,
  style: string,
  releaseContext?: any
): Promise<string> {
  try {
    console.log('Using outpainting/variation for environment extension...')
    
    // Since outpainting with maskPrompt is failing, let's use IMAGE_VARIATION
    // with lower similarity to achieve a similar effect
    const cleanOriginal = originalImage.replace(/^data:image\/\w+;base64,/, '')
    
    const extensionPrompt = style === 'vibrant' 
      ? 'Extend into colorful music festival environment, vibrant atmosphere, dynamic background'
      : style === 'cinematic'
      ? 'Extend into cinematic environment, dramatic atmosphere, moody lighting'
      : 'Extend into minimalist environment, clean spaces, elegant background'
    
    // Use IMAGE_VARIATION with low similarity to extend the environment
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'IMAGE_VARIATION',
        imageVariationParams: {
          text: extensionPrompt,
          negativeText: 'cropped, cut off, incomplete',
          images: [cleanOriginal],
          similarityStrength: 0.4  // Lower similarity allows more environment changes
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: 1024,
          width: 1024,
          cfgScale: 8.0
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No image returned from environment extension')
    }
    
    console.log('Environment extension successful using variation')
    return responseBody.images[0]
    
  } catch (error) {
    console.error('Environment extension failed:', error)
    throw error
  }
}

// Mock mode fallback
async function generateMockImage(style: string): Promise<string> {
  console.log('Mock mode: returning placeholder')
  
  // Return a data URL for a simple colored rectangle based on style
  const colors = {
    vibrant: '#ff6b6b',
    cinematic: '#1a1a2e',
    minimalist: '#f5f5f5'
  }

  const mockSvg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[style as keyof typeof colors]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[style as keyof typeof colors]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect x="50" y="50" width="924" height="924" 
            fill="none" stroke="white" stroke-width="4" stroke-dasharray="20,10" opacity="0.3"/>
      <text x="50%" y="40%" text-anchor="middle" fill="white" 
            font-family="Arial, sans-serif" font-size="48" font-weight="bold">
        Mock Release
      </text>
      <text x="50%" y="50%" text-anchor="middle" fill="white" 
            font-family="Arial, sans-serif" font-size="32">
        ${style}
      </text>
      <text x="50%" y="60%" text-anchor="middle" fill="white" opacity="0.8"
            font-family="Arial, sans-serif" font-size="20">
        AI Generated Content
      </text>
      <text x="50%" y="90%" text-anchor="middle" fill="white" opacity="0.5"
            font-family="Arial, sans-serif" font-size="16">
        Mock Mode - Enable Nova Canvas for real generation
      </text>
    </svg>
  `
  
  const base64 = Buffer.from(mockSvg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

export const dynamic = 'force-dynamic'
