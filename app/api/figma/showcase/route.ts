import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const filePath = join(process.cwd(), 'figma-exploration', 'showcase-data.json')

  if (!existsSync(filePath)) {
    return NextResponse.json({
      error: 'Showcase data not found. Run pnpm tsx scripts/explore-figma-file.ts first.'
    }, { status: 404 })
  }

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read showcase data.' }, { status: 500 })
  }
} 