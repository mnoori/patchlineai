import { NextRequest, NextResponse } from 'next/server'
import { FigmaClient, LayerExtractor } from '@/lib/figma'
import { getFigmaConfig } from '@/lib/figma'

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const nodeId = params.nodeId
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    const config = getFigmaConfig()
    if (!config.accessToken) {
      return NextResponse.json({ error: 'Figma access token not configured' }, { status: 500 })
    }

    const client = new FigmaClient(config.accessToken)
    const extractor = new LayerExtractor(client)
    
    // Get only the immediate children
    const children = await extractor.getLayerChildren(fileId, nodeId)
    
    return NextResponse.json({ children })
  } catch (error: any) {
    console.error('Error fetching layer children:', error)
    return NextResponse.json(
      { error: 'Failed to fetch layer children', details: error.message },
      { status: 500 }
    )
  }
} 