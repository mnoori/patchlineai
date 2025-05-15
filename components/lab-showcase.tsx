"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

// YouTube video IDs from the ALGORYX channel
const SHOWCASE_VIDEOS = [
  {
    id: "C02IXO2vxAE",
    title: "Live Audio visual set - Museum of Cannabis",
    description: "Live performance",
    timestamp: "2218s",
  },
  {
    id: "xHRhhv4pW3A",
    title: "Algoryx - Live Stream - Audio Visuals",
    description: "First live Audio Visual show with real-time generated visuals",
    timestamp: "3609s",
  },
]

const LabShowcase = () => {
  const [loadedVideos, setLoadedVideos] = useState<string[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const videoRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Initialize YouTube API
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Set up intersection observer to lazy load videos
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute("data-video-id")
            if (videoId && !loadedVideos.includes(videoId)) {
              setLoadedVideos((prev) => [...prev, videoId])
            }
          }
        })
      },
      { threshold: 0.1 },
    )

    // Observe all video containers
    videoRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [loadedVideos])

  return (
    <section id="lab" className="py-24 bg-eclipse relative">
      <div className="absolute inset-0 noise-bg opacity-20"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 glitch-text" data-text="Lab Showcase">
            Lab Showcase
          </h2>
          <p className="text-light/80 max-w-2xl mx-auto">
            Explore our experimental projects at the intersection of AI, music, and visual art. Each case study
            represents a unique approach to human-machine collaboration.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {SHOWCASE_VIDEOS.map((video, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <Card
                className="overflow-hidden bg-eclipse border border-light/10 hover:border-neon-cyan/50 transition-all duration-300 group"
                ref={(el) => (videoRefs.current[index] = el)}
                data-video-id={video.id}
              >
                <div className="aspect-video relative overflow-hidden">
                  {loadedVideos.includes(video.id) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=0&controls=0&mute=1&loop=1&modestbranding=1&playlist=${video.id}&start=${video.timestamp.replace("s", "")}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="absolute inset-0 w-full h-full"
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 via-neon-magenta/20 to-neon-green/20 animate-pulse flex items-center justify-center">
                      <span className="text-light/50">Loading...</span>
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-eclipse/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="outline"
                      className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-eclipse"
                      onClick={() =>
                        window.open(
                          `https://www.youtube.com/watch?v=${video.id}&t=${video.timestamp}&ab_channel=ALGORYX`,
                          "_blank",
                        )
                      }
                    >
                      View Story <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold mb-2">{video.title}</h3>
                  <p className="text-light/70 text-sm">{video.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LabShowcase
