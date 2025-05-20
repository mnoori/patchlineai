"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Instagram, Music, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PlatformConnectModalProps {
  platform: "instagram" | "soundcloud"
  isOpen: boolean
  onClose: () => void
}

export function PlatformConnectModal({ platform, isOpen, onClose }: PlatformConnectModalProps) {
  const { userId } = useCurrentUser()
  const [isConnecting, setIsConnecting] = useState(false)
  const [soundcloudUrl, setSoundcloudUrl] = useState("")
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setStatusMessage(null)
    
    try {
      if (platform === "instagram") {
        // Start Instagram OAuth flow
        const response = await fetch(`/api/auth/instagram`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to start OAuth flow")
        }

        window.location.href = data.url
      } else {
        // Validate SoundCloud URL
        if (!soundcloudUrl) {
          throw new Error("Please provide a SoundCloud URL")
        }

        const response = await fetch(`/api/oembed/soundcloud?url=${encodeURIComponent(soundcloudUrl)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch SoundCloud embed info")
        }

        // Save embed to backend
        const embedResponse = await fetch("/api/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            platform: "soundcloud",
            url: soundcloudUrl,
            html: data.html,
            title: data.title,
          }),
        })
        
        const embedData = await embedResponse.json()
        
        if (embedData.alreadyExists) {
          setStatusMessage({
            type: "info",
            message: "This SoundCloud URL has already been added to your profile."
          })
          setIsConnecting(false)
          return
        }
        
        console.log("SoundCloud embed saved")
        setStatusMessage({
          type: "success",
          message: "SoundCloud content successfully added!"
        })
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to connect platform:", error)
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to connect platform"
      })
      setIsConnecting(false)
    }
  }

  const platformConfig = {
    instagram: {
      name: "Instagram",
      icon: Instagram,
      description: "Connect your Instagram account to share your music and engage with your audience.",
      color: "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500",
    },
    soundcloud: {
      name: "SoundCloud",
      icon: Music,
      description: "Paste a public SoundCloud track, playlist, or profile URL to display it in your dashboard.",
      color: "bg-orange-500",
    },
  } as const

  const config = platformConfig[platform]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${config.color} flex items-center justify-center`}>
              <config.icon className="h-4 w-4 text-white" />
            </div>
            Connect {config.name}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {statusMessage && (
            <Alert variant={statusMessage.type === "error" ? "destructive" : "default"}>
              {statusMessage.type === "error" && <AlertCircle className="h-4 w-4" />}
              {statusMessage.type === "success" && <CheckCircle className="h-4 w-4" />}
              <AlertDescription>{statusMessage.message}</AlertDescription>
            </Alert>
          )}
          
          {platform === "instagram" ? (
            <div className="text-sm text-muted-foreground">
              By connecting your Instagram account, you agree to share your public profile information and
              allow us to post content on your behalf.
            </div>
          ) : (
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium" htmlFor="sc-url">
                SoundCloud URL
              </label>
              <Input
                id="sc-url"
                placeholder="https://soundcloud.com/artist/track"
                value={soundcloudUrl}
                onChange={(e) => setSoundcloudUrl(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={`${config.color} text-white`}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {platform === "instagram" ? "Redirecting..." : "Saving..."}
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 