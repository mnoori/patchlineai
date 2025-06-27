"use client"

export const dynamic = 'force-dynamic'

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  DashboardHeader, 
  DashboardGrid, 
  DashboardCard, 
  DashboardStat,
  DashboardTabs,
  DashboardSection 
} from '@/components/brand/dashboard'
import { GradientOrbs, PageGradient, Card as BrandCard } from '@/components/brand'
import {
  Activity,
  AlertCircle,
  BarChart2,
  Music2,
  Search,
  FileText,
  Users,
  Database,
  ArrowUpRight,
  Zap,
  Info,
  X,
  Store,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Bell,
  Mail,
  CalendarIcon,
  Instagram,
  Youtube,
  AirplayIcon as Spotify,
  Apple,
  Twitter,
  Facebook,
} from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { TimeCapsuleFeed } from "@/components/dashboard/time-capsule-feed"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fetchDashboardData, platformsAPI } from "@/lib/api-client"
import { usePlatformConnections } from "@/hooks/use-platform-connections"
import { WalletBalance } from '@/components/web3/wallet-balance'
import { useWeb3Store } from '@/lib/web3-store'
import { usePermissions } from '@/lib/permissions'
import nextDynamic from 'next/dynamic'

// Add DollarSign component before DashboardPage
function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
}

// Compact Horizontal Integrations Component
function IntegrationsPanel() {
  const [expanded, setExpanded] = useState(true) // Open by default
  const { platforms, loading, connectPlatform, getConnectedCount } = usePlatformConnections()
  
  const integrations = [
    {
      name: "Gmail",
      platform: "gmail",
      icon: <Mail className="h-4 w-4" />,
      connected: platforms.gmail?.connected || platforms.google?.connected || false,
      color: "from-red-500 to-red-600",
    },
    {
      name: "Google Calendar",
      platform: "google",
      icon: <CalendarIcon className="h-4 w-4" />,
      connected: platforms.google?.connected || false,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Spotify",
      platform: "spotify",
      icon: <Spotify className="h-4 w-4" />,
      connected: platforms.spotify?.connected || false,
      color: "from-green-500 to-green-600",
    },
    {
      name: "Apple Music",
      platform: "applemusic",
      icon: <Apple className="h-4 w-4" />,
      connected: platforms.applemusic?.connected || false,
      color: "from-gray-600 to-gray-700",
    },
    {
      name: "SoundCloud",
      platform: "soundcloud",
      icon: <Music2 className="h-4 w-4" />,
      connected: platforms.soundcloud?.connected || false,
      color: "from-orange-500 to-orange-600",
    },
    {
      name: "YouTube",
      platform: "youtube",
      icon: <Youtube className="h-4 w-4" />,
      connected: platforms.youtube?.connected || false,
      color: "from-red-600 to-red-700",
    },
    {
      name: "Instagram",
      platform: "instagram",
      icon: <Instagram className="h-4 w-4" />,
      connected: platforms.instagram?.connected || false,
      color: "from-pink-500 to-purple-600",
    },
    {
      name: "Twitter",
      platform: "twitter",
      icon: <Twitter className="h-4 w-4" />,
      connected: platforms.twitter?.connected || false,
      color: "from-blue-400 to-blue-500",
    },
    {
      name: "Facebook",
      platform: "facebook",
      icon: <Facebook className="h-4 w-4" />,
      connected: platforms.facebook?.connected || false,
      color: "from-blue-600 to-blue-700",
    },
  ]
  
  const connectedCount = integrations.filter(i => i.connected).length

  return (
    <BrandCard variant="gradient" hover="glow" className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-brand-cyan/10 p-1">
            <Settings className="h-4 w-4 text-brand-cyan" />
          </div>
          <h2 className="text-lg font-bold">Platform Integrations</h2>
          <Badge variant="secondary" className="h-5 px-2 text-xs">
            {connectedCount} of {integrations.length}
          </Badge>
          {/* Compact Progress Bar */}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <div className="w-16 h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-cyan to-brand-bright-blue transition-all duration-500"
                style={{ width: `${(connectedCount / integrations.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-brand-cyan font-medium">
              {Math.round((connectedCount / integrations.length) * 100)}%
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "max-h-36 opacity-100" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <div className="p-4">
          {/* Horizontal Scrollable Integrations */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className={cn(
                  "group relative flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 cursor-pointer w-[90px]", // Fixed width for all cards
                  integration.connected
                    ? "bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20"
                    : "bg-gradient-to-br from-gray-500/5 to-gray-600/5 border border-gray-500/20 hover:border-brand-cyan/40 hover:shadow-lg hover:shadow-brand-cyan/10",
                )}
              >
                {/* Icon with gradient background */}
                <div
                  className={cn(
                    "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                    integration.connected
                      ? `bg-gradient-to-br ${integration.color} text-white shadow-lg`
                      : "bg-gradient-to-br from-gray-400/20 to-gray-500/20 text-muted-foreground group-hover:from-brand-cyan/20 group-hover:to-brand-cyan/30 group-hover:text-brand-cyan",
                  )}
                >
                  {integration.icon}

                  {/* Connected indicator */}
                  {integration.connected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Platform name */}
                <span
                  className={cn(
                    "text-xs font-medium text-center transition-colors duration-300 leading-tight",
                    integration.connected ? "text-white" : "text-muted-foreground group-hover:text-brand-cyan",
                  )}
                >
                  {integration.name}
                </span>

                {/* Status indicator - more compact */}
                <div className="flex items-center justify-center">
                  {integration.connected ? (
                    <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">On</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 text-xs px-2 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan hover:text-black transition-all duration-300"
                      onClick={() => connectPlatform(integration.platform)}
                    >
                      +
                    </Button>
                  )}
                </div>

                {/* Hover glow effect */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    integration.connected
                      ? "bg-gradient-to-br from-green-400/5 to-green-600/5"
                      : "bg-gradient-to-br from-brand-cyan/5 to-brand-cyan/10",
                  )}
                ></div>
              </div>
            ))}

            {/* Add More Button - Keep this */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-brand-cyan/30 hover:border-brand-cyan/50 transition-all duration-300 cursor-pointer w-[90px] group">
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center group-hover:bg-brand-cyan/20 transition-colors">
                <Settings className="h-4 w-4 text-brand-cyan" />
              </div>
              <span className="text-xs font-medium text-brand-cyan">Add More</span>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
              >
                Manage All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10"
              >
                Settings
              </Button>
            </div>
            <Button
              size="sm"
              className="h-7 px-4 text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-black font-medium"
            >
              Connect Missing ({integrations.length - connectedCount})
            </Button>
          </div>
        </div>
      </div>
    </BrandCard>
  )
}

// Compact Release Card
function CompactReleaseCard({ release }: { release: any }) {
  return (
    <div className="flex items-center gap-3 group hover:bg-background/10 p-2 rounded-md transition-colors">
      <div className="relative w-12 h-12 flex-shrink-0">
        <img
          src={release.artwork || "/placeholder.svg"}
          alt={release.title}
          className="w-full h-full object-cover rounded-md"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white">
            <Music2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{release.title}</p>
        <p className="text-xs text-muted-foreground">{release.date}</p>
      </div>
      <div className="flex-shrink-0">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            release.status === "In Progress"
              ? "border-brand-cyan text-brand-cyan"
              : "border-amber-500 text-amber-500",
          )}
        >
          {release.status}
        </Badge>
      </div>
    </div>
  )
}

// Agent Tile Component with Progress and Quick Actions
function AgentTile({
  title,
  count,
  description,
  icon,
  href,
  actionLabel,
  actionOnClick,
  inTimeCapsule = false,
  progress = null,
  isEmpty = false,
}: {
  title: string
  count: string | number
  description: string
  icon: React.ReactNode
  href: string
  actionLabel: string
  actionOnClick: () => void
  inTimeCapsule?: boolean
  progress?: { current: number; total: number } | null
  isEmpty?: boolean
}) {
  const [showProgress, setShowProgress] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [showQuickAction, setShowQuickAction] = useState(false)
  const [actionComplete, setActionComplete] = useState(false)
  const [showUndo, setShowUndo] = useState(false)

  useEffect(() => {
    if (progress) {
      setShowProgress(true)
      setProgressValue((progress.current / progress.total) * 100)

      // Hide progress 3s after completion
      if (progress.current === progress.total) {
        const timer = setTimeout(() => {
          setShowProgress(false)
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [progress])

  const handleQuickAction = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    actionOnClick()
    setActionComplete(true)
    setShowUndo(true)

    // Hide undo after 5s
    setTimeout(() => {
      setShowUndo(false)
    }, 5000)
  }

  if (isEmpty) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-black/10 rounded-lg border border-white/10 hover:bg-black/20 transition-colors group">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">{title} All Clear</span>
      </div>
    )
  }

  return (
    <BrandCard
      variant="glass"
      hover="glow"
      className={cn(
        "transition-all duration-200 relative overflow-hidden group",
        inTimeCapsule ? "opacity-60 hover:opacity-100" : "",
      )}
      onMouseEnter={() => setShowQuickAction(true)}
      onMouseLeave={() => setShowQuickAction(false)}
    >
      {inTimeCapsule && (
        <div className="absolute top-2 right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-full bg-black/20 p-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Already in Time Capsule</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="p-4">
        <div className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {icon}
        </div>

        <div>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground">{description}</p>

          {showProgress && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{Math.round(progressValue)}%</span>
              </div>
              <Progress value={progressValue} className="h-1" />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 px-2 text-xs text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
              asChild
            >
              <Link href={href}>
                See details <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>

            {/* Quick Action Slide-in Button */}
            <div
              className={cn(
                "absolute inset-y-0 right-0 flex items-center transition-transform duration-200 ease-in-out",
                showQuickAction ? "transform translate-x-0" : "transform translate-x-full",
              )}
            >
              <Button
                size="sm"
                className="h-full rounded-l-none rounded-r-md bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                onClick={handleQuickAction}
                disabled={actionComplete}
              >
                {actionComplete ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> : null}
                {actionComplete ? "Done" : actionLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Undo Snackbar */}
      {showUndo && (
        <div className="fixed bottom-4 left-4 bg-background border border-border rounded-lg shadow-lg p-3 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-10">
          <span className="text-sm">{actionLabel} complete</span>
          <Button variant="outline" size="sm" onClick={() => setActionComplete(false)}>
            Undo
          </Button>
        </div>
      )}
    </BrandCard>
  )
}

// Critical Alert Banner Component
function CriticalAlertBanner({ alert, onDismiss, onAction }: any) {
  if (!alert) return null

  return (
    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 animate-in fade-in-50">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-500/20 p-1.5 mt-0.5">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-red-50">{alert.type}</h3>
              <p className="text-sm text-red-100/80 mt-1">{alert.message}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-200" onClick={() => onDismiss(alert.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button variant="ghost" size="sm" className="text-xs text-red-200 hover:text-red-100 hover:bg-red-500/20">
              See rationale
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-red-300 text-red-100 hover:bg-red-500/30"
              onClick={() => onAction(alert.id)}
            >
              {alert.action}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const RevenueLineChart = nextDynamic(() => import('@/components/dashboard/line-chart').then(m => m.RevenueLineChart), {
  ssr: false,
  suspense: true
})

export default function DashboardPage() {
  const { userId } = useCurrentUser()
  const [lastVisit, setLastVisit] = useState<Date | null>(null)
  const [showGreeting, setShowGreeting] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState("revenue")
  const [dashboardData, setDashboardData] = useState({
    revenue: 0,
    listeners: 0,
    engagement: 0,
  })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const { user } = usePermissions()
  const { settings: web3Settings, getActiveWallet } = useWeb3Store()
  const hasWallet = !!getActiveWallet()

  const [agentAlerts] = useState([
    {
      id: 1,
      type: "Trending Sound",
      message:
        "Lo-fi elements are gaining traction in your genre. Consider incorporating these elements in upcoming releases.",
      time: "Today",
      icon: <Zap className="h-4 w-4 text-brand-cyan" />,
      action: "Auto-Generate",
      severity: "medium",
    },
    {
      id: 2,
      type: "Playlist Opportunity",
      message:
        'Your track "Midnight Dreams" matches the profile for Spotify\'s "Late Night Vibes" playlist. We\'ve prepared a pitch.',
      time: "Yesterday",
      icon: <Music2 className="h-4 w-4 text-brand-cyan" />,
      action: "Auto-Pitch",
      severity: "medium",
    },
    {
      id: 3,
      type: "Contract Alert",
      message: 'Distribution agreement for "Summer Haze EP" expires in 6 days. Review our renewal recommendations.',
      time: "2 days ago",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      action: "Auto-Renew",
      severity: "high",
    },
    {
      id: 4,
      type: "Rights Management",
      message: 'We detected unclaimed royalties for "Night Drive" on YouTube. Click to review and claim.',
      time: "3 days ago",
      icon: <FileText className="h-4 w-4 text-red-500" />,
      action: "Auto-Claim",
      severity: "medium",
    },
  ])

  const upcomingReleases = [
    {
      title: "Summer EP",
      date: "June 15, 2025",
      status: "In Progress",
      artwork: "/placeholder.svg",
    },
    {
      title: "Remix Package",
      date: "July 22, 2025",
      status: "Scheduled",
      artwork: "/placeholder.svg",
    },
    {
      title: "Acoustic Sessions",
      date: "August 10, 2025",
      status: "Scheduled",
      artwork: "/placeholder.svg",
    },
    {
      title: "Collaboration EP",
      date: "September 5, 2025",
      status: "Scheduled",
      artwork: "/placeholder.svg",
    },
  ]

  const [connectedPlatforms, setConnectedPlatforms] = useState(3)
  const [criticalAlert, setCriticalAlert] = useState<any>(null)
  const [agentAlertsState, setAgentAlertsState] = useState([
    {
      id: 1,
      type: "Trending Sound",
      message:
        "Lo-fi elements are gaining traction in your genre. Consider incorporating these elements in upcoming releases.",
      time: "Today",
      icon: <Zap className="h-4 w-4 text-brand-cyan" />,
      action: "Auto-Generate",
      severity: "medium",
    },
    {
      id: 2,
      type: "Playlist Opportunity",
      message:
        'Your track "Midnight Dreams" matches the profile for Spotify\'s "Late Night Vibes" playlist. We\'ve prepared a pitch.',
      time: "Yesterday",
      icon: <Music2 className="h-4 w-4 text-brand-cyan" />,
      action: "Auto-Pitch",
      severity: "medium",
    },
    {
      id: 3,
      type: "Contract Alert",
      message: 'Distribution agreement for "Summer Haze EP" expires in 6 days. Review our renewal recommendations.',
      time: "2 days ago",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      action: "Auto-Renew",
      severity: "high",
    },
    {
      id: 4,
      type: "Rights Management",
      message: 'We detected unclaimed royalties for "Night Drive" on YouTube. Click to review and claim.',
      time: "3 days ago",
      icon: <FileText className="h-4 w-4 text-red-500" />,
      action: "Auto-Claim",
      severity: "medium",
    },
  ])

  // Agent states
  const [agentStates, setAgentStates] = useState({
    scout: { inTimeCapsule: false, progress: null, isEmpty: false },
    legal: { inTimeCapsule: true, progress: { current: 2, total: 3 }, isEmpty: false },
    metadata: { inTimeCapsule: true, progress: null, isEmpty: false },
    fan: { inTimeCapsule: false, progress: null, isEmpty: false },
    marketplace: { inTimeCapsule: false, progress: null, isEmpty: false },
  })

  useEffect(() => {
    // Check for last visit
    const lastVisitStr = localStorage.getItem("lastVisit")
    if (lastVisitStr) {
      const lastVisitDate = new Date(lastVisitStr)
      setLastVisit(lastVisitDate)

      // If last visit was more than 24 hours ago, show greeting
      const now = new Date()
      const hoursDiff = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60)
      setShowGreeting(hoursDiff > 24)
    }

    // Set current visit
    localStorage.setItem("lastVisit", new Date().toISOString())

    // Find critical alert (high severity)
    const critical = agentAlertsState.find((alert) => alert.severity === "high")
    if (critical) {
      setCriticalAlert(critical)
    }

    // Parallel data loading for better performance
    const loadAllData = async () => {
      if (!userId) return

      setLoadingDashboard(true)
      
      try {
        // Execute all data fetching in parallel
        const [dashboardResult, platformsResult] = await Promise.allSettled([
          // Dashboard data
          fetchDashboardData().catch(error => {
            console.error("Failed to fetch dashboard data:", error)
            // Return fallback values
            return {
              revenue: 45231.89,
              listeners: 2350412,
              engagement: 3827,
            }
          }),
          
          // Platforms data
          platformsAPI.get(userId).catch(error => {
            console.error("Failed to fetch platforms:", error)
            return { platforms: {} }
          })
        ])

        // Process dashboard data
        if (dashboardResult.status === 'fulfilled') {
          const data = dashboardResult.value as any
          setDashboardData({
            revenue: data.revenue || 45231.89,
            listeners: data.listeners || 2350412,
            engagement: data.engagement || 3827,
          })
        }

        // Process platforms data
        if (platformsResult.status === 'fulfilled') {
          const data = platformsResult.value as any
          // Count number of connected platforms
          const count = Object.values(data.platforms || {}).filter(Boolean).length
          setConnectedPlatforms(count)
        }
      } finally {
        setLoadingDashboard(false)
      }
    }

    // Start loading immediately
    loadAllData()
  }, [userId, agentAlertsState])

  const removeAlert = (id: number) => {
    setAgentAlertsState(agentAlertsState.filter((alert) => alert.id !== id))
    if (criticalAlert && criticalAlert.id === id) {
      setCriticalAlert(null)
    }
  }

  const handleAlertAction = (id: number) => {
    // Handle the alert action
    console.log(`Handling action for alert ${id}`)
    removeAlert(id)
  }

  const simulateAgentProgress = (agent: string) => {
    // Simulate progress updates
    setAgentStates((prev) => ({
      ...prev,
      [agent]: {
        ...prev[agent as keyof typeof prev],
        progress: { current: 1, total: 3 },
      },
    }))

    setTimeout(() => {
      setAgentStates((prev) => ({
        ...prev,
        [agent]: {
          ...prev[agent as keyof typeof prev],
          progress: { current: 2, total: 3 },
        },
      }))

      setTimeout(() => {
        setAgentStates((prev) => ({
          ...prev,
          [agent]: {
            ...prev[agent as keyof typeof prev],
            progress: { current: 3, total: 3 },
          },
        }))
      }, 1500)
    }, 1500)
  }

  return (
    <div className="relative min-h-screen">
      {/* Background gradient orbs */}
      <GradientOrbs variant="default" />
      
      <div className="relative z-10 space-y-6">
        {/* Greeting Strip (if last visit > 24h) */}
        {showGreeting && (
          <div className="bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg p-3 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-cyan" />
                <h2 className="font-medium">
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},
                  Alex
                </h2>
                <span className="text-sm text-muted-foreground">Streams up 4% overnight 🚀</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowGreeting(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Time Capsule Feed - First main element */}
        <TimeCapsuleFeed />

        {/* Integrations Panel */}
        <IntegrationsPanel />

        {/* Critical Alert Banner */}
        <CriticalAlertBanner alert={criticalAlert} onDismiss={removeAlert} onAction={handleAlertAction} />

        {/* Web3 Wallet Balance - Show when Web3 is enabled and wallet is connected */}
        {web3Settings.enabled && hasWallet && (
          <div className="mb-4">
            <WalletBalance />
          </div>
        )}

        {/* Quick Stats - Use DashboardGrid and DashboardStat */}
        <DashboardGrid cols={3}>
          <DashboardStat
            title="Total Revenue"
            value={loadingDashboard ? "Loading..." : `$${dashboardData.revenue.toLocaleString()}`}
            change={{ value: 20.1, period: "from last month" }}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <DashboardStat
            title="Monthly Listeners"
            value={loadingDashboard ? "Loading..." : dashboardData.listeners.toLocaleString()}
            change={{ value: 15.3, period: "from last month" }}
            icon={<Activity className="h-5 w-5" />}
          />
          <DashboardStat
            title="Engagement"
            value={loadingDashboard ? "Loading..." : dashboardData.engagement.toLocaleString()}
            change={{ value: 18.7, period: "from last month" }}
            icon={<Users className="h-5 w-5" />}
          />
        </DashboardGrid>

        {/* Agent Tiles */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <AgentTile
            title="Scout Agent"
            count="8"
            description="Demos surfaced based on your criteria"
            icon={<Search className="h-4 w-4 text-brand-cyan" />}
            href="/dashboard/agents/scout"
            actionLabel="Auto-Pitch"
            actionOnClick={() => simulateAgentProgress("scout")}
            inTimeCapsule={agentStates.scout.inTimeCapsule}
            progress={agentStates.scout.progress}
            isEmpty={agentStates.scout.isEmpty}
          />
          <AgentTile
            title="Legal Agent"
            count="2"
            description="Contracts expiring in the next 30 days"
            icon={<FileText className="h-4 w-4 text-brand-cyan" />}
            href="/dashboard/agents/legal"
            actionLabel="Auto-Renew"
            actionOnClick={() => simulateAgentProgress("legal")}
            inTimeCapsule={agentStates.legal.inTimeCapsule}
            progress={agentStates.legal.progress}
            isEmpty={agentStates.legal.isEmpty}
          />
          <AgentTile
            title="Metadata Agent"
            count="15"
            description="Tracks missing essential metadata"
            icon={<Database className="h-4 w-4 text-brand-cyan" />}
            href="/dashboard/agents/metadata"
            actionLabel="Auto-Fix"
            actionOnClick={() => simulateAgentProgress("metadata")}
            inTimeCapsule={agentStates.metadata.inTimeCapsule}
            progress={agentStates.metadata.progress}
            isEmpty={agentStates.metadata.isEmpty}
          />
          <AgentTile
            title="Fan Agent"
            count="5"
            description="Posts generated for your approval"
            icon={<Users className="h-4 w-4 text-brand-cyan" />}
            href="/dashboard/agents/fan"
            actionLabel="Auto-Schedule"
            actionOnClick={() => simulateAgentProgress("fan")}
            inTimeCapsule={agentStates.fan.inTimeCapsule}
            progress={agentStates.fan.progress}
            isEmpty={agentStates.fan.isEmpty}
          />
          <AgentTile
            title="Marketplace"
            count="20+"
            description="Agents available to enhance workflow"
            icon={<Store className="h-4 w-4 text-brand-cyan" />}
            href="/dashboard/agents/marketplace"
            actionLabel="Explore"
            actionOnClick={() => {}}
            inTimeCapsule={agentStates.marketplace.inTimeCapsule}
            progress={agentStates.marketplace.progress}
            isEmpty={agentStates.marketplace.isEmpty}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Upcoming Releases - Compact List */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold tracking-tight font-heading">Upcoming Releases</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
                asChild
              >
                <Link href="/dashboard/releases">
                  <Info className="h-4 w-4" />
                  <span className="text-brand-cyan">View All</span>
                </Link>
              </Button>
            </div>

            <BrandCard variant="gradient" hover="glow">
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  {upcomingReleases.map((release, index) => (
                    <CompactReleaseCard key={index} release={release} />
                  ))}
                </div>
              </div>
            </BrandCard>

            {/* Analytics Overview - Line Chart */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold tracking-tight font-heading">Performance Overview</h2>
                <div className="flex items-center">
                  <Tabs defaultValue="revenue" className="mr-2" onValueChange={setSelectedMetric}>
                    <TabsList className="h-7 bg-background/10">
                      <TabsTrigger value="revenue" className="text-xs px-2 py-1">
                        Revenue
                      </TabsTrigger>
                      <TabsTrigger value="listeners" className="text-xs px-2 py-1">
                        Listeners
                      </TabsTrigger>
                      <TabsTrigger value="engagement" className="text-xs px-2 py-1">
                        Engagement
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span className="text-brand-cyan">Full Insights</span>
                  </Button>
                </div>
              </div>
              <Suspense fallback={<div className="h-64 w-full rounded bg-background/10 animate-pulse" />}> 
                <RevenueLineChart
                  title=""
                  color={selectedMetric === "revenue" ? "var(--brand-cyan)" : selectedMetric === "listeners" ? "#9B6DFF" : "#FF6B6B"}
                />
              </Suspense>
            </div>
          </div>

          {/* Agent Alerts */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold tracking-tight font-heading">Agent Alerts</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
              >
                <Info className="h-4 w-4" />
                <span className="text-brand-cyan">View All</span>
              </Button>
            </div>
            <div className="space-y-4">
              {agentAlertsState
                .filter((alert) => !criticalAlert || alert.id !== criticalAlert.id)
                .map((alert, index) => (
                  <BrandCard
                    key={index}
                    variant={alert.severity === "high" ? "gradient" : "glass"}
                    hover="glow"
                    className={`transition-all duration-300 group ${
                      alert.severity === "high" ? "border-red-500/30" : ""
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-black/20 p-1 mt-0.5">{alert.icon}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{alert.type}</p>
                            <div className="flex items-center">
                              <p className="text-xs text-muted-foreground mr-2">{alert.time}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                                onClick={() => removeAlert(alert.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <div className="flex justify-between items-center pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
                            >
                              See rationale
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                              onClick={() => handleAlertAction(alert.id)}
                            >
                              {alert.action}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </BrandCard>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
