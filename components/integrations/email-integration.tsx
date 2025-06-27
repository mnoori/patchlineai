"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send, Eye, Loader2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { PATCHLINE_CONFIG } from "@/lib/config"

interface EmailIntegrationProps {
  recipient?: string
  subject?: string
  body?: string
  onSend?: (data: { recipient: string; subject: string; body: string }) => Promise<void>
  trigger?: React.ReactNode
  children?: React.ReactNode
}

export function EmailIntegration({
  recipient = "",
  subject = "",
  body = "",
  onSend,
  trigger,
  children,
}: EmailIntegrationProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailData, setEmailData] = useState({
    recipient,
    subject,
    body,
  })
  const [isConnected, setIsConnected] = useState(false)
  const isMobile = useIsMobile()
  const isDesktop = !isMobile

  const handleConnect = () => {
    // In a real implementation, this would trigger OAuth flow
    setIsConnected(true)
  }

  const handleSend = async () => {
    if (!PATCHLINE_CONFIG.features.enableEmailIntegration) {
      console.log("Email integration is disabled")
      return
    }

    try {
      setIsLoading(true)

      if (onSend) {
        await onSend(emailData)
      } else {
        // Simulate sending email
        await new Promise((resolve) => setTimeout(resolve, 1500))
        console.log("Email sent:", emailData)
      }

      setOpen(false)
    } catch (error) {
      console.error("Failed to send email:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-1">
              <Mail className="h-4 w-4" /> Compose Email
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              {isConnected
                ? "Draft an email to send via your connected account."
                : "Connect your email account to send emails directly from Patchline."}
            </DialogDescription>
          </DialogHeader>

          {!isConnected ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 text-center">
                <Mail className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">Connect your email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Gmail or Outlook account to send emails directly from Patchline.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleConnect} className="gap-1">
                    <Mail className="h-4 w-4" /> Connect Gmail
                  </Button>
                  <Button variant="outline" onClick={handleConnect} className="gap-1">
                    <Mail className="h-4 w-4" /> Connect Outlook
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">To</Label>
                <Input
                  id="recipient"
                  value={emailData.recipient}
                  onChange={(e) => setEmailData({ ...emailData, recipient: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  placeholder="Write your message here..."
                  rows={8}
                />
              </div>

              {children}
            </div>
          )}

          <DialogFooter>
            {isConnected && (
              <>
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="h-4 w-4" /> Preview
                </Button>
                <Button onClick={handleSend} disabled={isLoading} className="gap-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Email
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1">
            <Mail className="h-4 w-4" /> Compose Email
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Compose Email</DrawerTitle>
          <DrawerDescription>
            {isConnected
              ? "Draft an email to send via your connected account."
              : "Connect your email account to send emails directly from Patchline."}
          </DrawerDescription>
        </DrawerHeader>

        {!isConnected ? (
          <div className="px-4 space-y-4 py-4">
            <div className="rounded-lg border p-4 text-center">
              <Mail className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">Connect your email</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Gmail or Outlook account to send emails directly from Patchline.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleConnect} className="gap-1">
                  <Mail className="h-4 w-4" /> Connect Gmail
                </Button>
                <Button variant="outline" onClick={handleConnect} className="gap-1">
                  <Mail className="h-4 w-4" /> Connect Outlook
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-mobile">To</Label>
              <Input
                id="recipient-mobile"
                value={emailData.recipient}
                onChange={(e) => setEmailData({ ...emailData, recipient: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-mobile">Subject</Label>
              <Input
                id="subject-mobile"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body-mobile">Message</Label>
              <Textarea
                id="body-mobile"
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                placeholder="Write your message here..."
                rows={6}
              />
            </div>

            {children}
          </div>
        )}

        <DrawerFooter className="pt-2">
          {isConnected && (
            <>
              <Button onClick={handleSend} disabled={isLoading} className="gap-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Email
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
