// Systematic Social Media Template System
// Powers the "Ready-to-Post Content" with organized prompts and workflows

export interface SystematicTemplate {
  id: string
  name: string
  category: 'announcement' | 'engagement' | 'promotional' | 'behind-scenes' | 'milestone'
  
  // Content generation
  captionPrompt: string
  imagePrompts: {
    primary: string
    variations: string[]
    style: 'cinematic' | 'vibrant' | 'minimalist' | 'dramatic'
    mood: 'energetic' | 'mysterious' | 'celebratory' | 'intimate'
  }
  
  // Personalization variables
  variables: {
    required: string[]
    optional: string[]
  }
  
  // AI generation settings
  aiSettings: {
    tone: string[]
    length: 'short' | 'medium' | 'long'
    emojiDensity: 'light' | 'medium' | 'heavy'
  }
}

// Systematic templates that power the pre-generated content
export const SYSTEMATIC_TEMPLATES: SystematicTemplate[] = [
  {
    id: 'new-release-announcement',
    name: 'New Release Announcement',
    category: 'announcement',
    captionPrompt: `Create an exciting new music release announcement for {trackTitle} by {artistName}. 
    Include release date {releaseDate}, build anticipation, mention pre-save/streaming links, 
    and use relevant hashtags. Tone should be {tone} with {emojiDensity} emoji usage.`,
    imagePrompts: {
      primary: 'Futuristic album artwork with neon accents, artist silhouette against cosmic background, professional music industry aesthetic',
      variations: [
        'Close-up of mixing console with colorful LED lights and music equipment',
        'Artist performing on stage with dramatic lighting and crowd energy',
        'Abstract visualization of sound waves in space with cosmic elements'
      ],
      style: 'cinematic',
      mood: 'energetic'
    },
    variables: {
      required: ['artistName', 'trackTitle', 'releaseDate'],
      optional: ['genre', 'collaborators', 'personalNote', 'streamingPlatform']
    },
    aiSettings: {
      tone: ['excited', 'urgent', 'professional'],
      length: 'medium',
      emojiDensity: 'medium'
    }
  },
  {
    id: 'tour-announcement',
    name: 'Tour Announcement',
    category: 'announcement',
    captionPrompt: `Create a compelling tour announcement for {artistName} {tourName}. 
    Include tour dates {tourDates}, ticket sale information {ticketDate}, and build excitement 
    for live performances. Tone should be {tone} with {emojiDensity} emoji usage.`,
    imagePrompts: {
      primary: 'Epic concert venue filled with lights and crowd, artist on stage, live music energy',
      variations: [
        'Tour bus on highway at sunset with destination signs',
        'Collage of multiple city skylines representing tour stops',
        'Artist backstage preparing for show with instruments'
      ],
      style: 'vibrant',
      mood: 'celebratory'
    },
    variables: {
      required: ['artistName', 'tourName', 'tourDates', 'ticketDate'],
      optional: ['venues', 'specialGuests', 'vipPackages', 'ticketLink']
    },
    aiSettings: {
      tone: ['professional', 'excited', 'inviting'],
      length: 'medium',
      emojiDensity: 'light'
    }
  },
  {
    id: 'studio-sessions',
    name: 'Studio Sessions',
    category: 'behind-scenes',
    captionPrompt: `Create an intimate behind-the-scenes post about studio work for {artistName}. 
    Share the creative process, mention upcoming music {releaseTimeframe}, and engage fans 
    with questions about creativity. Tone should be {tone} with {emojiDensity} emoji usage.`,
    imagePrompts: {
      primary: 'Intimate studio setting with warm lighting, artist at work, creative atmosphere',
      variations: [
        'Close-up of hands on piano keys with sheet music',
        'Producer and artist collaborating at mixing desk',
        'Coffee cup next to notebook with lyrics and creative notes'
      ],
      style: 'minimalist',
      mood: 'intimate'
    },
    variables: {
      required: ['artistName', 'releaseTimeframe'],
      optional: ['trackName', 'collaborators', 'studioLocation', 'creativeProcess']
    },
    aiSettings: {
      tone: ['casual', 'intimate', 'reflective'],
      length: 'short',
      emojiDensity: 'light'
    }
  }
]

// Function to generate content using systematic templates
export function generateSystematicContent(
  templateId: string,
  userData: Record<string, any>
): { caption: string; imagePrompt: string; hashtags: string[] } {
  const template = SYSTEMATIC_TEMPLATES.find(t => t.id === templateId)
  if (!template) throw new Error('Template not found')
  
  // Generate caption using AI prompt
  let captionPrompt = template.captionPrompt
  Object.entries(userData).forEach(([key, value]) => {
    captionPrompt = captionPrompt.replace(new RegExp(`{${key}}`, 'g'), value)
  })
  
  // Select image prompt (primary or variation)
  const imagePrompt = userData.variationIndex 
    ? template.imagePrompts.variations[userData.variationIndex - 1] || template.imagePrompts.primary
    : template.imagePrompts.primary
    
  // Add style and mood to image prompt
  const styledImagePrompt = `${imagePrompt}, ${template.imagePrompts.style} style, ${template.imagePrompts.mood} mood`
  
  // Generate hashtags based on content
  const hashtags = [
    `#${userData.artistName?.replace(/\s+/g, '')}`,
    userData.trackTitle ? `#${userData.trackTitle.replace(/\s+/g, '')}` : null,
    template.category === 'announcement' ? '#NewMusic' : null,
    template.category === 'behind-scenes' ? '#StudioLife' : null,
    '#MusicProduction'
  ].filter(Boolean) as string[]
  
  return {
    caption: captionPrompt,
    imagePrompt: styledImagePrompt,
    hashtags
  }
}

// Pre-generated content data (what users see in "Ready-to-Post Content")
export const PRE_GENERATED_CONTENT = [
  {
    id: 'new-release-solitude',
    templateId: 'new-release-announcement',
    title: 'New Release: "Solitude"',
    subtitle: 'Releases Tomorrow',
    preview: '🎵 NEW MUSIC ALERT! 🎵 "Solitude" by ALGORYX drops TOMORROW!',
    caption: `🎵 NEW MUSIC ALERT! 🎵

"Solitude" by ALGORYX drops TOMORROW! 🔥

This track is a journey through electronic soundscapes that will transport you to another dimension.

Pre-save now and be the first to experience it 🎧
Link in bio!

#ALGORYX #Solitude #NewMusic #ElectronicMusic #ComingSoon`,
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop'
    ],
    userData: {
      artistName: 'ALGORYX',
      trackTitle: 'Solitude',
      releaseDate: 'TOMORROW',
      tone: 'excited',
      emojiDensity: 'medium'
    }
  },
  {
    id: 'tour-summer-2024',
    templateId: 'tour-announcement',
    title: 'Summer Tour 2024',
    subtitle: 'June 2024',
    preview: '🎤 TOUR ANNOUNCEMENT 🎤 ALGORYX Summer Tour 2024 is HERE!',
    caption: `🎤 TOUR ANNOUNCEMENT 🎤

ALGORYX Summer Tour 2024 is HERE! 🚌

Join us for an unforgettable journey across 15 cities:
📍 Los Angeles - June 5
📍 San Francisco - June 8
📍 Seattle - June 12
...and more!

Tickets on sale Friday at 10AM PST 🎫
Don't miss out!

#ALGORYXTour #SummerTour2024 #LiveMusic`,
    images: [
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop'
    ],
    userData: {
      artistName: 'ALGORYX',
      tourName: 'Summer Tour 2024',
      tourDates: 'June 5-30, 2024',
      ticketDate: 'Friday at 10AM PST',
      tone: 'professional',
      emojiDensity: 'light'
    }
  },
  {
    id: 'studio-sessions-echoes',
    templateId: 'studio-sessions',
    title: 'Studio Sessions',
    subtitle: 'Behind the Scenes',
    preview: 'Behind the magic ✨ Spent the last 48 hours in the studio...',
    caption: `Behind the magic ✨

Spent the last 48 hours in the studio crafting something special for you all. "Echoes" started as a simple melody at 3AM and evolved into something much deeper.

Can't wait to share the full track with you next month 🎵

What's your favorite part of the creative process?

#StudioLife #BehindTheScenes #ALGORYX #MusicProduction`,
    images: [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=400&h=400&fit=crop'
    ],
    userData: {
      artistName: 'ALGORYX',
      releaseTimeframe: 'next month',
      trackName: 'Echoes',
      creativeProcess: 'started as a simple melody at 3AM',
      tone: 'intimate',
      emojiDensity: 'light'
    }
  }
] 