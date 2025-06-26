export type AgentKey = "aria" | "scout" | "legal" | "growth"

export interface AgentConfig {
  key: AgentKey
  displayName: string
  gradientClass: string
  avatarUrl?: string
  model?: string
}

export const AGENTS: Record<AgentKey, AgentConfig> = {
  aria: {
    key: "aria",
    displayName: "ARIA",
    gradientClass:
      "bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent",
    avatarUrl: "/avatars/aria.png",
    model: "gpt-4o",
  },
  scout: {
    key: "scout",
    displayName: "Scout",
    gradientClass:
      "bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 bg-clip-text text-transparent",
  },
  legal: {
    key: "legal",
    displayName: "Legal",
    gradientClass:
      "bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 bg-clip-text text-transparent",
  },
  growth: {
    key: "growth",
    displayName: "Growth",
    gradientClass:
      "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent",
  },
}

export const DEFAULT_AGENT = AGENTS.aria; 