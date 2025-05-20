import { NextResponse } from "next/server"
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { USERS_TABLE } from "@/lib/aws-config"

const REGION = process.env.AWS_REGION || "us-east-1"
const ddbClient = new DynamoDBClient({ region: REGION })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const result = await ddbClient.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId })
      })
    )

    if (!result.Item) {
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

      await ddbClient.send(
        new PutItemCommand({
          TableName: USERS_TABLE,
          Item: marshall(defaultUser),
        })
      )

      return NextResponse.json(defaultUser)
    }

    return NextResponse.json(unmarshall(result.Item))
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, ...userData } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    await ddbClient.send(
      new PutItemCommand({
        TableName: USERS_TABLE,
        Item: marshall({
          userId,
          ...userData,
          updatedAt: new Date().toISOString()
        })
      })
    )

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error("Error upserting user:", error)
    return NextResponse.json(
      { error: "Failed to upsert user data" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  // Similar to POST but with partial updates
  return POST(req)
} 