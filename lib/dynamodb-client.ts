import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Creates a properly configured DynamoDB client that works in both:
 * - Local development environments
 * - Amplify SSR environment
 * 
 * This approach explicitly handles credentials to avoid the common
 * CredentialsProviderError in Amplify SSR environments.
 */
export function createDynamoDBClient() {
  const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1";
  const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
  const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
  const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

  // Log presence of credentials (not values)
  console.log(`[DynamoDB] Initializing client with region: ${REGION}`);
  console.log("[DynamoDB] Credentials check:", {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "set" : "undefined",
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID ? "set" : "undefined",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "set" : "undefined", 
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY ? "set" : "undefined",
    AWS_SESSION_TOKEN: SESSION_TOKEN ? "set" : "undefined"
  });

  // Create client with explicit credentials
  const client = new DynamoDBClient({
    region: REGION,
    credentials: ACCESS_KEY && SECRET_KEY ? {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      ...(SESSION_TOKEN && { sessionToken: SESSION_TOKEN })
    } : undefined
  });

  return client;
}

/**
 * Creates a DynamoDB Document client for higher-level operations
 * that works reliably in all environments.
 */
export function createDynamoDBDocumentClient() {
  const ddbClient = createDynamoDBClient();
  return DynamoDBDocumentClient.from(ddbClient);
}

// Default client instances
export const dynamoDBClient = createDynamoDBClient();
export const documentClient = createDynamoDBDocumentClient(); 