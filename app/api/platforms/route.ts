import { NextResponse } from "next/server"

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
let DynamoDBClient: any, GetItemCommand: any, PutItemCommand: any, marshall: any, unmarshall: any
let ddbClient: any = null

if (isAwsSupported()) {
  try {
    const dynamodb = require("@aws-sdk/client-dynamodb")
    const util = require("@aws-sdk/util-dynamodb")

    DynamoDBClient = dynamodb.DynamoDBClient
    GetItemCommand = dynamodb.GetItemCommand
    PutItemCommand = dynamodb.PutItemCommand
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
    console.log("[API /platforms] Failed to initialize AWS SDK, will use mock data:", error.message)
    ddbClient = null
  }
} else {
  console.log("[API /platforms] AWS not supported in this environment, using mock data")
}

const USERS_TABLE = process.env.USERS_TABLE || process.env.NEXT_PUBLIC_USERS_TABLE || "Users-staging"

// Mock platforms data
const generateMockPlatforms = (userId: string) => ({
  platforms: {
    spotify: {
      connected: true,
      accessToken: "mock_spotify_token",
      refreshToken: "mock_spotify_refresh",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      userId: "spotify_user_123",
      displayName: "Luna Echo",
      connectedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    soundcloud: {
      connected: true,
      accessToken: "mock_soundcloud_token",
      userId: "soundcloud_user_456",
      displayName: "Luna Echo",
      connectedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    instagram: {
      connected: true,
      accessToken: "mock_instagram_token",
      userId: "instagram_user_789",
      displayName: "lunaecho_music",
      connectedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    youtube: {
      connected: false,
    },
    tiktok: {
      connected: false,
    },
    twitter: {
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

  // If AWS is not supported, return mock data immediately
  if (!ddbClient) {
    console.log(`[API /platforms GET] Using mock data for userId: ${userId}`)
    return NextResponse.json(generateMockPlatforms(userId))
  }

  try {
    const result = await ddbClient.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
      }),
    )

    if (!result.Item) {
      return NextResponse.json({ platforms: {} })
    }

    const user = unmarshall(result.Item)
    return NextResponse.json({ platforms: user.platforms || {} })
  } catch (error: any) {
    console.error("Error fetching platforms:", error)

    // Return mock data on any error
    console.log(`[API /platforms GET] Returning mock data due to error for userId: ${userId}`)
    return NextResponse.json(generateMockPlatforms(userId))
  }
}

export async function POST(req: Request) {
  try {
    const { userId, platform, platformData } = await req.json()

    if (!userId || !platform || !platformData) {
      return NextResponse.json({ error: "Missing required fields: userId, platform, platformData" }, { status: 400 })
    }

    // If AWS is not supported, return mock success
    if (!ddbClient) {
      console.log(`[API /platforms POST] Using mock response for userId: ${userId}`)
      return NextResponse.json({
        success: true,
        platform,
        mockData: true,
        message: "Mock platform connection - AWS not available",
      })
    }

    // Get current user data
    const getUserResult = await ddbClient.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
      }),
    )

    const currentUser = getUserResult.Item ? unmarshall(getUserResult.Item) : { userId }
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
    await ddbClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE,
        Item: marshall({
          ...currentUser,
          platforms: updatedPlatforms,
          updatedAt: new Date().toISOString(),
        }),
      }),
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
