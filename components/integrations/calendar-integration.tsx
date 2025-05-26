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
import { CalendarIcon, Users, MapPin, Plus, Loader2, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-mobile"
import { PATCHLINE_CONFIG } from "@/lib/config"

interface CalendarIntegrationProps {
  title?: string
  description?: string
  location?: string
  startDate?: Date
  endDate?: Date
  attendees?: string[]
  onSchedule?: (data: {
    title: string
    description: string
    location: string
    startDate: Date
    endDate: Date
    attendees: string[]
  }) => Promise<void>
  trigger?: React.ReactNode
  children?: React.ReactNode
}

export function CalendarIntegration({
  title = "",
  description = "",
  location = "",
  startDate = new Date(),
  endDate = new Date(new Date().setHours(new Date().getHours() + 1)),
  attendees = [],
  onSchedule,
  trigger,
  children,
}: CalendarIntegrationProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [eventData, setEventData] = useState({
    title,
    description,
    location,
    startDate,
    endDate,
    attendees,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [attendeeInput, setAttendeeInput] = useState("")
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handleConnect = () => {
    // In a real implementation, this would trigger OAuth flow
    setIsConnected(true)
  }

  const handleSchedule = async () => {
    if (!PATCHLINE_CONFIG.features.enableCalendarIntegration) {
      console.log("Calendar integration is disabled")
      return
    }

    try {
      setIsLoading(true)

      if (onSchedule) {
        await onSchedule(eventData)
      } else {
        // Simulate scheduling event
        await new Promise((resolve) => setTimeout(resolve, 1500))
        console.log("Event scheduled:", eventData)
      }

      setOpen(false)
    } catch (error) {
      console.error("Failed to schedule event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addAttendee = () => {
    if (attendeeInput && !eventData.attendees.includes(attendeeInput)) {
      setEventData({
        ...eventData,
        attendees: [...eventData.attendees, attendeeInput],
      })
      setAttendeeInput("")
    }
  }

  const removeAttendee = (attendee: string) => {
    setEventData({
      ...eventData,
      attendees: eventData.attendees.filter((a) => a !== attendee),
    })
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-1">
              <CalendarIcon className="h-4 w-4" /> Schedule Event
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
            <DialogDescription>
              {isConnected
                ? "Create a calendar event and invite attendees."
                : "Connect your calendar to schedule events directly from Patchline."}
            </DialogDescription>
          </DialogHeader>

          {!isConnected ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">Connect your calendar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Google Calendar or Outlook calendar to schedule events directly from Patchline.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleConnect} className="gap-1">
                    <CalendarIcon className="h-4 w-4" /> Connect Google Calendar
                  </Button>
                  <Button variant="outline" onClick={handleConnect} className="gap-1">
                    <CalendarIcon className="h-4 w-4" /> Connect Outlook
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventData.startDate ? format(eventData.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventData.startDate}
                        onSelect={(date) => date && setEventData({ ...eventData, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventData.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventData.endDate ? format(eventData.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventData.endDate}
                        onSelect={(date) => date && setEventData({ ...eventData, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    id="location"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                    placeholder="Add location or meeting link"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Add description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    placeholder="Add attendee email"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addAttendee()}
                  />
                  <Button type="button" size="icon" onClick={addAttendee}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {eventData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eventData.attendees.map((attendee) => (
                      <div key={attendee} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                        <span>{attendee}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => removeAttendee(attendee)}
                        >
                          <span className="sr-only">Remove</span>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {children}
            </div>
          )}

          <DialogFooter>
            {isConnected && (
              <Button onClick={handleSchedule} disabled={isLoading} className="gap-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4" /> Schedule Event
                  </>
                )}
              </Button>
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
            <CalendarIcon className="h-4 w-4" /> Schedule Event
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Schedule Event</DrawerTitle>
          <DrawerDescription>
            {isConnected
              ? "Create a calendar event and invite attendees."
              : "Connect your calendar to schedule events directly from Patchline."}
          </DrawerDescription>
        </DrawerHeader>

        {!isConnected ? (
          <div className="px-4 space-y-4 py-4">
            <div className="rounded-lg border p-4 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">Connect your calendar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google Calendar or Outlook calendar to schedule events directly from Patchline.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleConnect} className="gap-1">
                  <CalendarIcon className="h-4 w-4" /> Connect Google Calendar
                </Button>
                <Button variant="outline" onClick={handleConnect} className="gap-1">
                  <CalendarIcon className="h-4 w-4" /> Connect Outlook
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title-mobile">Event Title</Label>
              <Input
                id="title-mobile"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventData.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventData.startDate ? format(eventData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventData.startDate}
                    onSelect={(date) => date && setEventData({ ...eventData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventData.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventData.endDate ? format(eventData.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventData.endDate}
                    onSelect={(date) => date && setEventData({ ...eventData, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-mobile">Location</Label>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  id="location-mobile"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  placeholder="Add location or meeting link"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description-mobile">Description</Label>
              <Textarea
                id="description-mobile"
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                placeholder="Add description"
                rows={3}
              />
            </div>

            {children}
          </div>
        )}

        <DrawerFooter className="pt-2">
          {isConnected && (
            <>
              <Button onClick={handleSchedule} disabled={isLoading} className="gap-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4" /> Schedule Event
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
