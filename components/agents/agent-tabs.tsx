"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion"

interface AgentTabsProps {
  tabs: Array<{
    value: string
    label: string
    content: React.ReactNode
  }>
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function AgentTabs({ tabs, defaultValue, onValueChange }: AgentTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeElement = document.querySelector(`[data-state="active"]`) as HTMLElement
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      })
    }
  }, [activeTab])

  const handleValueChange = (value: string) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleValueChange} className="w-full">
      <div className="relative">
        <TabsList className="grid w-full bg-transparent border-b rounded-none h-auto p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* DNA Line Indicator */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-gradient-to-r from-cosmic-teal to-cosmic-pink"
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
