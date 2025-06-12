/**
 * Nova Canvas Advanced Utilities
 * Provides intelligent image manipulation for album covers and artist photos
 */

import { getNovaCanvasClient } from './nova-canvas-api'
import { getS3Uploader } from './s3-upload'

export interface AlbumCoverOptions {
  artistPhotos: string[] // Base64 or URLs of artist photos
  style?: 'modern' | 'vintage' | 'minimalist' | 'abstract' | 'cinematic'
  mood?: string
  genre?: string
  albumTitle?: string
  colorPalette?: string[]
}

export interface ImageEditOptions {
  operation: 'remove-background' | 'inpaint' | 'outpaint' | 'style-transfer'
  mask?: string // Base64 mask for inpainting
  style?: string // Style reference for transfer
  direction?: 'all' | 'horizontal' | 'vertical' // For outpainting
  prompt?: string // Additional guidance
}

export class NovaCanvasUtils {
  private client: ReturnType<typeof getNovaCanvasClient>
  private s3Uploader: ReturnType<typeof getS3Uploader>
  
  constructor() {
    this.client = getNovaCanvasClient()
    this.s3Uploader = getS3Uploader()
  }

  /**
   * Create an album cover from artist photos intelligently
   */
  async createAlbumCover(options: AlbumCoverOptions): Promise<string[]> {
    const { artistPhotos, style = 'modern', mood, genre, albumTitle } = options
    
    if (!artistPhotos.length) {
      throw new Error('At least one artist photo is required')
    }

    try {
      // Step 1: Process artist photos (remove background if needed)
      const processedPhotos = await Promise.all(
        artistPhotos.map(photo => this.processArtistPhoto(photo))
      )

      // Step 2: Generate album cover variations
      const coverPrompts = this.generateAlbumCoverPrompts({
        style,
        mood,
        genre,
        albumTitle,
        hasArtistPhoto: true
      })

      // Step 3: Create covers using different techniques
      const covers: string[] = []

      // Technique 1: Style transfer from artist photo
      if (processedPhotos[0]) {
        const styledCover = await this.styleTransferAlbumCover(
          processedPhotos[0],
          coverPrompts[0]
        )
        covers.push(styledCover)
      }

      // Technique 2: Outpainting for wider composition
      if (processedPhotos[0]) {
        const expandedCover = await this.outpaintAlbumCover(
          processedPhotos[0],
          coverPrompts[1]
        )
        covers.push(expandedCover)
      }

      // Technique 3: Creative composite
      const compositeCover = await this.createCompositeAlbumCover(
        processedPhotos,
        coverPrompts[2]
      )
      covers.push(compositeCover)

      // Upload to S3 if enabled
      if (process.env.ENABLE_S3_UPLOAD === 'true') {
        const uploadedCovers = await this.s3Uploader.uploadMultipleImages(
          covers,
          'album-cover',
          { genre, style, mood: mood || 'default' }
        )
        return uploadedCovers
      }

      return covers.map(img => `data:image/png;base64,${img}`)
    } catch (error) {
      console.error('Album cover creation failed:', error)
      throw error
    }
  }

  /**
   * Process artist photo for album cover use
   */
  private async processArtistPhoto(photo: string): Promise<string> {
    // In production, this would:
    // 1. Remove background using Nova Canvas API
    // 2. Enhance image quality
    // 3. Adjust for square format
    
    // For now, return the original photo
    return photo
  }

  /**
   * Generate contextual prompts for album covers
   */
  private generateAlbumCoverPrompts(context: {
    style: string
    mood?: string
    genre?: string
    albumTitle?: string
    hasArtistPhoto: boolean
  }): string[] {
    const { style, mood, genre, albumTitle, hasArtistPhoto } = context
    const prompts: string[] = []

    // Base elements
    const genreStyle = genre ? `${genre} music album cover` : 'music album cover'
    const moodDesc = mood ? `, ${mood} atmosphere` : ''
    const titleElement = albumTitle ? `, featuring "${albumTitle}" text` : ''

    // Style-specific prompts
    switch (style) {
      case 'modern':
        prompts.push(
          `Modern ${genreStyle}, sleek design with geometric shapes${moodDesc}, professional photography, high contrast, bold typography${titleElement}, trending album artwork`,
          `Contemporary ${genreStyle}, minimalist layout with striking visuals${moodDesc}, negative space, sans-serif typography${titleElement}, award-winning design`,
          `Cutting-edge ${genreStyle}, digital art style with gradient overlays${moodDesc}, dynamic composition${titleElement}, Instagram-worthy square format`
        )
        break
      
      case 'vintage':
        prompts.push(
          `Vintage ${genreStyle}, retro aesthetic with film grain${moodDesc}, warm color palette, classic typography${titleElement}, nostalgic feel`,
          `Old-school ${genreStyle}, 70s inspired design${moodDesc}, textured background, serif fonts${titleElement}, authentic vintage look`,
          `Retro ${genreStyle}, analog photography style${moodDesc}, faded colors, artistic composition${titleElement}, timeless appeal`
        )
        break
      
      case 'minimalist':
        prompts.push(
          `Minimalist ${genreStyle}, clean design with single focal point${moodDesc}, monochrome palette, subtle typography${titleElement}, sophisticated simplicity`,
          `Ultra-minimal ${genreStyle}, abstract geometric shapes${moodDesc}, limited color scheme, modern fonts${titleElement}, gallery-worthy artwork`,
          `Simple ${genreStyle}, negative space focused${moodDesc}, elegant restraint${titleElement}, premium aesthetic`
        )
        break
      
      case 'abstract':
        prompts.push(
          `Abstract ${genreStyle}, artistic interpretation${moodDesc}, vibrant colors and shapes, experimental typography${titleElement}, creative expression`,
          `Surreal ${genreStyle}, dreamlike visuals${moodDesc}, flowing forms, artistic fonts${titleElement}, thought-provoking design`,
          `Experimental ${genreStyle}, mixed media style${moodDesc}, bold artistic choices${titleElement}, unique visual identity`
        )
        break
      
      case 'cinematic':
        prompts.push(
          `Cinematic ${genreStyle}, movie poster style${moodDesc}, dramatic lighting, epic composition${titleElement}, blockbuster quality`,
          `Film-inspired ${genreStyle}, widescreen aesthetic adapted to square${moodDesc}, depth of field, cinematic fonts${titleElement}, storytelling through visuals`,
          `Epic ${genreStyle}, Hollywood production value${moodDesc}, dynamic angles${titleElement}, memorable impact`
        )
        break
    }

    // Add artist photo context if applicable
    if (hasArtistPhoto) {
      prompts.forEach((prompt, index) => {
        prompts[index] = prompt.replace('album cover', 'album cover featuring the artist')
      })
    }

    return prompts
  }

  /**
   * Apply style transfer to create album cover
   */
  private async styleTransferAlbumCover(
    artistPhoto: string, 
    stylePrompt: string
  ): Promise<string> {
    // In production, this would use Nova Canvas style transfer API
    // For now, generate a new image based on the prompt
    const response = await this.client.generateImage({
      prompt: stylePrompt + ', style transfer from artist portrait, maintaining facial features',
      size: { width: 1024, height: 1024 },
      style: 'premium',
      numberOfImages: 1,
      cfgScale: 7.5
    })

    return response[0]
  }

  /**
   * Use outpainting to expand artist photo into album cover
   */
  private async outpaintAlbumCover(
    artistPhoto: string,
    expandPrompt: string
  ): Promise<string> {
    // In production, this would use Nova Canvas outpainting API
    // to expand the artist photo with contextual background
    const response = await this.client.generateImage({
      prompt: expandPrompt + ', expanded composition from central portrait',
      size: { width: 1024, height: 1024 },
      style: 'premium',
      numberOfImages: 1,
      cfgScale: 7.5
    })

    return response[0]
  }

  /**
   * Create composite album cover from multiple photos
   */
  private async createCompositeAlbumCover(
    photos: string[],
    compositePrompt: string
  ): Promise<string> {
    // In production, this would intelligently composite multiple photos
    // using Nova Canvas inpainting and advanced techniques
    const response = await this.client.generateImage({
      prompt: compositePrompt + ', creative photo composite, professional album artwork',
      size: { width: 1024, height: 1024 },
      style: 'premium',
      numberOfImages: 1,
      cfgScale: 8.0
    })

    return response[0]
  }

  /**
   * Remove background from image
   */
  async removeBackground(imageBase64: string): Promise<string> {
    // In production, this would use Nova Canvas background removal API
    // For now, return the original image
    console.log('Background removal requested - feature coming soon')
    return imageBase64
  }

  /**
   * Inpaint specific areas of an image
   */
  async inpaintImage(
    imageBase64: string,
    maskBase64: string,
    prompt: string
  ): Promise<string> {
    // In production, this would use Nova Canvas inpainting API
    console.log('Inpainting requested with prompt:', prompt)
    return imageBase64
  }

  /**
   * Outpaint to extend image boundaries
   */
  async outpaintImage(
    imageBase64: string,
    direction: 'all' | 'horizontal' | 'vertical',
    prompt: string
  ): Promise<string> {
    // In production, this would use Nova Canvas outpainting API
    console.log('Outpainting requested:', direction, prompt)
    return imageBase64
  }
}

// Singleton instance
let novaCanvasUtils: NovaCanvasUtils | null = null

export function getNovaCanvasUtils(): NovaCanvasUtils {
  if (!novaCanvasUtils) {
    novaCanvasUtils = new NovaCanvasUtils()
  }
  return novaCanvasUtils
} 