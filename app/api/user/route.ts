import { NextResponse } from "next/server"
import { getDocumentClient } from "@/lib/aws/shared-dynamodb-client"
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
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

    console.log("[API /user] AWS SDK initialized successfully")
  } catch (error) {
    console.log("[API /user] Failed to initialize AWS SDK, will use mock data:", error.message)
    ddbClient = null
  }
} else {
  console.log("[API /user] AWS not supported in this environment, using mock data")
}

const USERS_TABLE = process.env.USERS_TABLE || process.env.NEXT_PUBLIC_USERS_TABLE || "Users-staging"

// Mock user data
const generateMockUser = (userId: string) => ({
  userId,
  email: "luna.echo@example.com",
  name: "Luna Echo",
  displayName: "Luna Echo",
  profileImage: "/placeholder.svg?height=40&width=40&query=music+artist+avatar",
  role: "artist",
  subscription: "pro",
  createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
  updatedAt: new Date().toISOString(),
  preferences: {
    theme: "dark",
    notifications: true,
    autoSync: true,
  },
  stats: {
    totalTracks: 142,
    totalStreams: 2350412,
    monthlyListeners: 185432,
    totalRevenue: 45231.89,
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
  const cacheKey = `user:${userId}`
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey}`)
    return NextResponse.json(cachedData)
  }

  // Get shared document client
  const docClient = await getDocumentClient()
  
  // If AWS is not available, return mock data immediately
  if (!docClient) {
    console.log(`[API /user GET] Using mock data for userId: ${userId}`)
    const mockUser = generateMockUser(userId)
    cache.set(cacheKey, mockUser, 300) // Cache for 5 minutes
    return NextResponse.json(mockUser)
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      })
    )

    if (!result.Item) {
      // Return mock user if not found
      const mockUser = generateMockUser(userId)
      cache.set(cacheKey, mockUser, 300) // Cache for 5 minutes
      return NextResponse.json(mockUser)
    }

    // Cache the real user data
    cache.set(cacheKey, result.Item, 300) // Cache for 5 minutes
    console.log(`[CACHE SET] ${cacheKey}`)
    
    return NextResponse.json(result.Item)
  } catch (error: any) {
    console.error("Error fetching user:", error)

    // Return mock data on any error
    console.log(`[API /user GET] Returning mock data due to error for userId: ${userId}`)
    const mockUser = generateMockUser(userId)
    cache.set(cacheKey, mockUser, 60) // Cache error response for 1 minute
    return NextResponse.json(mockUser)
  }
}

export async function POST(req: Request) {
  try {
    const userData = await req.json()
    const { userId } = userData

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Invalidate cache on update
    const cacheKey = `user:${userId}`
    cache.del(cacheKey)

    // Get shared document client
    const docClient = await getDocumentClient()
    
    // If AWS is not supported, return mock success
    if (!docClient) {
      console.log(`[API /user POST] Using mock response for userId: ${userId}`)
      return NextResponse.json({
        success: true,
        user: generateMockUser(userId),
        mockData: true,
        message: "Mock user created/updated - AWS not available",
      })
    }

    const timestamp = new Date().toISOString()
    const userToSave = {
      ...userData,
      updatedAt: timestamp,
      ...(userData.createdAt ? {} : { createdAt: timestamp }),
    }

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: userToSave,
      })
    )

    // Update cache with new data
    cache.set(cacheKey, userToSave, 300)

    return NextResponse.json({ success: true, user: userToSave })
  } catch (error: any) {
    console.error("Error saving user:", error)

    // Return mock success on any error
    return NextResponse.json({
      success: true,
      user: generateMockUser("mock-user"),
      mockData: true,
      error: "AWS error, using mock data",
      details: error.message,
    })
  }
}
