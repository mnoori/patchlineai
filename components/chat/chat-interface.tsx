"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Zap, MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [mode, setMode] = useState<"agent" | "chat">("agent")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handle chat expansion
  const toggleExpansion = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)

    // Dispatch custom event for sidebar to listen to
    const event = new CustomEvent("chat-expanded", {
      detail: { expanded: newExpanded },
    })
    window.dispatchEvent(event)
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Expand chat when user types
    if (!isExpanded) {
      toggleExpansion()
    }

    // Add user message
    const userMessage: Message = { role: "user", content: input }
    setMessages([...messages, userMessage])
    setInput("")

    // Simulate assistant response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: `This is a simulated response to: "${input}"`,
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full border-t border-border transition-all duration-300 bg-card/50 backdrop-blur-sm",
        isExpanded ? "chat-expanded" : "chat-collapsed",
      )}
      onClick={() => !isExpanded && toggleExpansion()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/80">
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMode("agent")
            }}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors flex items-center",
              mode === "agent" ? "bg-cosmic-teal/10 text-cosmic-teal" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Zap className="h-3 w-3 mr-1" />
            Agent
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMode("chat")
            }}
            className={cn(
              "px-3 py-1 text-xs rounded-md transition-colors flex items-center",
              mode === "chat" ? "bg-cosmic-teal/10 text-cosmic-teal" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            if (isExpanded) toggleExpansion()
          }}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {mode === "agent"
                ? "Ask Patchy about your music, catalog, or industry insights"
                : "Start a conversation with the Patchline team"}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  message.role === "user"
                    ? "bg-cosmic-teal text-black font-medium"
                    : "bg-card text-foreground border border-border",
                )}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex items-end bg-card rounded-full border border-input focus-within:ring-1 focus-within:ring-cosmic-teal">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "agent" ? "Ask Patchy..." : "Type a message..."}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[40px] max-h-[120px] py-3 px-4 text-sm rounded-full"
            rows={1}
          />
          <button
            type="submit"
            className={cn(
              "p-3 rounded-full transition-colors mr-1",
              input.trim() ? "text-black bg-cosmic-teal hover:bg-cosmic-teal/90" : "text-muted-foreground bg-muted/50",
            )}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
