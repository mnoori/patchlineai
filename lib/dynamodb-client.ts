import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { CONFIG, shouldUseMockData, getCredentialProvider } from "./config"

export function createDynamoDBClient() {
  // Prevent AWS SDK initialization in development mode
  if (shouldUseMockData()) {
    throw new Error("DynamoDB client disabled in development mode - use mock data instead")
  }

  // Prevent any client-side AWS SDK initialization
  if (typeof window !== "undefined") {
    throw new Error("DynamoDB client cannot be used in browser environment")
  }

  const REGION = CONFIG.AWS_REGION
  const credentials = getCredentialProvider()

  if (!credentials) {
    throw new Error("No AWS credentials available")
  }

  console.log(`[DynamoDB] Initializing client with region: ${REGION}`)

  const client = new DynamoDBClient({
    region: REGION,
    credentials,
  })

  return client
}

export function createDynamoDBDocumentClient() {
  const ddbClient = createDynamoDBClient()
  return DynamoDBDocumentClient.from(ddbClient)
}

// Safe client instances that check environment - only create on server side
export const dynamoDBClient = typeof window === "undefined" && !shouldUseMockData() ? createDynamoDBClient() : null
export const documentClient =
  typeof window === "undefined" && !shouldUseMockData() ? createDynamoDBDocumentClient() : null
