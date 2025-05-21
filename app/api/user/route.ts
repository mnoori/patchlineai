import { NextResponse } from "next/server"
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { USERS_TABLE } from "@/lib/aws-config"

const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1"
console.log('[API User] Initializing DynamoDB client with region:', REGION);
console.log('[API User] AWS credentials check:',
  'ACCESS_KEY:', process.env.AWS_ACCESS_KEY_ID ? 'exists' : 'missing',
  'SECRET_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'exists' : 'missing',
  'SESSION_TOKEN:', process.env.AWS_SESSION_TOKEN ? 'exists' : 'missing'
);

const ddbClient = new DynamoDBClient({ region: REGION })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  console.log(`[API /user GET] Received request for userId: ${userId}, using table: ${USERS_TABLE}`)
  
  // Detailed credential check at request time
  console.log("--- AWS Credentials Check ---");
  console.log("AWS_REGION:", process.env.AWS_REGION || "NOT SET");
  console.log("AWS_ACCESS_KEY_ID exists:", process.env.AWS_ACCESS_KEY_ID ? "YES" : "NO");
  console.log("AWS_SECRET_ACCESS_KEY exists:", process.env.AWS_SECRET_ACCESS_KEY ? "YES" : "NO");
  console.log("AWS_SESSION_TOKEN exists:", process.env.AWS_SESSION_TOKEN ? "YES" : "NO");
  console.log("USERS_TABLE:", USERS_TABLE);
  console.log("--- End Credentials Check ---");

  if (!userId) {
    console.log("[API /user GET] Missing userId parameter")
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    console.log(`[API /user GET] Attempting to get item from table: ${USERS_TABLE} for userId: ${userId}`)
    const result = await ddbClient.send(
      new GetItemCommand({
        TableName: USERS_TABLE, // Use environment variable via aws-config.ts
        Key: marshall({ userId })
      })
    )

    if (!result.Item) {
      console.log(`[API /user GET] User not found for userId: ${userId}. Creating default user.`)
      // Create a default user record so the UI has something to display
      const defaultUser = {
        userId,
        fullName: "",
        email: "",
        company: "",
        website: "",
        bio: "",
        platforms: {
          soundcloud: true, // default connected
          spotify: false,
          applemusic: false,
          distrokid: false,
          instagram: false,
        },
        updatedAt: new Date().toISOString(),
      }

      console.log(`[API /user GET] Saving default user to table: ${USERS_TABLE}`, defaultUser)
      await ddbClient.send(
        new PutItemCommand({
          TableName: USERS_TABLE, // Use environment variable
          Item: marshall(defaultUser),
        })
      )

      console.log(`[API /user GET] Successfully created default user: ${userId}`)
      return NextResponse.json(defaultUser)
    }

    const userData = unmarshall(result.Item)
    console.log(`[API /user GET] Successfully fetched user: ${userId}`, userData)
    return NextResponse.json(userData)
  } catch (error: any) {
    console.error(`[API /user GET] Error fetching user data for ${userId}:`, error)
    console.error(`[API /user GET] Error details: ${error.message}`)
    console.error(`[API /user GET] Error type: ${error.__type}`)
    console.error(`[API /user GET] Table being accessed: ${USERS_TABLE}`)
    
    // Return a more informative error for debugging
    return NextResponse.json(
      { 
        error: "Failed to fetch user data",
        details: error.message,
        errorType: error.__type,
        tableAccessed: USERS_TABLE
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, ...userData } = body

    console.log(`[API /user POST] Received request for userId: ${userId}, using table: ${USERS_TABLE}`)
    console.log(`[API /user POST] User data to save:`, userData)
    
    if (!userId) {
      console.log("[API /user POST] Missing userId parameter")
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const item = {
      userId,
      ...userData,
      updatedAt: new Date().toISOString()
    }
    
    console.log(`[API /user POST] Saving user data to table: ${USERS_TABLE}`, item)
    await ddbClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE, // Use environment variable
        Item: marshall(item)
      })
    )

    console.log(`[API /user POST] Successfully saved user data for: ${userId}`)
    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    console.error(`[API /user POST] Error upserting user:`, error)
    console.error(`[API /user POST] Error details: ${error.message}`)
    console.error(`[API /user POST] Error type: ${error.__type}`)
    console.error(`[API /user POST] Table being accessed: ${USERS_TABLE}`)
    
    return NextResponse.json(
      { 
        error: "Failed to upsert user data",
        details: error.message,
        errorType: error.__type,
        tableAccessed: USERS_TABLE
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  // Similar to POST but with partial updates
  return POST(req)
} 