import { NextResponse } from "next/server"
import { getDocumentClient } from "@/lib/aws/shared-dynamodb-client"
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { cache } from "@/lib/cache"

// Check if we're in an environment that supports AWS SDK
const isAwsSupported = () => {
  try {
    return (
      typeof process !== "undefined" &&
      process.env &&
      (process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID) &&
      (process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY) &&
      typeof require !== "undefined"
    )
  } catch {
    return false
  }
}

// Only import AWS SDK if supported
let DynamoDBClient: any, GetItemCommand: any, PutItemCommand: any, QueryCommand: any, marshall: any, unmarshall: any
let ddbClient: any = null

if (isAwsSupported()) {
  try {
    const dynamodb = require("@aws-sdk/client-dynamodb")
    const util = require("@aws-sdk/util-dynamodb")

    DynamoDBClient = dynamodb.DynamoDBClient
    GetItemCommand = dynamodb.GetItemCommand
    PutItemCommand = dynamodb.PutItemCommand
    QueryCommand = dynamodb.QueryCommand
    marshall = util.marshall
    unmarshall = util.unmarshall

    const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1"
    const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
    const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
    const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN

    ddbClient = new DynamoDBClient({
      region: REGION,
      credentials:
        ACCESS_KEY && SECRET_KEY
          ? {
              accessKeyId: ACCESS_KEY,
              secretAccessKey: SECRET_KEY,
              ...(SESSION_TOKEN && { sessionToken: SESSION_TOKEN }),
            }
          : undefined,
    })

    console.log("[API /platforms] AWS SDK initialized successfully")
  } catch (error) {
    console.log("[API /platforms] Failed to initialize AWS SDK, will use mock data:", error instanceof Error ? error.message : String(error))
    ddbClient = null
  }
} else {
  console.log("[API /platforms] AWS not supported in this environment, using mock data")
}

const USERS_TABLE = process.env.USERS_TABLE || process.env.NEXT_PUBLIC_USERS_TABLE || "Users-staging"
const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || "PlatformConnections-staging"

// Mock platforms data - ALL PLATFORMS START AS DISCONNECTED
const generateMockPlatforms = (userId: string) => ({
  platforms: {
    spotify: {
      connected: false,
    },
    google: {
      connected: false,
    },
    soundcloud: {
      connected: false,
    },
    instagram: {
      connected: false,
    },
    applemusic: {
      connected: false,
    },
    youtube: {
      connected: false,
    },
    twitter: {
      connected: false,
    },
    facebook: {
      connected: false,
    },
    distrokid: {
      connected: false,
    },
  },
  mockData: true,
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  // Check cache first
  const cacheKey = `platforms:${userId}`
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey}`)
    return NextResponse.json(cachedData)
  }

  console.log(`[API /platforms GET] Received request for userId: ${userId}, using table: ${USERS_TABLE}`)

  // Get shared document client
  const docClient = await getDocumentClient()
  
  // If AWS is not available, return mock data immediately
  if (!docClient) {
    console.log(`[API /platforms GET] Using mock data for userId: ${userId}`)
    const mockData = generateMockPlatforms(userId)
    cache.set(cacheKey, mockData, 300) // Cache for 5 minutes
    return NextResponse.json(mockData)
  }

  try {
    console.log(`[API /platforms GET] Attempting to get user from table: ${USERS_TABLE} for userId: ${userId}`)
    
    // Run both queries in parallel for better performance
    const [userResult, connectionsResult] = await Promise.all([
      docClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId },
        })
      ),
      docClient.send(
        new QueryCommand({
          TableName: PLATFORM_CONNECTIONS_TABLE,
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        })
      )
    ])

    // Start with user's platform data (legacy format)
    let platforms: Record<string, any> = {}
    if (userResult.Item) {
      platforms = userResult.Item.platforms || {}
      console.log(`[API /platforms GET] Found existing platforms for userId: ${userId}`, platforms)
    }

    // Override with actual platform connections (new format)
    if (connectionsResult.Items && connectionsResult.Items.length > 0) {
      console.log(`[API /platforms GET] Found ${connectionsResult.Items.length} platform connections`)
      
      connectionsResult.Items.forEach((connection: any) => {
        platforms[connection.provider] = {
          connected: true,
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
          expiresAt: connection.expiresIn ? new Date(Date.now() + connection.expiresIn * 1000).toISOString() : null,
          connectedAt: connection.connectedAt,
          scope: connection.scope,
          displayName: connection.displayName || connection.provider
        }
      })
    }

    console.log(`[API /platforms GET] Returning platforms for userId: ${userId}`, platforms)
    const responseData = { platforms }
    
    // Cache the result
    cache.set(cacheKey, responseData, 300) // Cache for 5 minutes
    console.log(`[CACHE SET] ${cacheKey}`)
    
    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error(`[API /platforms GET] Error fetching platforms for userId: ${userId}:`, error)

    // Return mock data on any error
    console.log(`[API /platforms GET] Returning mock data due to error for userId: ${userId}`)
    const mockData = generateMockPlatforms(userId)
    cache.set(cacheKey, mockData, 60) // Cache error response for 1 minute
    return NextResponse.json(mockData)
  }
}

export async function POST(req: Request) {
  try {
    const { userId, platform, platformData } = await req.json()

    if (!userId || !platform || !platformData) {
      return NextResponse.json({ error: "Missing required fields: userId, platform, platformData" }, { status: 400 })
    }

    // Invalidate cache on update
    const cacheKey = `platforms:${userId}`
    cache.del(cacheKey)

    // Get shared document client
    const docClient = await getDocumentClient()
    
    // If AWS is not supported, return mock success
    if (!docClient) {
      console.log(`[API /platforms POST] Using mock response for userId: ${userId}`)
      return NextResponse.json({
        success: true,
        platform,
        mockData: true,
        message: "Mock platform connection - AWS not available",
      })
    }

    // Get current user data
    const getUserResult = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      })
    )

    const currentUser = getUserResult.Item || { userId }
    const currentPlatforms = currentUser.platforms || {}

    // Update platforms
    const updatedPlatforms = {
      ...currentPlatforms,
      [platform]: {
        ...platformData,
        connectedAt: new Date().toISOString(),
      },
    }

    // Save updated user
    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          ...currentUser,
          platforms: updatedPlatforms,
          updatedAt: new Date().toISOString(),
        },
      })
    )

    return NextResponse.json({ success: true, platform })
  } catch (error: any) {
    console.error("Error updating platforms:", error)

    // Return mock success on any error
    return NextResponse.json({
      success: true,
      platform: "mock",
      mockData: true,
      error: "AWS error, using mock data",
      details: error.message,
    })
  }
}
