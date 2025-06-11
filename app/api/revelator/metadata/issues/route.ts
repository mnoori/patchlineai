import { NextRequest, NextResponse } from 'next/server'
import { revelatorService } from '@/lib/services/revelator-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'test-user-id'
    const useMockData = process.env.ENABLE_REVELATOR !== 'true'
    
    if (useMockData) {
      // Return mock metadata issues
      return NextResponse.json({
        issues: getMockIssues(),
        summary: {
          total: 24,
          high: 4,
          medium: 3,
          low: 17,
          autoFixable: 11
        }
      })
    }
    
    // Fetch real metadata issues from Revelator
    const issues = await revelatorService.getMetadataIssues(userId)
    
    // Calculate summary
    const summary = {
      total: issues.length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      autoFixable: issues.filter(i => i.autoFixable).length
    }
    
    return NextResponse.json({ issues, summary })
  } catch (error) {
    console.error('Metadata issues API error:', error)
    
    // Return mock data on error
    return NextResponse.json({
      issues: getMockIssues(),
      summary: {
        total: 24,
        high: 4,
        medium: 3,
        low: 17,
        autoFixable: 11
      },
      error: 'Using mock data due to API error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { issueId, action } = data
    
    if (!issueId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const useMockData = process.env.ENABLE_REVELATOR !== 'true'
    
    if (useMockData) {
      // Mock auto-fix response
      return NextResponse.json({
        success: true,
        message: `Successfully ${action} for issue ${issueId}`,
        affectedTracks: Math.floor(Math.random() * 10) + 1
      })
    }
    
    // Handle different actions
    let result
    switch (action) {
      case 'auto-fix':
        result = await revelatorService.autoFixMetadata(issueId)
        break
      case 'dismiss':
        // Store dismissal in database
        result = { success: true, message: 'Issue dismissed' }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Metadata action error:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}

function getMockIssues() {
  return [
    {
      id: 'isrc-missing',
      field: 'isrc',
      message: '4 tracks missing ISRC codes',
      severity: 'high',
      autoFixable: true,
      affectedTracks: 4,
      category: 'ISRC'
    },
    {
      id: 'composer-credits',
      field: 'composer',
      message: '3 tracks missing composer credits',
      severity: 'medium',
      autoFixable: false,
      affectedTracks: 3,
      category: 'Credits'
    },
    {
      id: 'bpm-missing',
      field: 'bpm',
      message: '7 tracks missing BPM information',
      severity: 'low',
      autoFixable: true,
      affectedTracks: 7,
      category: 'BPM'
    },
    {
      id: 'publisher-info',
      field: 'publisher',
      message: '2 tracks missing publisher information',
      severity: 'high',
      autoFixable: false,
      affectedTracks: 2,
      category: 'Publisher'
    }
  ]
} 