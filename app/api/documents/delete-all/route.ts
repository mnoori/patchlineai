import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || "Documents-staging"
const S3_BUCKET = process.env.S3_BUCKET || "patchline-documents-dev"

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "default-user"

    console.log(`Deleting all documents for user: ${userId}`)

    // Scan all documents for the user (using scan instead of query to avoid index dependency)
    const scanCommand = new ScanCommand({
      TableName: DOCUMENTS_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    })

    const result = await docClient.send(scanCommand)
    const documents = result.Items || []

    console.log(`Found ${documents.length} documents to delete for user ${userId}`)

    let deletedCount = 0
    let s3DeletedCount = 0
    const errors: string[] = []

    // Delete each document
    for (const doc of documents) {
      try {
        // Delete from S3 if s3Key exists
        if (doc.s3Key) {
          try {
            const deleteS3Command = new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: doc.s3Key
            })
            await s3Client.send(deleteS3Command)
            s3DeletedCount++
            console.log(`Deleted from S3: ${doc.s3Key}`)
          } catch (s3Error) {
            console.error(`Failed to delete from S3: ${doc.s3Key}`, s3Error)
            errors.push(`S3 deletion failed for ${doc.filename}`)
          }
        }

        // Delete from DynamoDB using documentId as the key
        const deleteCommand = new DeleteCommand({
          TableName: DOCUMENTS_TABLE,
          Key: {
            documentId: doc.documentId
          }
        })
        await docClient.send(deleteCommand)
        deletedCount++
        console.log(`Deleted from DynamoDB: ${doc.documentId}`)

      } catch (error) {
        console.error(`Failed to delete document ${doc.documentId}:`, error)
        errors.push(`Failed to delete ${doc.filename}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} documents from database and ${s3DeletedCount} files from S3`,
      totalDocuments: documents.length,
      deletedCount,
      s3DeletedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Error in bulk delete:", error)
    return NextResponse.json(
      { error: "Failed to delete documents", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 