import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { BlogPost, ContentDraft, ContentPrompt } from "./blog-types";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1"
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names
export const BLOG_POSTS_TABLE = process.env.BLOG_POSTS_TABLE || "BlogPosts-staging";
export const CONTENT_DRAFTS_TABLE = process.env.CONTENT_DRAFTS_TABLE || "ContentDrafts-staging";

// Blog post functions
export async function createBlogPost(post: Omit<BlogPost, "id">): Promise<BlogPost> {
  const id = uuidv4();
  const newPost: BlogPost = {
    ...post,
    id,
    publishedDate: post.publishedDate || new Date().toISOString(),
    lastUpdatedDate: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: BLOG_POSTS_TABLE,
      Item: newPost,
    })
  );

  return newPost;
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: BLOG_POSTS_TABLE,
      Key: { id },
    })
  );

  return (result.Item as BlogPost) || null;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: BLOG_POSTS_TABLE,
      FilterExpression: "#slugAttr = :slug",
      ExpressionAttributeNames: {
        "#slugAttr": "slug",
      },
      ExpressionAttributeValues: {
        ":slug": slug,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] as BlogPost || null;
}

export async function listBlogPosts(limit = 10): Promise<BlogPost[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: BLOG_POSTS_TABLE,
      FilterExpression: "#blogStatus = :status",
      ExpressionAttributeNames: {
        "#blogStatus": "status"
      },
      ExpressionAttributeValues: {
        ":status": "published",
      },
      Limit: limit,
    })
  );

  return (result.Items || []) as BlogPost[];
}

// Content draft functions
export async function createContentDraft(prompt: ContentPrompt): Promise<ContentDraft> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const draft: ContentDraft = {
    id,
    prompt,
    content: "",
    createdAt: now,
    updatedAt: now,
    status: "generating",
  };

  await docClient.send(
    new PutCommand({
      TableName: CONTENT_DRAFTS_TABLE,
      Item: draft,
    })
  );

  return draft;
}

export async function updateContentDraft(draft: ContentDraft): Promise<ContentDraft> {
  const updatedDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: CONTENT_DRAFTS_TABLE,
      Item: updatedDraft,
    })
  );

  return updatedDraft;
}

export async function getContentDraft(id: string): Promise<ContentDraft | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONTENT_DRAFTS_TABLE,
      Key: { id },
    })
  );

  return (result.Item as ContentDraft) || null;
}

export async function listContentDrafts(limit = 10): Promise<ContentDraft[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: CONTENT_DRAFTS_TABLE,
      Limit: limit,
    })
  );

  return (result.Items || []) as ContentDraft[];
} 