"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Play } from "lucide-react"

const Hero = () => {
  const [showReel, setShowReel] = useState(false)
  const instagramReelUrl =
    "https://www.instagram.com/reel/DEGKScIyVF3/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

      {/* Parallax elements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="container relative z-10 px-4 text-center"
      >
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          data-text="Patchline: Orchestrate your Music Business with AI Agents"
        >
          <span className="glitch-text inline-block" data-text="Patchline:">
            Patchline:
          </span>{" "}
          <span className="glitch-text inline-block" data-text="Orchestrate">
            Orchestrate
          </span>{" "}
          <span className="glitch-text inline-block" data-text="your">
            your
          </span>{" "}
          <span className="glitch-text inline-block" data-text="Music">
            Music
          </span>{" "}
          <span className="glitch-text inline-block" data-text="Business">
            Business
          </span>{" "}
          <span className="glitch-text inline-block" data-text="with">
            with
          </span>{" "}
          <span className="glitch-text inline-block" data-text="AI">
            AI
          </span>{" "}
          <span className="glitch-text inline-block" data-text="Agents">
            Agents
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Button
            size="lg"
            className="bg-neon-cyan text-eclipse hover:bg-neon-cyan/80 font-medium"
            onClick={() => window.open(instagramReelUrl, "_blank")}
          >
            <Play className="mr-2 h-4 w-4" /> Watch Reel
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-eclipse font-medium"
            onClick={() => {
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            Book a Demo
          </Button>
        </motion.div>
      </motion.div>

      {/* YouTube modal */}
      <Dialog open={showReel} onOpenChange={setShowReel}>
        <DialogContent className="sm:max-w-[800px] p-0 bg-transparent border-none">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/videoseries?list=PLNYkxOF6rcIBzsbjZKyOdnHTiGIcjiUbC&autoplay=1"
              title="Patchline Reel"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default Hero
