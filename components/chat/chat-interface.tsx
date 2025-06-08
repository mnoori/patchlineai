"use client"

import type React from "react"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import {
  Send,
  Zap,
  MessageSquare,
  Loader2,
  ChevronDown,
  Copy,
  Check,
  Command,
  ChevronRight,
  Sparkles,
  Brain,
  CheckCircle,
  Activity,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { BEDROCK_MODELS, getAvailableModels, getDefaultModel, AGENT_MODEL_NOTE, type BedrockModel } from "@/lib/models-config"
import { Button } from "@/components/ui/button"
import { usePatchyStore } from "@/hooks/use-patchy-store"
import { useCurrentUser } from "@/hooks/use-current-user"
import { TRSCableLogo } from "@/components/icons/trs-cable-logo"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DEMO_MODE } from "@/lib/config"
import { SupervisorTraces } from '@/components/supervisor-traces'
import { type AgentTrace } from "@/lib/supervisor-agent"
// Removed wallet imports to prevent flickering - wallet operations handled in blockchain agent

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  pending?: boolean
  timestamp: Date
  type?: "text" | "suggestion" | "action" | "error"
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost"
    icon?: React.ReactNode
  }>
  metadata?: {
    agent: string
    agentKey: string
    model: string
    timestamp: string
    agentsUsed?: string[]
    traces?: AgentTrace[]
  }
}

// Quick commands for autocompletion
const QUICK_COMMANDS = [
  { command: "/fix", description: "Fix metadata issues", completion: "fix metadata issues in my catalog" },
  { command: "/pitch", description: "Pitch to playlists", completion: "pitch my track to relevant playlists" },
  {
    command: "/analyze",
    description: "Analyze track performance",
    completion: "analyze the performance of my latest release",
  },
  {
    command: "/suggest",
    description: "Get content ideas",
    completion: "suggest content ideas for my next social post",
  },
  { command: "/schedule", description: "Schedule a release", completion: "help me schedule my next release" },
]

// Import agent types from source of truth
import { AGENT_TYPES as CONFIG_AGENT_TYPES } from "@/lib/config"

// Convert to Bedrock Agent mode format
const AGENT_TYPES = CONFIG_AGENT_TYPES.map(agent => ({
  key: `${agent.id.toUpperCase()}_AGENT`,
  label: agent.name.replace(' Agent', '')
}))

type BedrockModelWithKey = BedrockModel & { key: string }

export function ChatInterface() {
  // Global state from Zustand
  const { 
    messages: globalMessages, 
    lastMessage, 
    unreadCount, 
    setUnreadCount, 
    mode, 
    setMode, 
    threadId, 
    setThreadId, 
    addMessage, 
    updateMessage,
    markAsRead,
  } = usePatchyStore()
  
  // Get current user
  const { userId } = useCurrentUser()

  // Get wallet for blockchain transactions (only if available)
  let publicKey = null
  // Don't access wallet context in chat interface - it causes flickering
  // Wallet operations should be handled in the blockchain agent

  // Get available models for current mode
  const availableModels: BedrockModelWithKey[] = getAvailableModels(mode) as BedrockModelWithKey[]
  const defaultModelKey = getDefaultModel(mode)
  const defaultModel: BedrockModelWithKey = availableModels.find(m => m.key === defaultModelKey) || availableModels[0]

  // Selected Agent (only relevant in agent mode)
  const [selectedAgent, setSelectedAgent] = useState<string>("GMAIL_AGENT")
  
  // Remember last selections for each mode
  const [lastChatModel, setLastChatModel] = useState<BedrockModelWithKey>(defaultModel)
  const [lastAgentSelection, setLastAgentSelection] = useState<string>("GMAIL_AGENT")

  // Local state - removed local messages state since we're using global
  const [input, setInput] = useState("")
  const [selectedModel, setSelectedModel] = useState<BedrockModelWithKey>(defaultModel)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [commandSuggestions, setCommandSuggestions] = useState<typeof QUICK_COMMANDS>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>("")
  const [showTraces, setShowTraces] = useState(false)
  const [selectedTraces, setSelectedTraces] = useState<AgentTrace[]>([])

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea - ensure it starts with single line height
  useEffect(() => {
    if (inputRef.current) {
      // Always start with single line height
      inputRef.current.style.height = "44px"

      // Only expand if there's content and it overflows
      if (input.length > 0) {
        const maxHeight = Math.min(window.innerHeight / 3, 200)
        const scrollHeight = inputRef.current.scrollHeight

        if (scrollHeight > 44) {
          inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
        }

        // Show scrollbar if content exceeds max height
        if (scrollHeight > maxHeight) {
          inputRef.current.style.overflowY = "auto"
          // Add custom scrollbar styling
          inputRef.current.classList.add("custom-scrollbar")
        } else {
          inputRef.current.style.overflowY = "hidden"
        }
      }
    }
  }, [input])

  // Also add this useEffect to ensure the textarea starts with single line height when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "44px"
      inputRef.current.style.overflowY = "hidden"
    }
  }, [])

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Keyboard shortcut for model menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ to toggle model menu
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        setShowModelMenu((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Scroll to bottom when messages change (but not on initial mount)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  useEffect(() => {
    // Skip scroll on initial mount
    if (!hasInitialized) {
      setHasInitialized(true)
      return
    }
    
    // Only scroll for new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [globalMessages, hasInitialized])

  // Scroll to bottom on initial mount after a delay (to show latest messages)
  useEffect(() => {
    // Use instant scroll on mount to show latest messages without animation
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
    }, 100)
  }, [])

  // Focus input when component mounts
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
  }, [])

  // Command suggestions
  useEffect(() => {
    if (input.startsWith("/")) {
      const query = input.slice(1).toLowerCase()
      const filtered = QUICK_COMMANDS.filter(
        (cmd) => cmd.command.slice(1).toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query),
      )
      setCommandSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedSuggestionIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }, [input])

  // Update selected model when mode changes - use useLayoutEffect to prevent flicker
  useLayoutEffect(() => {
    if (mode === "chat") {
      // Restore last chat model
      setSelectedModel(lastChatModel)
    } else if (mode === "agent") {
      // Restore last agent selection  
      setSelectedAgent(lastAgentSelection)
      // Agent mode uses a fixed model, not the chat models
      const agentModels = getAvailableModels(mode) as BedrockModelWithKey[]
      setSelectedModel(agentModels[0] || defaultModel)
    }
  }, [mode]) // Only trigger when mode changes
  
  // Track model changes for chat mode
  useEffect(() => {
    if (mode === "chat") {
      setLastChatModel(selectedModel)
    }
  }, [selectedModel?.id, mode])
  
  // Track agent changes for agent mode
  useEffect(() => {
    if (mode === "agent") {
      setLastAgentSelection(selectedAgent)
    }
  }, [selectedAgent, mode])

  // Generate action buttons based on response content
  const generateActionsFromResponse = (content: string): Message["actions"] => {
    const actions: Message["actions"] = []

    // Add copy action by default
    actions.push({
      label: "Copy",
      onClick: () => handleCopyMessage(content),
      variant: "ghost",
      icon: <Copy className="h-3 w-3 mr-1" />,
    })

    // Check for metadata issues
    if (content.toLowerCase().includes("metadata") && content.toLowerCase().includes("issue")) {
      actions.push({
        label: "Fix All",
        onClick: () => console.log("Fixing all metadata issues"),
        variant: "default",
        icon: <Sparkles className="h-3 w-3 mr-1" />,
      })
    }

    // Check for playlist suggestions
    if (content.toLowerCase().includes("playlist") && content.toLowerCase().includes("pitch")) {
      actions.push({
        label: "View Playlists",
        onClick: () => console.log("Viewing suggested playlists"),
        variant: "default",
        icon: <ChevronRight className="h-3 w-3 mr-1" />,
      })
    }

    return actions
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      type: "text",
    }

    const assistantMessageId = (Date.now() + 1).toString()
    const pendingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      pending: true,
      timestamp: new Date(),
      type: "text",
    }

    addMessage(userMessage)
    setInput("")
    addMessage(pendingMessage)
    setIsGenerating(true)
    setCurrentStatus("")

    // Trigger agent activity simulation for sidebar logs (in both demo and real mode)
    if (mode === "agent") {
      window.dispatchEvent(new CustomEvent("agent-activity"))
    }

    // Handle different modes
    if (mode === "agent" && DEMO_MODE) {
      // DEMO MODE: Show mock response for investor presentations
      setTimeout(() => {
        updateMessage(assistantMessageId, {
          content:
            "I've completed a comprehensive analysis of your catalog! I found 12 optimization opportunities and identified 8 relevant playlists for your tracks. Your top-performing track 'Summer Vibes' has great potential for playlist placement. I've also detected some metadata inconsistencies that we should address to improve discoverability.",
          pending: false,
          type: "text",
          actions: [
            {
              label: "View Report",
              onClick: () => console.log("Opening detailed report"),
              variant: "default",
              icon: <ChevronRight className="h-3 w-3 mr-1" />,
            },
            {
              label: "Fix Metadata",
              onClick: () => console.log("Starting metadata fixes"),
              variant: "outline",
              icon: <Sparkles className="h-3 w-3 mr-1" />,
            },
          ],
        })
        setIsGenerating(false)
        setCurrentStatus("")
      }, 18000) // 18 seconds to match the simulation
    } else {
      // REAL MODE: Call the chat API for both chat and agent modes
      try {
        // Use the supervisor endpoint when Supervisor Agent is selected
        const isSupervisor = mode === "agent" && selectedAgent === "SUPERVISOR_AGENT"
        
        if (isSupervisor) {
          // Supervisor mode - use the new API with traces
          console.log("🤖 [SUPERVISOR] Analyzing your request...")
          
          // Show immediate start activity
          setTimeout(() => {
            console.log("🔍 [SUPERVISOR] Searching for relevant agents...")
          }, 500)
          
          const response = await fetch("/api/chat/supervisor", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: input.trim(),
              userId: userId || 'test-user',
              sessionId: threadId || `session-${Date.now()}`,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to get response from supervisor API')
          }

          const data = await response.json()
          
          // Handle traces and show real-time status updates
          if (data.traces && data.traces.length > 0) {
            // Show real-time status from traces
            data.traces.forEach((trace: AgentTrace, index: number) => {
              setTimeout(() => {
                if (trace.status === 'delegating') {
                  console.log(`🤖 [SUPERVISOR] ${trace.action}`)
                } else if (trace.agent) {
                  console.log(`✨ [SUPERVISOR] Delegating to ${trace.agent}`)
                } else {
                  console.log(`🔄 [SUPERVISOR] ${trace.action}`)
                }
              }, 1000 + (index * 800)) // Start after initial delay
            })
          } else {
            // Fallback logs if no traces
            setTimeout(() => {
              console.log("🧠 [SUPERVISOR] Processing request with specialized agents...")
            }, 1000)
            
            setTimeout(() => {
              console.log("📧 [SUPERVISOR] Accessing Gmail integration...")
            }, 2000)
            
            setTimeout(() => {
              console.log("⚖️ [SUPERVISOR] Consulting Legal agent...")
            }, 4000)
            
            setTimeout(() => {
              console.log("📝 [SUPERVISOR] Generating comprehensive analysis...")
            }, 6000)
          }
          
          // Update the message with response and metadata
          updateMessage(assistantMessageId, {
            content: data.response,
            pending: false,
            type: "text",
            actions: generateActionsFromResponse(data.response),
            metadata: {
              agent: "Supervisor Agent",
              agentKey: "supervisor",
              model: "Claude 3.5 Sonnet",
              timestamp: new Date().toISOString(),
              agentsUsed: data.agentsUsed,
              traces: data.traces
            }
          })
          
          // Clear status after a delay
          setCurrentStatus("")
          
          // Log completion with detailed summary
          const finalDelay = data.traces?.length ? (data.traces.length * 800 + 2000) : 8000
          if (data.agentsUsed && data.agentsUsed.length > 0) {
            setTimeout(() => {
              console.log(`✅ [SUPERVISOR] Orchestration complete - Used: ${data.agentsUsed.join(', ')}`)
            }, finalDelay)
          } else {
            setTimeout(() => {
              console.log(`✅ [SUPERVISOR] Orchestration complete - Analysis ready`)
            }, finalDelay)
          }
          
          setIsGenerating(false)
          window.dispatchEvent(new CustomEvent("agent-complete"))
          
        } else {
          // Regular non-supervisor endpoint
          const endpoint = '/api/chat'
          console.log("🤖 [CHAT] Thinking...")
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: input.trim(),
              userId: userId,
              mode: mode,
              modelId: selectedModel.id,
              ...(mode === "agent" && !autoMode ? { agentType: selectedAgent } : {}),
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to get response from chat API')
          }

          const data = await response.json()
          
          updateMessage(assistantMessageId, {
            content: data.response,
            pending: false,
            type: "text",
            actions: generateActionsFromResponse(data.response),
          })
          setIsGenerating(false)
          setCurrentStatus("")

          // Stop agent working state in real mode
          if (mode === "agent" && !DEMO_MODE) {
            window.dispatchEvent(new CustomEvent("agent-complete"))
          }

          // Blockchain agent responses are handled by the agent itself
          // No need to process them here

          // Show additional info if email context was used
          if (data.hasEmailContext) {
            console.log(`✅ [AGENT] Response included Gmail context from ${data.actionsInvoked?.length || 0} actions`)
            
            // Log each action for visibility in the sidebar
            if (data.actionsInvoked && data.actionsInvoked.length > 0) {
              data.actionsInvoked.forEach((action: string, index: number) => {
                setTimeout(() => {
                  let actionDisplay = ''
                  switch (action) {
                    case '/search-emails':
                      actionDisplay = '📧 [GMAIL] Searching emails...'
                      break
                    case '/read-email':
                      actionDisplay = '📧 [GMAIL] Reading email content...'
                      break
                    case '/draft-email':
                      actionDisplay = '📧 [GMAIL] Creating email draft...'
                      break
                    case '/send-email':
                      actionDisplay = '📧 [GMAIL] Sending email...'
                      break
                    case '/list-labels':
                      actionDisplay = '📧 [GMAIL] Fetching email labels...'
                      break
                    case '/get-email-stats':
                      actionDisplay = '📧 [GMAIL] Getting email statistics...'
                      break
                    default:
                      actionDisplay = `📧 [GMAIL] Action: ${action}`
                  }
                  console.log(actionDisplay)
                  
                  // Log completion after a delay
                  setTimeout(() => {
                    console.log(`✅ [GMAIL] ${action} completed`)
                  }, 500)
                }, index * 600) // Stagger the logs for visibility
              })
            }
          }
        }

      } catch (error) {
        console.error('❌ [CHAT] Error getting response:', error)
        
        updateMessage(assistantMessageId, {
          content: "Sorry, I encountered an error while processing your request. Please try again.",
          pending: false,
          type: "error",
        })
        setIsGenerating(false)
        setCurrentStatus("")
      }
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift or Ctrl)
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !showSuggestions) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    // Allow Ctrl+Enter for new lines (default behavior)
    if (e.key === "Enter" && e.ctrlKey) {
      // Let the default behavior happen (new line)
      return
    }

    // Handle command suggestions navigation
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev < commandSuggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        const selected = commandSuggestions[selectedSuggestionIndex]
        setInput(selected.completion)
        setShowSuggestions(false)
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowSuggestions(false)
      }
    }
  }

  // Copy message to clipboard
  const handleCopyMessage = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        // Show copied indicator
        setCopiedMessageId(content)
        setTimeout(() => setCopiedMessageId(null), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err)
      })
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  // Get indicator label based on mode
  const getIndicatorLabel = () => {
    if (mode === "agent") {
      return autoMode ? "Auto" : AGENT_TYPES.find(a => a.key === selectedAgent)?.label || "Agent"
    }
    return selectedModel.displayName
  }

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <TRSCableLogo className="h-5 w-5 text-cosmic-teal" />
          <span className="font-semibold tracking-wide text-cosmic-teal">Patchy</span>
          {DEMO_MODE && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
              Demo Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        role="log"
        aria-live="polite"
      >
        {globalMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cosmic-teal/20 to-cosmic-pink/20 flex items-center justify-center mb-4">
              <TRSCableLogo className="h-6 w-6 text-cosmic-teal" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">Start a conversation with Patchy</p>
          </div>
        ) : (
          <>
            {globalMessages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm group relative",
                    message.role === "user"
                      ? "bg-cosmic-teal text-black font-medium"
                      : message.type === "error"
                        ? "bg-red-500/10 text-foreground border border-red-500/30"
                        : "bg-background/80 text-foreground border border-border/50 backdrop-blur-sm",
                  )}
                >
                  {message.pending ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap">{message.content}</div>

                      {/* Timestamp */}
                      <div className="text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(message.timestamp)}
                      </div>

                      {/* Copy button for assistant messages */}
                      {message.role === "assistant" && !message.pending && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleCopyMessage(message.content)}
                          >
                            {copiedMessageId === message.content ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Action buttons */}
                      {message.role === "assistant" && message.actions && message.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action, i) => (
                            <Button
                              key={i}
                              size="sm"
                              variant={action.variant || "outline"}
                              className="h-7 text-xs"
                              onClick={action.onClick}
                            >
                              {action.icon}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {message.metadata?.agentKey === "supervisor" && message.metadata?.traces && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (message.metadata?.traces) {
                              setSelectedTraces(message.metadata.traces)
                              setShowTraces(true)
                            }
                          }}
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          See traces
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Command suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border/50 bg-background/90 backdrop-blur-sm max-h-[200px] overflow-y-auto custom-scrollbar"
          >
            <div className="p-2 text-xs text-muted-foreground">Commands</div>
            {commandSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.command}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer flex items-center justify-between",
                  index === selectedSuggestionIndex ? "bg-cosmic-teal/10" : "hover:bg-muted/50",
                )}
                onClick={() => {
                  setInput(suggestion.completion)
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
              >
                <div className="flex items-center">
                  <Command className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="font-medium">{suggestion.command}</span>
                </div>
                <span className="text-xs text-muted-foreground">{suggestion.description}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls - Cursor Style */}
      <div className="border-t border-border/50 bg-background/90 backdrop-blur-sm">
        {/* Agent/Chat Toggle and Model Selector */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          {/* Agent/Chat Toggle */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                if (mode !== "agent") {
                  setMode("agent")
                }
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all flex items-center",
                mode === "agent"
                  ? "bg-cosmic-teal/20 text-cosmic-teal"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Zap className="h-4 w-4 mr-2" />
              Agent
            </button>
            <button
              onClick={() => {
                if (mode !== "chat") {
                  setMode("chat")
                }
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all flex items-center",
                mode === "chat"
                  ? "bg-cosmic-teal/20 text-cosmic-teal"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </button>
          </div>

          {/* Model Selector - Cursor Style */}
          <div className="relative">
            <Button
              variant="ghost"
              className="text-xs h-8 px-2 flex items-center gap-2"
              type="button"
              onClick={() => setShowModelMenu((prev) => !prev)}
            >
              <div className="w-2 h-2 rounded-full bg-cosmic-teal" />
              <span className="text-muted-foreground text-xs">{getIndicatorLabel()}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>

            {/* Model Menu Dropdown */}
            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  ref={modelMenuRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-2 w-80 p-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-lg z-50"
                >
                  <div className="text-xs text-muted-foreground mb-3">Ctrl+/ for model menu</div>

                  {/* Auto toggle */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto</span>
                      <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-3 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {mode === "agent"
                      ? AGENT_TYPES.map((agent) => (
                          <div
                            key={agent.key}
                            onClick={() => {
                              if (selectedAgent !== agent.key) {
                                setSelectedAgent(agent.key)
                              }
                              setShowModelMenu(false)
                            }}
                            className={cn(
                              "cursor-pointer flex items-center text-sm rounded-md px-3 py-2 gap-3",
                              selectedAgent === agent.key ? "bg-cosmic-teal/10" : "hover:bg-muted/50",
                            )}
                          >
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{agent.label}</div>
                            </div>
                            {selectedAgent === agent.key && <Check className="h-4 w-4 text-cosmic-teal" />}
                          </div>
                        ))
                      : availableModels.map((model) => (
                          <div
                            key={model.key}
                            onClick={() => {
                              if (selectedModel.key !== model.key) {
                                setSelectedModel(model)
                              }
                              setShowModelMenu(false)
                            }}
                            className={cn(
                              "cursor-pointer flex items-center text-sm rounded-md px-3 py-2 gap-3",
                              selectedModel.key === model.key ? "bg-cosmic-teal/10" : "hover:bg-muted/50",
                            )}
                          >
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{model.name}</div>
                            </div>
                            {selectedModel.key === model.key && <Check className="h-4 w-4 text-cosmic-teal" />}
                          </div>
                        ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 relative">
          <div className="relative flex items-end bg-background/80 backdrop-blur-sm rounded-xl border border-input/50 focus-within:ring-1 focus-within:ring-cosmic-teal">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-3 px-4 pr-12 text-sm rounded-xl custom-scrollbar"
              style={{
                height: "44px",
                maxHeight: `${Math.min(window.innerHeight / 3, 200)}px`,
                overflowY: "hidden",
              }}
              rows={1}
              disabled={isGenerating}
              aria-label="Message input"
            />
            <button
              type="submit"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                input.trim() && !isGenerating
                  ? "text-black bg-cosmic-teal hover:bg-cosmic-teal/90"
                  : "text-muted-foreground bg-muted/50",
              )}
              disabled={!input.trim() || isGenerating}
              aria-label="Send message"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          {/* Keyboard shortcuts */}
          <div className="mt-2 flex justify-between items-center text-[10px] text-muted-foreground px-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] mr-1">⌘J</kbd>
                <span>toggle</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] mr-1">⏎</kbd>
                <span>send</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] mr-1">/</kbd>
                <span>commands</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <SupervisorTraces 
        traces={selectedTraces}
        isOpen={showTraces}
        onClose={() => setShowTraces(false)}
      />
    </div>
  )
}
