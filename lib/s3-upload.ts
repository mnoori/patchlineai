/**
 * S3 Upload Utility for Nova Canvas Images
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { CONFIG } from "@/lib/config"

export class S3ImageUploader {
  private s3Client: S3Client
  private bucketName: string
  
  constructor() {
    this.s3Client = new S3Client({
      region: CONFIG.AWS_REGION,
      credentials: CONFIG.AWS_ACCESS_KEY_ID ? {
        accessKeyId: CONFIG.AWS_ACCESS_KEY_ID!,
        secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY!,
      } : undefined,
    })
    
    // Use environment variable or default bucket name
    this.bucketName = process.env.S3_IMAGE_BUCKET || 'patchline-content-images'
  }

  /**
   * Upload base64 image to S3
   */
  async uploadBase64Image(
    base64Data: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Clean, 'base64')
      
      // Generate unique key
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 9)
      const extension = this.getExtensionFromContentType(contentType)
      const key = `generated/${contentType}/${timestamp}-${randomId}.${extension}`
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: this.getMimeType(extension),
        Metadata: {
          ...metadata,
          generatedAt: new Date().toISOString(),
          generator: 'nova-canvas'
        },
        // Make images publicly readable
        ACL: 'public-read'
      })
      
      await this.s3Client.send(command)
      
      // Return public URL
      return this.getPublicUrl(key)
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload image to S3')
    }
  }

  /**
   * Upload multiple images in parallel
   */
  async uploadMultipleImages(
    images: string[],
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string[]> {
    const uploadPromises = images.map((image, index) => 
      this.uploadBase64Image(image, contentType, {
        ...metadata,
        imageIndex: index.toString()
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
   * Get public URL for uploaded image
   */
  private getPublicUrl(key: string): string {
    // Use CloudFront if configured, otherwise direct S3 URL
    const cdnUrl = process.env.CLOUDFRONT_URL
    
    if (cdnUrl) {
      return `${cdnUrl}/${key}`
    }
    
    // Direct S3 URL
    return `https://${this.bucketName}.s3.${CONFIG.AWS_REGION}.amazonaws.com/${key}`
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