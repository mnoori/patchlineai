import { create } from "zustand"
import type React from "react"
import type { AgentTrace } from '@/app/api/chat/supervisor/route'

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

interface AriaStore {
  // Chat state
  messages: Message[]
  lastMessage: Message | null
  unreadCount: number
  mode: "agent" | "chat"
  threadId: string | null

  // Agent activity
  isAgentWorking: boolean
  agentLogs: Array<{
    timestamp: string
    message: string
    type: "working" | "success" | "error"
    icon: string
  }>

  // Actions
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setUnreadCount: (count: number) => void
  setMode: (mode: "agent" | "chat") => void
  setThreadId: (id: string) => void
  markAsRead: () => void
  setAgentActivity: (working: boolean) => void
  addAgentLog: (log: any) => void
  clearAgentLogs: () => void
}

export const useAriaStore = create<AriaStore>((set, get) => ({
  // Initial state
  messages: [],
  lastMessage: null,
  unreadCount: 0,
  mode: "chat",
  threadId: null,
  isAgentWorking: false,
  agentLogs: [],

  // Actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      lastMessage: message,
      unreadCount: message.role === "assistant" ? state.unreadCount + 1 : state.unreadCount,
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...updates } : message
      ),
      lastMessage:
        id === state.lastMessage?.id ? { ...state.lastMessage, ...updates } : state.lastMessage,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setMode: (mode) => set({ mode }),

  setThreadId: (id) => set({ threadId: id }),

  markAsRead: () => set({ unreadCount: 0 }),

  setAgentActivity: (working) => set({ isAgentWorking: working }),

  addAgentLog: (log) =>
    set((state) => ({
      agentLogs: [...state.agentLogs, log],
    })),

  clearAgentLogs: () => set({ agentLogs: [] }),
}))
