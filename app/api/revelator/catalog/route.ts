import { NextRequest, NextResponse } from 'next/server'
import { revelatorService } from '@/lib/services/revelator-service'
import { shouldBypassAuth } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params or headers
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'test-user-id'
    
    // For development, allow mock data
    const useMockData = process.env.ENABLE_REVELATOR !== 'true'
    
    if (useMockData) {
      // Return mock data matching the UI structure
      return NextResponse.json({
        tracks: getMockTracks(),
        albums: getMockAlbums(),
        playlists: getMockPlaylists()
      })
    }
    
    // Fetch real data from Revelator
    const catalogData = await revelatorService.getCatalogData(userId)
    
    return NextResponse.json(catalogData)
  } catch (error) {
    console.error('Catalog API error:', error)
    
    // Fallback to mock data on error
    return NextResponse.json({
      tracks: getMockTracks(),
      albums: getMockAlbums(),
      playlists: getMockPlaylists(),
      error: 'Using mock data due to API error'
    })
  }
}

// Mock data generators matching the UI
function getMockTracks() {
  return [
    {
      id: "track1",
      title: "Midnight Dreams",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "3:45",
      releaseDate: "June 15, 2025",
      streams: "1.2M",
      streamsTrend: "up",
      streamsDelta: "+8.5%",
      revenue: "$4,850",
      revenueTrend: "up",
      revenueDelta: "+12.3%",
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      sparklineData: [25, 36, 47, 52, 49, 62, 73, 75, 61, 70, 82, 90, 85],
      platforms: ["spotify", "apple", "youtube", "amazon"],
      genres: ["Synthwave", "Electronic", "Chillwave"],
      mood: "Dreamy, Atmospheric",
      bpm: 105,
    },
    {
      id: "track2",
      title: "Neon City",
      artist: "Luna Echo",
      album: "Summer EP",
      duration: "4:12",
      releaseDate: "June 15, 2025",
      streams: "850K",
      streamsTrend: "up",
      streamsDelta: "+5.2%",
      revenue: "$3,420",
      revenueTrend: "up",
      revenueDelta: "+4.8%",
      status: "metadata",
      statusDetail: "Missing genre tags and BPM information",
      sparklineData: [40, 45, 42, 50, 55, 60, 58, 64, 70, 65, 72, 78, 80],
      platforms: ["spotify", "apple", "amazon"],
      genres: ["Synthwave", "Electronic"],
      mood: "Energetic, Urban",
      bpm: null,
    }
  ]
}

function getMockAlbums() {
  return [
    {
      id: "album1",
      title: "Summer EP",
      artist: "Luna Echo",
      tracks: 3,
      tracksReady: 75,
      releaseDate: "June 15, 2025",
      totalStreams: "2.77M",
      streamsTrend: "up",
      streamsDelta: "+4.2%",
      totalRevenue: "$11,150",
      revenueTrend: "up",
      revenueDelta: "+5.8%",
      status: "metadata",
      statusDetail: "2 tracks missing complete metadata",
      topTracks: [
        { title: "Midnight Dreams", streams: "1.2M" },
        { title: "Neon City", streams: "850K" },
        { title: "Summer Haze", streams: "720K" },
      ],
      pendingTasks: ["Artwork missing alt-text", "Missing composer credits on track 2"],
      platforms: ["spotify", "apple", "youtube", "amazon"],
    }
  ]
}

function getMockPlaylists() {
  return [
    {
      id: "playlist1",
      title: "Late Night Vibes",
      platform: "spotify",
      followers: "1.2M",
      tracks: 2,
      tracksList: ["Midnight Dreams", "Night Drive"],
      lastUpdated: "May 5, 2025",
      position: 12,
      lastMovement: "up",
      movementValue: 3,
      matchScore: 85,
      type: "editorial",
      curator: "Spotify Editorial Team",
      description: "The perfect soundtrack for your late night drives and chill sessions.",
      genres: ["Synthwave", "Electronic", "Chillwave", "Darkwave"],
      mood: "Nocturnal, Atmospheric, Dreamy",
      averageBpm: 108,
      refreshRate: "Weekly",
    }
  ]
} 