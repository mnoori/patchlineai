"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Music2, Calendar, DollarSign, FileText, Zap, ExternalLink, X, AlertTriangle, CheckCircle2 } from "lucide-react"
import { handoff } from "@/lib/agent-bridge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"

const syncOpportunities = [
  {
    id: "1",
    title: "TV Commercial",
    client: "Nike",
    genre: "Electronic",
    mood: "Upbeat",
    matchingTracks: 3,
    deadline: "June 30, 2025",
    budget: "$15,000",
    status: "Active",
    description: "Looking for upbeat electronic tracks for a summer campaign featuring athletes.",
    requirements: ["Instrumental version required", "Clean lyrics", "High energy", "Positive vibe"],
    matches: ["Neon City", "Digital Horizon", "Summer Haze"],
  },
  {
    id: "2",
    title: "Indie Film",
    client: "Sundance Film",
    genre: "Ambient",
    mood: "Melancholic",
    matchingTracks: 2,
    deadline: "July 15, 2025",
    budget: "$8,000",
    status: "Active",
    description: "Seeking ambient tracks for emotional scenes in an indie drama.",
    requirements: ["Full song rights", "Emotional depth", "Minimal lyrics", "Atmospheric"],
    matches: ["Midnight Dreams", "Cosmic Journey"],
  },
  {
    id: "3",
    title: "Mobile Game",
    client: "Supercell",
    genre: "Electronic",
    mood: "Energetic",
    matchingTracks: 5,
    deadline: "August 5, 2025",
    budget: "$25,000",
    status: "Active",
    description: "Need energetic tracks for a new mobile game soundtrack.",
    requirements: ["Loop-friendly", "Instrumental only", "Dynamic range", "Catchy hooks"],
    matches: ["Neon City", "Digital Horizon", "Summer Haze", "Midnight Dreams", "Cosmic Journey"],
  },
]

const readinessChecklist = [
  {
    id: "instrumental",
    item: "Instrumental Versions",
    current: 8,
    total: 12,
    percentage: 67,
    action: "Generate",
    handoffTo: "StemSeparator",
    description: "Instrumental versions are required for many sync opportunities, especially in advertising and film.",
    missingTracks: ["Neon City", "Digital Horizon", "Summer Haze", "Cosmic Journey"],
  },
  {
    id: "stems",
    item: "Stems Available",
    current: 5,
    total: 12,
    percentage: 42,
    action: "Upload",
    handoffTo: "FileManager",
    description: "Individual stems allow music supervisors to remix or edit tracks to fit their specific needs.",
    missingTracks: [
      "Midnight Dreams",
      "Neon City",
      "Digital Horizon",
      "Summer Haze",
      "Cosmic Journey",
      "Astral Drift",
      "Lunar Phase",
    ],
  },
  {
    id: "clearance",
    item: "Clearance Documentation",
    current: 10,
    total: 12,
    percentage: 83,
    action: "Review",
    handoffTo: "Legal",
    description: "Proper clearance documentation ensures you have the rights to license your music for sync.",
    missingTracks: ["Digital Horizon", "Cosmic Journey"],
  },
  {
    id: "metadata",
    item: "Metadata Complete",
    current: 11,
    total: 12,
    percentage: 92,
    action: "Fix",
    handoffTo: "Metadata",
    description:
      "Complete metadata helps sync platforms find your music when searching for specific moods, genres, or tempos.",
    missingTracks: ["Digital Horizon"],
  },
]

export function SyncReadiness() {
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null)

  const handleOpportunityClick = (opportunityId: string) => {
    setSelectedOpportunity(opportunityId)
  }

  const handleChecklistClick = (checklistId: string) => {
    setSelectedChecklist(checklistId)
  }

  const handleViewMatches = (opportunity: (typeof syncOpportunities)[0]) => {
    handoff("Metadata", "SyncMatcher", {
      opportunityId: opportunity.id,
      genre: opportunity.genre,
      mood: opportunity.mood,
    })
    setSelectedOpportunity(null)
  }

  const handleGenerateAction = (item: (typeof readinessChecklist)[0]) => {
    handoff("Metadata", item.handoffTo, {
      action: item.action,
      tracks: item.total - item.current,
    })
    setSelectedChecklist(null)
  }

  const overallReadiness = Math.round(
    readinessChecklist.reduce((sum, item) => sum + item.percentage, 0) / readinessChecklist.length,
  )

  const selectedOpportunityData = selectedOpportunity
    ? syncOpportunities.find((opp) => opp.id === selectedOpportunity)
    : null

  const selectedChecklistData = selectedChecklist
    ? readinessChecklist.find((item) => item.id === selectedChecklist)
    : null

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sync Opportunities */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-cosmic-teal" />
            Sync Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="rounded-lg border p-4 cursor-pointer transition-all hover:bg-muted/50 hover:scale-[1.01]"
                onClick={() => handleOpportunityClick(opportunity.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{opportunity.title}</h3>
                    <p className="text-sm text-muted-foreground">{opportunity.client}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{opportunity.status}</Badge>
                </div>

                <div className="flex gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {opportunity.genre}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {opportunity.mood}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <Music2 className="h-3 w-3" />
                    <span>{opportunity.matchingTracks} matches</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{opportunity.budget}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{opportunity.deadline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Readiness Checklist */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cosmic-teal" />
            Sync Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">Overall Sync Readiness</h3>
                <span className="font-medium text-cosmic-teal">{overallReadiness}%</span>
              </div>
              <Progress value={overallReadiness} className="h-3" />
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
              {readinessChecklist.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 cursor-pointer transition-all hover:bg-muted/50 hover:scale-[1.01] p-2 rounded-md"
                  onClick={() => handleChecklistClick(item.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item.item}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.current}/{item.total} tracks ready
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={item.percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-12">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black gap-2">
              <Zap className="h-4 w-4" />
              Optimize All for Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Detail Drawer */}
      <Sheet open={selectedOpportunity !== null} onOpenChange={(open) => !open && setSelectedOpportunity(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{selectedOpportunityData?.title}</span>
              <SheetClose className="rounded-full hover:bg-muted p-1">
                <X className="h-4 w-4" />
              </SheetClose>
            </SheetTitle>
            <SheetDescription>
              {selectedOpportunityData?.client} • {selectedOpportunityData?.genre} • {selectedOpportunityData?.mood}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* AI Summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-cosmic-teal" />
                AI Analysis
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedOpportunityData?.description} This opportunity matches{" "}
                {selectedOpportunityData?.matchingTracks} tracks in your catalog based on genre, mood, and tempo.
              </p>
            </div>

            {/* Opportunity Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Opportunity Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Budget</div>
                <div>{selectedOpportunityData?.budget}</div>
                <div className="text-muted-foreground">Deadline</div>
                <div>{selectedOpportunityData?.deadline}</div>
                <div className="text-muted-foreground">Status</div>
                <div>{selectedOpportunityData?.status}</div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Requirements</h4>
              <ul className="space-y-1">
                {selectedOpportunityData?.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Matching Tracks */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Matching Tracks</h4>
              <div className="flex flex-wrap gap-2">
                {selectedOpportunityData?.matches.map((track, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {track}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            {selectedOpportunityData && (
              <Button
                onClick={() => handleViewMatches(selectedOpportunityData)}
                className="w-full gap-1"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                View Matches
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Checklist Item Detail Drawer */}
      <Sheet open={selectedChecklist !== null} onOpenChange={(open) => !open && setSelectedChecklist(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{selectedChecklistData?.item}</span>
              <SheetClose className="rounded-full hover:bg-muted p-1">
                <X className="h-4 w-4" />
              </SheetClose>
            </SheetTitle>
            <SheetDescription>
              {selectedChecklistData?.current}/{selectedChecklistData?.total} tracks ready •{" "}
              {selectedChecklistData?.percentage}% complete
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* AI Summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-cosmic-teal" />
                AI Analysis
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedChecklistData?.description} Improving this metric will increase your sync opportunities by
                making your catalog more attractive to music supervisors.
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Completion Progress</h4>
              <div className="flex items-center gap-2">
                <Progress value={selectedChecklistData?.percentage} className="h-2 flex-1" />
                <span className="text-sm font-medium">{selectedChecklistData?.percentage}%</span>
              </div>
            </div>

            {/* Missing Tracks */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Tracks Needing Attention</h4>
              <div className="flex flex-wrap gap-2">
                {selectedChecklistData?.missingTracks.map((track, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {track}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            {selectedChecklistData && (
              <Button
                onClick={() => handleGenerateAction(selectedChecklistData)}
                className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black gap-1"
              >
                <Zap className="h-4 w-4" />
                {selectedChecklistData.action} Missing {selectedChecklistData.item}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
