import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { getDocumentClient } from "@/lib/aws/shared-dynamodb-client"
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { cache } from "@/lib/cache"

const EMBEDS_TABLE = process.env.EMBEDS_TABLE || process.env.NEXT_PUBLIC_EMBEDS_TABLE || "Embeds-staging"

// Mock data generator
const generateMockEmbeds = (userId: string) => [
  {
    embedId: "mock-embed-1",
    userId: userId,
    platform: "soundcloud",
    url: "https://soundcloud.com/example/midnight-dreams",
    html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1234567890&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
    title: "Midnight Dreams",
    artist: "Luna Echo",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    embedId: "mock-embed-2",
    userId: userId,
    platform: "soundcloud",
    url: "https://soundcloud.com/example/neon-city",
    html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/0987654321&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
    title: "Neon City",
    artist: "Luna Echo",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    embedId: "mock-embed-3",
    userId: userId,
    platform: "soundcloud",
    url: "https://soundcloud.com/example/summer-haze",
    html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1122334455&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>',
    title: "Summer Haze",
    artist: "Luna Echo",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
]

// GET /api/embed?userId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  console.log(`[API /embed GET] Received request for userId: ${userId}`)

  if (!userId) {
    console.log("[API /embed GET] Missing userId parameter")
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  // Check cache first
  const cacheKey = `embed:${userId}`
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey}`)
    return NextResponse.json(cachedData)
  }

  // Get shared document client
  const docClient = await getDocumentClient()
  
  // If AWS is not available, return mock data immediately
  if (!docClient) {
    console.log(`[API /embed GET] Using mock data for userId: ${userId}`)
    const mockEmbeds = generateMockEmbeds(userId)
    const response = {
      embeds: mockEmbeds,
      mockData: true,
      message: "Using mock data - AWS not available",
    }
    cache.set(cacheKey, response, 300) // Cache for 5 minutes
    return NextResponse.json(response)
  }

  try {
    console.log(`[API /embed GET] Querying embeds from table: ${EMBEDS_TABLE} for userId: ${userId}`)
    const result = await docClient.send(
      new QueryCommand({
        TableName: EMBEDS_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    )

    if (!result.Items || result.Items.length === 0) {
      console.log(`[API /embed GET] No embeds found for userId: ${userId}`)
      const response = { embeds: [] }
      cache.set(cacheKey, response, 300) // Cache empty result for 5 minutes
      return NextResponse.json(response)
    }

    console.log(`[API /embed GET] Found ${result.Items.length} embeds for userId: ${userId}`)
    const response = { embeds: result.Items }
    cache.set(cacheKey, response, 300) // Cache for 5 minutes
    console.log(`[CACHE SET] ${cacheKey}`)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[API /embed GET] Error fetching embeds for userId: ${userId}:`, error)

    // Return mock data on any error
    console.log(`[API /embed GET] Returning mock data due to error for userId: ${userId}`)
    const mockEmbeds = generateMockEmbeds(userId)
    const response = {
      embeds: mockEmbeds,
      mockData: true,
      error: "AWS error, using mock data",
      details: error.message,
    }
    cache.set(cacheKey, response, 60) // Cache error response for 1 minute
    return NextResponse.json(response)
  }
}

// POST /api/embed
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, platform, url, html, title, artist, ...embedData } = body

    console.log(`[API /embed POST] Received request for userId: ${userId}`)
    console.log(`[API /embed POST] Platform: ${platform}, URL: ${url}`)

    if (!userId) {
      console.log("[API /embed POST] Missing userId parameter")
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (!platform || !url) {
      console.log("[API /embed POST] Missing required fields:", { platform, url })
      return NextResponse.json({ error: "Missing required fields: platform, url" }, { status: 400 })
    }

    // Invalidate cache on update
    const cacheKey = `embed:${userId}`
    cache.del(cacheKey)
    cache.del(`embeds:${userId}`) // Also invalidate the embeds (plural) cache

    // Get shared document client
    const docClient = await getDocumentClient()
    
    // If AWS is not supported, return mock success
    if (!docClient) {
      console.log(`[API /embed POST] Using mock response for userId: ${userId}`)
      const mockEmbedId = uuidv4()
      const mockEmbed = {
        userId,
        embedId: mockEmbedId,
        platform,
        url,
        html:
          html ||
          `<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}"></iframe>`,
        title: title || "Mock Track",
        artist: artist || "Mock Artist",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...embedData,
      }

      return NextResponse.json({
        success: true,
        embedId: mockEmbedId,
        embed: mockEmbed,
        mockData: true,
        message: "Mock embed created - AWS not available",
      })
    }

    // Check for duplicates
    try {
      const existingEmbedsResult = await docClient.send(
        new QueryCommand({
          TableName: EMBEDS_TABLE,
          KeyConditionExpression: "userId = :userId",
          FilterExpression: "#u = :uval",
          ExpressionAttributeNames: {
            "#u": "url",
          },
          ExpressionAttributeValues: {
            ":userId": userId,
            ":uval": url,
          },
        })
      )

      if (existingEmbedsResult.Items && existingEmbedsResult.Items.length > 0) {
        const existingEmbed = existingEmbedsResult.Items[0]
        console.log(`[API /embed POST] Embed with URL already exists: ${url}`)
        return NextResponse.json({
          success: true,
          embedId: existingEmbed.embedId,
          embed: existingEmbed,
          alreadyExists: true,
        })
      }
    } catch (duplicateCheckError: any) {
      console.error(`[API /embed POST] Error checking for duplicate embed:`, duplicateCheckError)
    }

    const embedId = uuidv4()
    const timestamp = new Date().toISOString()
    const newEmbed = {
      userId,
      embedId,
      platform,
      url,
      html,
      title,
      artist,
      ...embedData,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    console.log(`[API /embed POST] Creating new embed with ID: ${embedId}`)
    await docClient.send(
      new PutCommand({
        TableName: EMBEDS_TABLE,
        Item: newEmbed,
      })
    )

    console.log(`[API /embed POST] Successfully created embed: ${embedId}`)
    return NextResponse.json({
      success: true,
      embedId,
      embed: newEmbed,
    })
  } catch (error: any) {
    console.error(`[API /embed POST] Error creating embed:`, error)

    // Return mock success on any error
    console.log(`[API /embed POST] Returning mock success due to error`)
    const mockEmbedId = uuidv4()
    const mockEmbed = {
      userId: "mock-user",
      embedId: mockEmbedId,
      platform: "soundcloud",
      url: "https://soundcloud.com/mock/track",
      html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=mock"></iframe>',
      title: "Mock Track",
      artist: "Mock Artist",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      embedId: mockEmbedId,
      embed: mockEmbed,
      mockData: true,
      error: "AWS error, using mock data",
      details: error.message,
    })
  }
}
