import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { logger } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const BUCKET_NAME = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bankType = formData.get('bankType') as string
    const userId = formData.get('userId') as string
    const description = formData.get('description') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bankType) {
      return NextResponse.json({ error: 'No bank type provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Create S3 key with bank type folder
    const s3Key = `documents/${userId}/${bankType}/${documentId}/${file.name}`

    logger.info(`Starting upload URL generation for file: ${file.name}`)

    // Validation
    if (!file.name) {
      logger.warn('Missing filename in upload request')
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      )
    }

    // Create pre-signed URL for upload
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: file.type || getContentType(file.name),
      Metadata: {
        documentId,
        userId,
        bankType,
        uploadedAt: new Date().toISOString(),
        originalFilename: file.name,
        description
      }
    })

    const uploadUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 3600 }) // 1 hour

    logger.info(`Pre-signed URL generated successfully for document: ${documentId}`)

    // Log document upload initiation
    logger.logDocumentUpload(documentId, file.name, {
      fileSize: buffer.length,
      bankType,
      s3Key
    })

    return NextResponse.json({
      uploadUrl,
      s3Key,
      documentId,
      message: "Upload URL generated successfully"
    })

  } catch (error) {
    logger.error('Failed to generate upload URL', error)
    
    return NextResponse.json(
      { 
        error: "Failed to generate upload URL", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Helper function to detect content type
function getContentType(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'doc':
      return 'application/msword'
    case 'txt':
      return 'text/plain'
    default:
      return 'application/octet-stream'
  }
} 