"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface UseCaseCardProps {
  title: string
  description: string
  icon: ReactNode
  index: number
}

export default function UseCaseCard({ title, description, icon, index }: UseCaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all transform hover:scale-[1.02]"
      layoutId={`use-case-${index}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 p-3 bg-eclipse rounded-full">{icon}</div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-light/80">{description}</p>
      </div>
    </motion.div>
  )
}
