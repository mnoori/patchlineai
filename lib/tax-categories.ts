/**
 * Tax Category Configuration for Schedule C Business Expenses
 * Optimized for AI/Tech Companies
 */

export interface TaxCategory {
  line: string
  description: string
  keywords: string[]
  examples: string[]
  proofRequired: string[]
}

// IRS Schedule C categories for AI/Tech businesses
export const TAX_CATEGORIES: Record<string, TaxCategory> = {
  advertising: {
    line: "Schedule C Line 8",
    description: "Advertising and Marketing",
    keywords: ["advertising", "marketing", "promotion", "ads", "google ads", "facebook", "linkedin", "social media", "seo", "sem"],
    examples: ["Google Ads", "Facebook Ads", "LinkedIn promotions", "Marketing campaigns", "SEO services"],
    proofRequired: ["Invoice", "Receipt", "Credit card statement"]
  },
  
  car_and_truck: {
    line: "Schedule C Line 9",
    description: "Car and Truck Expenses",
    keywords: ["uber", "lyft", "taxi", "car rental", "mileage", "parking", "tolls", "gas"],
    examples: ["Uber/Lyft rides", "Business mileage", "Parking fees", "Tolls"],
    proofRequired: ["Receipts", "Mileage log", "Trip purpose"]
  },
  
  contract_labor: {
    line: "Schedule C Line 11",
    description: "Contract Labor",
    keywords: ["contractor", "freelance", "1099", "consultant", "developer", "designer"],
    examples: ["Freelance developers", "Contract designers", "Independent consultants"],
    proofRequired: ["Form 1099", "Invoice", "Contract"]
  },
  
  depreciation: {
    line: "Schedule C Line 13",
    description: "Depreciation and Section 179",
    keywords: ["equipment", "computer", "laptop", "monitor", "camera", "furniture", "hardware"],
    examples: ["Computers", "Studio equipment", "Office furniture", "Cameras", "High-end monitors"],
    proofRequired: ["Purchase receipt", "Asset list"]
  },
  
  insurance: {
    line: "Schedule C Line 15",
    description: "Insurance (other than health)",
    keywords: ["insurance", "liability", "professional", "business insurance", "e&o", "cyber"],
    examples: ["Professional liability", "Business insurance", "Cyber insurance", "E&O insurance"],
    proofRequired: ["Policy documents", "Premium statements"]
  },
  
  interest: {
    line: "Schedule C Line 16",
    description: "Interest on Business Loans",
    keywords: ["interest", "loan", "credit card interest", "business loan", "line of credit", "interest charge", "interest charged", "finance charge"],
    examples: ["Business credit card interest", "Business loan interest", "Equipment financing", "Interest charged on credit cards", "Finance charges"],
    proofRequired: ["Loan statements", "Interest statements", "Credit card statements"]
  },
  
  legal_professional: {
    line: "Schedule C Line 17",
    description: "Legal and Professional Services",
    keywords: ["legal", "lawyer", "attorney", "accounting", "cpa", "bookkeeping", "tax"],
    examples: ["Legal fees", "CPA services", "Tax preparation", "Business formation"],
    proofRequired: ["Invoice", "Receipt", "Engagement letter"]
  },
  
  office_expenses: {
    line: "Schedule C Line 18",
    description: "Office Expenses",
    keywords: ["office", "supplies", "stationery", "printer", "ink", "paper", "small items"],
    examples: ["Office supplies", "Printer ink", "Paper", "Pens", "Notebooks"],
    proofRequired: ["Receipt", "Invoice"]
  },
  
  rent_lease: {
    line: "Schedule C Line 20b",
    description: "Rent or Lease",
    keywords: ["rent", "lease", "studio", "office", "workspace", "coworking"],
    examples: ["Studio rent", "Office lease", "Coworking space", "Storage unit"],
    proofRequired: ["Lease agreement", "Rent receipts"]
  },
  
  repairs_maintenance: {
    line: "Schedule C Line 21",
    description: "Repairs and Maintenance",
    keywords: ["repair", "maintenance", "fix", "service", "cleaning"],
    examples: ["Equipment repairs", "Computer maintenance", "Office cleaning"],
    proofRequired: ["Service receipts", "Repair invoices"]
  },
  
  supplies: {
    line: "Schedule C Line 22",
    description: "Supplies (not office)",
    keywords: ["supplies", "materials", "production", "packaging", "shipping supplies"],
    examples: ["Packaging materials", "Shipping supplies", "Production materials"],
    proofRequired: ["Receipts", "Invoices"]
  },
  
  taxes_licenses: {
    line: "Schedule C Line 23",
    description: "Taxes and Licenses",
    keywords: ["tax", "license", "permit", "registration", "business license", "state tax"],
    examples: ["Business licenses", "Permits", "State taxes", "City registrations"],
    proofRequired: ["Tax notices", "License documents"]
  },
  
  travel: {
    line: "Schedule C Line 24a",
    description: "Travel",
    keywords: ["travel", "flight", "hotel", "airfare", "lodging", "conference", "business trip"],
    examples: ["Business flights", "Hotel stays", "Conference travel", "Client meetings"],
    proofRequired: ["Receipts", "Travel log", "Business purpose"]
  },
  
  meals: {
    line: "Schedule C Line 24b",
    description: "Deductible Meals",
    keywords: ["meal", "food", "restaurant", "lunch", "dinner", "coffee", "business meal"],
    examples: ["Client meals", "Business lunches", "Team dinners", "Coffee meetings"],
    proofRequired: ["Receipt with business purpose", "Attendees noted"]
  },
  
  utilities: {
    line: "Schedule C Line 25",
    description: "Utilities",
    keywords: ["utilities", "electricity", "gas", "water", "internet", "phone", "cell"],
    examples: ["Internet service", "Phone bills", "Electricity", "Water"],
    proofRequired: ["Utility bills", "Service statements"]
  },
  
  wages: {
    line: "Schedule C Line 26",
    description: "Wages (W-2 employees)",
    keywords: ["wages", "salary", "payroll", "employee", "w2", "compensation"],
    examples: ["Employee salaries", "Wages", "Payroll"],
    proofRequired: ["Payroll records", "W-2 forms"]
  },
  
  other_expenses: {
    line: "Schedule C Line 27a",
    description: "Other Expenses",
    keywords: ["subscription", "software", "saas", "membership", "bank fee", "transaction fee", "processing fee", "miscellaneous"],
    examples: ["Software subscriptions", "Professional memberships", "Bank fees", "Transaction fees"],
    proofRequired: ["Receipts", "Invoices", "Statements"]
  },
  
  platform_expenses: {
    line: "Schedule C Line 27a",
    description: "Platform & API Expenses",
    keywords: ["platform", "api", "cloud", "hosting", "server", "compute", "storage", "bandwidth", "usage", "credits"],
    examples: ["AWS/Azure/GCP charges", "API usage fees", "Cloud hosting", "Platform subscriptions", "Compute resources"],
    proofRequired: ["Platform invoices", "Usage statements", "Cloud bills"]
  },
  
  home_office: {
    line: "Schedule C Line 30",
    description: "Home Office Expenses",
    keywords: ["home office", "home", "residential", "workspace"],
    examples: ["Home office deduction", "Portion of home expenses"],
    proofRequired: ["Home office calculation", "Square footage", "Total home expenses"]
  }
}

// Platform and software subcategories for AI companies
export const AI_PLATFORM_SUBCATEGORIES = {
  cloud_infrastructure: ["aws", "google cloud", "azure", "digitalocean", "heroku", "vercel"],
  ai_platforms: ["openai", "anthropic", "cohere", "hugging face", "replicate", "together ai"],
  development_tools: ["github", "gitlab", "jira", "linear", "notion", "slack", "figma"],
  monitoring: ["datadog", "sentry", "logdna", "new relic", "pingdom"],
  databases: ["mongodb", "postgresql", "redis", "elasticsearch", "pinecone"],
  analytics: ["mixpanel", "amplitude", "segment", "google analytics", "hotjar"],
  communication: ["twilio", "sendgrid", "mailgun", "intercom", "zendesk"],
  payment_processing: ["stripe", "paypal", "square", "plaid"],
  security: ["auth0", "okta", "1password", "lastpass", "cloudflare"],
  content_delivery: ["cloudinary", "imgix", "fastly", "akamai"],
  testing: ["browserstack", "cypress", "postman", "insomnia"],
  other_saas: ["zoom", "calendly", "docusign", "hubspot", "salesforce"]
}

// Helper function to find matching category
export function findMatchingCategory(description: string): { 
  category: string; 
  confidence: number; 
  scheduleCLine?: string 
} | null {
  const lowerDesc = description.toLowerCase()
  let bestMatch = { category: '', confidence: 0, scheduleCLine: '' }
  
  for (const [categoryKey, category] of Object.entries(TAX_CATEGORIES)) {
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
    
    // Special handling for AI platforms
    if (categoryKey === 'other_expenses') {
      for (const [subcat, platforms] of Object.entries(AI_PLATFORM_SUBCATEGORIES)) {
        for (const platform of platforms) {
          if (lowerDesc.includes(platform)) {
            score += 3 // High confidence for known platforms
          }
        }
      }
    }
    
    if (score > bestMatch.confidence) {
      bestMatch = {
        category: categoryKey,
        confidence: Math.min(score * 10, 100), // Convert to percentage, cap at 100
        scheduleCLine: category.line
      }
    }
  }
  
  return bestMatch.confidence > 0 ? bestMatch : null
}

// Get Schedule C line for a category
export function getScheduleCLine(category: string): string {
  return TAX_CATEGORIES[category]?.line || 'Schedule C Line 27a'
}

// Get all categories
export function getAllCategories(): string[] {
  return Object.keys(TAX_CATEGORIES)
}

// Export custom categories from localStorage
export function getCustomCategories(): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('customTaxCategories')
  return stored ? JSON.parse(stored) : []
}

// Save custom category
export function saveCustomCategory(category: string) {
  if (typeof window === 'undefined') return
  const existing = getCustomCategories()
  if (!existing.includes(category)) {
    existing.push(category)
    localStorage.setItem('customTaxCategories', JSON.stringify(existing))
  }
}

// Export type definitions
export type TaxCategoryKey = keyof typeof TAX_CATEGORIES 