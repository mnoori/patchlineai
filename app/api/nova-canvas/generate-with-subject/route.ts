import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { getS3Uploader } from '@/lib/s3-upload'

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
      subjectImageData // Allow direct base64 image data
    } = data

    // Check if we're in mock mode
    const useMockData = process.env.ENABLE_NOVA_CANVAS !== 'true'
    
    if (useMockData) {
      // Return mock result
      const mockImage = generateMockImage(prompt, { style, releaseContext })
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

    let processedSubject = subjectImage
    
    // Step 1: Remove background if requested
    if (removeBackground) {
      console.log('Removing background from subject image...')
      processedSubject = await removeImageBackground(subjectImage)
    }

    // Step 2: Generate new background based on release context
    console.log('Generating new background...')
    const newBackground = await generateBackground(prompt, style, {
      size: { width: 1024, height: 1024 },
      releaseContext
    })

    // Step 3: Composite the images
    // For now, we'll return the background as compositing requires additional work
    // In production, you'd use Sharp or Canvas API to properly composite
    console.log('Creating composite...')
    const compositeImage = await createAdvancedComposite(
      processedSubject, 
      newBackground, 
      prompt,
      releaseContext
    )

    // Upload to S3 if enabled
    if (process.env.ENABLE_S3_UPLOAD === 'true') {
      const s3Uploader = getS3Uploader()
      const uploadedUrl = await s3Uploader.uploadBase64Image(
        compositeImage,
        'release-content',
        {
          releaseTitle: releaseContext?.title || 'untitled',
          style,
          prompt: prompt.substring(0, 100)
        }
      )
      
      return NextResponse.json({
        imageUrl: uploadedUrl,
        mock: false,
        s3Enabled: true
      })
    }

    // Return base64 data URL
    return NextResponse.json({
      imageUrl: `data:image/png;base64,${compositeImage}`,
      mock: false
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

async function removeImageBackground(imageData: string): Promise<string> {
  try {
    // Use Nova Canvas background removal
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'BACKGROUND_REMOVAL',
        backgroundRemovalParams: {
          image: imageData.replace(/^data:image\/\w+;base64,/, ''),
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    return `data:image/png;base64,${responseBody.images[0]}`
  } catch (error) {
    console.error('Background removal error:', error)
    // Return original image if removal fails
    return imageData
  }
}

async function generateBackground(prompt: string, style: string, options: any): Promise<string> {
  const stylePrompts = {
    vibrant: 'vibrant colors, dynamic energy, abstract shapes, modern design, bright and colorful',
    cinematic: 'cinematic lighting, dramatic atmosphere, depth of field, professional photography, moody',
    minimalist: 'minimalist design, clean lines, white space, elegant, sophisticated',
    festival: 'festival atmosphere, bright colors, summer vibes, outdoor concert, energetic crowd'
  }

  const enhancedPrompt = `${prompt}, ${stylePrompts[style as keyof typeof stylePrompts] || ''}, high quality, professional`

  const command = new InvokeModelCommand({
    modelId: 'amazon.nova-canvas-v1:0',
    body: JSON.stringify({
      taskType: 'TEXT_IMAGE',
      textToImageParams: {
        text: enhancedPrompt,
        negativeText: 'low quality, blurry, distorted, text, watermark',
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        height: options?.size?.height || 1024,
        width: options?.size?.width || 1024,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 1000000)
      }
    }),
    contentType: 'application/json',
    accept: 'application/json'
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  
  return `data:image/png;base64,${responseBody.images[0]}`
}

async function createAdvancedComposite(
  subjectImage: string, 
  backgroundImage: string, 
  prompt: string,
  releaseContext?: any
): Promise<string> {
  try {
    // Use outpainting to integrate the subject into the background
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-canvas-v1:0',
      body: JSON.stringify({
        taskType: 'OUTPAINTING',
        outPaintingParams: {
          image: backgroundImage,
          text: `${prompt}, professional music artist integrated naturally into the scene`,
          maskPrompt: 'expand the scene to include the artist naturally',
          outPaintingMode: 'PRECISE'
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
    
    if (responseBody.images && responseBody.images.length > 0) {
      return responseBody.images[0]
    }
    
    // Fallback to background if outpainting fails
    return backgroundImage
  } catch (error) {
    console.error('Composite creation error:', error)
    // Return the background as fallback
    return backgroundImage
  }
}

function generateMockImage(prompt: string, options: any): string {
  const { style = 'vibrant', releaseContext } = options
  const title = releaseContext?.title || 'Mock Release'
  const genre = releaseContext?.genre || 'Music'
  
  const mockSvg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#818cf8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect x="50" y="50" width="924" height="924" 
            fill="none" stroke="white" stroke-width="4" stroke-dasharray="20,10" opacity="0.3"/>
      <text x="50%" y="40%" text-anchor="middle" fill="white" 
            font-family="Arial, sans-serif" font-size="48" font-weight="bold">
        ${title}
      </text>
      <text x="50%" y="50%" text-anchor="middle" fill="white" 
            font-family="Arial, sans-serif" font-size="32">
        ${genre} • ${style}
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
