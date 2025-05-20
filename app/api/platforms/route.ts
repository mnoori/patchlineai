import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { USERS_TABLE } from "@/lib/aws-config";

// Initialize the DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
});

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
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
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
      // Create the user with default platforms (SoundCloud connected)
      platforms = getDefaultPlatforms();
      
      try {
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
      } catch (e: any) {
        console.error("Error creating new user:", e);
      }
    } else {
      // Ensure all supported platforms have values
      SUPPORTED_PLATFORMS.forEach(p => { 
        if (!(p in platforms)) {
          platforms[p] = p === "soundcloud"; // Default SoundCloud to true
        }
      });
    }
    
    return NextResponse.json({ userId, platforms });
  } catch (e: any) {
    console.error("Error fetching platforms:", e);
    return NextResponse.json({ error: "Failed to fetch platform connections", details: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, platform, connected } = await req.json();
  if (!userId || !platform || typeof connected !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }
  
  try {
    // First check if user exists
    // @ts-ignore - Ignoring type mismatch for DynamoDB commands
    const getResult = await ddb.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      })
    );
    
    if (!getResult.Item) {
      // Create user with platforms if not exists
      const platforms: PlatformStatus = getDefaultPlatforms(); 
      platforms[platform] = connected; // Override the specific platform
      
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
    } else {
      // Update existing user's platform connection
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
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error updating platform:", e);
    return NextResponse.json({ error: "Failed to update platform connection", details: e.message }, { status: 500 });
  }
} 