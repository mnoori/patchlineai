/**
 * AWS Configuration for DynamoDB tables
 *
 * This file defines the table names used throughout the application,
 * with environment variable fallbacks in the following order:
 * 1. AWS_REGION environment variable
 * 2. Public environment variables (NEXT_PUBLIC_*)
 * 3. Hardcoded default values with staging suffix
 */

import { CONFIG, IS_DEVELOPMENT_MODE, PATCHLINE_CONFIG, getEnvWithFallback } from "./config"

/**
 * DynamoDB AWS Credential Configuration Pattern
 *
 * IMPORTANT: For AWS SDK v3 in Amplify SSR environments, always explicitly provide credentials:
 *
 * const client = new DynamoDBClient({
 *   region: process.env.AWS_REGION || "us-east-1",
 *   credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *     ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
 *   } : undefined
 * });
 *
 * Relying on the default credential provider chain often fails in Amplify SSR environments.
 */

// AWS Region configuration
// Allow REGION_AWS (used in Amplify where variables cannot start with AWS_) as an alternative.
const resolvedRegion = CONFIG.AWS_REGION

// If only REGION_AWS is provided, propagate it so other libraries that expect AWS_REGION still work.
if (!process.env.AWS_REGION && process.env.REGION_AWS) {
  process.env.AWS_REGION = process.env.REGION_AWS
}

export const AWS_REGION = resolvedRegion

// DynamoDB table names with proper environment variable fallbacks
export const USERS_TABLE = CONFIG.USERS_TABLE
export const EMBEDS_TABLE = CONFIG.EMBEDS_TABLE
export const BLOG_POSTS_TABLE = CONFIG.BLOG_POSTS_TABLE
export const CONTENT_DRAFTS_TABLE = CONFIG.CONTENT_DRAFTS_TABLE

// Log table names on initialization
console.log(`[AWS Config] Using AWS Region: ${AWS_REGION}${IS_DEVELOPMENT_MODE ? " (DEVELOPMENT MODE)" : ""}`)
console.log("[AWS Config] Using Table Names:", {
  USERS_TABLE,
  EMBEDS_TABLE,
  BLOG_POSTS_TABLE,
  CONTENT_DRAFTS_TABLE,
})

/**
 * AWS configuration with development mode support
 */
export const AWS_CONFIG = {
  region: AWS_REGION,
  credentials: PATCHLINE_CONFIG.DEVELOPMENT_MODE
    ? {
        accessKeyId: "MOCK_ACCESS_KEY_ID",
        secretAccessKey: "MOCK_SECRET_ACCESS_KEY",
      }
    : undefined, // In production, use the credentials from the environment

  // DynamoDB
  dynamoDb: {
    tableName: getEnvWithFallback("DYNAMODB_TABLE"),
  },

  // Bedrock
  bedrock: {
    enabled: getEnvWithFallback("BEDROCK_ENABLED") === "true",
    modelId: getEnvWithFallback("BEDROCK_MODEL_ID") || "anthropic.claude-3-sonnet-20240229-v1:0",
  },

  // Cognito
  cognito: {
    userPoolId: getEnvWithFallback("COGNITO_USER_POOL_ID"),
    clientId: getEnvWithFallback("COGNITO_CLIENT_ID"),
  },
}
