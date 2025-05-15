"use client"

import { motion } from "framer-motion"
import { TrendingUp, Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TrendingArtists() {
  const trendingArtists = [
    {
      name: "Neon Pulse",
      genre: "Synthwave",
      location: "Los Angeles",
      growth: "+127%",
      metric: "monthly listeners",
      image: "/electronic-artist-profile.png",
    },
    {
      name: "Echo Chamber",
      genre: "Ambient",
      location: "Berlin",
      growth: "+85%",
      metric: "playlist adds",
      image: "/ambient-artist-profile.png",
    },
    {
      name: "Quantum Pulse",
      genre: "Electro",
      location: "Tokyo",
      growth: "+152%",
      metric: "social engagement",
      image: "/placeholder.svg?key=6p9db",
    },
    {
      name: "Digital Horizon",
      genre: "Chillwave",
      location: "London",
      growth: "+94%",
      metric: "track shares",
      image: "/chillwave-artist.png",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trendingArtists.map((artist, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-eclipse/50 border border-light/10 rounded-lg p-5 hover:border-neon-cyan/50 transition-all"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={artist.image || "/placeholder.svg"}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold">{artist.name}</h3>
                <p className="text-light/60 text-sm">
                  {artist.genre} • {artist.location}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-neon-green" />
                  <span className="text-neon-green text-sm font-medium">
                    {artist.growth} {artist.metric}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 py-1 text-xs border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-eclipse"
                  >
                    <Play className="h-3 w-3 mr-1" /> Listen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 py-1 text-xs border-light/30 text-light/70 hover:border-light/50 hover:text-light"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" /> Profile
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
