"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Music2,
  Calendar,
  Search,
  FileText,
  Database,
  Users,
  PlusCircle,
  BarChart2,
  Settings,
  ChevronDown,
  HelpCircle,
  Store,
  Edit3,
  Zap,
} from "lucide-react"
import { ChatInterface } from "../chat/chat-interface"
import { TRSCableLogo } from "../icons/trs-cable-logo"
import { useAriaStore } from "@/hooks/use-aria-store"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { DEMO_MODE } from "@/lib/config"
import { usePermissions, FeatureId, FEATURE_CATALOG } from "@/lib/permissions"

// Define types for sidebar items
interface SidebarItem {
  title: string
  href?: string
  icon: React.ReactNode
  isGodMode?: boolean
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
  }[]
}

const pulseGlowStyle = `
  @keyframes pulse-glow {
    0%, 100% { 
      box-shadow: 0 0 5px rgba(0, 230, 228, 0.1), 0 0 10px rgba(0, 230, 228, 0.05);
      border-color: rgba(0, 230, 228, 0.1);
    }
    50% { 
      box-shadow: 0 0 10px rgba(0, 230, 228, 0.2), 0 0 20px rgba(0, 230, 228, 0.1);
      border-color: rgba(0, 230, 228, 0.2);
    }
  }
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
    border: 1px solid rgba(0, 230, 228, 0.1);
  }

  @keyframes pulse-glow-yellow {
    0%, 100% { 
      box-shadow: 0 0 5px rgba(255, 215, 0, 0.2), 0 0 10px rgba(255, 215, 0, 0.1);
      border-color: rgba(255, 215, 0, 0.2);
      background-color: rgba(255, 215, 0, 0.05);
    }
    50% { 
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), 0 0 25px rgba(255, 215, 0, 0.2);
      border-color: rgba(255, 215, 0, 0.4);
      background-color: rgba(255, 215, 0, 0.1);
    }
  }
  .animate-pulse-glow-yellow {
    animation: pulse-glow-yellow 2s ease-in-out infinite;
    border: 1px solid rgba(255, 215, 0, 0.2);
    color: rgba(255, 215, 0, 0.9) !important;
  }
  .animate-pulse-glow-yellow:hover {
    background-color: rgba(255, 215, 0, 0.15) !important;
    color: rgba(255, 215, 0, 1) !important;
  }

  /* Soft v0-style dashboard blur */
  .dashboard-blur {
    position: fixed;
    top: 64px;
    left: 256px;
    right: 0;
    bottom: 0;
    background-color: rgba(13, 13, 30, 0.4);
    backdrop-filter: blur(16px) saturate(0.7);
    -webkit-backdrop-filter: blur(16px) saturate(0.7);
    z-index: 30;
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease;
    cursor: pointer;
  }
  
  .dashboard-blur.active {
    opacity: 1;
    pointer-events: all;
  }

      /* Aria's activity card - Clean slide animation */
  .activity-card {
    position: fixed;
    top: 100px;
    left: calc(256px + 400px + ((100vw - 256px - 400px) / 2));
    width: 380px;
    max-width: 90%;
    background: rgba(13, 13, 30, 0.3);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 16px;
    padding: 24px;
    z-index: 35;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transform: translateX(-50%) translateY(-100px);
    opacity: 0;
    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease;
    pointer-events: none;
  }

  .activity-card.visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .activity-card.closing {
    transform: translateX(-50%) translateY(-100px);
    opacity: 0;
    transition: transform 250ms cubic-bezier(0.33, 0, 0.66, 1), opacity 200ms ease;
  }

  .activity-card.working {
    width: 520px;
    padding: 32px;
    background: rgba(13, 13, 30, 0.4);
    box-shadow: 
      0 12px 48px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(0, 230, 228, 0.1);
    transition: width 300ms cubic-bezier(0.16, 1, 0.3, 1), 
                padding 300ms cubic-bezier(0.16, 1, 0.3, 1),
                background 300ms ease,
                box-shadow 300ms ease,
                transform 300ms cubic-bezier(0.16, 1, 0.3, 1), 
                opacity 250ms ease;
  }

  .activity-card::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 16px;
    background: linear-gradient(135deg, 
      rgba(0, 230, 228, 0.1) 0%, 
      rgba(0, 230, 228, 0.02) 50%,
      rgba(0, 230, 228, 0.1) 100%);
    opacity: 0.2;
    filter: blur(1px);
    z-index: -1;
  }

  /* Content wrapper to prevent reflow */
  .activity-content-wrapper {
    width: 100%;
    transition: width 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Smooth content transitions */
  .activity-content {
    transition: opacity 200ms ease;
  }

  .activity-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    transition: all 200ms ease;
  }

  .suggestion-content {
    transition: opacity 200ms ease;
  }

  /* Fade content during mode switch */
  .activity-content.fade-out {
    opacity: 0;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .cursor {
    animation: blink 1s infinite;
    color: #00E6E4;
  }

  .suggestion-text {
    color: rgba(226, 232, 240, 0.8);
    font-size: 15px;
    line-height: 1.6;
    min-height: 24px;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #00E6E4;
    border-radius: 50%;
    margin-right: 10px;
    box-shadow: 0 0 10px rgba(0, 230, 228, 0.5);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  .logs-container {
    max-height: 540px;
    overflow-y: scroll;
    padding-right: 8px;
    scroll-behavior: smooth;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    line-height: 1.4;
    scrollbar-gutter: stable;
  }

  .logs-container::-webkit-scrollbar {
    width: 6px;
  }

  .logs-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  .logs-container::-webkit-scrollbar-thumb {
    background: rgba(0, 230, 228, 0.3);
    border-radius: 3px;
  }

  .log-line {
    display: flex;
    align-items: flex-start;
    padding: 4px 0;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.9);
    opacity: 0;
    transform: translateY(10px);
    animation: filmRoll 0.3s ease-out forwards;
    white-space: nowrap;
    overflow: hidden;
  }

  @keyframes filmRoll {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .log-timestamp {
    color: rgba(0, 230, 228, 0.6);
    margin-right: 8px;
    font-size: 10px;
    min-width: 60px;
  }

  .log-icon {
    margin-right: 6px;
    font-size: 11px;
  }

  .log-message {
    color: rgba(226, 232, 240, 0.8);
    flex: 1;
  }

  .log-success .log-message {
    color: rgba(34, 197, 94, 0.9);
  }

  .log-working .log-message {
    color: rgba(251, 191, 36, 0.9);
  }

  .log-error .log-message {
    color: rgba(239, 68, 68, 0.9);
  }
`

// Icon mapping for features
const featureIcons: Record<string, React.ReactNode> = {
  [FeatureId.DASHBOARD]: <LayoutDashboard className="h-5 w-5" />,
  [FeatureId.CATALOG]: <Music2 className="h-5 w-5" />,
  [FeatureId.RELEASES]: <Calendar className="h-5 w-5" />,
  [FeatureId.CONTENT]: <Edit3 className="h-5 w-5" />,
  [FeatureId.INSIGHTS]: <BarChart2 className="h-5 w-5" />,
  [FeatureId.SETTINGS]: <Settings className="h-5 w-5" />,
  [FeatureId.HELP]: <HelpCircle className="h-5 w-5" />,
  [FeatureId.GOD_MODE_ACCESS]: <Zap className="h-5 w-5" />,
  [FeatureId.SCOUT_AGENT]: <Search className="h-5 w-5" />,
  [FeatureId.LEGAL_AGENT]: <FileText className="h-5 w-5" />,
  [FeatureId.METADATA_AGENT]: <Database className="h-5 w-5" />,
  [FeatureId.FAN_AGENT]: <Users className="h-5 w-5" />,
  [FeatureId.MARKETPLACE_AGENT]: <Store className="h-5 w-5" />,
  [FeatureId.EDUCATION_AGENT]: <HelpCircle className="h-5 w-5" />,
}

// Simulation logs for agent activity
const simulationLogs = [
  {
    timestamp: "14:32:01",
    message: "Initializing agent workflow...",
    type: "working",
    icon: "⚡",
  },
  {
    timestamp: "14:32:02",
    message: "Analyzing user query: catalog optimization",
    type: "working",
    icon: "🔍",
  },
  {
    timestamp: "14:32:04",
    message: "Connecting to Spotify API...",
    type: "working",
    icon: "🔗",
  },
  {
    timestamp: "14:32:05",
    message: "✓ Successfully connected to Spotify",
    type: "success",
    icon: "✅",
  },
  {
    timestamp: "14:32:06",
    message: "Fetching catalog metadata...",
    type: "working",
    icon: "📊",
  },
  {
    timestamp: "14:32:08",
    message: "Processing 47 tracks in catalog",
    type: "working",
    icon: "⚙️",
  },
  {
    timestamp: "14:32:10",
    message: "Analyzing streaming performance data...",
    type: "working",
    icon: "📈",
  },
  {
    timestamp: "14:32:12",
    message: "✓ Found 12 optimization opportunities",
    type: "success",
    icon: "🎯",
  },
  {
    timestamp: "14:32:13",
    message: "Generating playlist recommendations...",
    type: "working",
    icon: "🎵",
  },
  {
    timestamp: "14:32:15",
    message: "✓ Identified 8 relevant playlists",
    type: "success",
    icon: "📝",
  },
  {
    timestamp: "14:32:16",
    message: "Compiling final report...",
    type: "working",
    icon: "📋",
  },
  {
    timestamp: "14:32:18",
    message: "✓ Agent workflow completed successfully",
    type: "success",
    icon: "🎉",
  },
]

export function SidebarWithChat() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("Agents")
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isAgentWorking, setIsAgentWorking] = useState(false)
  const [currentLogs, setCurrentLogs] = useState<typeof simulationLogs>([])
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { unreadCount, setAgentActivity } = useAriaStore()
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const { hasFeature, getAvailableFeatures } = usePermissions()

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Generate sidebar items based on permissions
  const getSidebarItems = (): SidebarItem[] => {
    const items: SidebarItem[] = []
    const availableFeatures = getAvailableFeatures()
    
    // Core features
    const coreFeatures = [
      FeatureId.DASHBOARD,
      FeatureId.CATALOG,
      FeatureId.RELEASES,
      FeatureId.CONTENT,
      FeatureId.INSIGHTS
    ]
    
    coreFeatures.forEach(featureId => {
      if (availableFeatures.includes(featureId)) {
        const feature = FEATURE_CATALOG[featureId]
        items.push({
          title: feature.name,
          href: feature.route!,
          icon: featureIcons[featureId]
        })
      }
    })
    
    // Agent features - grouped under submenu
    const agentFeatures = availableFeatures.filter(f => 
      FEATURE_CATALOG[f].type === 'agent' && f !== FeatureId.EDUCATION_AGENT
    )
    
    if (agentFeatures.length > 0) {
      const agentSubmenu: SidebarItem = {
        title: "Agents",
        icon: <PlusCircle className="h-5 w-5" />,
        submenu: agentFeatures.map(featureId => {
          const feature = FEATURE_CATALOG[featureId]
          return {
            title: feature.name.replace(' Agent', ''),
            href: feature.route!,
            icon: featureIcons[featureId]
          }
        })
      }
      items.push(agentSubmenu)
    }
    
    // God Mode (if available) - DISABLED FOR PRODUCTION
    // if (hasFeature(FeatureId.GOD_MODE_ACCESS)) {
    //   const godModeFeature = FEATURE_CATALOG[FeatureId.GOD_MODE_ACCESS]
    //   items.push({
    //     title: godModeFeature.name,
    //     href: godModeFeature.route!,
    //     icon: featureIcons[FeatureId.GOD_MODE_ACCESS],
    //     isGodMode: true
    //   })
    // }
    
    // Settings and Help (always visible)
    items.push({
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />
    })
    
    items.push({
      title: "Help",
      href: "/dashboard/help",
      icon: <HelpCircle className="h-5 w-5" />
    })
    
    return items
  }
  
  // Only generate sidebar items after component is mounted to prevent hydration mismatch
  const sidebarItems = isMounted ? getSidebarItems() : []

  // Set Agents submenu to open by default
  useEffect(() => {
    setOpenSubmenu("Agents")
  }, [])

  // Listen for agent activity trigger
  useEffect(() => {
    const handleAgentActivity = () => {
      if (!isChatExpanded) return

      if (DEMO_MODE) {
        // DEMO MODE: Show mock logs for investor presentations
        setIsAgentWorking(true)
        setCurrentLogs([])

        // Simulate agent logs appearing over time with smoother intervals
        simulationLogs.forEach((log, index) => {
          setTimeout(() => {
            setCurrentLogs((prev) => {
              const newLogs = [...prev, log]

              // Trigger smooth scroll after state update
              setTimeout(() => {
                const logsContainer = document.querySelector(".logs-container")
                if (logsContainer) {
                  const isNearBottom =
                    logsContainer.scrollHeight - logsContainer.scrollTop <= logsContainer.clientHeight + 50

                  if (isNearBottom) {
                    logsContainer.scrollTo({
                      top: logsContainer.scrollHeight,
                      behavior: "smooth",
                    })
                  }
                }
              }, 50)

              return newLogs
            })

            // Mark as complete when done
            if (index === simulationLogs.length - 1) {
              setTimeout(() => {
                setIsAgentWorking(false)
              }, 2000)
            }
          }, index * 1200 + 400) // Add initial delay for smooth transition
        })
      } else {
        // REAL MODE: Show actual console logs
        setIsAgentWorking(true)
        setCurrentLogs([])
        
        // In real mode, logs will be populated by intercepting console.log
        // The agent will complete when the API call finishes
      }
    }

    const handleAgentComplete = () => {
      if (!DEMO_MODE) {
        // Keep showing logs for 10 seconds after completion
        setTimeout(() => {
          // Clear logs first, then set agent working to false
          setCurrentLogs([])
          setIsAgentWorking(false)
          
          // Reset suggestion state to restart the typewriter effect
          setDisplayedText("")
          setCurrentSuggestion(0)
        }, 10000) // Show logs for 10 seconds after completion
      }
    }

    window.addEventListener("agent-activity", handleAgentActivity)
    window.addEventListener("agent-complete", handleAgentComplete)
    return () => {
      window.removeEventListener("agent-activity", handleAgentActivity)
      window.removeEventListener("agent-complete", handleAgentComplete)
    }
  }, [isChatExpanded])

  // Intercept console logs in real mode to show them in the activity panel
  useEffect(() => {
    if (DEMO_MODE || !isAgentWorking) return

    const originalConsoleLog = console.log
    
    console.log = (...args) => {
      // Call original console.log
      originalConsoleLog.apply(console, args)
      
      // Check if this is a log we want to show in the activity panel
      const message = args.join(' ')
      
      // Show all logs during agent activity, not just specific ones
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
      
      let type = 'working'
      let icon = '⚙️'
      
      if (message.includes('✅')) {
        type = 'success'
        icon = '✅'
      } else if (message.includes('❌')) {
        type = 'error'
        icon = '❌'
      } else if (message.includes('📧')) {
        icon = '📧'
      } else if (message.includes('🤖')) {
        icon = '🤖'
      } else if (message.includes('🧠')) {
        icon = '🧠'
      } else if (message.includes('🔵')) {
        icon = '🔵'
      } else if (message.includes('⚠️')) {
        icon = '⚠️'
        type = 'warning'
      }
      
      // Extract clean message
      let cleanMessage = message
      // Remove emoji prefixes
      cleanMessage = cleanMessage.replace(/^[🔵✅❌⚠️🤖🧠📧]\s*/, '')
      // Remove [TAG] prefixes
      cleanMessage = cleanMessage.replace(/\[(CHAT|AGENT|GMAIL|MODEL|CONFIG|API)\]\s*/, '')
      
      const logEntry = {
        timestamp,
        message: cleanMessage,
        type,
        icon
      }
      
      setCurrentLogs(prev => {
        const newLogs = [...prev, logEntry]
        
        // Immediately scroll to bottom for real-time feel
        requestAnimationFrame(() => {
          const logsContainer = document.querySelector(".logs-container")
          if (logsContainer) {
            logsContainer.scrollTo({
              top: logsContainer.scrollHeight,
              behavior: "smooth",
            })
          }
        })
        
        return newLogs
      })
    }
    
    return () => {
      console.log = originalConsoleLog
    }
  }, [DEMO_MODE, isAgentWorking])

          // Aria's suggestions (when not working)
  const suggestions = [
    "Analyzing your catalog for optimization opportunities...",
    "Scanning streaming platforms for playlist placements...",
    "Processing metadata inconsistencies across tracks...",
    "Generating personalized pitch strategies for curators...",
  ]

  // Typewriter effect for suggestions (only when not working)
  useEffect(() => {
    if (!isChatExpanded || isAgentWorking) return

    let typingTimeout: NodeJS.Timeout
    let displayTimeout: NodeJS.Timeout

    const typeText = () => {
      const suggestion = suggestions[currentSuggestion]
      let charIndex = 0
      setDisplayedText("")

      const typeChar = () => {
        if (charIndex < suggestion.length) {
          setDisplayedText(suggestion.slice(0, charIndex + 1))
          charIndex++
          typingTimeout = setTimeout(typeChar, Math.random() * 40 + 60)
        } else {
          displayTimeout = setTimeout(() => {
            setCurrentSuggestion((prev) => (prev + 1) % suggestions.length)
          }, 5000)
        }
      }

      typeChar()
    }

    // Only start typing if we're not already in the middle of typing
    const timeoutId = setTimeout(typeText, 100)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(typingTimeout)
      clearTimeout(displayTimeout)
    }
  }, [currentSuggestion, isChatExpanded, isAgentWorking, suggestions.length]) // Added suggestions.length to stable deps

  // Create UI elements (only once)
  useEffect(() => {
    // Create blur overlay
    const blurOverlay = document.createElement("div")
    blurOverlay.className = "dashboard-blur"
    blurOverlay.id = "dashboard-blur"
    document.body.appendChild(blurOverlay)

    // Clean up
    return () => {
      if (document.body.contains(blurOverlay)) {
        document.body.removeChild(blurOverlay)
      }
    }
  }, []) // NO dependencies - create only once!

  // Add click handler to blur overlay (separate effect)
  useEffect(() => {
    const blurOverlay = document.getElementById("dashboard-blur")
    if (!blurOverlay) return

    const handleBlurClick = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      // Only close if the chat is expanded
      if (isChatExpanded) {
        // Trigger the slide-up animation for the card
        setIsClosing(true)
        
        // Wait a brief moment before closing the interface
        setTimeout(() => {
          setIsChatExpanded(false)
          setIsClosing(false)
          
          // Reset logs if agent is not working
          if (!isAgentWorking) {
            setCurrentLogs([])
          }
          
          // Dispatch event
          const closeEvent = new CustomEvent("chat-expanded", {
            detail: { expanded: false },
          })
          window.dispatchEvent(closeEvent)
        }, 200) // Slightly faster to feel snappier
      }
    }

    // Add click handler directly to the blur overlay element
    blurOverlay.addEventListener("click", handleBlurClick)
    
    // Clean up
    return () => {
      blurOverlay.removeEventListener("click", handleBlurClick)
    }
  }, [isChatExpanded, isAgentWorking]) // Dependencies for the click handler

  // Control blur overlay visibility
  useEffect(() => {
    const blurOverlay = document.getElementById("dashboard-blur")
    if (!blurOverlay) return
    
    if (isChatExpanded) {
      blurOverlay.classList.add("active")
      blurOverlay.style.pointerEvents = "all"
    } else {
      blurOverlay.classList.remove("active")
      blurOverlay.style.pointerEvents = "none"
    }
  }, [isChatExpanded])

  // Remove the DOM manipulation effects
  // Update logs with smooth film-roll effect
  useEffect(() => {
    if (!isAgentWorking || !logsContainerRef.current) return

    // Auto-scroll to bottom when new logs are added
    requestAnimationFrame(() => {
      if (logsContainerRef.current) {
        logsContainerRef.current.scrollTo({
          top: logsContainerRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
    })
  }, [currentLogs, isAgentWorking])

  // Remove the suggestion text DOM manipulation effect

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const toggleChat = () => {
    if (isChatExpanded) {
      // Closing - trigger the slide-up animation for the card
      setIsClosing(true)
      
      setTimeout(() => {
        setIsChatExpanded(false)
        setIsClosing(false)
        
        // Reset logs if agent is not working
        if (!isAgentWorking) {
          setCurrentLogs([])
        }
        
        // Dispatch event
        const closeEvent = new CustomEvent("chat-expanded", {
          detail: { expanded: false },
        })
        window.dispatchEvent(closeEvent)
      }, 200)
    } else {
      // Opening
      setIsChatExpanded(true)
      
      // Dispatch event
      const openEvent = new CustomEvent("chat-expanded", {
        detail: { expanded: true },
      })
      window.dispatchEvent(openEvent)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseGlowStyle }} />
      
      {/* Activity Card - React-based rendering */}
      {(isChatExpanded || isClosing) && (
        <div className={cn(
          "activity-card",
          isChatExpanded && !isClosing && "visible",
          isClosing && "closing",
          isAgentWorking && "working"
        )}>
          <div className="activity-content-wrapper">
            <div className="activity-content">
              <div className="activity-header">
                {isAgentWorking ? (
                  <>
                    <div className="spinner" style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(0, 230, 228, 0.3)',
                      borderTop: '2px solid #00E6E4',
                      borderRadius: '50%',
                      marginRight: '12px'
                    }} />
                    <span style={{ color: '#00E6E4', fontSize: '14px', fontWeight: 600 }}>
                      Agent Activity
                    </span>
                  </>
                ) : (
                  <>
                    <div className="dot" />
                    <span style={{ color: '#00E6E4', fontSize: '14px', fontWeight: 500 }}>
                      Aria's Suggestions
                    </span>
                  </>
                )}
              </div>
              
              {isAgentWorking ? (
                <div className="logs-container" ref={logsContainerRef}>
                  {currentLogs.map((log, index) => (
                    <div key={index} className={`log-line log-${log.type}`}>
                      <span className="log-timestamp">{log.timestamp}</span>
                      <span className="log-icon">{log.icon}</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="suggestion-content">
                  <div className="suggestion-text">
                    {displayedText}<span className="cursor">|</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed top-16 bottom-0 left-0 z-40 hidden md:flex">
        {/* Main Sidebar */}
        <div className="w-64 flex flex-col border-r border-border bg-background relative z-50">
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {!isMounted ? (
                // Loading skeleton to prevent hydration mismatch
                <div className="space-y-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center rounded-md px-3 py-2">
                      <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                      <div className="ml-3 h-4 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                sidebarItems.map((item) => {
                const isActive = item.href
                  ? pathname === item.href
                  : item.submenu?.some((subItem) => pathname === subItem.href)

                return (
                  <div key={item.title}>
                    {item.submenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.title)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-brand-cyan/10 text-brand-cyan"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <div className="flex items-center">
                            {item.icon}
                            <span className="ml-3">{item.title}</span>
                          </div>
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", openSubmenu === item.title && "rotate-180")}
                          />
                        </button>
                        {openSubmenu === item.title && (
                          <div className="mt-1 space-y-1 pl-6">
                            {item.submenu.map((subItem) => {
                              const isSubActive = pathname === subItem.href
                              return (
                                <Link
                                  key={subItem.title}
                                  href={subItem.href}
                                  className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isSubActive
                                      ? "bg-brand-cyan/10 text-brand-cyan"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                  )}
                                >
                                  {subItem.icon}
                                  <span className="ml-3">{subItem.title}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href!}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          item.isGodMode
                            ? "text-amber-400 hover:bg-amber-400/10"
                            : isActive
                            ? "bg-brand-cyan/10 text-brand-cyan"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </Link>
                    )}
                  </div>
                )
              })
              )}
            </nav>
          </div>

          {/* Aria Chat Button */}
          <div className="sticky bottom-0 p-2 border-t border-border bg-background/95 backdrop-blur-sm">
            <button
              onClick={toggleChat}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                isChatExpanded
                  ? "bg-gradient-to-r from-brand-cyan/20 to-brand-bright-blue/10 text-brand-cyan border border-brand-cyan/30 shadow-[0_0_15px_rgba(0,230,228,0.3)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent animate-pulse-glow",
              )}
            >
              <div className="flex items-center relative z-10">
                <div className="relative flex items-center justify-center w-6 h-6 mr-3 rounded-full">
                  <TRSCableLogo className="h-5 w-5 text-brand-cyan" />
                  {!isChatExpanded && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    "font-semibold tracking-wide",
                    isChatExpanded ? "text-brand-cyan" : "text-brand-cyan/80",
                  )}
                >
                  Aria
                </span>
              </div>
              {!isChatExpanded && (
                <div className="flex items-center text-[10px] text-muted-foreground relative z-10">
                  <span>AI Assistant</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {isChatExpanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 },
              }}
              className="h-full border-r border-border bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
            >
              <ChatInterface />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
