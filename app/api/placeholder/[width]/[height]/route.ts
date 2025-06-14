import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { width: string; height: string } }
) {
  const width = parseInt(params.width) || 400
  const height = parseInt(params.height) || 400
  
  // Use a placeholder service
  const imageUrl = `https://via.placeholder.com/${width}x${height}/1a1a2e/16a34a?text=ALGORYX`
  
  try {
    const response = await fetch(imageUrl)
    const imageBuffer = await response.arrayBuffer()
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    // Return a simple SVG if the placeholder service fails
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#1a1a2e"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#16a34a" font-family="Arial" font-size="24">
          ALGORYX
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  }
} 