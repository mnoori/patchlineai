"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Copy, Sparkles, Calendar, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Release } from "@/lib/mock/release"
import { cn } from "@/lib/utils"

interface ReleaseListProps {
  releases: Release[]
  selectedRelease: Release | null
  onSelectRelease: (release: Release) => void
  searchTerm: string
}

export function ReleaseList({ releases, selectedRelease, onSelectRelease, searchTerm }: ReleaseListProps) {
  const [hoveredRelease, setHoveredRelease] = useState<string | null>(null)

  const filteredReleases = releases.filter(
    (release) =>
      release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: Release["status"]) => {
    switch (status) {
      case "In Progress":
        return "bg-amber-600/30 text-amber-300"
      case "Scheduled":
        return "bg-green-600/30 text-green-300"
      case "Released":
        return "bg-blue-600/30 text-blue-300"
      default:
        return "bg-gray-600/30 text-gray-300"
    }
  }

  const getTimelineColor = (release: Release) => {
    if (release.risks.length > 0) {
      const highRisk = release.risks.some((r) => r.severity === "high")
      const mediumRisk = release.risks.some((r) => r.severity === "medium")
      if (highRisk) return "bg-red-600/30 text-red-300"
      if (mediumRisk) return "bg-amber-600/30 text-amber-300"
    }
    return "bg-green-600/30 text-green-300"
  }

  const handleQuickAction = (action: string, release: Release, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`${action} for ${release.title}`)
    // TODO: Implement actual actions
  }

  return (
    <div className="space-y-4">
      {filteredReleases.map((release) => (
        <motion.div
          key={release.id}
          className={cn(
            "relative p-4 rounded-lg border transition-all duration-200 cursor-pointer",
            "glass-effect hover:border-cyan-400/30",
            selectedRelease?.id === release.id && "border-cyan-400/50 bg-cyan-400/5",
          )}
          onClick={() => onSelectRelease(release)}
          onMouseEnter={() => setHoveredRelease(release.id)}
          onMouseLeave={() => setHoveredRelease(null)}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{release.title}</h3>
                <p className="text-sm text-muted-foreground">{release.artist}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {release.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{release.tracks} tracks</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge className={cn("text-[10px] px-2", getStatusColor(release.status))}>{release.status}</Badge>
                {release.risks.length > 0 && (
                  <Badge className={cn("text-[10px] px-2", getTimelineColor(release))}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Risk
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Release Progress</span>
                <span>{release.progress}%</span>
              </div>
              <Progress value={release.progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  <span>{release.releaseDate}</span>
                </div>
                {release.eta && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{release.eta}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hoveredRelease === release.id && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 px-2">
                          <Play className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleQuickAction("open", release, e)}>
                          <Play className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleQuickAction("duplicate", release, e)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleQuickAction("generate-plan", release, e)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate rollout plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectRelease(release)
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
