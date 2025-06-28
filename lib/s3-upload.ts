/**
 * S3 Upload Utility - Single source of truth for all S3 uploads
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { CONFIG } from "@/lib/config"
import { S3_BUCKETS, S3_PATHS, S3_SETTINGS, getS3Path } from "@/lib/aws/s3-config"

export interface S3UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  usePresignedUrl?: boolean
  expiresIn?: number
  isPublic?: boolean
}

export interface S3UploadResult {
  url: string
  key: string
  bucket: string
  etag?: string
  versionId?: string
}

export class S3ImageUploader {
  private s3Client: S3Client
  private bucketName: string
  
  constructor(bucketName?: string) {
    // Use centralized configuration
    const region = S3_BUCKETS.DEFAULT_REGION
    
    this.s3Client = new S3Client({
      region: region,
      credentials: CONFIG.AWS_ACCESS_KEY_ID ? {
        accessKeyId: CONFIG.AWS_ACCESS_KEY_ID!,
        secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY!,
      } : undefined,
    })
    
    // Use provided bucket or default from config
    this.bucketName = bucketName || S3_BUCKETS.CONTENT_IMAGES
    
    console.log(`S3 configured for region: ${region}, bucket: ${this.bucketName}`)
  }

  /**
   * Upload base64 image to S3
   */
  async uploadBase64Image(
    base64Data: string,
    contentType: string,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      // Remove data URL prefix if present
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Clean, 'base64')
      
      // Generate unique key using centralized paths
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 9)
      const extension = this.getExtensionFromContentType(contentType)
      const key = getS3Path(
        'CONTENT_IMAGES',
        S3_PATHS.GENERATED_CONTENT,
        contentType,
        `${timestamp}-${randomId}.${extension}`
      )
      
      // Build metadata
      const metadata = {
        ...options.metadata,
        generatedAt: new Date().toISOString(),
        generator: 'nova-canvas',
        contentType: contentType
      }
      
      if (options.usePresignedUrl) {
        // Generate presigned URL for upload
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: this.getMimeType(extension),
          Metadata: metadata
        })
        
        const presignedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: options.expiresIn || S3_SETTINGS.SIGNED_URL_EXPIRY
        })
        
        return {
          url: presignedUrl,
          key,
          bucket: this.bucketName
        }
      } else {
        // Direct upload
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: this.getMimeType(extension),
          Metadata: metadata
          // NO ACL - bucket handles permissions via bucket policy
        })
        
        const response = await this.s3Client.send(command)
        
        return {
          url: this.getObjectUrl(key, options.isPublic),
          key,
          bucket: this.bucketName,
          etag: response.ETag,
          versionId: response.VersionId
        }
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload image to S3')
    }
  }

  /**
   * Upload file buffer to S3
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata
        // NO ACL - bucket handles permissions
      })
      
      if (options.usePresignedUrl) {
        const presignedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: options.expiresIn || S3_SETTINGS.SIGNED_URL_EXPIRY
        })
        
        return {
          url: presignedUrl,
          key,
          bucket: this.bucketName
        }
      } else {
        const response = await this.s3Client.send(command)
        
        return {
          url: this.getObjectUrl(key, options.isPublic),
          key,
          bucket: this.bucketName,
          etag: response.ETag,
          versionId: response.VersionId
        }
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload to S3')
    }
  }

  /**
   * Upload multiple images in parallel
   */
  async uploadMultipleImages(
    images: string[],
    contentType: string,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult[]> {
    const uploadPromises = images.map((image, index) => 
      this.uploadBase64Image(image, contentType, {
        ...options,
        metadata: {
          ...options.metadata,
          imageIndex: index.toString()
        }
      })
    )
    
    return Promise.all(uploadPromises)
  }

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType: string): string {
    const extensionMap: Record<string, string> = {
      'blog': 'jpg',
      'epk': 'jpg',
      'social': 'jpg',
      'short-video': 'jpg',
      'music-video': 'jpg'
    }
    
    return extensionMap[contentType] || 'jpg'
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(extension: string): string {
    const mimeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    }
    
    return mimeMap[extension] || 'image/jpeg'
  }

  /**
   * Get object URL (public or signed)
   */
  private getObjectUrl(key: string, isPublic?: boolean): string {
    // Use CloudFront if configured, otherwise direct S3 URL
    const cdnUrl = process.env.CLOUDFRONT_URL
    
    if (cdnUrl) {
      return `${cdnUrl}/${key}`
    }
    
    // Direct S3 URL
    if (isPublic) {
      return `https://${this.bucketName}.s3.${S3_BUCKETS.DEFAULT_REGION}.amazonaws.com/${key}`
    } else {
      // For private objects, you'd generate a signed URL here
      // For now, return the key so the caller can generate a signed URL if needed
      return key
    }
  }

  /**
   * Delete image from S3
   */
  async deleteImage(url: string): Promise<void> {
    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(url)
      
      if (!key) {
        throw new Error('Invalid image URL')
      }
      
      // Delete from S3
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      })
      
      await this.s3Client.send(command)
    } catch (error) {
      console.error('S3 delete error:', error)
      throw new Error('Failed to delete image from S3')
    }
  }

  /**
   * Extract S3 key from URL
   */
  private extractKeyFromUrl(url: string): string | null {
    // Handle CloudFront URLs
    const cdnUrl = process.env.CLOUDFRONT_URL
    if (cdnUrl && url.startsWith(cdnUrl)) {
      return url.replace(`${cdnUrl}/`, '')
    }
    
    // Handle direct S3 URLs
    const s3Pattern = new RegExp(`https://${this.bucketName}.s3.[^/]+.amazonaws.com/(.+)`)
    const match = url.match(s3Pattern)
    
    return match ? match[1] : null
  }
}

// Singleton instance
let s3Uploader: S3ImageUploader | null = null

export function getS3Uploader(): S3ImageUploader {
  if (!s3Uploader) {
    s3Uploader = new S3ImageUploader()
  }
  return s3Uploader
} 