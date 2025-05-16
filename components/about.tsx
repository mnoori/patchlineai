"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export default function About() {
  return (
    <section id="about" className="py-20 relative">
      <div className="absolute inset-0 noise-bg opacity-30"></div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 glitch-text" data-text="The Vision">
              The Vision
            </h2>
            <div className="space-y-4 text-light/90">
              <p>
                Patchline AI is building the operating system for the future of music business. We're creating a
                full-stack, AI-first platform with specialized agents that automate and optimize workflows across A&R,
                legal, catalog management, sync licensing, and fan engagement.
              </p>
              <p>
                Our platform provides intelligent A&R discovery and analysis, automated metadata management, rights and
                royalty tracking, smart contract generation, catalog optimization, fan engagement automation, and
                cross-platform analytics.
              </p>
              <p>
                We're making professional tools accessible to independent creators while helping major labels scale their
                operations. Our AI agents work together to create intelligent workflows, with human oversight at critical
                decision points.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
