"use client"

import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, Plus, Check, AlertTriangle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


interface Platform {
  id: string
  name: string
  icon: string
  connected: boolean
  lastSync?: string
  status: "active" | "error" | "pending"
}

interface PlatformConnectionStatusProps {
  platforms: Platform[]
}

export function PlatformConnectionStatus({ platforms }: PlatformConnectionStatusProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  const handleRefresh = (id: string) => {
    setRefreshing(id)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(null)
    }, 1500)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Check className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "pending":
        return <RefreshCw className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  const connectedPlatforms = platforms.filter((platform) => platform.connected)
  const disconnectedPlatforms = platforms.filter((platform) => !platform.connected)

  return (
    <BrandCard className="glass-effect hover:border-brand-cyan/30 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">Platform Connections</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[250px] text-xs">
                  Connect your music platforms to get comprehensive insights. More connections mean better data.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Connect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Platform</DialogTitle>
              <DialogDescription>Connect your music platforms to get comprehensive insights.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {disconnectedPlatforms.map((platform) => (
                <Button key={platform.id} variant="outline" className="justify-start h-12">
                  <img src={platform.icon || "/placeholder.svg"} alt={platform.name} className="h-5 w-5 mr-2" />
                  {platform.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Connected Platforms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connectedPlatforms.map((platform) => (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <img src={platform.icon || "/placeholder.svg"} alt={platform.name} className="h-6 w-6" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{platform.name}</span>
                        {getStatusIcon(platform.status)}
                      </div>
                      {platform.lastSync && (
                        <p className="text-xs text-muted-foreground">Last sync: {platform.lastSync}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleRefresh(platform.id)}
                    disabled={refreshing === platform.id}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing === platform.id ? "animate-spin" : ""}`} />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {disconnectedPlatforms.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Recommended Connections</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {disconnectedPlatforms.slice(0, 2).map((platform) => (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-3 border rounded-md border-dashed"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={platform.icon || "/placeholder.svg"}
                        alt={platform.name}
                        className="h-6 w-6 opacity-70"
                      />
                      <span className="text-sm text-muted-foreground">{platform.name}</span>
                    </div>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setIsDialogOpen(true)}>
                      Connect
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border rounded-md bg-brand-cyan/5 border-brand-cyan/20">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-brand-cyan text-primary-foreground">Aria Tip</Badge>
              <h4 className="text-sm font-medium">More connections = better insights</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect all your platforms to get the most comprehensive view of your music performance. This helps Aria
              generate more accurate recommendations.
            </p>
          </div>
        </div>
      </CardContent>
    </BrandCard>
  )
}
