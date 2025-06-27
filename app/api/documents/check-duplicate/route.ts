import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(client)

const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || "Documents-staging"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileHash = searchParams.get("fileHash")
    const filename = searchParams.get("filename")

    if (!fileHash && !filename) {
      return NextResponse.json(
        { error: "Either fileHash or filename is required" },
        { status: 400 }
      )
    }

    // Check for duplicates using fileHash (preferred) or filename as fallback
    let filterExpression = ""
    let expressionAttributeValues: any = {}

    if (fileHash) {
      filterExpression = "fileHash = :fileHash"
      expressionAttributeValues[":fileHash"] = fileHash
    } else if (filename) {
      filterExpression = "filename = :filename"
      expressionAttributeValues[":filename"] = filename
    }

    const command = new ScanCommand({
      TableName: DOCUMENTS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: 1 // We only need to know if at least one exists
    })

    const result = await docClient.send(command)
    const isDuplicate = (result.Items?.length || 0) > 0

    return NextResponse.json({ 
      isDuplicate,
      existingCount: result.Items?.length || 0,
      checkMethod: fileHash ? 'fileHash' : 'filename'
    })

  } catch (error) {
    console.error("Error checking for duplicate:", error)
    return NextResponse.json(
      { error: "Failed to check for duplicate" },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
