import { NextRequest, NextResponse } from 'next/server'
import { FigmaClient } from '@/lib/figma/client'
import { getFigmaConfig } from '@/lib/figma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    const config = getFigmaConfig()
    if (!config.accessToken) {
      return NextResponse.json({ error: 'Figma access token not configured' }, { status: 500 })
    }

    const client = new FigmaClient(config.accessToken)
    const file = await client.getFile(fileId)
    
    // Extract pages from the document
    const pages = file.document.children.map(page => ({
      id: page.id,
      name: page.name,
      type: page.type
    }))

    return NextResponse.json({ pages })
  } catch (error: any) {
    console.error('Error fetching Figma pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Figma pages', details: error.message },
      { status: 500 }
    )
  }
}