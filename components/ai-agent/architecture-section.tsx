"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Brain, Database, Layers, Users, Search, FileText, Music, LinkIcon, BarChart, Heart } from "lucide-react"

export default function ArchitectureSection() {
  const [mounted, setMounted] = useState(false)

  // Only enable animations after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const agentTypes = [
    {
      title: "A&R Agent",
      description:
        "Analyzes 100,000+ tracks daily across platforms to identify promising artists and tracks that match your label's sound.",
      icon: <Search className="h-10 w-10 text-neon-cyan" />,
      color: "neon-cyan",
    },
    {
      title: "Legal Agent",
      description:
        "Reviews contracts, flags potential issues, and suggests improvements based on industry standards and your label's preferences.",
      icon: <FileText className="h-10 w-10 text-neon-magenta" />,
      color: "neon-magenta",
    },
    {
      title: "Catalog Agent",
      description:
        "Automatically analyzes and tags your entire music catalog with detailed metadata for better organization and discoverability.",
      icon: <Music className="h-10 w-10 text-neon-green" />,
      color: "neon-green",
    },
    {
      title: "Sync Agent",
      description: "Matches your catalog to sync licensing opportunities across film, TV, advertising, and gaming.",
      icon: <LinkIcon className="h-10 w-10 text-neon-cyan" />,
      color: "neon-cyan",
    },
    {
      title: "Analytics Agent",
      description:
        "Tracks emerging genres, production techniques, and audience preferences with real-time data visualization and predictive analytics.",
      icon: <BarChart className="h-10 w-10 text-neon-magenta" />,
      color: "neon-magenta",
    },
    {
      title: "Fan Engagement Agent",
      description:
        "Optimizes fan communication, social media strategy, and marketing campaigns based on audience data and behavior.",
      icon: <Heart className="h-10 w-10 text-neon-green" />,
      color: "neon-green",
    },
  ]

  const architectureItems = [
    {
      title: "Orchestration Layer",
      description: "Coordinates agent workflows, manages complex tasks, and facilitates human-in-the-loop decisions",
      icon: <Brain className="h-12 w-12 text-neon-cyan" />,
    },
    {
      title: "Memory & Knowledge",
      description: "Persistent memory and industry-specific knowledge base",
      icon: <Database className="h-12 w-12 text-neon-magenta" />,
    },
    {
      title: "Tool Access",
      description: "Integration with music platforms, rights databases, and more",
      icon: <Layers className="h-12 w-12 text-neon-green" />,
    },
    {
      title: "Human-in-the-Loop",
      description: "Collaborative workflow with human experts for oversight",
      icon: <Users className="h-12 w-12 text-neon-cyan" />,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Architecture Components */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {architectureItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-light/80">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Types with Detailed Descriptions */}
      <h3 className="text-2xl font-bold mb-8 text-center">
        Specialized <span className="text-neon-cyan">AI Agents</span>
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {agentTypes.map((agent, index) => (
          <motion.div
            key={agent.title}
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.4 + index * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all h-full"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className={`mr-4 p-3 rounded-full bg-${agent.color}/20`}>{agent.icon}</div>
                <h3 className="text-xl font-semibold">{agent.title}</h3>
              </div>
              <p className="text-light/80 flex-grow">{agent.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="bg-eclipse/50 border border-light/10 p-6 rounded-lg"
      >
        <h3 className="text-xl font-semibold mb-4 text-center">How They Work Together</h3>
        <p className="text-light/80">
          Our platform orchestrates these components to create intelligent workflows. The A&R Agent discovers new music,
          the Catalog Agent tags it, the Sync Agent identifies licensing opportunities, and the Legal Agent helps with
          contract review—all with human oversight at critical decision points.
        </p>
      </motion.div>
    </div>
  )
}
