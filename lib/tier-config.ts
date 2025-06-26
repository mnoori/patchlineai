/**
 * Single Source of Truth for Tier Configuration
 * This file defines all tier-related data used across:
 * - Pricing pages
 * - Permission system
 * - Billing/Settings
 * - User onboarding
 */

import { UserTier, FeatureId } from './permissions'

export { UserTier } from './permissions'

export interface TierConfig {
  id: UserTier
  name: string
  tagline: string
  description: string
  price: {
    monthly: number
    yearly: number
    currency: string
  }
  features: string[] // Marketing features for pricing page
  technicalFeatures: FeatureId[] // Actual feature IDs for permissions
  limits: {
    seats: number | null
    catalogTracks: number | null
    agentActionsPerDay: number | null
    agentActionsPerMonth: number | null
    marketplaceCreditsPerMonth: number | null
  }
  personas: string[]
  highlighted?: boolean
  ctaText: string
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  [UserTier.HOBBY]: {
    id: UserTier.HOBBY,
    name: "Hobby",
    tagline: "For solo artists & emerging talent",
    description: "Perfect for artists starting their journey with essential tools for catalog management, fan engagement, and release planning",
    price: {
      monthly: 0,
      yearly: 0,
      currency: "USD"
    },
    features: [
      "Track & catalog manager (up to 50 tracks)",
      "100 AI agent actions per month",
      "Release planning & scheduling",
      "Fan engagement tools",
      "Marketplace access",
      "Basic analytics dashboard"
    ],
    technicalFeatures: [
      FeatureId.DASHBOARD,
      FeatureId.CATALOG,
      FeatureId.RELEASES,
      FeatureId.CONTENT,
      FeatureId.SETTINGS,
      FeatureId.HELP,
      FeatureId.FAN_AGENT,
      FeatureId.MARKETPLACE_AGENT
    ],
    limits: {
      seats: 1,
      catalogTracks: 50,
      agentActionsPerDay: null, // Now using monthly limit
      agentActionsPerMonth: 100,
      marketplaceCreditsPerMonth: 0
    },
    personas: [
      "Solo artists",
      "Bedroom producers",
      "Content creators",
      "Aspiring music entrepreneurs"
    ],
    ctaText: "Start Free"
  },
  
  [UserTier.PRO]: {
    id: UserTier.PRO,
    name: "Pro",
    tagline: "For managers, small labels & venues",
    description: "Pro plan covers artist managers and small venues or festival ops juggling multiple stages",
    price: {
      monthly: 59,
      yearly: 590,
      currency: "USD"
    },
    features: [
      "Everything in Hobby, plus:",
      "5 team seats (+ $9/additional seat)",
      "1,000 AI agent actions per month",
      "Advanced release management",
      "AI marketing kit (artwork, copy, social calendar)",
      "Legal & Scout agents",
      "Metadata optimization",
      "10 marketplace credits/month",
      "Up to 5,000 tracks"
    ],
    technicalFeatures: [
      FeatureId.DASHBOARD,
      FeatureId.CATALOG,
      FeatureId.RELEASES,
      FeatureId.CONTENT,
      FeatureId.INSIGHTS,
      FeatureId.SETTINGS,
      FeatureId.HELP,
      FeatureId.FAN_AGENT,
      FeatureId.MARKETPLACE_AGENT,
      FeatureId.METADATA_AGENT,
      FeatureId.LEGAL_AGENT,
      FeatureId.SCOUT_AGENT
    ],
    limits: {
      seats: 5,
      catalogTracks: 5000,
      agentActionsPerDay: null, // Now using monthly limit
      agentActionsPerMonth: 1000,
      marketplaceCreditsPerMonth: 10
    },
    personas: [
      "Indie managers (2-10 artists)",
      "Small record labels",
      "Boutique festivals",
      "Multi-tasking creators",
      "Growing production houses"
    ],
    highlighted: true,
    ctaText: "Start 14-Day Trial"
  },
  
  [UserTier.ULTRA]: {
    id: UserTier.ULTRA,
    name: "Ultra",
    tagline: "For labels, publishers & promoters",
    description: "Built for established companies managing large rosters and complex operations",
    price: {
      monthly: 200,
      yearly: 2000,
      currency: "USD"
    },
    features: [
      "Everything in Pro, plus:",
      "Unlimited seats & custom roles",
      "Unlimited AI agent actions",
      "Bulk catalog import & management",
      "Contract vault with e-signatures",
      "White-label artist portals",
      "Dedicated AI instance",
      "Priority support & SLA",
      "30 marketplace credits/month"
    ],
    technicalFeatures: [
      FeatureId.DASHBOARD,
      FeatureId.CATALOG,
      FeatureId.RELEASES,
      FeatureId.CONTENT,
      FeatureId.INSIGHTS,
      FeatureId.SETTINGS,
      FeatureId.HELP,
      FeatureId.SCOUT_AGENT,
      FeatureId.LEGAL_AGENT,
      FeatureId.METADATA_AGENT,
      FeatureId.FAN_AGENT,
      FeatureId.MARKETPLACE_AGENT,
      FeatureId.EDUCATION_AGENT
    ],
    limits: {
      seats: null, // Unlimited
      catalogTracks: null, // Unlimited
      agentActionsPerDay: null, // Unlimited
      agentActionsPerMonth: null, // Unlimited
      marketplaceCreditsPerMonth: 30
    },
    personas: [
      "Established record labels (10-50+ artists)",
      "Music publishing companies",
      "Entertainment groups",
      "Multi-stage festival promoters",
      "Rights management companies"
    ],
    ctaText: "Contact Sales"
  },
  
  [UserTier.GOD_MODE]: {
    id: UserTier.GOD_MODE,
    name: "God Mode",
    tagline: "Internal power tools",
    description: "Special tier for Patchline team and beta testers",
    price: {
      monthly: 0,
      yearly: 0,
      currency: "USD"
    },
    features: [
      "All features unlocked",
      "Experimental tools",
      "Debug capabilities",
      "Admin controls"
    ],
    technicalFeatures: Object.values(FeatureId),
    limits: {
      seats: null,
      catalogTracks: null,
      agentActionsPerDay: null,
      agentActionsPerMonth: null,
      marketplaceCreditsPerMonth: null
    },
    personas: ["Internal team"],
    ctaText: "Internal Only"
  }
}

// Helper functions
export function getTierConfig(tier: UserTier): TierConfig {
  return TIER_CONFIGS[tier]
}

export function getTierByPrice(monthlyPrice: number): UserTier | null {
  const tier = Object.values(TIER_CONFIGS).find(
    config => config.price.monthly === monthlyPrice
  )
  return tier?.id || null
}

export function getUpgradePath(currentTier: UserTier): UserTier[] {
  const tierOrder = [UserTier.HOBBY, UserTier.PRO, UserTier.ULTRA]
  const currentIndex = tierOrder.indexOf(currentTier)
  return currentIndex >= 0 ? tierOrder.slice(currentIndex + 1) : []
} 