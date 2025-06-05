import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Initialize clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

// Table and bucket names
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || "Documents-staging"
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params

    const command = new GetCommand({
      TableName: DOCUMENTS_TABLE,
      Key: {
        documentId: documentId,
      },
    })

    const result = await docClient.send(command)
    
    if (!result.Item) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document: result.Item })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params

    // Check if document exists first
    const getCommand = new GetCommand({
      TableName: DOCUMENTS_TABLE,
      Key: {
        documentId: documentId,
      },
    })

    const document = await docClient.send(getCommand)
    
    if (!document.Item) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from S3 if s3Key exists
    if (document.Item.s3Key) {
      try {
        const deleteS3Command = new DeleteObjectCommand({
          Bucket: DOCUMENTS_BUCKET,
          Key: document.Item.s3Key,
        })
        await s3Client.send(deleteS3Command)
        console.log(`Deleted S3 object: ${document.Item.s3Key}`)
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error)
        // Continue with DynamoDB deletion even if S3 fails
      }
    }

    // Delete document from DynamoDB
    const deleteCommand = new DeleteCommand({
      TableName: DOCUMENTS_TABLE,
      Key: {
        documentId: documentId,
      },
    })

    await docClient.send(deleteCommand)

    return NextResponse.json({ 
      success: true, 
      message: "Document deleted successfully",
      documentId,
      s3Deleted: !!document.Item.s3Key
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
} 