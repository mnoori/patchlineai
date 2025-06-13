import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      subjectImage, 
      backgroundPrompt, 
      style, 
      removeBackground, 
      platform,
      options 
    } = body

    // First, remove background from subject image
    const backgroundRemovedImage = await removeImageBackground(subjectImage)
    
    // Then generate creative background based on prompt
    const backgroundImage = await generateBackground(backgroundPrompt, style, options)
    
    // Finally, composite the subject onto the background
    const finalImages = await compositeImages(backgroundRemovedImage, backgroundImage, style)

    return NextResponse.json({
      images: finalImages,
      success: true
    })

  } catch (error) {
    console.error('Generate with subject error:', error)
    
    // Fallback to regular generation
    try {
      const { backgroundPrompt, options } = await request.json()
      
      const command = new InvokeModelCommand({
        modelId: 'amazon.nova-canvas-v1:0',
        body: JSON.stringify({
          taskType: 'TEXT_IMAGE',
          textToImageParams: {
            text: backgroundPrompt,
            negativeText: 'low quality, blurry, distorted',
          },
          imageGenerationConfig: {
            numberOfImages: options?.numberOfImages || 3,
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
      
      const images = responseBody.images?.map((img: string) => `data:image/png;base64,${img}`) || []
      
      return NextResponse.json({
        images,
        success: true
      })
    } catch (fallbackError) {
      console.error('Fallback generation error:', fallbackError)
      return NextResponse.json({
        images: [],
        success: false,
        error: 'Failed to generate images'
      }, { status: 500 })
    }
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

async function compositeImages(subject: string, background: string, style: string): Promise<string[]> {
  // For now, return multiple variations of the background
  // In a real implementation, this would composite the subject onto the background
  // with different positions and effects
  
  const variations = []
  
  // Generate 3 variations with different seeds
  for (let i = 0; i < 3; i++) {
    // This is a placeholder - in production, you'd use image manipulation
    // libraries or services to properly composite the images
    variations.push(background)
  }
  
  return variations
} 