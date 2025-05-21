// Blog post data model
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  content: string; // Markdown content
  publishedDate?: string;
  lastUpdatedDate?: string;
  author: {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
  };
  status: 'draft' | 'published' | 'archived';
  readingTime?: number;
  tags: string[];
  category?: string;
  seoDescription?: string;
  relatedPosts?: string[]; // IDs of related posts
}

// Content agent system types
export interface ContentPrompt {
  topic: string;
  keywords?: string[];
  targetAudience?: string;
  tone?: 'professional' | 'conversational' | 'technical' | 'educational';
  length?: 'short' | 'medium' | 'long';
  contentType?: 'blog' | 'newsletter' | 'social' | 'product';
  callToAction?: string;
  modelId?: string; // Bedrock model ID to use
  showPrompt?: boolean; // Whether to show the generated prompt
}

export interface AIGenerationParams {
  temperature?: number;
  maxTokens?: number;
  contextualPrompts?: string[];
  exampleFormat?: string;
  systemInstructions?: string;
}

export interface ContentDraft {
  id: string;
  prompt: ContentPrompt;
  content: string;
  promptUsed?: string; // The actual prompt sent to the AI
  createdAt: string;
  updatedAt: string;
  status: 'generating' | 'ready' | 'edited' | 'approved' | 'rejected';
  feedback?: string;
  generationParams?: AIGenerationParams;
} 