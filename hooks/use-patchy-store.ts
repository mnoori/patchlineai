import { create } from "zustand"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "text" | "suggestion" | "action" | "error"
}

interface PatchyStore {
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
  setUnreadCount: (count: number) => void
  setMode: (mode: "agent" | "chat") => void
  setThreadId: (id: string) => void
  markAsRead: () => void
  setAgentActivity: (working: boolean) => void
  addAgentLog: (log: any) => void
  clearAgentLogs: () => void
}

export const usePatchyStore = create<PatchyStore>((set, get) => ({
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
