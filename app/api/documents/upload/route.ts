import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { logger, logDocumentUpload } from "@/lib/logger"
import { v4 as uuidv4 } from "uuid"

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const BUCKET_NAME = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function POST(request: NextRequest) {
  const requestLog = logger.apiRequest('POST', '/documents/upload')
  
  try {
    const body = await request.json()
    const { filename, userId, contentType, folderPath, documentType } = body

    logger.info('DOCUMENT_UPLOAD', 'START', `Starting upload URL generation`, {
      requestId: requestLog.requestId,
      userId,
      data: { filename, contentType, folderPath, documentType }
    })

    // Validation
    if (!filename) {
      logger.warn('DOCUMENT_UPLOAD', 'VALIDATION', 'Missing filename', {
        requestId: requestLog.requestId,
        data: { filename, userId }
      })
      
      requestLog.error('Missing filename', 400)
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      )
    }

    // Generate document ID and S3 key
    const documentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const year = new Date().getFullYear()
    const s3Key = folderPath 
      ? `documents/${userId}/${folderPath}/${documentId}-${filename}`
      : `documents/${userId}/${year}/${documentId}-${filename}`

    logger.info('DOCUMENT_UPLOAD', 'S3_KEY_GENERATED', `Generated S3 key`, {
      requestId: requestLog.requestId,
      data: { 
        documentId, 
        s3Key, 
        bucket: BUCKET_NAME,
        contentType: contentType || getContentType(filename)
      }
    })

    // Create pre-signed URL for upload
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType || getContentType(filename),
      Metadata: {
        documentId,
        userId,
        documentType: documentType || 'unknown',
        uploadedAt: new Date().toISOString(),
        originalFilename: filename
      }
    })

    const uploadTimer = logger.startTimer('S3', 'GENERATE_PRESIGNED_URL', requestLog.requestId)
    const uploadUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 3600 }) // 1 hour
    uploadTimer()

    logger.info('DOCUMENT_UPLOAD', 'PRESIGNED_URL_CREATED', `Pre-signed URL generated successfully`, {
      requestId: requestLog.requestId,
      data: { 
        documentId,
        s3Key,
        expiresIn: '1 hour',
        urlLength: uploadUrl.length
      }
    })

    // Log document upload initiation
    const docUploadLog = logDocumentUpload(filename, userId, {
      fileSize: body.fileSize,
      documentType,
      s3Key
    })

    docUploadLog.success({
      documentId,
      s3Key,
      uploadUrl: 'generated',
      message: 'Pre-signed URL created successfully'
    })

    requestLog.success({
      documentId,
      s3Key,
      uploadUrl: 'generated',
      documentType,
      bucket: BUCKET_NAME
    })

    return NextResponse.json({
      uploadUrl,
      s3Key,
      documentId,
      message: "Upload URL generated successfully"
    })

  } catch (error) {
    logger.error('DOCUMENT_UPLOAD', 'ERROR', `Failed to generate upload URL`, {
      requestId: requestLog.requestId,
      error,
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    })

    requestLog.error(error, 500)
    
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