/**
 * Dynamic Prompt Library
 * Context-aware prompts for Nova Canvas image generation
 * Based on best practices from AWS Nova Canvas documentation
 */

export interface DynamicPrompt {
  id: string
  category: 'release' | 'artist' | 'event' | 'merchandise' | 'general'
  platform: 'instagram' | 'x' | 'tiktok' | 'all'
  name: string
  description: string
  template: string
  variables: string[]
  tags: string[]
  examples?: string[]
}

export const PROMPT_TEMPLATES: DynamicPrompt[] = [
  // Release Announcement Prompts
  {
    id: 'release-cover-vibrant',
    category: 'release',
    platform: 'instagram',
    name: 'Vibrant Album Cover',
    description: 'Eye-catching album cover for social media',
    template: 'Album cover for {genre} music, featuring {subject}, {mood} atmosphere, professional studio lighting, vibrant colors with {primaryColor} and {secondaryColor} palette, high contrast, album title "{albumTitle}" in modern typography, square format, commercial quality, trending on music platforms',
    variables: ['genre', 'subject', 'mood', 'primaryColor', 'secondaryColor', 'albumTitle'],
    tags: ['album', 'cover', 'release', 'vibrant'],
    examples: [
      'Album cover for electronic music, featuring abstract neon shapes, energetic atmosphere, professional studio lighting, vibrant colors with electric blue and hot pink palette'
    ]
  },
  {
    id: 'release-teaser-cinematic',
    category: 'release',
    platform: 'all',
    name: 'Cinematic Release Teaser',
    description: 'Dramatic teaser image for upcoming release',
    template: 'Cinematic promotional image for {genre} music release, {subject} in dramatic lighting, {location}, moody {timeOfDay} atmosphere, depth of field, film grain, widescreen composition, mysterious and intriguing, professional photography',
    variables: ['genre', 'subject', 'location', 'timeOfDay'],
    tags: ['teaser', 'cinematic', 'release', 'dramatic']
  },

  // Artist Portrait Prompts
  {
    id: 'artist-portrait-professional',
    category: 'artist',
    platform: 'all',
    name: 'Professional Artist Portrait',
    description: 'High-end portrait for EPK and press',
    template: 'Professional portrait of {artistDescription}, {pose}, {lighting} lighting, {background}, sharp focus on face, bokeh background, captured with 85mm lens, magazine quality, {mood} expression, styled for {genre} artist',
    variables: ['artistDescription', 'pose', 'lighting', 'background', 'mood', 'genre'],
    tags: ['portrait', 'professional', 'epk', 'press']
  },
  {
    id: 'artist-lifestyle-candid',
    category: 'artist',
    platform: 'instagram',
    name: 'Candid Lifestyle Shot',
    description: 'Authentic behind-the-scenes moment',
    template: 'Candid lifestyle photo of musician {action}, natural {lighting}, {location}, documentary style, authentic moment, shallow depth of field, warm tones, Instagram-worthy composition, relatable and genuine',
    variables: ['action', 'lighting', 'location'],
    tags: ['lifestyle', 'candid', 'authentic', 'bts']
  },

  // Event Promotion Prompts
  {
    id: 'event-concert-poster',
    category: 'event',
    platform: 'all',
    name: 'Concert Poster Design',
    description: 'Eye-catching concert promotion',
    template: 'Concert poster design for {artistName}, {venue} venue, {date}, {genre} music event, dynamic composition with {visualElement}, bold typography, {colorScheme} color scheme, professional event poster layout, high impact design',
    variables: ['artistName', 'venue', 'date', 'genre', 'visualElement', 'colorScheme'],
    tags: ['concert', 'poster', 'event', 'promotion']
  },

  // Social Media Specific
  {
    id: 'social-story-announcement',
    category: 'general',
    platform: 'instagram',
    name: 'Story Announcement',
    description: 'Vertical story format for announcements',
    template: 'Instagram story design, {announcement} text overlay, {background} background, modern gradient, bold sans-serif typography, {accentColor} accents, minimalist design, vertical 9:16 format, eye-catching and shareable',
    variables: ['announcement', 'background', 'accentColor'],
    tags: ['story', 'announcement', 'vertical', 'instagram']
  },
  {
    id: 'social-x-header',
    category: 'general',
    platform: 'x',
    name: 'X (Twitter) Header',
    description: 'Professional header for X profile',
    template: 'X (Twitter) header banner for {artistType} artist, {visualTheme}, panoramic composition, {colorPalette} color palette, subtle branding elements, professional and cohesive design, 1500x500 pixel optimization',
    variables: ['artistType', 'visualTheme', 'colorPalette'],
    tags: ['header', 'banner', 'x', 'twitter', 'profile']
  },

  // Merchandise Prompts
  {
    id: 'merch-tshirt-design',
    category: 'merchandise',
    platform: 'all',
    name: 'T-Shirt Design',
    description: 'Merchandise design for apparel',
    template: 'T-shirt design featuring {designElement}, {style} art style, {colorCount} color design suitable for screen printing, centered composition, bold and impactful, merchandise-ready artwork, {theme} theme',
    variables: ['designElement', 'style', 'colorCount', 'theme'],
    tags: ['merchandise', 'tshirt', 'apparel', 'design']
  }
]

/**
 * Get prompts filtered by criteria
 */
export function getPromptsByFilter(filter: {
  category?: string
  platform?: string
  tags?: string[]
}): DynamicPrompt[] {
  return PROMPT_TEMPLATES.filter(prompt => {
    if (filter.category && prompt.category !== filter.category) return false
    if (filter.platform && prompt.platform !== 'all' && prompt.platform !== filter.platform) return false
    if (filter.tags?.length) {
      const hasTag = filter.tags.some(tag => prompt.tags.includes(tag))
      if (!hasTag) return false
    }
    return true
  })
}

/**
 * Fill prompt template with variables
 */
export function fillPromptTemplate(template: string, variables: Record<string, string>): string {
  let filled = template
  Object.entries(variables).forEach(([key, value]) => {
    filled = filled.replace(new RegExp(`{${key}}`, 'g'), value)
  })
  return filled
}

/**
 * Get prompt suggestions based on content context
 */
export function getPromptSuggestions(context: {
  contentType: string
  genre?: string
  mood?: string
  platform?: string
}): DynamicPrompt[] {
  const suggestions: DynamicPrompt[] = []
  
  // Platform-specific suggestions
  if (context.platform) {
    suggestions.push(...getPromptsByFilter({ platform: context.platform }))
  }
  
  // Genre-based suggestions
  if (context.genre) {
    const genreTags = context.genre.toLowerCase().split(' ')
    suggestions.push(...getPromptsByFilter({ tags: genreTags }))
  }
  
  // Mood-based filtering
  if (context.mood) {
    const moodPrompts = PROMPT_TEMPLATES.filter(p => 
      p.template.toLowerCase().includes(context.mood.toLowerCase()) ||
      p.tags.includes(context.mood.toLowerCase())
    )
    suggestions.push(...moodPrompts)
  }
  
  // Remove duplicates
  const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.id)))
    .map(id => suggestions.find(s => s.id === id)!)
  
  return uniqueSuggestions.slice(0, 5) // Return top 5 suggestions
}

/**
 * Enhanced prompt modifiers based on AWS best practices
 */
export const PROMPT_MODIFIERS = {
  quality: [
    'high quality',
    'professional',
    'ultra detailed',
    'sharp focus',
    'masterpiece',
    'award winning'
  ],
  lighting: [
    'natural lighting',
    'studio lighting',
    'golden hour',
    'dramatic lighting',
    'soft diffused lighting',
    'neon lighting',
    'cinematic lighting'
  ],
  style: [
    'photorealistic',
    'artistic',
    'minimalist',
    'abstract',
    'vintage',
    'modern',
    'futuristic'
  ],
  mood: [
    'energetic',
    'serene',
    'mysterious',
    'uplifting',
    'melancholic',
    'powerful',
    'intimate'
  ],
  composition: [
    'rule of thirds',
    'centered composition',
    'dynamic angle',
    'symmetrical',
    'close-up',
    'wide shot',
    'aerial view'
  ]
}

/**
 * Build enhanced prompt with modifiers
 */
export function buildEnhancedPrompt(
  basePrompt: string, 
  modifiers: {
    quality?: string[]
    lighting?: string[]
    style?: string[]
    mood?: string[]
    composition?: string[]
  }
): string {
  const parts = [basePrompt]
  
  Object.entries(modifiers).forEach(([category, values]) => {
    if (values && values.length > 0) {
      parts.push(values.join(', '))
    }
  })
  
  return parts.join(', ')
}

/**
 * Negative prompt suggestions to exclude unwanted elements
 */
export const NEGATIVE_PROMPTS = {
  general: 'low quality, blurry, pixelated, distorted, amateur, ugly',
  people: 'extra limbs, deformed hands, bad anatomy, unrealistic proportions',
  text: 'typos, misspelled words, gibberish text, unclear text',
  style: 'cartoon (unless wanted), anime (unless wanted), 3D render (unless wanted)'
} 