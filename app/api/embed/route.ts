import { NextResponse } from "next/server"
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { EMBEDS_TABLE } from "@/lib/aws-config"

const REGION = process.env.AWS_REGION || "us-east-1"
const ddbClient = new DynamoDBClient({ region: REGION })

// GET /api/embed?userId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const result = await ddbClient.send(
      new QueryCommand({
        TableName: EMBEDS_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: marshall({
          ":userId": userId
        })
      })
    )

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ embeds: [] })
    }

    const embeds = result.Items.map(item => unmarshall(item))
    return NextResponse.json({ embeds })
  } catch (error) {
    console.error("Error fetching embeds:", error)
    return NextResponse.json(
      { error: "Failed to fetch embeds" },
      { status: 500 }
    )
  }
}

// POST /api/embed
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, platform, url, html, ...embedData } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (!platform || !url) {
      return NextResponse.json({ error: "Missing required fields: platform, url" }, { status: 400 })
    }

    // Check if this URL is already added for this user
    // Note: 'url' is a reserved keyword in DynamoDB, so we need to use expression attributes
    const existingEmbedsResult = await ddbClient.send(
      new QueryCommand({
        TableName: EMBEDS_TABLE,
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "#embedUrl = :embedUrl",
        ExpressionAttributeNames: {
          "#embedUrl": "url"
        },
        ExpressionAttributeValues: marshall({
          ":userId": userId,
          ":embedUrl": url
        })
      })
    );

    // If we already have this URL, return the existing embed instead of creating a duplicate
    if (existingEmbedsResult.Items && existingEmbedsResult.Items.length > 0) {
      const existingEmbed = unmarshall(existingEmbedsResult.Items[0]);
      return NextResponse.json({ 
        success: true, 
        embedId: existingEmbed.embedId,
        embed: existingEmbed,
        alreadyExists: true
      });
    }

    const embedId = uuidv4()
    const timestamp = new Date().toISOString()

    await ddbClient.send(
      new PutItemCommand({
        TableName: EMBEDS_TABLE,
        Item: marshall({
          userId,
          embedId,
          platform,
          url,
          html,
          ...embedData,
          createdAt: timestamp,
          updatedAt: timestamp
        })
      })
    )

    return NextResponse.json({ 
      success: true, 
      embedId,
      embed: {
        userId,
        embedId,
        platform,
        url,
        html,
        ...embedData,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    })
  } catch (error) {
    console.error("Error creating embed:", error)
    return NextResponse.json(
      { error: "Failed to create embed" },
      { status: 500 }
    )
  }
} 