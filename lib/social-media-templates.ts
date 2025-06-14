// Social Media Template System for Scalable Personalization
// This system allows for dynamic content generation based on user data and context

export interface SocialMediaTemplate {
  id: string
  name: string
  category: 'announcement' | 'engagement' | 'promotional' | 'behind-scenes' | 'milestone'
  platforms: Array<'instagram-post' | 'instagram-story' | 'twitter' | 'tiktok'>
  
  // Visual generation prompts
  imagePrompts: {
    primary: string
    variations: string[]
    style: string // e.g., "cinematic", "vibrant", "minimalist"
    mood: string // e.g., "energetic", "mysterious", "celebratory"
  }
  
  // Caption templates with dynamic variables
  captionTemplate: string
  hashtags: string[]
  
  // Personalization rules
  personalization: {
    requiredData: string[] // e.g., ['artistName', 'trackTitle', 'releaseDate']
    optionalData: string[] // e.g., ['genre', 'collaborators', 'venue']
    dataSource: 'user-profile' | 'release-metadata' | 'event-details' | 'manual'
  }
  
  // AI enhancement settings
  aiEnhancements: {
    toneModifiers: string[] // e.g., ['professional', 'casual', 'excited']
    lengthPreference: 'short' | 'medium' | 'long'
    emojiDensity: 'none' | 'light' | 'medium' | 'heavy'
  }
  
  // Performance tracking
  analytics: {
    expectedEngagement: 'low' | 'medium' | 'high' | 'viral'
    bestTimeToPost: string[] // e.g., ['morning', 'evening', 'weekend']
    targetAudience: string[] // e.g., ['fans', 'industry', 'new-listeners']
  }
}

// Pre-generated templates from our AI agent Aria
export const ARIA_GENERATED_TEMPLATES: SocialMediaTemplate[] = [
  {
    id: 'new-release-hype',
    name: 'New Release Announcement',
    category: 'announcement',
    platforms: ['instagram-post', 'instagram-story'],
    imagePrompts: {
      primary: 'Futuristic album artwork with neon accents, artist silhouette against cosmic background',
      variations: [
        'Close-up of mixing console with colorful LED lights',
        'Artist performing on stage with dramatic lighting',
        'Abstract visualization of sound waves in space'
      ],
      style: 'cinematic',
      mood: 'energetic'
    },
    captionTemplate: `🎵 NEW MUSIC ALERT! 🎵

"{trackTitle}" by {artistName} drops {releaseDate}! 🔥

{personalNote}

Pre-save now and be the first to experience it 🎧
Link in bio!

{hashtags}`,
    hashtags: ['#{artistName}', '#{trackTitle}', '#NewMusic', '#ElectronicMusic', '#ComingSoon'],
    personalization: {
      requiredData: ['artistName', 'trackTitle', 'releaseDate'],
      optionalData: ['personalNote', 'genre', 'collaborators'],
      dataSource: 'release-metadata'
    },
    aiEnhancements: {
      toneModifiers: ['excited', 'urgent'],
      lengthPreference: 'medium',
      emojiDensity: 'medium'
    },
    analytics: {
      expectedEngagement: 'high',
      bestTimeToPost: ['morning', 'evening'],
      targetAudience: ['fans', 'new-listeners']
    }
  },
  {
    id: 'tour-announcement-epic',
    name: 'Tour Announcement',
    category: 'announcement',
    platforms: ['instagram-post', 'twitter'],
    imagePrompts: {
      primary: 'Epic concert venue filled with lights and crowd, artist on stage',
      variations: [
        'Tour bus on highway at sunset',
        'Collage of multiple city skylines',
        'Artist backstage preparing for show'
      ],
      style: 'vibrant',
      mood: 'celebratory'
    },
    captionTemplate: `🎤 TOUR ANNOUNCEMENT 🎤

{artistName} {tourName} is HERE! 🚌

Join us for an unforgettable journey:
{tourDates}

Tickets on sale {ticketDate} 🎫
{ticketLink}

{hashtags}`,
    hashtags: ['#{artistName}Tour', '#{tourName}', '#LiveMusic', '#OnTour'],
    personalization: {
      requiredData: ['artistName', 'tourName', 'tourDates', 'ticketDate'],
      optionalData: ['ticketLink', 'specialGuests', 'vipPackages'],
      dataSource: 'event-details'
    },
    aiEnhancements: {
      toneModifiers: ['professional', 'excited'],
      lengthPreference: 'medium',
      emojiDensity: 'light'
    },
    analytics: {
      expectedEngagement: 'viral',
      bestTimeToPost: ['morning'],
      targetAudience: ['fans', 'local-audiences']
    }
  },
  {
    id: 'studio-session-intimate',
    name: 'Studio Sessions',
    category: 'behind-scenes',
    platforms: ['instagram-post', 'instagram-story', 'tiktok'],
    imagePrompts: {
      primary: 'Intimate studio setting with warm lighting, artist at work',
      variations: [
        'Close-up of hands on piano keys',
        'Producer and artist collaborating at mixing desk',
        'Coffee cup next to notebook with lyrics'
      ],
      style: 'minimalist',
      mood: 'mysterious'
    },
    captionTemplate: `Behind the magic ✨

{studioStory}

Can't wait to share the full track with you {releaseTimeframe} 🎵

What's your favorite part of the creative process?

{hashtags}`,
    hashtags: ['#StudioLife', '#BehindTheScenes', '#{artistName}', '#MusicProduction'],
    personalization: {
      requiredData: ['studioStory', 'releaseTimeframe'],
      optionalData: ['trackName', 'collaborators', 'studioLocation'],
      dataSource: 'manual'
    },
    aiEnhancements: {
      toneModifiers: ['casual', 'intimate'],
      lengthPreference: 'short',
      emojiDensity: 'light'
    },
    analytics: {
      expectedEngagement: 'high',
      bestTimeToPost: ['evening'],
      targetAudience: ['fans', 'music-producers']
    }
  },
  {
    id: 'milestone-celebration',
    name: 'Milestone Achievement',
    category: 'milestone',
    platforms: ['instagram-post', 'twitter'],
    imagePrompts: {
      primary: 'Celebratory graphic with achievement numbers, confetti effect',
      variations: [
        'Artist holding award or plaque',
        'Screenshot of streaming numbers',
        'Fan collage showing support'
      ],
      style: 'vibrant',
      mood: 'celebratory'
    },
    captionTemplate: `🎉 INCREDIBLE NEWS! 🎉

{achievement} 🏆

This wouldn't be possible without each and every one of you. {gratitudeMessage}

Here's to many more milestones together! 🥂

{hashtags}`,
    hashtags: ['#Grateful', '#{artistName}Family', '#MusicMilestone', '#ThankYou'],
    personalization: {
      requiredData: ['achievement', 'gratitudeMessage'],
      optionalData: ['specificNumbers', 'nextGoal', 'specialThanks'],
      dataSource: 'user-profile'
    },
    aiEnhancements: {
      toneModifiers: ['grateful', 'humble', 'excited'],
      lengthPreference: 'medium',
      emojiDensity: 'heavy'
    },
    analytics: {
      expectedEngagement: 'viral',
      bestTimeToPost: ['evening', 'weekend'],
      targetAudience: ['fans', 'industry', 'new-listeners']
    }
  }
]

// Function to get personalized template
export function getPersonalizedTemplate(
  templateId: string,
  userData: Record<string, any>
): { caption: string; hashtags: string[] } {
  const template = ARIA_GENERATED_TEMPLATES.find(t => t.id === templateId)
  if (!template) throw new Error('Template not found')
  
  // Replace variables in caption
  let caption = template.captionTemplate
  Object.entries(userData).forEach(([key, value]) => {
    caption = caption.replace(new RegExp(`{${key}}`, 'g'), value)
  })
  
  // Process hashtags
  const hashtags = template.hashtags.map(tag => {
    Object.entries(userData).forEach(([key, value]) => {
      tag = tag.replace(new RegExp(`{${key}}`, 'g'), value)
    })
    return tag
  })
  
  // Remove any remaining placeholders for optional data
  caption = caption.replace(/\{[^}]+\}/g, '').replace(/\n\n+/g, '\n\n').trim()
  
  return { caption, hashtags }
}

// Function to get templates by category
export function getTemplatesByCategory(category: SocialMediaTemplate['category']): SocialMediaTemplate[] {
  return ARIA_GENERATED_TEMPLATES.filter(t => t.category === category)
}

// Function to get templates for a specific platform
export function getTemplatesForPlatform(platform: string): SocialMediaTemplate[] {
  return ARIA_GENERATED_TEMPLATES.filter(t => t.platforms.includes(platform as any))
}

// Function to generate image prompt with context
export function generateImagePrompt(
  template: SocialMediaTemplate,
  userData: Record<string, any>,
  variationIndex: number = 0
): string {
  const basePrompt = variationIndex === 0 
    ? template.imagePrompts.primary 
    : template.imagePrompts.variations[variationIndex - 1] || template.imagePrompts.primary
    
  // Add style and mood
  const styledPrompt = `${basePrompt}, ${template.imagePrompts.style} style, ${template.imagePrompts.mood} mood`
  
  // Add any artist-specific context
  if (userData.artistStyle) {
    return `${styledPrompt}, in the style of ${userData.artistStyle}`
  }
  
  return styledPrompt
} 