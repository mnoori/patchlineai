import type { EnhancedContentPrompt } from "./content-types"

export interface ContentPrompt extends Partial<EnhancedContentPrompt> {
  topic: string
  keywords?: string[]
  targetAudience?: string
  tone?: "professional" | "conversational" | "technical" | "educational"
  length?: "short" | "medium" | "long"
  contentType?: string // Keep for backward compatibility
  callToAction?: string
  modelId?: string
  showPrompt?: boolean
  customPrompt?: string
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
