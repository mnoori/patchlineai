"use client"

import { motion } from "framer-motion"

const TeamHero = () => {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      {/* Animated procedural noise background */}
      <div className="absolute inset-0 noise-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-eclipse via-eclipse/90 to-eclipse/80"></div>
        <div
          className="absolute inset-0"
          style={{
            background: `
            radial-gradient(circle at 20% 30%, rgba(0, 234, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 41, 117, 0.15) 0%, transparent 50%)
          `,
          }}
        ></div>
      </div>

      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="container relative z-10 px-4 text-center"
      >
        <motion.h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="text-gradient">Meet Our Team</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-light/80 text-xl max-w-2xl mx-auto"
        >
          The creative minds building the future of music industry AI
        </motion.p>
      </motion.div>
    </section>
  )
}

export default TeamHero
