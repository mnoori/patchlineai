"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Search, Filter, Download, Music2, AlertTriangle, CheckCircle2, Edit, Plus, FileText } from "lucide-react"

export default function MetadataAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const tracks = [
    {
      title: "Midnight Dreams",
      artist: "Luna Echo",
      album: "Summer EP",
      completeness: 95,
      issues: 0,
      status: "Complete",
    },
    {
      title: "Neon City",
      artist: "Luna Echo",
      album: "Summer EP",
      completeness: 85,
      issues: 2,
      status: "Incomplete",
    },
    {
      title: "Digital Horizon",
      artist: "Pulse Wave",
      album: "Digital Dreams",
      completeness: 78,
      issues: 3,
      status: "Incomplete",
    },
    {
      title: "Cosmic Journey",
      artist: "Astral Drift",
      album: "Cosmic Journey",
      completeness: 92,
      issues: 1,
      status: "Incomplete",
    },
    {
      title: "Summer Haze",
      artist: "Luna Echo",
      album: "Summer EP",
      completeness: 100,
      issues: 0,
      status: "Complete",
    },
  ]

  const missingFields = [
    {
      field: "ISRC",
      affectedTracks: 4,
      impact: "High",
      description: "Missing International Standard Recording Code affects royalty tracking",
    },
    {
      field: "Composer Credits",
      affectedTracks: 3,
      impact: "Medium",
      description: "Missing composer information may affect royalty distribution",
    },
    {
      field: "BPM",
      affectedTracks: 7,
      impact: "Low",
      description: "Missing tempo information affects sync opportunities",
    },
    {
      field: "Publisher Info",
      affectedTracks: 2,
      impact: "High",
      description: "Missing publisher details affects rights management",
    },
  ]

  const syncOpportunities = [
    {
      title: "TV Commercial",
      genre: "Electronic",
      mood: "Upbeat",
      matchingTracks: 3,
      deadline: "June 30, 2025",
    },
    {
      title: "Indie Film",
      genre: "Ambient",
      mood: "Melancholic",
      matchingTracks: 2,
      deadline: "July 15, 2025",
    },
    {
      title: "Mobile Game",
      genre: "Electronic",
      mood: "Energetic",
      matchingTracks: 5,
      deadline: "August 5, 2025",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Metadata Agent</h1>
        <p className="text-muted-foreground">
          Audit and auto-fill missing metadata fields to ensure your catalog is properly organized
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tracks..."
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
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
            <Plus className="h-4 w-4" /> Bulk Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="sync-ready">Sync Ready</TabsTrigger>
          <TabsTrigger value="agent-settings">Agent Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Catalog Overview</CardTitle>
              <CardDescription>Track metadata status and completeness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Track</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Album</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Completeness</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Issues</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div>
                              <div className="font-medium">{track.title}</div>
                              <div className="text-xs text-muted-foreground">{track.artist}</div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{track.album}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Progress value={track.completeness} className="h-2 w-24" />
                              <span>{track.completeness}%</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {track.issues > 0 ? (
                              <div className="flex items-center text-amber-500">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                <span>{track.issues}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-500">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                <span>None</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                track.status === "Complete"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-amber-500/20 text-amber-500"
                              }`}
                            >
                              {track.status}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium">Overall Completeness:</span> 90%
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Total Issues:</span> 6
                  </div>
                </div>
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Auto-Fix Issues</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Missing Fields</CardTitle>
              <CardDescription>Fields that need attention across your catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {missingFields.map((field, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{field.field}</h3>
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          field.impact === "High"
                            ? "bg-red-500/10 text-red-500"
                            : field.impact === "Medium"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {field.impact} Impact
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        Affected Tracks: <span className="font-medium">{field.affectedTracks}</span>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Edit className="h-4 w-4" /> Fix All
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-ready">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Sync Opportunities</CardTitle>
                <CardDescription>Potential sync placements for your catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncOpportunities.map((opportunity, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{opportunity.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-cosmic-teal/10 text-cosmic-teal">
                              {opportunity.genre}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-cosmic-teal/10 text-cosmic-teal">
                              {opportunity.mood}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">Deadline: {opportunity.deadline}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          Matching Tracks: <span className="font-medium">{opportunity.matchingTracks}</span>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Music2 className="h-4 w-4" /> View Matches
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Sync Readiness</CardTitle>
                <CardDescription>Prepare your catalog for sync opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Overall Sync Readiness</h3>
                      <span className="font-medium">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Instrumental Versions</div>
                        <div className="text-sm text-muted-foreground">8/12 tracks have instrumentals</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Generate
                      </Button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Stems Available</div>
                        <div className="text-sm text-muted-foreground">5/12 tracks have stems</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Clearance Documentation</div>
                        <div className="text-sm text-muted-foreground">10/12 tracks have clearance</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                    Optimize for Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agent-settings">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>Configure your Metadata Agent preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Metadata Standards</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Preferred Standard</div>
                        <div className="text-sm text-muted-foreground">Set your metadata standard</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>DDEX</option>
                        <option>ID3v2</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Required Fields</div>
                        <div className="text-sm text-muted-foreground">Fields that must be present</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Auto-Fix Settings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Auto-Fix Level</div>
                        <div className="text-sm text-muted-foreground">How aggressively to fix issues</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>Conservative</option>
                        <option>Balanced</option>
                        <option>Aggressive</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Auto-Fix Schedule</div>
                        <div className="text-sm text-muted-foreground">When to run auto-fix</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>Manual Only</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Platform Connections</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Music2 className="h-5 w-5 text-green-500" />
                        <div>Spotify</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Music2 className="h-5 w-5 text-red-500" />
                        <div>Apple Music</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>DistroKid</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
