/**
 * Tax Category Configuration for Schedule C Business Expenses
 * Maps expense categories to specific Schedule C line items
 */

export interface TaxCategory {
  line: string
  description: string
  keywords: string[]
  examples: string[]
  proofRequired: string[]
}

export interface BusinessTypeConfig {
  name: string
  categories: Record<string, TaxCategory>
  totalBudget?: number
}

// Main tax categories configuration
export const TAX_CATEGORIES: Record<string, BusinessTypeConfig> = {
  media: {
    name: "Media Business",
    categories: {
      advertising: {
        line: "Schedule C Line 8",
        description: "Advertising Expenses on Business",
        keywords: ["advertising", "marketing", "promotion", "ads", "google ads", "facebook ads", "instagram", "social media marketing"],
        examples: ["Google Ads", "Facebook Ads", "Instagram promotions", "Marketing campaigns"],
        proofRequired: ["Invoice", "Receipt", "Credit card statement showing charge"]
      },
      contract_labor: {
        line: "Schedule C Line 11",
        description: "Contract Labor Paid on Business",
        keywords: ["contractor", "freelance", "1099", "consultant", "freelancer", "independent contractor"],
        examples: ["Freelance videographer", "Independent editor", "Contract designer"],
        proofRequired: ["Form 1099", "Invoice from contractor", "Payment proof"]
      },
      depreciation: {
        line: "Schedule C Line 13",
        description: "Depreciable Assets on Business",
        keywords: ["equipment", "camera", "computer", "software", "hardware", "asset", "depreciation"],
        examples: ["Camera equipment", "Computers", "Editing software", "Studio equipment"],
        proofRequired: ["Purchase receipt", "Asset depreciation schedule"]
      },
      legal_professional: {
        line: "Schedule C Line 17",
        description: "Legal and Professional Services",
        keywords: ["legal", "lawyer", "attorney", "professional", "accounting", "cpa", "bookkeeping", "tax preparation"],
        examples: ["Legal consultation", "CPA services", "Business attorney fees"],
        proofRequired: ["Invoice", "Receipt", "Engagement letter"]
      },
      office_expenses: {
        line: "Schedule C Line 18",
        description: "Office Expenses",
        keywords: ["office", "supplies", "stationery", "printer", "ink", "paper", "pens", "folders"],
        examples: ["Office supplies", "Printer ink", "Paper", "Small office items"],
        proofRequired: ["Receipt", "Invoice", "Credit card statement"]
      },
      rent: {
        line: "Schedule C Line 20b",
        description: "Rent Expenses for Business Property",
        keywords: ["rent", "lease", "studio", "office space", "workspace", "coworking"],
        examples: ["Studio rent", "Office space lease", "Coworking membership"],
        proofRequired: ["Lease agreement", "Rent receipts", "Bank statements"]
      },
      travel: {
        line: "Schedule C Line 24a",
        description: "Travel Expenses",
        keywords: ["travel", "flight", "hotel", "airfare", "lodging", "uber", "lyft", "taxi", "transportation"],
        examples: ["Business flights", "Hotel stays", "Uber/Lyft for business", "Conference travel"],
        proofRequired: ["Receipts", "Travel log", "Business purpose documentation"]
      },
      utilities: {
        line: "Schedule C Line 25",
        description: "Utilities",
        keywords: ["utilities", "electricity", "gas", "water", "internet", "phone", "cell", "mobile"],
        examples: ["Internet service", "Phone bills", "Electricity for studio"],
        proofRequired: ["Utility bills", "Service statements"]
      },
      other_expenses: {
        line: "Schedule C Line 27",
        description: "Other Business Expenses",
        keywords: ["subscription", "software", "membership", "insurance", "bank fees", "miscellaneous", "beatport", "spotify", "apple", "music", "streaming", "audio", "sound", "track", "sample", "loop", "plugin", "vst", "daw", "ableton", "logic", "pro tools"],
        examples: ["Software subscriptions", "Professional memberships", "Bank fees", "Business insurance", "Music streaming services", "Audio software", "Sample libraries"],
        proofRequired: ["Receipts", "Invoices", "Statements"]
      }
    },
    totalBudget: 105903 // Total for Media Business
  },
  
  consulting: {
    name: "Consulting Business",
    categories: {
      advertising: {
        line: "Schedule C Line 8",
        description: "Advertising Expenses on Business",
        keywords: ["advertising", "marketing", "promotion", "linkedin ads", "professional marketing"],
        examples: ["LinkedIn ads", "Professional website", "Business cards"],
        proofRequired: ["Invoice", "Receipt", "Credit card statement"]
      },
      depreciation: {
        line: "Schedule C Line 13",
        description: "Depreciable Assets on Business",
        keywords: ["laptop", "computer", "equipment", "software", "office furniture"],
        examples: ["Laptop computer", "Office furniture", "Professional software"],
        proofRequired: ["Purchase receipt", "Asset depreciation schedule"]
      },
      legal_professional: {
        line: "Schedule C Line 17",
        description: "Legal and Professional Services",
        keywords: ["legal", "professional", "consulting", "accounting", "tax", "business formation"],
        examples: ["Business formation", "Contract review", "Tax preparation"],
        proofRequired: ["Invoice", "Receipt", "Professional service agreement"]
      },
      office_expenses: {
        line: "Schedule C Line 18",
        description: "Office Expenses",
        keywords: ["office", "supplies", "software", "computer accessories"],
        examples: ["Office supplies", "Software licenses", "Computer accessories"],
        proofRequired: ["Receipt", "Invoice"]
      },
      rent: {
        line: "Schedule C Line 20b",
        description: "Rent Expenses for Business Property",
        keywords: ["office rent", "coworking", "workspace", "meeting room"],
        examples: ["Coworking space", "Client meeting rooms", "Office rental"],
        proofRequired: ["Lease agreement", "Membership invoice", "Payment proof"]
      },
      travel: {
        line: "Schedule C Line 24a",
        description: "Travel Expenses",
        keywords: ["client travel", "business trip", "conference", "meeting travel"],
        examples: ["Client meetings", "Conference attendance", "Business development travel"],
        proofRequired: ["Receipts", "Travel log", "Meeting documentation"]
      },
      utilities: {
        line: "Schedule C Line 25",
        description: "Utilities",
        keywords: ["phone", "internet", "mobile", "communication"],
        examples: ["Business phone", "Internet service", "Video conferencing tools"],
        proofRequired: ["Service bills", "Statements"]
      },
      other_expenses: {
        line: "Schedule C Line 27",
        description: "Other Business Expenses",
        keywords: ["professional development", "training", "certification", "membership", "tools"],
        examples: ["Professional certifications", "Industry memberships", "Training courses"],
        proofRequired: ["Receipts", "Invoices", "Certificates"]
      }
    },
    totalBudget: 44794 // Total for Consulting Business
  }
}

// Helper function to detect business type from description
export function detectBusinessType(description: string): 'media' | 'consulting' | 'unknown' {
  const lowerDesc = description.toLowerCase()
  
  // Media business indicators
  const mediaKeywords = ['video', 'film', 'studio', 'camera', 'editing', 'production', 'creative', 'content', 'media', 'music', 'audio', 'sound', 'beatport', 'spotify', 'apple music', 'streaming', 'track', 'sample', 'plugin']
  
  // Consulting business indicators
  const consultingKeywords = ['consulting', 'advisory', 'strategy', 'analysis', 'client', 'professional services']
  
  const mediaScore = mediaKeywords.filter(keyword => lowerDesc.includes(keyword)).length
  const consultingScore = consultingKeywords.filter(keyword => lowerDesc.includes(keyword)).length
  
  if (mediaScore > consultingScore) return 'media'
  if (consultingScore > mediaScore) return 'consulting'
  return 'unknown'
}

// Helper function to find matching category
export function findMatchingCategory(
  description: string, 
  businessType?: 'media' | 'consulting'
): { category: string; confidence: number; businessType: string } | null {
  const lowerDesc = description.toLowerCase()
  let bestMatch = { category: '', confidence: 0, businessType: '' }
  
  // Check both business types if not specified
  const businessTypes = businessType ? [businessType] : ['media', 'consulting'] as const
  
  for (const bType of businessTypes) {
    const categories = TAX_CATEGORIES[bType].categories
    
    for (const [categoryKey, category] of Object.entries(categories)) {
      let score = 0
      
      // Check keywords
      for (const keyword of category.keywords) {
        if (lowerDesc.includes(keyword)) {
          score += keyword.split(' ').length // Multi-word keywords get higher score
        }
      }
      
      // Check examples
      for (const example of category.examples) {
        if (lowerDesc.includes(example.toLowerCase())) {
          score += 2 // Examples are more specific, so higher weight
        }
      }
      
      if (score > bestMatch.confidence) {
        bestMatch = {
          category: categoryKey,
          confidence: Math.min(score * 10, 100), // Convert to percentage, cap at 100
          businessType: bType
        }
      }
    }
  }
  
  return bestMatch.confidence > 0 ? bestMatch : null
}

// Get Schedule C line for a category
export function getScheduleCLine(businessType: 'media' | 'consulting', category: string): string {
  return TAX_CATEGORIES[businessType]?.categories[category]?.line || 'Unknown'
}

// Get all categories for a business type
export function getBusinessCategories(businessType: 'media' | 'consulting'): string[] {
  return Object.keys(TAX_CATEGORIES[businessType]?.categories || {})
}

// Export type definitions
export type BusinessType = 'media' | 'consulting'
export type TaxCategoryKey = keyof typeof TAX_CATEGORIES.media.categories 