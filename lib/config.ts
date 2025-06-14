/**
 * Patchline Configuration System
 *
 * This file provides a centralized configuration system that allows toggling
 * between development and production modes. It sets default values for
 * environment variables and provides a unified configuration object.
 */

// ======================================================================
// DEVELOPMENT MODE TOGGLE
// Set this to false when deploying to production
// ======================================================================
export const IS_DEVELOPMENT_MODE = true

// ======================================================================
// AUTHENTICATION BYPASS
// Only works when IS_DEVELOPMENT_MODE is true
// ======================================================================
export const BYPASS_AUTH_IN_DEVELOPMENT = false

// Mock user for development mode when bypassing authentication
export const MOCK_USER = {
  userId: "dev-user-123",
  email: "dev@patchline.ai",
  fullName: "Development User",
  role: "admin",
}

// ======================================================================
// ENVIRONMENT VARIABLES WITH DEFAULTS
// ======================================================================
export const CONFIG = {
  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY:
    process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || "",
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN || undefined,

  // Bedrock Agent Configuration
  // Define multiple agents by name for easy switching
  BEDROCK_AGENTS: {
    GMAIL_AGENT: {
      ID: process.env.BEDROCK_GMAIL_AGENT_ID || "2X5IXYPR9C",
      ALIAS_ID: process.env.BEDROCK_GMAIL_AGENT_ALIAS_ID || "9W9I1MFHAE",
      NAME: "Gmail Agent",
      DESCRIPTION: "Handles email operations via Gmail API"
    },
    LEGAL_AGENT: {
      ID: process.env.BEDROCK_LEGAL_AGENT_ID || "IFG9MC5ORA",
      ALIAS_ID: process.env.BEDROCK_LEGAL_AGENT_ALIAS_ID || "ED2AJTY2HF",
      NAME: "Legal Agent",
      DESCRIPTION: "Analyzes legal documents & contracts from a music-industry perspective"
    },
    SCOUT_AGENT: {
      ID: process.env.BEDROCK_SCOUT_AGENT_ID || '1R8VKEVBK2',
      ALIAS_ID: process.env.BEDROCK_SCOUT_AGENT_ALIAS_ID || 'PFSXQHBTUJ',
      NAME: "Scout Agent",
      DESCRIPTION: "Discovers and analyzes promising artists using Soundcharts data"
    },
    BLOCKCHAIN_AGENT: {
      ID: process.env.BEDROCK_BLOCKCHAIN_AGENT_ID || 'OO7395LRBY',
      ALIAS_ID: process.env.BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID || '4756GPGRAJ',
      NAME: "Blockchain Agent",
      DESCRIPTION: "Handles Solana transactions and crypto payments"
    },
    // Future agents can be added here
    // CALENDAR_AGENT: {
    //   ID: process.env.BEDROCK_CALENDAR_AGENT_ID || "",
    //   ALIAS_ID: process.env.BEDROCK_CALENDAR_AGENT_ALIAS_ID || "",
    //   NAME: "Calendar Agent",
    //   DESCRIPTION: "Manages calendar and scheduling"
    // },
  },
  
  // Current active agent (can be changed to switch agents)
  // No default active agent - let the system choose based on context
  ACTIVE_AGENT: "",
  
  // Legacy support - these will use the active agent
  BEDROCK_AGENT_ID: process.env.BEDROCK_AGENT_ID || "IAGTE3GFDZ",
  BEDROCK_AGENT_ALIAS_ID: process.env.BEDROCK_AGENT_ALIAS_ID || "M4DLDCPVGR",

  // DynamoDB Tables
  USERS_TABLE: process.env.USERS_TABLE || "Users-staging",
  EMBEDS_TABLE: process.env.EMBEDS_TABLE || "Embeds-staging",
  BLOG_POSTS_TABLE: process.env.BLOG_POSTS_TABLE || "BlogPosts-staging",
  CONTENT_DRAFTS_TABLE: process.env.CONTENT_DRAFTS_TABLE || "ContentDrafts-staging",

  // Public URLs for frontend
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  NEXT_PUBLIC_USERS_TABLE: process.env.NEXT_PUBLIC_USERS_TABLE || "Users-staging",
  NEXT_PUBLIC_EMBEDS_TABLE: process.env.NEXT_PUBLIC_EMBEDS_TABLE || "Embeds-staging",
  NEXT_PUBLIC_BLOG_POSTS_TABLE: process.env.NEXT_PUBLIC_BLOG_POSTS_TABLE || "BlogPosts-staging",
  NEXT_PUBLIC_CONTENT_DRAFTS_TABLE: process.env.NEXT_PUBLIC_CONTENT_DRAFTS_TABLE || "ContentDrafts-staging",

  // AI Configuration
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0",
  SYSTEM_PROMPT:
    process.env.SYSTEM_PROMPT ||
    "Orchestrate your Music Business with AI Agents. A full-stack, AI-first platform with specialized agents, Patchline connects your data, simplifies your workflows, and gives music professionals time back.",

  // Platform Integrations
  // Spotify
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "1c3ef44bdb494a4c90c591f56fd4bc37",
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
  // Use explicit env var if provided. Otherwise derive from NEXT_PUBLIC_APP_URL.
  // ‑ In production we should never fallback to 127.0.0.1 – instead use the public site URL.
  // ‑ In local development Spotify now requires 127.0.0.1 instead of localhost.
  SPOTIFY_REDIRECT_URI:
    process.env.SPOTIFY_REDIRECT_URI ||
    process.env.SPOTIFY_LOCAL_REDIRECT_URI ||
    (() => {
      const isProd = process.env.NODE_ENV === "production"
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (isProd ? "https://www.patchline.ai" : "http://localhost:3000")

      // In development use 127.0.0.1 loopback rule, otherwise keep domain intact
      const sanitizedBase = !isProd && baseUrl.includes("localhost")
        ? baseUrl.replace("localhost", "127.0.0.1")
        : baseUrl

      return `${sanitizedBase}/api/oauth/spotify/callback`
    })(),
  
  // Google/Gmail
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || "",
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || "",
  APP_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // SoundCloud
  SOUNDCLOUD_CLIENT_ID: process.env.SOUNDCLOUD_CLIENT_ID || "",
  SOUNDCLOUD_CLIENT_SECRET: process.env.SOUNDCLOUD_CLIENT_SECRET || "",
  SOUNDCLOUD_REDIRECT_URI: process.env.SOUNDCLOUD_REDIRECT_URI || "http://localhost:3000/api/oauth/soundcloud/callback",
  
  // Instagram
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID || "",
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET || "",
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:3000/api/oauth/instagram/callback",

  // Social Media Workflow Configuration
  SOCIAL_MEDIA_WORKFLOW: {
    // Zapier MCP Configuration
    ZAPIER_MCP_ENDPOINT: process.env.ZAPIER_MCP_ENDPOINT || "http://localhost:3001/mcp",
    ZAPIER_API_KEY: process.env.ZAPIER_API_KEY || "",
    
    // Google Drive Integration
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
    GOOGLE_DRIVE_MAX_IMAGES: parseInt(process.env.GOOGLE_DRIVE_MAX_IMAGES || "20"),
    
    // Image Processing
    SELECTED_IMAGES_COUNT: 3, // Always select 3 images as per requirements
    TEMP_S3_BUCKET: process.env.TEMP_S3_BUCKET || "patchline-temp-images",
    FINAL_S3_BUCKET: process.env.FINAL_S3_BUCKET || "patchline-social-content",
    
    // Template Configuration
    TEMPLATES_S3_BUCKET: process.env.TEMPLATES_S3_BUCKET || "patchline-templates",
    DEFAULT_TEMPLATES: [
      {
        id: "vintage-concert-poster",
        name: "Vintage Concert Poster",
        description: "Retro-style concert poster with vintage aesthetics",
        visualPrompt: "Create a vintage concert poster background with retro typography, distressed textures, and warm color palette",
        captionPrompt: "Write an exciting announcement about my new single in a vintage, nostalgic tone that captures the essence of classic rock concerts"
      },
      {
        id: "modern-album-art",
        name: "Modern Album Art",
        description: "Clean, contemporary album artwork style",
        visualPrompt: "Create a modern, minimalist album cover background with clean lines, bold colors, and contemporary design elements",
        captionPrompt: "Write a sleek, modern announcement about my new release that appeals to contemporary music fans and streaming audiences"
      },
      {
        id: "neon-cyberpunk",
        name: "Neon Cyberpunk",
        description: "Futuristic cyberpunk aesthetic with neon colors",
        visualPrompt: "Create a cyberpunk-inspired background with neon lights, futuristic elements, and electric color schemes",
        captionPrompt: "Write a futuristic, edgy announcement about my new track that captures the energy of electronic and cyberpunk culture"
      },
      {
        id: "acoustic-indie",
        name: "Acoustic Indie",
        description: "Warm, organic indie folk aesthetic",
        visualPrompt: "Create a warm, organic background with natural textures, earth tones, and indie folk aesthetics",
        captionPrompt: "Write a heartfelt, authentic announcement about my new song that resonates with indie and folk music lovers"
      }
    ]
  },

  // Other Configuration
  JWT_SECRET: process.env.JWT_SECRET || "development-jwt-secret-key-change-in-production",
  ENV: process.env.ENV || "development",
}

/**
 * Global configuration with development mode toggle
 */
export const PATCHLINE_CONFIG = {
  // Set to true for frontend development without backend dependencies
  DEVELOPMENT_MODE: false,

  // Feature flags
  features: {
    enableEmailIntegration: true,
    enableCalendarIntegration: true,
    enableAgentSuperLoop: true,
    enableMarketplace: true,
    enableTimelineFeed: true,
  },

  // Development fallbacks for missing environment variables
  devFallbacks: {
    // AWS services
    AWS_REGION: "us-east-1",
    BEDROCK_ENABLED: "true",
    DYNAMODB_TABLE: "patchline-dev-table",

    // Auth
    COGNITO_USER_POOL_ID: "dev-user-pool-id",
    COGNITO_CLIENT_ID: "dev-client-id",

    // API endpoints
    API_ENDPOINT: "https://api.example.com/dev",

    // Third-party integrations
    INSTAGRAM_CLIENT_ID: "mock-instagram-client-id",
    INSTAGRAM_CLIENT_SECRET: "mock-instagram-client-secret",
    INSTAGRAM_REDIRECT_URI: "http://localhost:3000/api/auth/instagram/callback",
  },
}

/**
 * Get environment variable with development fallback
 */
export function getEnvWithFallback(key: string): string {
  if (PATCHLINE_CONFIG.DEVELOPMENT_MODE && !process.env[key]) {
    const fallback = PATCHLINE_CONFIG.devFallbacks[key as keyof typeof PATCHLINE_CONFIG.devFallbacks]
    if (fallback) return fallback
    console.warn(`No fallback found for ${key} in development mode`)
  }
  return process.env[key] || ""
}

// Add this function to prevent filesystem credential loading
export function getCredentialProvider() {
  const credentials = getAWSCredentials()
  if (!credentials) {
    throw new Error("AWS SDK disabled in development mode")
  }
  return credentials
}

// ======================================================================
// DEMO MODE FOR INVESTOR PRESENTATIONS
// ======================================================================
export const DEMO_MODE = false

// ======================================================================
// MOCK DATA FOR DEVELOPMENT MODE
// ======================================================================
export const MOCK_DATA = {
  // Mock user data
  users: [
    {
      userId: "dev-user-123",
      email: "dev@patchline.ai",
      fullName: "Development User",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
  ],

  // Mock platform connections
  platforms: {
    spotify: true,
    appleMusic: true,
    soundcloud: false,
    instagram: false,
    youtube: true,
  },

  // Mock analytics data
  analytics: {
    totalRevenue: 45231.89,
    monthlyListeners: 2350412,
    engagement: 3827,
    revenueGrowth: 20.1,
    listenerGrowth: 15.3,
    engagementGrowth: 18.7,
  },
}

// ======================================================================
// HELPER FUNCTIONS
// ======================================================================

/**
 * Determines if we should use mock data instead of real services
 */
export function shouldUseMockData() {
  return IS_DEVELOPMENT_MODE
}

/**
 * Determines if we should bypass authentication
 */
export function shouldBypassAuth() {
  return IS_DEVELOPMENT_MODE && BYPASS_AUTH_IN_DEVELOPMENT
}

/**
 * Gets the appropriate AWS configuration based on mode
 */
export function getAWSConfig() {
  // Prevent any AWS SDK operations on the client side
  if (isClientSide()) {
    throw new Error("AWS operations not allowed on client side")
  }

  return {
    region: CONFIG.AWS_REGION,
    credentials: {
      accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
      secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
      ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN }),
    },
  }
}

/**
 * Prevents AWS SDK from trying to load credentials from filesystem
 * Returns null credentials in development mode to force mock usage
 */
// Add this function at the top after the imports
function isClientSide() {
  return typeof window !== "undefined"
}

// Modify the getAWSCredentials function to prevent client-side execution
export function getAWSCredentials() {
  // Prevent any AWS SDK operations on the client side
  if (isClientSide()) {
    return null
  }

  if (IS_DEVELOPMENT_MODE) {
    // Return null to prevent any AWS SDK initialization
    return null
  }

  return {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
    ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN }),
  }
}

// Add environment check function
export function isServerSide() {
  return typeof window === "undefined"
}

// Add function to check if AWS operations should be allowed
export function shouldUseAWS() {
  return !IS_DEVELOPMENT_MODE && isServerSide()
}

// Ensure environment variables are properly set
if (IS_DEVELOPMENT_MODE) {
  // Set environment variables for libraries that read directly from process.env
  if (!process.env.AWS_REGION) process.env.AWS_REGION = CONFIG.AWS_REGION
  if (!process.env.REGION_AWS) process.env.REGION_AWS = CONFIG.AWS_REGION
  if (!process.env.AWS_ACCESS_KEY_ID) process.env.AWS_ACCESS_KEY_ID = CONFIG.AWS_ACCESS_KEY_ID
  if (!process.env.ACCESS_KEY_ID) process.env.ACCESS_KEY_ID = CONFIG.AWS_ACCESS_KEY_ID
  if (!process.env.AWS_SECRET_ACCESS_KEY) process.env.AWS_SECRET_ACCESS_KEY = CONFIG.AWS_SECRET_ACCESS_KEY
  if (!process.env.SECRET_ACCESS_KEY) process.env.SECRET_ACCESS_KEY = CONFIG.AWS_SECRET_ACCESS_KEY

  console.log("[CONFIG] Running in DEVELOPMENT mode with default configuration")
} else {
  console.log("[CONFIG] Running in PRODUCTION mode")
}

export const GMAIL_AGENT = {
  agentId: process.env.BEDROCK_GMAIL_AGENT_ID || '2X5IXYPR9C',
  agentAliasId: process.env.BEDROCK_GMAIL_AGENT_ALIAS_ID || '9W9I1MFHAE',
  region: process.env.AWS_REGION || 'us-east-1'
};

export const LEGAL_AGENT = {
  agentId: process.env.BEDROCK_LEGAL_AGENT_ID || 'IFG9MC5ORA',
  agentAliasId: process.env.BEDROCK_LEGAL_AGENT_ALIAS_ID || 'ED2AJTY2HF',
  region: process.env.AWS_REGION || 'us-east-1'
};

export const SUPERVISOR_AGENT = {
  agentId: process.env.BEDROCK_SUPERVISOR_AGENT_ID || 'RH5QK3WOWU',
  agentAliasId: process.env.BEDROCK_SUPERVISOR_AGENT_ALIAS_ID || 'ILHZGPX3JJ',
  region: process.env.AWS_REGION || 'us-east-1'
};

export const BLOCKCHAIN_AGENT = {
  agentId: process.env.BEDROCK_BLOCKCHAIN_AGENT_ID || 'OO7395LRBY',
  agentAliasId: process.env.BEDROCK_BLOCKCHAIN_AGENT_ALIAS_ID || '4756GPGRAJ',
  region: process.env.AWS_REGION || 'us-east-1'
};

// ADD: Scout agent configuration
export const SCOUT_AGENT = {
  agentId: process.env.BEDROCK_SCOUT_AGENT_ID || '1R8VKEVBK2',
  agentAliasId: process.env.BEDROCK_SCOUT_AGENT_ALIAS_ID || 'PFSXQHBTUJ',
  region: process.env.AWS_REGION || 'us-east-1'
};

// Agent types for UI
export const AGENT_TYPES = [
  { id: 'gmail', name: 'Gmail Agent', description: 'Email management and communication' },
  { id: 'legal', name: 'Legal Agent', description: 'Contract analysis and legal review' },
  { id: 'scout', name: 'Scout Agent', description: 'AI talent scouting and artist discovery' },
  { id: 'blockchain', name: 'Blockchain Agent', description: 'Web3 transactions and crypto payments' },
  { id: 'supervisor', name: 'Supervisor Agent', description: 'Multi-agent coordination and delegation' }
];
