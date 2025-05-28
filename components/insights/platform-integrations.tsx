"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronUp, Settings, Plus } from "lucide-react"
import { motion } from "framer-motion"

interface PlatformCardProps {
  name: string
  icon: React.ReactNode
  connected: boolean
  onClick: () => void
}

const PlatformCard = ({ name, icon, connected, onClick }: PlatformCardProps) => {
  return (
    <div
      className={`relative rounded-lg p-4 flex flex-col items-center justify-center gap-2 border border-border/50 hover:border-cosmic-teal/30 hover:scale-[1.03] transition-all duration-200 cursor-pointer ${
        connected ? "bg-background/20" : "bg-background/10"
      }`}
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${connected ? "" : "opacity-70"}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{name}</span>
      {connected ? (
        <div className="flex items-center gap-1 text-xs text-green-500">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>On</span>
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-background/30 flex items-center justify-center hover:bg-cosmic-teal/20 transition-colors">
          <Plus className="h-4 w-4 text-cosmic-teal" />
        </div>
      )}
      {connected && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
      )}
    </div>
  )
}

import { usePlatformConnections } from "@/hooks/use-platform-connections"

export function PlatformIntegrations() {
  const { platforms, connectPlatform } = usePlatformConnections()
  
  const platformList = [
    {
      name: "Gmail",
      platform: "gmail",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
      ),
      connected: platforms.gmail?.connected || false,
    },
    {
      name: "Google Calendar",
      platform: "google",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
            <path d="M16 18h.01" />
          </svg>
        </div>
      ),
      connected: platforms.google?.connected || false,
    },
    {
      name: "Spotify",
      platform: "spotify",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 11.973c2.5-1.473 4.5-.973 7.5.527" />
            <path d="M9 15c1.5-.5 2.5-.5 5 1" />
            <path d="M9 9c1.5-.5 3.5-1 5.5.5" />
          </svg>
        </div>
      ),
      connected: platforms.spotify?.connected || false,
    },
    {
      name: "Apple Music",
      platform: "applemusic",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
            <path d="M8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M14 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M16 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M10 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M12 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M14 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M16 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path d="M10 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          </svg>
        </div>
      ),
      connected: platforms.applemusic?.connected || false,
    },
    {
      name: "SoundCloud",
      platform: "soundcloud",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 17h.7c1.2 0 2.3-.5 3-1.4 1-1.2 1-3 0-4.2-.7-.9-1.8-1.4-3-1.4H4" />
            <path d="M2 17h1" />
            <path d="M6 17h2" />
            <path d="M10 17h2" />
            <path d="M14 17h1" />
            <path d="M18 17h1" />
            <path d="M22 17h.3a2 2 0 0 0 1.7-2.3 2 2 0 0 0-2-1.7H22" />
            <path d="M20 17h1" />
            <path d="M2 10h20" />
            <path d="M2 14h20" />
          </svg>
        </div>
      ),
      connected: platforms.soundcloud?.connected || false,
    },
    {
      name: "YouTube",
      platform: "youtube",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
            <path d="m10 15 5-3-5-3z" />
          </svg>
        </div>
      ),
      connected: platforms.youtube?.connected || false,
    },
    {
      name: "Instagram",
      platform: "instagram",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </div>
      ),
      connected: platforms.instagram?.connected || false,
    },
    {
      name: "Twitter",
      platform: "twitter",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        </div>
      ),
      connected: platforms.twitter?.connected || false,
    },
    {
      name: "Facebook",
      platform: "facebook",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        </div>
      ),
      connected: platforms.facebook?.connected || false,
    },
    {
      name: "Add More",
      icon: (
        <div className="w-10 h-10 rounded-lg bg-cosmic-teal/20 flex items-center justify-center text-cosmic-teal">
          <Settings className="h-6 w-6" />
        </div>
      ),
      connected: false,
    },
  ]

  const connectedCount = platformList.filter((p) => p.connected).length
  const totalCount = platformList.length - 1 // Excluding "Add More"
  const percentage = Math.round((connectedCount / totalCount) * 100)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cosmic-teal" />
            <CardTitle className="text-lg font-medium">Platform Integrations</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>
              {connectedCount} of {totalCount}
            </span>
            <Progress value={percentage} className="w-24 h-2" />
            <span>{percentage}%</span>
          </div>
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {platformList.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <PlatformCard
                  name={platform.name}
                  icon={platform.icon}
                  connected={platform.connected}
                  onClick={() => platform.platform ? connectPlatform(platform.platform) : console.log(`Clicked ${platform.name}`)}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
