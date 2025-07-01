import { NextResponse } from 'next/server'
import { FigmaClient } from '@/lib/figma/client'
import { getFigmaConfig } from '@/lib/figma'

export async function POST(request: Request) {
  try {
    const { fileId, nodeIds, format = 'png', scale = 2 } = await request.json()
    
    if (!fileId || !nodeIds || !Array.isArray(nodeIds)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const config = getFigmaConfig()
    if (!config.accessToken) {
      return NextResponse.json(
        { error: 'Figma access token not configured' },
        { status: 500 }
      )
    }

    const client = new FigmaClient(config.accessToken)
    const images = await client.exportAssets(fileId, nodeIds, format as any, scale)

    return NextResponse.json({ images })
  } catch (error: any) {
    console.error('Figma export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export assets' },
      { status: 500 }
    )
  }
} 