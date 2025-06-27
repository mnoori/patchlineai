// Shared DynamoDB client - initialized ONCE and reused everywhere
// This eliminates the 30-50 second initialization delays

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let ddbClient: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;
let initializationPromise: Promise<void> | null = null;

// Get configuration
const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

// Initialize the client only once
async function initializeClients() {
  if (ddbClient && docClient) return;
  
  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  initializationPromise = (async () => {
    try {
      console.log("[AWS] Initializing DynamoDB client...");
      const startTime = Date.now();
      
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
        maxAttempts: 3
      });

      docClient = DynamoDBDocumentClient.from(ddbClient, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      });

      console.log(`[AWS] DynamoDB client initialized in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error("[AWS] Failed to initialize DynamoDB client:", error);
      ddbClient = null;
      docClient = null;
      throw error;
    }
  })();

  await initializationPromise;
}

// Export functions to get the clients
export async function getDynamoDBClient(): Promise<DynamoDBClient | null> {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.warn("[AWS] Missing AWS credentials");
    return null;
  }
  
  await initializeClients();
  return ddbClient;
}

export async function getDocumentClient(): Promise<DynamoDBDocumentClient | null> {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.warn("[AWS] Missing AWS credentials");
    return null;
  }
  
  await initializeClients();
  return docClient;
}

// Check if AWS is available
export function isAwsAvailable(): boolean {
  return !!(ACCESS_KEY && SECRET_KEY);
}

// Pre-warm the connection if AWS is available
if (typeof window === "undefined" && isAwsAvailable()) {
  initializeClients().catch(console.error);
} 