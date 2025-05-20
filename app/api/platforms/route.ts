import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { USERS_TABLE } from "@/lib/aws-config";

// Initialize the DynamoDB client with more detailed configuration and logging
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  // Don't explicitly set credentials here, rely on the AWS environment
  // The AWS Lambda environment in Amplify will provide these automatically
});

console.log("[API /platforms] DynamoDB client initialized with region:", process.env.AWS_REGION || "us-east-1");
console.log("[API /platforms] Using table:", USERS_TABLE);

const ddb = DynamoDBDocumentClient.from(client);

// Supported platforms
const SUPPORTED_PLATFORMS = ["soundcloud", "spotify", "applemusic", "distrokid", "instagram"];

// Define platform status interface
interface PlatformStatus {
  [key: string]: boolean;
}

// Initialize default platforms map
const getDefaultPlatforms = (): PlatformStatus => {
  const platforms: PlatformStatus = {};
  SUPPORTED_PLATFORMS.forEach(platform => {
    platforms[platform] = platform === "soundcloud"; // True for SoundCloud, false for others
  });
  return platforms;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  
  console.log(`[API /platforms GET] Received request for userId: ${userId}, using table: ${USERS_TABLE}`);
  
  if (!userId) {
    console.log("[API /platforms GET] Missing userId parameter");
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    console.log(`[API /platforms GET] Attempting to get user from table: ${USERS_TABLE} for userId: ${userId}`);
    // Type assertion for DynamoDB interaction
    // @ts-ignore - Ignoring type mismatch for DynamoDB commands
    const result = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      })
    );
    
    // If user exists, use their platforms or default, otherwise use defaults
    let platforms: PlatformStatus = result.Item?.platforms as PlatformStatus || undefined;
    
    if (!platforms) {
      console.log(`[API /platforms GET] No platforms found for userId: ${userId}, creating default platforms`);
      // Create the user with default platforms (SoundCloud connected)
      platforms = getDefaultPlatforms();
      
      try {
        console.log(`[API /platforms GET] Saving user with default platforms to table: ${USERS_TABLE}`);
        // @ts-ignore - Ignoring type mismatch for DynamoDB commands
        await ddb.send(
          new PutCommand({
            TableName: USERS_TABLE,
            Item: {
              userId,
              platforms,
              // Add other required user fields
              fullName: "Mehdi Noori",
              email: "mehdi.noori7@gmail.com",
              updatedAt: new Date().toISOString()
            }
          })
        );
        console.log(`[API /platforms GET] Successfully created user with default platforms for userId: ${userId}`);
      } catch (e: any) {
        console.error(`[API /platforms GET] Error creating new user:`, e);
        console.error(`[API /platforms GET] Error details: ${e.message}`);
        console.error(`[API /platforms GET] Error type: ${e.__type}`);
      }
    } else {
      console.log(`[API /platforms GET] Found existing platforms for userId: ${userId}`, platforms);
      // Ensure all supported platforms have values
      SUPPORTED_PLATFORMS.forEach(p => { 
        if (!(p in platforms)) {
          console.log(`[API /platforms GET] Adding missing platform ${p} with default value`);
          platforms[p] = p === "soundcloud"; // Default SoundCloud to true
        }
      });
    }
    
    console.log(`[API /platforms GET] Returning platforms for userId: ${userId}`, platforms);
    return NextResponse.json({ userId, platforms });
  } catch (e: any) {
    console.error(`[API /platforms GET] Error fetching platforms for userId: ${userId}:`, e);
    console.error(`[API /platforms GET] Error details: ${e.message}`);
    console.error(`[API /platforms GET] Error type: ${e.__type}`);
    console.error(`[API /platforms GET] Table being accessed: ${USERS_TABLE}`);
    
    return NextResponse.json({ 
      error: "Failed to fetch platform connections", 
      details: e.message,
      errorType: e.__type,
      tableAccessed: USERS_TABLE
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, platform, connected } = await req.json();
  
  console.log(`[API /platforms POST] Received request for userId: ${userId}, platform: ${platform}, connected: ${connected}`);
  console.log(`[API /platforms POST] Using table: ${USERS_TABLE}`);
  
  if (!userId || !platform || typeof connected !== "boolean") {
    console.log("[API /platforms POST] Missing or invalid parameters", { userId, platform, connected });
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    console.log(`[API /platforms POST] Unsupported platform: ${platform}`);
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }
  
  try {
    // First check if user exists
    console.log(`[API /platforms POST] Checking if user exists in table: ${USERS_TABLE} for userId: ${userId}`);
    // @ts-ignore - Ignoring type mismatch for DynamoDB commands
    const getResult = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      })
    );
    
    if (!getResult.Item) {
      console.log(`[API /platforms POST] User not found for userId: ${userId}, creating new user with default platforms`);
      // Create user with platforms if not exists
      const platforms: PlatformStatus = getDefaultPlatforms(); 
      platforms[platform] = connected; // Override the specific platform
      
      console.log(`[API /platforms POST] Creating new user with platforms:`, platforms);
      // @ts-ignore - Ignoring type mismatch for DynamoDB commands
      await ddb.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: {
            userId,
            platforms,
            // Add other required user fields
            fullName: "Mehdi Noori",
            email: "mehdi.noori7@gmail.com",
            updatedAt: new Date().toISOString()
          }
        })
      );
      console.log(`[API /platforms POST] Successfully created new user for userId: ${userId}`);
    } else {
      // Update existing user's platform connection
      console.log(`[API /platforms POST] Updating existing user's platform connection: ${platform} = ${connected}`);
      
      // @ts-ignore - Ignoring type mismatch for DynamoDB commands
      await ddb.send(
        new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { userId },
          UpdateExpression: `SET platforms.#platform = :connected`,
          ExpressionAttributeNames: { "#platform": platform },
          ExpressionAttributeValues: { ":connected": connected },
        })
      );
      console.log(`[API /platforms POST] Successfully updated platform connection for userId: ${userId}`);
    }
    
    console.log(`[API /platforms POST] Completed successfully for userId: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`[API /platforms POST] Error updating platform for userId: ${userId}:`, e);
    console.error(`[API /platforms POST] Error details: ${e.message}`);
    console.error(`[API /platforms POST] Error type: ${e.__type}`);
    console.error(`[API /platforms POST] Table being accessed: ${USERS_TABLE}`);
    
    return NextResponse.json({ 
      error: "Failed to update platform connection", 
      details: e.message,
      errorType: e.__type,
      tableAccessed: USERS_TABLE
    }, { status: 500 });
  }
} 