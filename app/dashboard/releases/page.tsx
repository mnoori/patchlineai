"use client"

import { useState, useEffect } from "react"
import { Card } from '@/components/brand'
import { motion } from "framer-motion"
import { Search, Filter, Calendar, Plus, ChevronDown, Download, FolderSyncIcon as Sync, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useReleaseStore } from "@/hooks/use-release-store"
import { ReleaseList } from "@/components/releases/release-list"
import { ReleaseDetail } from "@/components/releases/release-detail"
import { cn } from "@/lib/utils"

export default function ReleasesPage() {
  const {
    releases,
    selectedRelease,
    searchTerm,
    dismissedHints,
    setSelectedRelease,
    setSearchTerm,
    dismissHint,
    markTaskComplete,
    updateReleaseProgress,
  } = useReleaseStore()

  const [activeTab, setActiveTab] = useState("upcoming")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Shift+R as a simple shortcut for new release
      if (e.key === "r" && e.shiftKey) {
        e.preventDefault()
        console.log("New Release shortcut triggered")
        handleNewRelease()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredReleases = releases.filter((release) => {
    if (activeTab === "upcoming") return release.status === "In Progress" || release.status === "Scheduled"
    if (activeTab === "past") return release.status === "Released"
    if (activeTab === "drafts") return release.status === "Draft"
    return true
  })

  const handleCalendarSync = (provider: string) => {
    console.log(`Syncing to ${provider}`)
    // TODO: Implement calendar sync API call
  }

  const handleNewRelease = () => {
    console.log("Creating new release")
    // TODO: Open new release modal
  }

  const MobileReleaseSelector = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="md:hidden w-full justify-between">
          {selectedRelease ? selectedRelease.title : "Select Release"}
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search releases..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ReleaseList
                releases={filteredReleases}
                selectedRelease={selectedRelease}
                onSelectRelease={(release) => {
                  setSelectedRelease(release)
                  setIsMobileMenuOpen(false)
                }}
                searchTerm={searchTerm}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight font-heading bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">Release Workspace</h1>
                <p className="text-muted-foreground">
                  Plan, manage, and track all your releases in one unified workspace.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 hidden md:flex">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Calendar className="h-4 w-4" />
                      View Calendar
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCalendarOpen(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      View Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCalendarSync("google")}>
                      <Sync className="h-4 w-4 mr-2" />
                      Sync to Google
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCalendarSync("ics")}>
                      <Download className="h-4 w-4 mr-2" />
                      Download ICS
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" className="gap-1 bg-cyan-500 hover:bg-cyan-600 text-black" onClick={handleNewRelease} variant="outline">
                  <Plus className="h-4 w-4" />
                  New Release
                </Button>
              </div>
            </div>

            {/* Mobile Release Selector */}
            <div className="md:hidden">
              <MobileReleaseSelector />
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search releases, tracks, or artists..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="space-y-4 h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4 h-[calc(100%-60px)] overflow-y-auto">
                  <ReleaseList
                    releases={filteredReleases}
                    selectedRelease={selectedRelease}
                    onSelectRelease={setSelectedRelease}
                    searchTerm={searchTerm}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="h-full overflow-y-auto">
              {selectedRelease ? (
                <motion.div
                  key={selectedRelease.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ReleaseDetail
                    release={selectedRelease}
                    onTaskComplete={(taskId: string) => markTaskComplete(selectedRelease.id, taskId)}
                    onStepComplete={(stepId: string) => updateReleaseProgress(selectedRelease.id, stepId, true)}
                    dismissedHints={dismissedHints}
                    onDismissHint={dismissHint}
                  />
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Select a Release</h3>
                      <p className="text-muted-foreground">
                        Choose a release from the list to view details and manage tasks
                      </p>
                    </div>
                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-black" onClick={handleNewRelease} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Release
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Release Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CalendarComponent mode="single" className="rounded-md border" />
            <div className="space-y-2">
              <h4 className="font-medium">Upcoming Releases</h4>
              {releases
                .filter((r) => r.status === "In Progress" || r.status === "Scheduled")
                .slice(0, 3)
                .map((release) => (
                  <div key={release.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{release.title}</p>
                      <p className="text-xs text-muted-foreground">{release.releaseDate}</p>
                    </div>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        release.status === "In Progress" ? "bg-amber-500" : "bg-green-500",
                      )}
                    />
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
