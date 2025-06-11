import { NextRequest, NextResponse } from 'next/server'
import { getNovaCanvasClient } from '@/lib/nova-canvas-api'
import { getS3Uploader } from '@/lib/s3-upload'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { prompt, options = {} } = data
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    // Check if we should use mock data
    const useMockData = process.env.ENABLE_NOVA_CANVAS !== 'true'
    
    if (useMockData) {
      // Return mock image for development
      const mockImage = generateMockImage(prompt, options)
      return NextResponse.json({
        images: [mockImage],
        mock: true
      })
    }
    
    // Use real Nova Canvas API
    const client = getNovaCanvasClient()
    const base64Images = await client.generateImage({
      prompt,
      negativePrompt: options.negativePrompt,
      style: options.style || 'standard',
      size: options.size || { width: 1024, height: 1024 },
      seed: options.seed,
      numberOfImages: options.numberOfImages || 1,
      cfgScale: options.cfgScale
    })
    
    // Upload to S3 if enabled
    const uploadToS3 = process.env.ENABLE_S3_UPLOAD === 'true'
    let images: string[]
    
    if (uploadToS3) {
      const s3Uploader = getS3Uploader()
      images = await s3Uploader.uploadMultipleImages(
        base64Images,
        options.contentType || 'general',
        {
          prompt: prompt.substring(0, 100),
          style: options.style || 'standard'
        }
      )
    } else {
      // Return base64 data URLs
      images = base64Images.map(img => `data:image/png;base64,${img}`)
    }
    
    return NextResponse.json({
      images,
      mock: false,
      s3Enabled: uploadToS3
    })
    
  } catch (error: any) {
    console.error('Image generation error:', error)
    
    // Handle specific Nova Canvas errors
    if (error.message.includes('Content policy violation')) {
      return NextResponse.json(
        { error: 'Content policy violation: Your prompt contains restricted content' },
        { status: 400 }
      )
    }
    
    if (error.message.includes('not available in your region')) {
      return NextResponse.json(
        { error: 'Nova Canvas is not available in your AWS region' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate image', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate a mock image placeholder for development
 */
function generateMockImage(prompt: string, options: any): string {
  const width = options.size?.width || 1024
  const height = options.size?.height || 1024
  const style = options.style || 'standard'
  
  // Create a canvas element (server-side canvas simulation)
  // In real implementation, this would generate an actual placeholder image
  const mockSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="10" y="10" width="${width-20}" height="${height-20}" 
            fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="10,5"/>
      <text x="50%" y="40%" text-anchor="middle" fill="#38bdf8" 
            font-family="Arial, sans-serif" font-size="24">
        AI Generated Image
      </text>
      <text x="50%" y="50%" text-anchor="middle" fill="#64748b" 
            font-family="Arial, sans-serif" font-size="16">
        ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}
      </text>
      <text x="50%" y="60%" text-anchor="middle" fill="#475569" 
            font-family="Arial, sans-serif" font-size="14">
        ${width}x${height} • ${style}
      </text>
      <text x="50%" y="90%" text-anchor="middle" fill="#334155" 
            font-family="Arial, sans-serif" font-size="12">
        Mock Image - Enable Nova Canvas for real generation
      </text>
    </svg>
  `
  
  // Convert SVG to base64
  const base64 = Buffer.from(mockSvg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
} 