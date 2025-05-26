"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Zap, CheckCircle2, Clock, X } from "lucide-react"
import { handoff, showTaskProgress } from "@/lib/agent-bridge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"

const mockIssues = [
  {
    id: "isrc",
    field: "ISRC",
    affectedTracks: 4,
    impact: "High",
    description: "Missing International Standard Recording Code affects royalty tracking",
    tracks: ["Midnight Dreams", "Neon City", "Digital Horizon", "Cosmic Journey"],
    canAutoFix: true,
  },
  {
    id: "composer",
    field: "Composer Credits",
    affectedTracks: 3,
    impact: "Medium",
    description: "Missing composer information may affect royalty distribution",
    tracks: ["Neon City", "Digital Horizon", "Summer Haze"],
    canAutoFix: false,
  },
  {
    id: "bpm",
    field: "BPM",
    affectedTracks: 7,
    impact: "Low",
    description: "Missing tempo information affects sync opportunities",
    tracks: ["All tracks missing BPM data"],
    canAutoFix: true,
  },
  {
    id: "publisher",
    field: "Publisher Info",
    affectedTracks: 2,
    impact: "High",
    description: "Missing publisher details affects rights management",
    tracks: ["Midnight Dreams", "Cosmic Journey"],
    canAutoFix: false,
  },
]

const mockDiff = {
  isrc: {
    before: {
      ISRC: "",
      BPM: "",
      Publisher: "",
    },
    after: {
      ISRC: "USRC17607839",
      BPM: "128",
      Publisher: "Cosmic Music Publishing",
    },
  },
  composer: {
    before: {
      "Composer Credits": "",
      Lyricist: "",
    },
    after: {
      "Composer Credits": "Jane Smith, John Doe",
      Lyricist: "Jane Smith",
    },
  },
  bpm: {
    before: {
      BPM: "",
      Key: "",
    },
    after: {
      BPM: "128",
      Key: "C Minor",
    },
  },
  publisher: {
    before: {
      Publisher: "",
      "Publisher ID": "",
    },
    after: {
      Publisher: "Cosmic Music Publishing",
      "Publisher ID": "CMP-12345",
    },
  },
}

export function IssuesKanban() {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)

  const handleIssueClick = (issueId: string) => {
    setSelectedIssue(issueId)
  }

  const handleFixIssue = (issue: (typeof mockIssues)[0]) => {
    if (issue.canAutoFix) {
      showTaskProgress(`Auto-fixing ${issue.field} for ${issue.affectedTracks} tracks`)
    } else {
      handoff("Metadata", "Manual Review", { issueId: issue.id, tracks: issue.tracks })
    }
    setSelectedIssue(null)
  }

  const selectedIssueData = selectedIssue ? mockIssues.find((issue) => issue.id === selectedIssue) : null

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Missing Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-lg border p-4 cursor-pointer transition-all hover:bg-muted/50 hover:scale-[1.01]"
                onClick={() => handleIssueClick(issue.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-medium">{issue.field}</div>
                      <div className="text-sm text-muted-foreground">{issue.affectedTracks} tracks affected</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        issue.impact === "High"
                          ? "border-red-500 text-red-500"
                          : issue.impact === "Medium"
                            ? "border-amber-500 text-amber-500"
                            : "border-blue-500 text-blue-500"
                      }
                    >
                      {issue.impact} Impact
                    </Badge>
                    {issue.canAutoFix && (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Auto-fixable
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issue Detail Drawer */}
      <Sheet open={selectedIssue !== null} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{selectedIssueData?.field}</span>
              <SheetClose className="rounded-full hover:bg-muted p-1">
                <X className="h-4 w-4" />
              </SheetClose>
            </SheetTitle>
            <SheetDescription>
              {selectedIssueData?.affectedTracks} tracks affected • {selectedIssueData?.impact} Impact
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* AI Summary */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                AI Analysis
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedIssueData?.description}. This issue affects {selectedIssueData?.affectedTracks} tracks in your
                catalog.
                {selectedIssueData?.canAutoFix
                  ? " I can automatically fix this issue by retrieving the correct data from connected platforms and industry databases."
                  : " This issue requires manual review as the information needs human verification."}
              </p>
            </div>

            {/* Affected Tracks */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Affected Tracks:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedIssueData?.tracks.map((track, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {track}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Diff Preview */}
            {selectedIssueData && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Changes Preview:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-red-500 mb-2 text-xs">Before (Current)</h5>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3 space-y-2">
                      {Object.entries(mockDiff[selectedIssueData.id as keyof typeof mockDiff].before).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-mono text-xs">{key}:</span>
                            <span className="font-mono text-xs text-red-600">{value || "<empty>"}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-500 mb-2 text-xs">After (Proposed)</h5>
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-3 space-y-2">
                      {Object.entries(mockDiff[selectedIssueData.id as keyof typeof mockDiff].after).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-mono text-xs">{key}:</span>
                            <span className="font-mono text-xs text-green-600">{value}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Est. fix time: {selectedIssueData?.canAutoFix ? "2 minutes" : "Manual review required"}</span>
            </div>

            {/* Actions */}
            {selectedIssueData && (
              <Button
                onClick={() => handleFixIssue(selectedIssueData)}
                className={
                  selectedIssueData.canAutoFix
                    ? "w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black gap-1"
                    : "w-full gap-1"
                }
                variant={selectedIssueData.canAutoFix ? "default" : "outline"}
              >
                <Zap className="h-4 w-4" />
                {selectedIssueData.canAutoFix ? "Auto-Fix All" : "Review Manually"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
