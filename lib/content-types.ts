// Enhanced content type system for Patchline AI
export type ContentType = "blog" | "epk" | "social" | "social-ai" | "short-video" | "music-video"

export interface ContentTypeConfig {
  id: ContentType
  name: string
  description: string
  icon: string
  color: string
  estimatedTime: string
  agentSuggestions: string[]
}

export interface ContactInfo {
  name: string
  email: string
  phone?: string
  website?: string
  socialMedia?: {
    instagram?: string
    twitter?: string
    spotify?: string
  }
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeConfig> = {
  blog: {
    id: "blog",
    name: "Blog Post",
    description: "In-depth articles and thought leadership content",
    icon: "FileText",
    color: "brand-cyan",
    estimatedTime: "5-8 min",
    agentSuggestions: [
      "Industry insights and trends",
      "Artist spotlights and interviews",
      "Technical deep-dives",
      "Market analysis and predictions",
    ],
  },
  epk: {
    id: "epk",
    name: "Electronic Press Kit",
    description: "Professional artist presentation for media and venues",
    icon: "Briefcase",
    color: "purple-500",
    estimatedTime: "3-5 min",
    agentSuggestions: [
      "Artist biography and achievements",
      "Press quotes and testimonials",
      "Performance history and venues",
      "High-quality media assets",
    ],
  },
  social: {
    id: "social",
    name: "Social Media",
    description: "Engaging posts optimized for social platforms",
    icon: "Share2",
    color: "blue-500",
    estimatedTime: "2-3 min",
    agentSuggestions: [
      "Platform-specific formatting",
      "Trending hashtags and topics",
      "Engagement-optimized content",
      "Visual content recommendations",
    ],
  },
  "short-video": {
    id: "short-video",
    name: "Short Video",
    description: "TikTok, Reels, and YouTube Shorts concepts",
    icon: "Video",
    color: "pink-500",
    estimatedTime: "4-6 min",
    agentSuggestions: [
      "Trending video formats",
      "Storyboard and shot sequences",
      "Audio and music recommendations",
      "Text overlays and captions",
    ],
  },
  "social-ai": {
    id: "social-ai",
    name: "AI Social Media Creator",
    description: "Transform your photos into stunning social media content with AI",
    icon: "Sparkles",
    color: "brand-cyan",
    estimatedTime: "3-5 min",
    agentSuggestions: [
      "Google Drive photo integration",
      "AI background removal and generation",
      "Custom template styling",
      "Automated caption generation",
    ],
  },
  "music-video": {
    id: "music-video",
    name: "Music Video",
    description: "Full-length music video concepts and treatments",
    icon: "Clapperboard",
    color: "orange-500",
    estimatedTime: "8-12 min",
    agentSuggestions: [
      "Visual themes and aesthetics",
      "Narrative and concept development",
      "Location and set recommendations",
      "Technical production notes",
    ],
  },
}

// Enhanced content prompt interface
export interface EnhancedContentPrompt {
  topic: string
  keywords?: string[]
  contentType: ContentType
  tone?: string
  length?: string
  creativityLevel?: "conservative" | "balanced" | "creative"
  customPrompt?: string

  // EPK specific fields
  artistName?: string
  artistBio?: string
  featuredTracks?: Array<{
    title: string
    duration: string
    streamingLinks: string[]
  }>
  pressQuotes?: Array<{
    quote: string
    source: string
    publication?: string
  }>
  performanceHistory?: Array<{
    venue: string
    date: string
    location: string
    capacity: number
  }>
  contactInfo?: {
    manager?: string
    booking?: string
    press?: string
    email?: string
    phone?: string
  }

  // Social media specific fields
  platform?: "instagram" | "twitter" | "tiktok"
  postTone?: "casual" | "professional" | "enthusiastic"
  includeHashtags?: boolean
  includeEmojis?: boolean
  targetAudience?: string

  // Video specific fields
  aspectRatio?: "9:16" | "1:1" | "16:9"
  duration?: "15s" | "30s" | "60s" | "90s" | "full-length"
  videoTheme?: string
  budget?: "low" | "medium" | "high"

  // Music video specific fields
  selectedTrack?: string
  musicVideoStyle?: "narrative" | "performance" | "abstract" | "lyric-video"
  mood?: string
  colorPalette?: string[]
  visualThemes?: string[]
}

// Content ideas for different types
export interface ContentIdea {
  title: string
  excerpt: string
  image: string
  category: string
  slug: string
  contentType: ContentType
  estimatedEngagement?: string
  trendingScore?: number
}

export const CONTENT_IDEAS: Record<ContentType, ContentIdea[]> = {
  blog: [
    {
      title: "The State of AI in Music: Beyond the Hype",
      excerpt:
        "How artificial intelligence is transforming the music industry landscape and what it means for artists, labels, and fans.",
      image: "/music-industry-ai-blog.png",
      category: "AI Technology",
      slug: "state-of-ai-in-music",
      contentType: "blog",
      estimatedEngagement: "High",
      trendingScore: 95,
    },
    {
      title: "How Independent Labels Can Compete Using AI",
      excerpt: "Leveling the playing field with major labels through strategic AI implementation.",
      image: "/independent-labels-ai.png",
      category: "Music Industry",
      slug: "independent-labels-ai",
      contentType: "blog",
      estimatedEngagement: "Medium",
      trendingScore: 87,
    },
    {
      title: "Metadata: The Hidden Value in Your Music Catalog",
      excerpt: "Why proper metadata management is crucial for maximizing your music's potential.",
      image: "/music-metadata-management.png",
      category: "Metadata Agent",
      slug: "metadata-hidden-value",
      contentType: "blog",
      estimatedEngagement: "Medium",
      trendingScore: 78,
    },
    {
      title: "Agent-Based Workflows: The Future of Creative Production",
      excerpt: "How AI agents are transforming creative workflows in the music industry.",
      image: "/ai-agent-workflows.png",
      category: "Agent Updates",
      slug: "agent-based-workflows",
      contentType: "blog",
      estimatedEngagement: "High",
      trendingScore: 92,
    },
  ],
  epk: [
    {
      title: "Emerging Artist EPK Template",
      excerpt: "Professional press kit for breakthrough artists seeking media coverage and booking opportunities.",
      image: "/music-talent-discovery.png",
      category: "Artist Development",
      slug: "emerging-artist-epk",
      contentType: "epk",
      estimatedEngagement: "High",
      trendingScore: 88,
    },
    {
      title: "Festival-Ready Artist Package",
      excerpt: "Comprehensive EPK designed for festival submissions and major venue bookings.",
      image: "/music-education-dashboard.png",
      category: "Live Performance",
      slug: "festival-ready-epk",
      contentType: "epk",
      estimatedEngagement: "High",
      trendingScore: 91,
    },
    {
      title: "Label Showcase EPK",
      excerpt: "Multi-artist press kit for record labels showcasing their roster to industry professionals.",
      image: "/music-analytics-dashboard.png",
      category: "Label Services",
      slug: "label-showcase-epk",
      contentType: "epk",
      estimatedEngagement: "Medium",
      trendingScore: 82,
    },
    {
      title: "Producer Portfolio EPK",
      excerpt: "Specialized press kit highlighting production credits, collaborations, and technical expertise.",
      image: "/contract-management-dashboard.png",
      category: "Production",
      slug: "producer-portfolio-epk",
      contentType: "epk",
      estimatedEngagement: "Medium",
      trendingScore: 79,
    },
  ],
  social: [
    {
      title: "New Release Announcement Campaign",
      excerpt: "Multi-platform social media strategy for announcing and promoting new music releases.",
      image: "/music-industry-ai-blog.png",
      category: "Release Marketing",
      slug: "new-release-campaign",
      contentType: "social",
      estimatedEngagement: "Very High",
      trendingScore: 96,
    },
    {
      title: "Behind-the-Scenes Content Series",
      excerpt: "Authentic, engaging content showing the creative process and artist personality.",
      image: "/music-education-technology.png",
      category: "Artist Branding",
      slug: "behind-scenes-content",
      contentType: "social",
      estimatedEngagement: "High",
      trendingScore: 89,
    },
    {
      title: "Fan Engagement Challenge",
      excerpt: "Interactive social media campaign designed to boost fan participation and community building.",
      image: "/ai-ethics-music.png",
      category: "Community Building",
      slug: "fan-engagement-challenge",
      contentType: "social",
      estimatedEngagement: "Very High",
      trendingScore: 94,
    },
    {
      title: "Industry Thought Leadership Posts",
      excerpt: "Professional content positioning artists as industry experts and thought leaders.",
      image: "/principles.png",
      category: "Professional Branding",
      slug: "thought-leadership-posts",
      contentType: "social",
      estimatedEngagement: "Medium",
      trendingScore: 76,
    },
  ],
  "social-ai": [
    {
      title: "Artist Photo Transformation",
      excerpt: "Transform your personal photos into professional social media content with AI-generated backgrounds.",
      image: "/music-industry-ai-blog.png",
      category: "AI Content Creation",
      slug: "artist-photo-transformation",
      contentType: "social-ai",
      estimatedEngagement: "Very High",
      trendingScore: 98,
    },
    {
      title: "Album Art Style Social Posts",
      excerpt: "Create cohesive social media content that matches your album artwork aesthetic.",
      image: "/music-education-technology.png",
      category: "Brand Consistency",
      slug: "album-art-style-posts",
      contentType: "social-ai",
      estimatedEngagement: "High",
      trendingScore: 92,
    },
    {
      title: "Concert Poster Style Content",
      excerpt: "Generate vintage concert poster-style social media content from your photos.",
      image: "/ai-ethics-music.png",
      category: "Vintage Aesthetic",
      slug: "concert-poster-content",
      contentType: "social-ai",
      estimatedEngagement: "High",
      trendingScore: 89,
    },
    {
      title: "Cyberpunk Artist Visuals",
      excerpt: "Transform your photos into futuristic cyberpunk-style social media content.",
      image: "/ai-agent-workflows.png",
      category: "Futuristic Style",
      slug: "cyberpunk-artist-visuals",
      contentType: "social-ai",
      estimatedEngagement: "Very High",
      trendingScore: 95,
    },
  ],
  "short-video": [
    {
      title: "Music Production Process Timelapse",
      excerpt: "Engaging short-form content showing the creation of a track from start to finish.",
      image: "/music-education-technology.png",
      category: "Educational Content",
      slug: "production-timelapse",
      contentType: "short-video",
      estimatedEngagement: "Very High",
      trendingScore: 93,
    },
    {
      title: "Artist Challenge Response",
      excerpt: "Trending challenge adaptation that showcases artist personality and creativity.",
      image: "/ai-agent-workflows.png",
      category: "Trending Content",
      slug: "artist-challenge-response",
      contentType: "short-video",
      estimatedEngagement: "Very High",
      trendingScore: 97,
    },
    {
      title: "Quick Music Theory Tips",
      excerpt: "Educational micro-content that provides value while building authority.",
      image: "/music-education-dashboard.png",
      category: "Educational",
      slug: "music-theory-tips",
      contentType: "short-video",
      estimatedEngagement: "High",
      trendingScore: 85,
    },
    {
      title: "Day in the Life - Artist Edition",
      excerpt: "Authentic glimpse into an artist's daily routine and creative process.",
      image: "/music-talent-discovery.png",
      category: "Lifestyle Content",
      slug: "day-in-life-artist",
      contentType: "short-video",
      estimatedEngagement: "High",
      trendingScore: 88,
    },
  ],
  "music-video": [
    {
      title: "Narrative-Driven Music Video",
      excerpt: "Story-based music video concept with character development and visual storytelling.",
      image: "/music-industry-ai-blog.png",
      category: "Narrative",
      slug: "narrative-music-video",
      contentType: "music-video",
      estimatedEngagement: "Very High",
      trendingScore: 91,
    },
    {
      title: "Performance-Based Visual Concept",
      excerpt: "High-energy performance video with dynamic cinematography and lighting design.",
      image: "/music-analytics-dashboard.png",
      category: "Performance",
      slug: "performance-visual-concept",
      contentType: "music-video",
      estimatedEngagement: "High",
      trendingScore: 87,
    },
    {
      title: "Abstract Visual Art Piece",
      excerpt: "Experimental music video focusing on abstract visuals and artistic expression.",
      image: "/ai-ethics-music.png",
      category: "Experimental",
      slug: "abstract-visual-art",
      contentType: "music-video",
      estimatedEngagement: "Medium",
      trendingScore: 79,
    },
    {
      title: "Collaborative Artist Feature",
      excerpt: "Multi-artist music video showcasing collaboration and creative synergy.",
      image: "/independent-labels-ai.png",
      category: "Collaboration",
      slug: "collaborative-feature",
      contentType: "music-video",
      estimatedEngagement: "High",
      trendingScore: 84,
    },
  ],
}

export const CONTENT_TYPE_CONFIG = {
  blog: {
    title: "Blog Post",
    icon: "📝",
    description: "Professional articles and thought leadership content",
  },
  epk: {
    title: "Electronic Press Kit",
    icon: "👤",
    description: "Professional artist presentation and media kit",
  },
  social: {
    title: "Social Media",
    icon: "📱",
    description: "Engaging posts for social platforms",
  },
  "social-ai": {
    title: "AI Social Media Creator",
    icon: "✨",
    description: "Transform photos into stunning social content with AI",
  },
  "short-video": {
    title: "Short Video",
    icon: "🎬",
    description: "Brief, impactful videos for social platforms",
  },
  "music-video": {
    title: "Music Video",
    icon: "🎵",
    description: "Conceptual music videos with AI-generated visuals",
  },
}
