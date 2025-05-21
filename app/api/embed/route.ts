import { NextResponse } from "next/server"
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { EMBEDS_TABLE } from "@/lib/aws-config"
import { createExpressionAttributeNames, isReservedKeyword } from "@/lib/dynamodb-utils"

const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1"
const ddbClient = new DynamoDBClient({ 
  region: REGION,
  // Explicit credentials configuration for AWS SDK v3
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
  } : undefined
})

// GET /api/embed?userId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  console.log(`[API /embed GET] Received request for userId: ${userId}, using table: ${EMBEDS_TABLE}`)

  if (!userId) {
    console.log("[API /embed GET] Missing userId parameter")
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    console.log(`[API /embed GET] Querying embeds from table: ${EMBEDS_TABLE} for userId: ${userId}`)
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
      console.log(`[API /embed GET] No embeds found for userId: ${userId}`)
      return NextResponse.json({ embeds: [] })
    }

    const embeds = result.Items.map(item => unmarshall(item))
    console.log(`[API /embed GET] Found ${embeds.length} embeds for userId: ${userId}`)
    return NextResponse.json({ embeds })
  } catch (error: any) {
    console.error(`[API /embed GET] Error fetching embeds for userId: ${userId}:`, error)
    console.error(`[API /embed GET] Error details: ${error.message}`)
    console.error(`[API /embed GET] Error type: ${error.__type}`)
    console.error(`[API /embed GET] Table being accessed: ${EMBEDS_TABLE}`)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch embeds",
        details: error.message,
        errorType: error.__type,
        tableAccessed: EMBEDS_TABLE
      },
      { status: 500 }
    )
  }
}

// POST /api/embed
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, platform, url, html, ...embedData } = body

    console.log(`[API /embed POST] Received request for userId: ${userId}, using table: ${EMBEDS_TABLE}`)
    console.log(`[API /embed POST] Platform: ${platform}, URL: ${url}`)

    if (!userId) {
      console.log("[API /embed POST] Missing userId parameter")
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    if (!platform || !url) {
      console.log("[API /embed POST] Missing required fields:", { platform, url })
      return NextResponse.json({ error: "Missing required fields: platform, url" }, { status: 400 })
    }

    // Check if this URL is already added for this user
    // IMPORTANT: 'url' is a reserved keyword in DynamoDB, use expression attributes
    console.log(`[API /embed POST] Checking for duplicates in table: ${EMBEDS_TABLE} for URL: ${url}`)
    try {
      const existingEmbedsResult = await ddbClient.send(
        new QueryCommand({
          TableName: EMBEDS_TABLE,
          KeyConditionExpression: "userId = :userId",
          FilterExpression: "#u = :uval",
          ExpressionAttributeNames: {
            "#u": "url"
          },
          ExpressionAttributeValues: {
            ":userId": { S: userId },
            ":uval": { S: url }
          }
        })
      );

      // If we already have this URL, return the existing embed instead of creating a duplicate
      if (existingEmbedsResult.Items && existingEmbedsResult.Items.length > 0) {
        const existingEmbed = unmarshall(existingEmbedsResult.Items[0]);
        console.log(`[API /embed POST] Embed with URL already exists: ${url}, embedId: ${existingEmbed.embedId}`)
        return NextResponse.json({ 
          success: true, 
          embedId: existingEmbed.embedId,
          embed: existingEmbed,
          alreadyExists: true
        });
      }
    } catch (duplicateCheckError: any) {
      // Log but continue - we'll try to create the embed anyway
      console.error(`[API /embed POST] Error checking for duplicate embed:`, duplicateCheckError)
      console.error(`[API /embed POST] Error details: ${duplicateCheckError.message}`)
      console.error(`[API /embed POST] Error type: ${duplicateCheckError.__type}`)
    }

    const embedId = uuidv4()
    const timestamp = new Date().toISOString()
    const newEmbed = {
      userId,
      embedId,
      platform,
      url,
      html,
      ...embedData,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    console.log(`[API /embed POST] Creating new embed with ID: ${embedId}`)
    await ddbClient.send(
      new PutItemCommand({
        TableName: EMBEDS_TABLE,
        Item: marshall(newEmbed)
      })
    )

    console.log(`[API /embed POST] Successfully created embed: ${embedId}`)
    return NextResponse.json({ 
      success: true, 
      embedId,
      embed: newEmbed
    })
  } catch (error: any) {
    console.error(`[API /embed POST] Error creating embed:`, error)
    console.error(`[API /embed POST] Error details: ${error.message}`)
    console.error(`[API /embed POST] Error type: ${error.__type}`)
    console.error(`[API /embed POST] Table being accessed: ${EMBEDS_TABLE}`)
    
    return NextResponse.json(
      { 
        error: "Failed to create embed",
        details: error.message,
        errorType: error.__type,
        tableAccessed: EMBEDS_TABLE
      },
      { status: 500 }
    )
  }
} 