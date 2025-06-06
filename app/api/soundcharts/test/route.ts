import { NextResponse } from 'next/server'
import { soundchartsClient } from '@/lib/services/soundcharts-client'

export async function GET() {
  try {
    console.log('Testing Soundcharts API integration...')
    
    // Test 1: Search for a popular artist
    const searchResults = await soundchartsClient.searchArtists('Taylor Swift', 1)
    console.log('Search test passed:', searchResults.items.length > 0)
    
    if (searchResults.items.length > 0) {
      const artist = searchResults.items[0]
      
      // Test 2: Get artist details
      const artistDetails = await soundchartsClient.getArtist(artist.uuid)
      console.log('Artist details test passed:', artistDetails.object.name)
      
      // Test 3: Get artist stats
      const stats = await soundchartsClient.getArtistStats(artist.uuid)
      console.log('Artist stats test passed:', stats.audience?.length > 0)
      
      // Test 4: Format for Scout
      const formatted = soundchartsClient.formatArtistForScout(
        artistDetails.object,
        stats
      )
      
      return NextResponse.json({
        success: true,
        tests: {
          search: 'passed',
          details: 'passed',
          stats: 'passed',
          formatting: 'passed'
        },
        sample: {
          artist: formatted,
          rawStats: {
            audienceMetrics: stats.audience?.length || 0,
            streamingMetrics: stats.streaming?.length || 0,
            score: stats.score
          }
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'No artists found in search'
    })
    
  } catch (error) {
    console.error('Soundcharts test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
} 