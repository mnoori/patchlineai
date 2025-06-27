import { NextResponse } from "next/server";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { AWS_REGION, USERS_TABLE, EMBEDS_TABLE, BLOG_POSTS_TABLE, CONTENT_DRAFTS_TABLE } from "@/lib/aws-config";

/**
 * Health check endpoint that provides diagnostic information
 * about the AWS environment and DynamoDB connectivity.
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log("[API /health] Health check initiated");
    
    // Collect environment information
    const environmentInfo = {
      region: AWS_REGION,
      nodeEnv: process.env.NODE_ENV,
      awsRegion: process.env.AWS_REGION,
      hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
      isAmplifyEnv: !!process.env.AWS_EXECUTION_ENV?.includes('AWS_Lambda'),
      amplifyAppId: process.env.AWS_APP_ID,
      amplifyBranchName: process.env.AWS_BRANCH,
      tableNames: {
        USERS_TABLE,
        EMBEDS_TABLE,
        BLOG_POSTS_TABLE,
        CONTENT_DRAFTS_TABLE
      },
      allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('AWS_')),
      time: new Date().toISOString()
    };
    
    // Try to connect to DynamoDB
    let dynamoDbStatus = "unknown";
    let dynamoDbTables: string[] = [];
    let dynamoDbError: Record<string, string> | null = null;
    
    try {
      console.log("[API /health] Testing DynamoDB connection");
      const ddbClient = new DynamoDBClient({ region: AWS_REGION });
      
      // Try to list tables as a connectivity test
      const listResult = await ddbClient.send(new ListTablesCommand({}));
      dynamoDbStatus = "connected";
      dynamoDbTables = listResult.TableNames || [];
      console.log(`[API /health] Successfully connected to DynamoDB. Found ${dynamoDbTables.length} tables`);
    } catch (error: any) {
      dynamoDbStatus = "error";
      dynamoDbError = {
        message: error.message || "Unknown error",
        name: error.name || "Error",
        stack: error.stack || "",
      };
      console.error("[API /health] DynamoDB connection error:", error);
    }
    
    // Calculate total duration
    const duration = Date.now() - startTime;
    
    // Prepare response
    const response = {
      status: "ok",
      message: "Health check completed",
      environment: environmentInfo,
      dynamodb: {
        status: dynamoDbStatus,
        tables: dynamoDbTables,
        error: dynamoDbError,
      },
      duration: `${duration}ms`,
    };
    
    console.log(`[API /health] Health check completed in ${duration}ms`);
    return NextResponse.json(response);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[API /health] Error during health check:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Health check failed",
      error: {
        message: error.message || "Unknown error",
        stack: error.stack || "",
      },
      duration: `${duration}ms`,
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'
