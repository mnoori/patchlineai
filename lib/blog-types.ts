import type { EnhancedContentPrompt, ContentType } from "./content-types"

export interface BlogPost {
  id: string
  slug: string
  title: string
  subtitle?: string
  content: string
  heroImage?: string
  publishedDate?: string
  author?: string
  category: string
  tags?: string[]
  isPublished?: boolean
}

export interface AIGenerationParams {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ContentPrompt {
  topic: string
  keywords?: string[]
  targetAudience?: string
  tone?: "professional" | "conversational" | "technical" | "educational"
  length?: "short" | "medium" | "long"
  contentType?: ContentType | string // Allow both for backward compatibility
  callToAction?: string
  modelId?: string
  showPrompt?: boolean
  customPrompt?: string
  // Include optional fields from EnhancedContentPrompt
  creativityLevel?: "conservative" | "balanced" | "creative"
  platform?: "instagram" | "twitter" | "tiktok"
  postTone?: "casual" | "professional" | "enthusiastic"
  includeHashtags?: boolean
  includeEmojis?: boolean
}

export interface ContentDraft {
  id: string
  prompt: EnhancedContentPrompt // Use enhanced prompt
  content: string
  promptUsed?: string
  createdAt: string
  updatedAt: string
  status: "generating" | "ready" | "edited" | "approved" | "rejected"
  feedback?: string
  generationParams?: AIGenerationParams
}
