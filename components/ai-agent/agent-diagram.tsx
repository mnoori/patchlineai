"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Search, FileText, Music, LinkIcon, BarChart, Heart } from "lucide-react"

export default function AgentDiagram() {
  const [mounted, setMounted] = useState(false)

  // Only enable animations after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const agents = [
    {
      name: "A&R Agent",
      color: "bg-neon-cyan",
      borderColor: "border-neon-cyan",
      textColor: "text-neon-cyan",
      description: "Scouts new talent",
      icon: <Search className="h-8 w-8 text-neon-cyan mb-3" />,
    },
    {
      name: "Legal Agent",
      color: "bg-neon-magenta",
      borderColor: "border-neon-magenta",
      textColor: "text-neon-magenta",
      description: "Reviews contracts",
      icon: <FileText className="h-8 w-8 text-neon-magenta mb-3" />,
    },
    {
      name: "Sync Agent",
      color: "bg-neon-green",
      borderColor: "border-neon-green",
      textColor: "text-neon-green",
      description: "Matches music to opportunities",
      icon: <LinkIcon className="h-8 w-8 text-neon-green mb-3" />,
    },
    {
      name: "Catalog Agent",
      color: "bg-neon-cyan",
      borderColor: "border-neon-cyan",
      textColor: "text-neon-cyan",
      description: "Organizes metadata",
      icon: <Music className="h-8 w-8 text-neon-cyan mb-3" />,
    },
    {
      name: "Analytics Agent",
      color: "bg-neon-magenta",
      borderColor: "border-neon-magenta",
      textColor: "text-neon-magenta",
      description: "Tracks performance metrics",
      icon: <BarChart className="h-8 w-8 text-neon-magenta mb-3" />,
    },
    {
      name: "Fan Agent",
      color: "bg-neon-green",
      borderColor: "border-neon-green",
      textColor: "text-neon-green",
      description: "Engages with audiences",
      icon: <Heart className="h-8 w-8 text-neon-green mb-3" />,
    },
  ]

  return (
    <div className="relative">
      {/* Orchestration Layer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 mx-auto mb-12 max-w-3xl glassmorphic p-6 rounded-xl shadow-lg"
      >
        <h3 className="text-2xl font-bold text-center mb-2">Orchestration Layer</h3>
        <p className="text-light/80 text-center">
          Coordinates agent workflows, manages complex tasks, and facilitates human-in-the-loop decisions
        </p>
      </motion.div>

      {/* Connection Lines */}
      <div className="absolute top-[120px] left-1/2 transform -translate-x-1/2 w-[1px] h-[60px] bg-neon-cyan opacity-50"></div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
            whileHover={
              mounted
                ? {
                    translateY: -8,
                    rotateZ: index % 2 === 0 ? 1 : -1,
                    transition: { duration: 0.3 },
                  }
                : {}
            }
            className={`${agent.color} bg-opacity-20 border ${agent.borderColor} border-opacity-50 p-6 rounded-lg text-center hover:bg-opacity-30 transition-all`}
          >
            <div className="flex flex-col items-center">
              {agent.icon}
              <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
              <p className="text-light/80">{agent.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Connection Lines to Tools */}
      <div className="mx-auto mt-8 mb-2 w-[1px] h-[60px] bg-neon-magenta opacity-50"></div>

      {/* Tools Layer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mx-auto max-w-3xl glassmorphic rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-2xl font-bold text-center mb-2">Tools & Integrations</h3>
        <p className="text-light/80 text-center">
          Connects with streaming platforms, rights databases, DAWs, and other music industry tools
        </p>
      </motion.div>
    </div>
  )
}
