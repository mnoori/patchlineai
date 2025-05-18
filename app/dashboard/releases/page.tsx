"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Search, Filter, Music2, Calendar, Clock, CheckCircle2, Plus, MoreHorizontal, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ReleasesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const upcomingReleases = [
    {
      title: "Summer EP",
      artist: "Luna Echo",
      type: "EP",
      tracks: 3,
      releaseDate: "June 15, 2025",
      status: "In Progress",
      progress: 75,
      tasks: [
        { name: "Upload tracks", completed: true },
        { name: "Add metadata", completed: true },
        { name: "Create artwork", completed: true },
        { name: "Schedule release", completed: false },
      ],
    },
    {
      title: "Remix Package",
      artist: "Luna Echo",
      type: "EP",
      tracks: 4,
      releaseDate: "July 22, 2025",
      status: "Scheduled",
      progress: 100,
      tasks: [
        { name: "Upload tracks", completed: true },
        { name: "Add metadata", completed: true },
        { name: "Create artwork", completed: true },
        { name: "Schedule release", completed: true },
      ],
    },
    {
      title: "Acoustic Sessions",
      artist: "Luna Echo",
      type: "Album",
      tracks: 8,
      releaseDate: "August 10, 2025",
      status: "Scheduled",
      progress: 100,
      tasks: [
        { name: "Upload tracks", completed: true },
        { name: "Add metadata", completed: true },
        { name: "Create artwork", completed: true },
        { name: "Schedule release", completed: true },
      ],
    },
  ]

  const pastReleases = [
    {
      title: "Digital Dreams",
      artist: "Pulse Wave",
      type: "Album",
      tracks: 8,
      releaseDate: "March 10, 2025",
      streams: "1.2M",
      revenue: "$4,800",
    },
    {
      title: "Cosmic Journey",
      artist: "Astral Drift",
      type: "Album",
      tracks: 10,
      releaseDate: "January 22, 2025",
      streams: "950K",
      revenue: "$3,800",
    },
    {
      title: "Urban Jungle",
      artist: "Metro Beats",
      type: "Album",
      tracks: 12,
      releaseDate: "February 8, 2025",
      streams: "1.8M",
      revenue: "$7,200",
    },
    {
      title: "Neon Lights",
      artist: "Vapor Trail",
      type: "Single",
      tracks: 1,
      releaseDate: "April 5, 2025",
      streams: "320K",
      revenue: "$1,280",
    },
  ]

  const draftReleases = [
    {
      title: "Winter Collection",
      artist: "Luna Echo",
      type: "Album",
      tracks: 0,
      lastEdited: "May 10, 2025",
      progress: 15,
    },
    {
      title: "Untitled Project",
      artist: "Metro Beats",
      type: "EP",
      tracks: 2,
      lastEdited: "May 8, 2025",
      progress: 30,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Releases</h1>
        <p className="text-muted-foreground">Manage your upcoming, past, and draft releases</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search releases..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" /> Calendar
          </Button>
          <Button size="sm" className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
            <Plus className="h-4 w-4" /> New Release
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-6">
            {upcomingReleases.map((release, index) => (
              <Card key={index} className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                          <Music2 className="h-8 w-8 text-cosmic-teal" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{release.title}</h3>
                          <p className="text-sm text-muted-foreground">{release.artist}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cosmic-teal/10 text-cosmic-teal">
                              {release.type}
                            </span>
                            <span className="text-xs text-muted-foreground">{release.tracks} tracks</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-1/4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Release Date</span>
                          <span className="text-sm">{release.releaseDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status</span>
                          <span
                            className={`text-sm flex items-center gap-1 ${
                              release.status === "In Progress" ? "text-amber-500" : "text-green-500"
                            }`}
                          >
                            {release.status === "In Progress" ? (
                              <Clock className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {release.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{release.progress}%</span>
                          </div>
                          <Progress value={release.progress} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="md:w-1/3">
                      <h4 className="text-sm font-medium mb-2">Tasks</h4>
                      <div className="space-y-1">
                        {release.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-center gap-2">
                            {task.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                            )}
                            <span className="text-sm">{task.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:w-1/6 flex md:justify-end items-center">
                      <Button variant="outline" className="gap-1">
                        Manage <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Past Releases</CardTitle>
              <CardDescription>Previously released music</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Release</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Tracks</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Release Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Streams</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Revenue</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastReleases.map((release, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                                <Music2 className="h-5 w-5 text-cosmic-teal" />
                              </div>
                              <div>
                                <div className="font-medium">{release.title}</div>
                                <div className="text-xs text-muted-foreground">{release.artist}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{release.type}</td>
                          <td className="p-4 align-middle">{release.tracks}</td>
                          <td className="p-4 align-middle">{release.releaseDate}</td>
                          <td className="p-4 align-middle">{release.streams}</td>
                          <td className="p-4 align-middle">{release.revenue}</td>
                          <td className="p-4 align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Download Reports</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="grid md:grid-cols-2 gap-6">
            {draftReleases.map((draft, index) => (
              <Card key={index} className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                        <Music2 className="h-6 w-6 text-cosmic-teal" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{draft.title}</h3>
                        <p className="text-sm text-muted-foreground">{draft.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cosmic-teal/10 text-cosmic-teal">
                            {draft.type}
                          </span>
                          <span className="text-xs text-muted-foreground">{draft.tracks} tracks</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last edited: {draft.lastEdited}</span>
                      <span>{draft.progress}% complete</span>
                    </div>
                    <Progress value={draft.progress} className="h-2" />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" className="gap-1">
                      Continue Editing <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="glass-effect border-dashed hover:border-cosmic-teal/30 transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[220px]">
                <div className="rounded-full bg-cosmic-teal/10 p-3 mb-4">
                  <Plus className="h-6 w-6 text-cosmic-teal" />
                </div>
                <h3 className="text-lg font-medium mb-2">Create New Draft</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">Start planning your next release</p>
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Create Draft</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Release Calendar Preview */}
      <Card className="glass-effect">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Release Calendar</CardTitle>
            <CardDescription>Upcoming release schedule</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" /> View Full Calendar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 text-center">
                <div className="text-sm font-medium">JUN</div>
                <div className="text-2xl font-bold">15</div>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                  <Music2 className="h-5 w-5 text-cosmic-teal" />
                </div>
                <div>
                  <div className="font-medium">Summer EP</div>
                  <div className="text-xs text-muted-foreground">Luna Echo • 3 tracks</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">In Progress</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 text-center">
                <div className="text-sm font-medium">JUL</div>
                <div className="text-2xl font-bold">22</div>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                  <Music2 className="h-5 w-5 text-cosmic-teal" />
                </div>
                <div>
                  <div className="font-medium">Remix Package</div>
                  <div className="text-xs text-muted-foreground">Luna Echo • 4 tracks</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Scheduled</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 text-center">
                <div className="text-sm font-medium">AUG</div>
                <div className="text-2xl font-bold">10</div>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-cosmic-teal/10 flex items-center justify-center">
                  <Music2 className="h-5 w-5 text-cosmic-teal" />
                </div>
                <div>
                  <div className="font-medium">Acoustic Sessions</div>
                  <div className="text-xs text-muted-foreground">Luna Echo • 8 tracks</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Scheduled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
