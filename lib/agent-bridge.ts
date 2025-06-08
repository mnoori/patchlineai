import { toast } from "@/components/ui/use-toast"

export interface AgentHandoff {
  from: string
  to: string
  payload: any
  timestamp: Date
}

export interface AgentAction {
  id: string
  type: "handoff" | "task" | "automation"
  status: "pending" | "running" | "success" | "error"
  message: string
  progress?: number
}

// Agent handoff utility
export function handoff(from: string, to: string, payload: any = {}) {
  const handoffData: AgentHandoff = {
    from,
    to,
    payload,
    timestamp: new Date(),
  }

  // Show handoff toast
  toast({
    title: `Handing off to ${to}...`,
    description: `Transferring data from ${from} Agent`,
    duration: 2000,
  })

  // Store handoff data for the receiving agent
  if (typeof window !== "undefined") {
    sessionStorage.setItem("agentHandoff", JSON.stringify(handoffData))
  }

  // Navigate to target agent
  const routes: Record<string, string> = {
    Scout: "/dashboard/agents/scout",
    Metadata: "/dashboard/agents/metadata",
    Fan: "/dashboard/agents/fan",
    Legal: "/dashboard/agents/legal",
    Marketplace: "/dashboard/agents/marketplace",
    PlaylistMatcher: "/dashboard/agents/playlist-matcher",
    StemSeparator: "/dashboard/agents/stem-separator",
    RemixMatchmaker: "/dashboard/agents/remix-matchmaker",
  }

  const targetRoute = routes[to]
  if (targetRoute) {
    // Simulate navigation (in real app, use Next.js router)
    setTimeout(() => {
      window.location.href = targetRoute
    }, 1000)
  }
}

// Task progress utility
export function showTaskProgress(task: string, onComplete?: () => void) {
  let progress = 0
  const interval = setInterval(() => {
    progress += Math.random() * 20
    if (progress >= 100) {
      clearInterval(interval)
      toast({
        title: "✅ Task Complete",
        description: task,
        duration: 3000,
      })
      onComplete?.()
    } else {
      toast({
        title: `⚡ ${Math.round(progress)}% Complete`,
        description: task,
        duration: 1000,
      })
    }
  }, 800)
}

// Quick agent actions
export const AGENT_QUICK_ACTIONS = {
  Scout: {
    primary: "Discover New Talent",
    automations: [
      "Scan trending playlists",
      "Analyze growth metrics",
      "Generate weekly report",
      "Update watchlist scores",
    ],
  },
  Metadata: {
    primary: "Auto-Fix Issues",
    automations: ["Complete missing fields", "Validate ISRC codes", "Generate instrumentals", "Sync to platforms"],
  },
  Fan: {
    primary: "Generate Content",
    automations: [
      "Schedule weekly posts",
      "Analyze engagement trends",
      "Create campaign ideas",
      "Update audience insights",
    ],
  },
  Legal: {
    primary: "Review Contracts",
    automations: ["Check expiring contracts", "Flag risky clauses", "Generate renewals", "Update compliance status"],
  },
  Blockchain: {
    primary: "Send SOL Payment",
    automations: [
      "Check wallet balance",
      "Send to Coinbase",
      "Validate addresses", 
      "Monitor transactions"
    ],
  },
  Marketplace: {
    primary: "Discover Agents",
    automations: ["Check for updates", "Recommend new agents", "Optimize workflows", "Generate usage reports"],
  },
}
