/**
 * Image utility functions for content generation
 */

export async function resizeImageForNovaCanvas(base64Image: string): Promise<string> {
  // Nova Canvas max: 2048x2048 (4,194,304 pixels)
  const MAX_DIMENSION = 2048
  
  try {
    // Create an image element to get dimensions
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        // Check if resize is needed
        if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
          // No resize needed, return original
          resolve(base64Image)
          return
        }
        
        // Calculate scale to fit within max dimensions
        const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        const newWidth = Math.floor(width * scale)
        const newHeight = Math.floor(height * scale)
        
        // Set canvas dimensions
        canvas.width = newWidth
        canvas.height = newHeight
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        // Convert to base64
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
        
        console.log(`Image resized from ${width}x${height} to ${newWidth}x${newHeight}`)
        resolve(resizedBase64)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      // Load the image
      img.src = `data:image/jpeg;base64,${base64Image}`
    })
  } catch (error) {
    console.error('Image resize error:', error)
    throw error
  }
}

export function cleanBase64(base64String: string): string {
  // Remove data URL prefix if present
  return base64String.replace(/^data:image\/\w+;base64,/, '')
}

export function isBase64Valid(base64String: string): boolean {
  try {
    // Check if it's a valid base64 string
    const cleaned = cleanBase64(base64String)
    return /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)
  } catch {
    return false
  }
}

export function getImageDimensions(base64Image: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      reject(new Error('Failed to get image dimensions'))
    }
    
    img.src = `data:image/jpeg;base64,${cleanBase64(base64Image)}`
  })
}

// Server-side resize function (for API routes)
export async function resizeImageForNovaCanvasServer(base64Image: string): Promise<string> {
  // In a server environment, you would use Sharp or similar
  // For now, we'll just validate and return the original
  
  const cleaned = cleanBase64(base64Image)
  
  if (!isBase64Valid(cleaned)) {
    throw new Error('Invalid base64 image data')
  }
  
  // In production with Sharp:
  // const buffer = Buffer.from(cleaned, 'base64')
  // const resized = await sharp(buffer)
  //   .resize(2048, 2048, { 
  //     fit: 'inside', 
  //     withoutEnlargement: true 
  //   })
  //   .jpeg({ quality: 90 })
  //   .toBuffer()
  // return resized.toString('base64')
  
  console.warn('Server-side image resizing not implemented. Install Sharp for production use.')
  return cleaned
}

/**
 * Create a simple center mask for outpainting
 * White (255,255,255) = keep, Black (0,0,0) = replace
 * This creates a white rectangle in the center and black around the edges
 */
export function createCenterMask(width: number, height: number, keepRatio: number = 0.6): string {
  if (typeof window === 'undefined') {
    // Server-side: return a simple placeholder
    // In production, you'd use Sharp or another image library
    console.warn('Server-side mask generation not implemented - using placeholder')
    return ''
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  // Fill with black (areas to replace)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  
  // Create white rectangle in center (area to keep)
  const keepWidth = width * keepRatio
  const keepHeight = height * keepRatio
  const x = (width - keepWidth) / 2
  const y = (height - keepHeight) / 2
  
  ctx.fillStyle = 'white'
  ctx.fillRect(x, y, keepWidth, keepHeight)
  
  // Convert to base64
  return canvas.toDataURL('image/png').split(',')[1]
}

/**
 * Create an edge mask for outpainting
 * This keeps the center and replaces the edges
 */
export function createEdgeMask(width: number, height: number, edgeSize: number = 100): string {
  if (typeof window === 'undefined') {
    console.warn('Server-side mask generation not implemented')
    return ''
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas context not available')
  }
  
  // Fill with white (keep everything initially)
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width, height)
  
  // Draw black borders (areas to replace)
  ctx.fillStyle = 'black'
  
  // Top edge
  ctx.fillRect(0, 0, width, edgeSize)
  // Bottom edge
  ctx.fillRect(0, height - edgeSize, width, edgeSize)
  // Left edge
  ctx.fillRect(0, 0, edgeSize, height)
  // Right edge
  ctx.fillRect(width - edgeSize, 0, edgeSize, height)
  
  // Convert to base64
  return canvas.toDataURL('image/png').split(',')[1]
} 