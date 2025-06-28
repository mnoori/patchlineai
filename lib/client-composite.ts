/**
 * Client-side image compositing using Canvas API
 */

export async function compositeImagesClient(
  backgroundBase64: string,
  subjectBase64: string,
  options?: {
    position?: { x: number; y: number };
    scale?: number;
    opacity?: number;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    const bgImg = new Image();
    const subjectImg = new Image();
    let loadedCount = 0;
    
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        performComposite();
      }
    };
    
    const performComposite = () => {
      try {
        // Set canvas size to background dimensions
        canvas.width = bgImg.width;
        canvas.height = bgImg.height;
        
        // Draw background
        ctx.drawImage(bgImg, 0, 0);
        
        // Calculate subject dimensions
        const scale = options?.scale || 0.5; // Default to 50% of background size
        const subjectWidth = bgImg.width * scale;
        const subjectHeight = (subjectImg.height / subjectImg.width) * subjectWidth;
        
        // Calculate position (default to center)
        const x = options?.position?.x || (bgImg.width - subjectWidth) / 2;
        const y = options?.position?.y || (bgImg.height - subjectHeight) / 2;
        
        // Set opacity if specified
        if (options?.opacity) {
          ctx.globalAlpha = options.opacity;
        }
        
        // Draw subject
        ctx.drawImage(subjectImg, x, y, subjectWidth, subjectHeight);
        
        // Reset opacity
        ctx.globalAlpha = 1;
        
        // Convert to base64
        const result = canvas.toDataURL('image/png').split(',')[1];
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    bgImg.onload = checkLoaded;
    subjectImg.onload = checkLoaded;
    
    bgImg.onerror = () => reject(new Error('Failed to load background image'));
    subjectImg.onerror = () => reject(new Error('Failed to load subject image'));
    
    // Load images
    bgImg.src = `data:image/png;base64,${backgroundBase64.replace(/^data:image\/\w+;base64,/, '')}`;
    subjectImg.src = `data:image/png;base64,${subjectBase64.replace(/^data:image\/\w+;base64,/, '')}`;
  });
}

export async function createClientSideComposite(
  images: string[],
  style: string
): Promise<string> {
  if (images.length < 2) {
    throw new Error('Need at least 2 images for composite');
  }
  
  const [background, subject] = images;
  
  // Different positioning based on style
  const styleOptions = {
    vibrant: { scale: 0.6, position: { x: null, y: null } }, // center
    cinematic: { scale: 0.4, position: { x: 50, y: 100 } }, // offset
    minimalist: { scale: 0.3, position: { x: null, y: null } }, // small, centered
  };
  
  const options = styleOptions[style as keyof typeof styleOptions] || styleOptions.vibrant;
  
  return compositeImagesClient(background, subject, {
    ...options,
    position: options.position.x ? options.position : undefined
  });
} 