"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface ContractEvent {
  id: string
  title: string
  type: "expiry" | "renewal" | "delivery" | "option" | "review"
  date: Date
  status: "upcoming" | "overdue" | "completed"
  contract: string
  description?: string
}

export function ContractCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<ContractEvent | null>(null)
  const [eventDrawerOpen, setEventDrawerOpen] = useState(false)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const mockEvents: ContractEvent[] = [
    {
      id: "1",
      title: "Distribution Agreement Expiry",
      type: "expiry",
      date: new Date(2025, 5, 15), // June 15, 2025
      status: "upcoming",
      contract: "Luna Ray Distribution",
      description: "Rights revert to artist if not renewed",
    },
    {
      id: "2",
      title: "Album Delivery Deadline",
      type: "delivery",
      date: new Date(2025, 4, 30), // May 30, 2025
      status: "upcoming",
      contract: "Cosmic Waves Recording",
      description: "Second album delivery required",
    },
    {
      id: "3",
      title: "Option Period Expires",
      type: "option",
      date: new Date(2025, 6, 10), // July 10, 2025
      status: "upcoming",
      contract: "The Echoes Publishing",
      description: "Label option for next album",
    },
    {
      id: "4",
      title: "Contract Review",
      type: "review",
      date: new Date(2025, 4, 15), // May 15, 2025
      status: "completed",
      contract: "Metro Beats Licensing",
      description: "Annual contract review completed",
    },
  ]

  const getEventColor = (type: string, status: string) => {
    if (status === "overdue") return "bg-red-500"
    if (status === "completed") return "bg-green-500"

    switch (type) {
      case "expiry":
        return "bg-red-400"
      case "renewal":
        return "bg-blue-400"
      case "delivery":
        return "bg-amber-400"
      case "option":
        return "bg-purple-400"
      case "review":
        return "bg-cyan-400"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "upcoming":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return mockEvents.filter(
      (event) =>
        event.date.getDate() === day &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear(),
    )
  }

  const handleEventClick = (event: ContractEvent) => {
    setSelectedEvent(event)
    setEventDrawerOpen(true)
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button size="sm" className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
          <Plus className="h-4 w-4 mr-2" />
          Add Key Date
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty days for month start */}
                {emptyDays.map((day) => (
                  <div key={`empty-${day}`} className="h-24 p-1" />
                ))}

                {/* Month days */}
                {days.map((day) => {
                  const events = getEventsForDate(day)
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear()

                  return (
                    <motion.div
                      key={day}
                      className={`h-24 p-1 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        isToday ? "bg-cosmic-teal/10 border-cosmic-teal" : "border-border"
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isToday ? "text-cosmic-teal" : ""}`}>{day}</span>
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          {events.slice(0, 2).map((event) => (
                            <motion.div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded text-white truncate cursor-pointer ${getEventColor(event.type, event.status)}`}
                              onClick={() => handleEventClick(event)}
                              whileHover={{ scale: 1.05 }}
                            >
                              {event.title}
                            </motion.div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{events.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockEvents
                .filter((event) => event.status === "upcoming")
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((event) => (
                  <motion.div
                    key={event.id}
                    className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEventClick(event)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start gap-2">
                      {getStatusIcon(event.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.contract}</p>
                        <p className="text-xs text-muted-foreground">{event.date.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { type: "expiry", label: "Contract Expiry", color: "bg-red-400" },
                { type: "renewal", label: "Renewal Notice", color: "bg-blue-400" },
                { type: "delivery", label: "Delivery Deadline", color: "bg-amber-400" },
                { type: "option", label: "Option Period", color: "bg-purple-400" },
                { type: "review", label: "Review Date", color: "bg-cyan-400" },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Drawer */}
      <Sheet open={eventDrawerOpen} onOpenChange={setEventDrawerOpen}>
        <SheetContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-border/50">
          <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
          {selectedEvent && (
            <>
              <SheetHeader className="border-b border-cosmic-teal/20 pb-4">
                <SheetTitle className="text-cosmic-teal">{selectedEvent.title}</SheetTitle>
                <SheetDescription>
                  {selectedEvent.contract} • {selectedEvent.date.toLocaleDateString()}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedEvent.status)}
                  <Badge variant="secondary" className="text-xs">
                    {selectedEvent.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>

                {selectedEvent.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">DESCRIPTION</h3>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <h3 className="text-sm font-medium text-cosmic-teal">ACTIONS</h3>
                  <div className="flex gap-2">
                    <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Take Action</Button>
                    <Button variant="outline">View Contract</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
