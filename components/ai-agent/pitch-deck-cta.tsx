"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Presentation } from "lucide-react"

export default function PitchDeckCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto mt-16 glassmorphic rounded-xl p-8 border border-neon-cyan/30"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="bg-neon-cyan/20 p-4 rounded-full">
          <Presentation className="h-10 w-10 text-neon-cyan" />
        </div>
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-xl font-semibold mb-2">View Patchline Pitch Deck</h3>
          <p className="text-light/80">
            Explore our complete pitch presentation to learn more about our vision, technology, and market opportunity.
          </p>
        </div>
        <Link
          href="/pitch-deck"
          className="shrink-0 px-6 py-3 bg-neon-cyan text-eclipse rounded-md font-medium hover:bg-neon-cyan/80 transition-colors"
        >
          View Pitch Deck
        </Link>
      </div>
    </motion.div>
  )
}
