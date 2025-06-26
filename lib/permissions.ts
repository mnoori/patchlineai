/**
 * Patchline – Modular Feature Permission System (UTF-8)
 * ----------------------------------------------------
 * 1. Tier names reflect music-industry terminology.
 * 2. Entitlements are stored client-side for now; in production these
 *    should come from the JWT/session.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

/* ------------------------------------------------------------------
 *  ENUMS & TYPES
 * ---------------------------------------------------------------- */

// Tiers (music-industry wording)
export enum UserTier {
  HOBBY = "hobby",            // Solo artists / small teams
  PRO = "pro",                // Indie managers, small labels, festivals
  ULTRA = "ultra",            // Mid-large labels, rights cos., promoters
  GOD_MODE = "god_mode"        // Internal / power user
}

// All discrete capabilities in the product
export enum FeatureId {
  // Core
  DASHBOARD = "dashboard",
  CATALOG = "catalog",
  RELEASES = "releases",
  CONTENT = "content",
  INSIGHTS = "insights",
  SETTINGS = "settings",
  HELP = "help",

  // Agents (add-ons)
  SCOUT_AGENT = "scout_agent",
  LEGAL_AGENT = "legal_agent",
  METADATA_AGENT = "metadata_agent",
  FAN_AGENT = "fan_agent",
  MARKETPLACE_AGENT = "marketplace_agent",
  EDUCATION_AGENT = "education_agent",

  // God-Mode
  GOD_MODE_ACCESS = "god_mode_access",
  DOCUMENT_PROCESSING = "document_processing",
  AI_HR_RECRUITER = "ai_hr_recruiter",
  NEWSLETTER_GENERATOR = "newsletter_generator"
}

export enum FeatureType {
  CORE = "core",
  AGENT = "agent",
  GOD_MODE = "god_mode",
  ADDON = "addon"
}

export interface Feature {
  id: FeatureId
  name: string
  description: string
  type: FeatureType
  route?: string
}

/* ------------------------------------------------------------------
 *  FEATURE CATALOG  (single source of truth)
 * ---------------------------------------------------------------- */
export const FEATURE_CATALOG: Record<FeatureId, Feature> = {
  [FeatureId.DASHBOARD]: {
    id: FeatureId.DASHBOARD,
    name: "Dashboard",
    description: "Main overview",
    type: FeatureType.CORE,
    route: "/dashboard"
  },
  [FeatureId.CATALOG]: {
    id: FeatureId.CATALOG,
    name: "Catalog",
    description: "Track & release catalog",
    type: FeatureType.CORE,
    route: "/dashboard/catalog"
  },
  [FeatureId.RELEASES]: {
    id: FeatureId.RELEASES,
    name: "Releases",
    description: "Release scheduling",
    type: FeatureType.CORE,
    route: "/dashboard/releases"
  },
  [FeatureId.CONTENT]: {
    id: FeatureId.CONTENT,
    name: "Content",
    description: "Content creation",
    type: FeatureType.CORE,
    route: "/dashboard/content"
  },
  [FeatureId.INSIGHTS]: {
    id: FeatureId.INSIGHTS,
    name: "Insights",
    description: "Analytics & KPIs",
    type: FeatureType.CORE,
    route: "/dashboard/insights"
  },
  [FeatureId.SETTINGS]: {
    id: FeatureId.SETTINGS,
    name: "Settings",
    description: "Account settings",
    type: FeatureType.CORE,
    route: "/dashboard/settings"
  },
  [FeatureId.HELP]: {
    id: FeatureId.HELP,
    name: "Help",
    description: "Support & docs",
    type: FeatureType.CORE,
    route: "/dashboard/help"
  },
  // Agents
  [FeatureId.SCOUT_AGENT]: {
    id: FeatureId.SCOUT_AGENT,
    name: "Scout Agent",
    description: "AI talent scouting",
    type: FeatureType.AGENT,
    route: "/dashboard/agents/scout"
  },
  [FeatureId.LEGAL_AGENT]: {
    id: FeatureId.LEGAL_AGENT,
    name: "Legal Agent",
    description: "Contract review",
    type: FeatureType.AGENT,
    route: "/dashboard/agents/legal"
  },
  [FeatureId.METADATA_AGENT]: {
    id: FeatureId.METADATA_AGENT,
    name: "Metadata Agent",
    description: "Metadata optimisation",
    type: FeatureType.AGENT,
    route: "/dashboard/agents/metadata"
  },
  [FeatureId.FAN_AGENT]: {
    id: FeatureId.FAN_AGENT,
    name: "Fan Agent",
    description: "Fan engagement",
    type: FeatureType.AGENT,
    route: "/dashboard/agents/fan"
  },
  [FeatureId.MARKETPLACE_AGENT]: {
    id: FeatureId.MARKETPLACE_AGENT,
    name: "Marketplace Agent",
    description: "DSP / marketplace",
    type: FeatureType.AGENT,
    route: "/dashboard/agents/marketplace"
  },
  [FeatureId.EDUCATION_AGENT]: {
    id: FeatureId.EDUCATION_AGENT,
    name: "Education Agent",
    description: "Learning & training",
    type: FeatureType.AGENT,
    route: "/dashboard/agents/education"
  },
  // God-Mode feature toggle (unlocks hidden labs)
  [FeatureId.GOD_MODE_ACCESS]: {
    id: FeatureId.GOD_MODE_ACCESS,
    name: "God Mode",
    description: "Internal power tools",
    type: FeatureType.GOD_MODE,
    route: "/dashboard/god-mode"
  },
  [FeatureId.DOCUMENT_PROCESSING]: {
    id: FeatureId.DOCUMENT_PROCESSING,
    name: "Document Processing",
    description: "AI doc analysis",
    type: FeatureType.GOD_MODE
  },
  [FeatureId.AI_HR_RECRUITER]: {
    id: FeatureId.AI_HR_RECRUITER,
    name: "AI HR Recruiter",
    description: "LinkedIn talent search",
    type: FeatureType.GOD_MODE
  },
  [FeatureId.NEWSLETTER_GENERATOR]: {
    id: FeatureId.NEWSLETTER_GENERATOR,
    name: "Newsletter Generator",
    description: "Automated newsletters",
    type: FeatureType.GOD_MODE
  }
}

/* ------------------------------------------------------------------
 *  DEFAULT ENTITLEMENTS PER TIER
 * ---------------------------------------------------------------- */
export const TIER_FEATURES: Record<UserTier, FeatureId[]> = {
  /* CREATOR – free / low-cost */
  [UserTier.HOBBY]: [
    FeatureId.DASHBOARD,
    FeatureId.CATALOG,
    FeatureId.RELEASES,
    FeatureId.CONTENT,
    FeatureId.SETTINGS,
    FeatureId.HELP,
    FeatureId.FAN_AGENT,
    FeatureId.MARKETPLACE_AGENT
  ],

  /* ROSTER – growth */
  [UserTier.PRO]: [
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

  /* ENTERPRISE – scale */
  [UserTier.ULTRA]: [
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

  /* GOD_MODE – internal tools */
  [UserTier.GOD_MODE]: [
    ...Object.values(FeatureId)
  ]
}

/* ------------------------------------------------------------------
 *  QUOTAS / LIMITS PER TIER (v1) – used for seat & usage gating
 * ---------------------------------------------------------------- */
export interface TierLimits {
  maxSeats?: number | null
  catalogTrackLimit?: number | null
  agentActionsPerDay?: number | null
  marketplaceCreditsPerMonth?: number | null
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  [UserTier.HOBBY]: {
    maxSeats: 1,
    catalogTrackLimit: 50,
    agentActionsPerDay: 3,
    marketplaceCreditsPerMonth: 0
  },
  [UserTier.PRO]: {
    maxSeats: 5,
    catalogTrackLimit: 5000,
    agentActionsPerDay: null, // Unlimited
    marketplaceCreditsPerMonth: 10
  },
  [UserTier.ULTRA]: {
    maxSeats: null, // Unlimited
    catalogTrackLimit: null,
    agentActionsPerDay: null,
    marketplaceCreditsPerMonth: 30
  },
  [UserTier.GOD_MODE]: {
    maxSeats: null,
    catalogTrackLimit: null,
    agentActionsPerDay: null,
    marketplaceCreditsPerMonth: null
  }
}

/* ------------------------------------------------------------------
 *  STORE (temporary client-side until JWT feeds it)
 * ---------------------------------------------------------------- */
export interface User {
  id: string
  email: string
  tier: UserTier
  purchasedFeatures: FeatureId[]
  godModeActivated?: boolean
}

interface PermissionStore {
  user: User | null
  setUser: (u: User | null) => void
  hasFeature: (f: FeatureId) => boolean
  getAvailableFeatures: () => FeatureId[]
  getLimit: (key: keyof TierLimits) => number | null | undefined
  activateGodMode: (password: string) => boolean
  deactivateGodMode: () => void
}

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),

      /* Does the user own this feature? */
      hasFeature: (f) => {
        const { user } = get()
        if (!user) return false
        const tier = normalizeTier(user.tier as string)
        if (TIER_FEATURES[tier]?.includes(f)) return true
        if (user.purchasedFeatures?.includes(f)) return true
        if (user.tier === UserTier.GOD_MODE && user.godModeActivated) {
          return FEATURE_CATALOG[f]?.type === FeatureType.GOD_MODE
        }
        return false
      },

      /* All features currently available */
      getAvailableFeatures: () => {
        const { user } = get()
        if (!user) return []
        const tier = normalizeTier(user.tier as string)
        const setAll = new Set<FeatureId>([
          ...(TIER_FEATURES[tier] || []),
          ...(user.purchasedFeatures || [])
        ])
        if (user.tier === UserTier.GOD_MODE && user.godModeActivated) {
          Object.values(FeatureId).forEach((fid) => {
            if (FEATURE_CATALOG[fid]?.type === FeatureType.GOD_MODE) setAll.add(fid)
          })
        }
        return Array.from(setAll)
      },

      /* Tier limit getter */
      getLimit: (key) => {
        const { user } = get()
        if (!user) return undefined
        const tier = normalizeTier(user.tier as string)
        return TIER_LIMITS[tier]?.[key]
      },

      /* Simple PW gate (dev only) */
      activateGodMode: (pw) => {
        const { user } = get()
        if (!user || user.tier !== UserTier.GOD_MODE) return false
        if (pw !== "patchline-god-mode-2024") return false
        set({ user: { ...user, godModeActivated: true } })
        return true
      },
      deactivateGodMode: () => {
        const { user } = get()
        if (!user) return
        set({ user: { ...user, godModeActivated: false } })
      }
    }),
    { name: "patchline-permissions" }
  )
)

/* ------------------------------------------------------------------
 *  CONVENIENCE HOOK – SAME API AS BEFORE
 * ---------------------------------------------------------------- */
export function usePermissions() {
  const store = usePermissionStore()
  return {
    user: store.user,
    setUser: store.setUser,
    hasFeature: store.hasFeature,
    getAvailableFeatures: store.getAvailableFeatures,
    getLimit: store.getLimit,
    activateGodMode: store.activateGodMode,
    deactivateGodMode: store.deactivateGodMode
  }
}

// Utility – map legacy tier names to new ones
function normalizeTier(tier: string): UserTier {
  switch (tier) {
    // Legacy / alias mapping
    case "free":
    case "creator":
      return UserTier.HOBBY
    case "indie":
    case "professional":
    case "roster":
      return UserTier.PRO
    case "label":
    case "enterprise":
      return UserTier.ULTRA
    case "hobby":
      return UserTier.HOBBY
    case "pro":
      return UserTier.PRO
    case "ultra":
      return UserTier.ULTRA
    default:
      return (Object.values(UserTier) as string[]).includes(tier) ? (tier as UserTier) : UserTier.HOBBY
  }
}
