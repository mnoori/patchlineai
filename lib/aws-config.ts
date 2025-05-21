/**
 * AWS Configuration for DynamoDB tables
 * 
 * This file defines the table names used throughout the application,
 * with environment variable fallbacks in the following order:
 * 1. AWS_REGION environment variable
 * 2. Public environment variables (NEXT_PUBLIC_*)
 * 3. Hardcoded default values with staging suffix
 */

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
const resolvedRegion = process.env.AWS_REGION || process.env.REGION_AWS || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";

// If only REGION_AWS is provided, propagate it so other libraries that expect AWS_REGION still work.
if (!process.env.AWS_REGION && process.env.REGION_AWS) {
  process.env.AWS_REGION = process.env.REGION_AWS;
}

export const AWS_REGION = resolvedRegion

// DynamoDB table names with proper environment variable fallbacks
export const USERS_TABLE = process.env.USERS_TABLE || process.env.NEXT_PUBLIC_USERS_TABLE || "Users-staging"
export const EMBEDS_TABLE = process.env.EMBEDS_TABLE || process.env.NEXT_PUBLIC_EMBEDS_TABLE || "Embeds-staging"
export const BLOG_POSTS_TABLE = process.env.BLOG_POSTS_TABLE || process.env.NEXT_PUBLIC_BLOG_POSTS_TABLE || "BlogPosts-staging"
export const CONTENT_DRAFTS_TABLE = process.env.CONTENT_DRAFTS_TABLE || process.env.NEXT_PUBLIC_CONTENT_DRAFTS_TABLE || "ContentDrafts-staging"

// Log table names on initialization
console.log("[AWS Config] Using AWS Region:", AWS_REGION)
console.log("[AWS Config] Using Table Names:", { 
  USERS_TABLE, 
  EMBEDS_TABLE, 
  BLOG_POSTS_TABLE, 
  CONTENT_DRAFTS_TABLE 
}) 