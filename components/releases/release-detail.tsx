"use client"

import { useState } from "react"
import { Calendar, ExternalLink, Sparkles, AlertTriangle, CheckCircle2, Clock, RefreshCw, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Release } from "@/lib/mock/release"
import { TimelineStepper } from "./timeline-stepper"
import { AgentHint } from "./agent-hint"
import { cn } from "@/lib/utils"
import { ReleaseMarketingContentModal } from './release-marketing-content-modal'

interface TimelineItem {
  id: string
  date: string
  title: string
  description?: string
}

interface ReleaseDetailProps {
  release: Release
  onTaskComplete: (taskId: string) => void
  onStepComplete: (stepId: string) => void
  dismissedHints: string[]
  onDismissHint: (hintId: string) => void
}

export function ReleaseDetail({
  release,
  onTaskComplete,
  onStepComplete,
  dismissedHints,
  onDismissHint,
}: ReleaseDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedEvent, setSelectedEvent] = useState<TimelineItem | null>(null)
  const [showMarketingModal, setShowMarketingModal] = useState(false)
  const [marketingContentType, setMarketingContentType] = useState<'content' | 'campaign' | 'outreach'>('content')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
      case "Live":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "Error":
      case "Rejected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "Pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Live":
        return "text-green-500"
      case "Error":
      case "Rejected":
        return "text-red-500"
      case "Pending":
        return "text-amber-500"
      default:
        return "text-gray-500"
    }
  }

  const handleGenerateContent = (type: 'content' | 'campaign' | 'outreach') => {
    setMarketingContentType(type)
    setShowMarketingModal(true)
  }

  const handleFixDistribution = (platformId: string) => {
    console.log(`Fixing distribution for ${platformId}`)
    // TODO: Implement distribution fix
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{release.title}</h1>
            <p className="text-muted-foreground">{release.artist}</p>
          </div>
          <Badge
            className={cn(
              "text-xs px-3 py-1",
              release.status === "In Progress"
                ? "bg-amber-600/30 text-amber-300"
                : release.status === "Scheduled"
                  ? "bg-green-600/30 text-green-300"
                  : "bg-blue-600/30 text-blue-300",
            )}
          >
            {release.status}
          </Badge>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Release Progress</span>
            <div className="text-right">
              <div className="text-lg font-bold">{release.progress}%</div>
              <div className="text-xs text-muted-foreground">
                Tracks: {release.tracks} • Release Date: {release.releaseDate}
              </div>
            </div>
          </div>

          <Progress value={release.progress} className="h-3" />

          {release.forecastDate && <p className="text-sm text-cyan-400">{release.forecastDate}</p>}

          {release.risks.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <Badge className="bg-amber-600/30 text-amber-300 text-[10px] px-2">
                {release.risks.length} Risk{release.risks.length > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Agent Hints */}
      {!dismissedHints.includes("artwork-hint") && release.risks.some((r) => r.type === "content") && (
        <AgentHint
          id="artwork-hint"
          message="I can generate alternative artwork sizes to fix the Apple Music error"
          action={{
            label: "Generate Now",
            onClick: () => handleGenerateContent("content"),
          }}
          onDismiss={onDismissHint}
        />
      )}

      {/* Interactive Timeline */}
      <Card className="glass-effect">
        <CardContent className="p-6">
          <TimelineStepper
            steps={release.timeline}
            onStepClick={(stepId) => console.log("Step clicked:", stepId)}
            onTaskComplete={onTaskComplete}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Release Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Genre:</span>
                  <span className="text-sm">{release.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Label:</span>
                  <span className="text-sm">{release.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Catalog #:</span>
                  <span className="text-sm">{release.catalogNumber}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Distribution Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Platforms:</span>
                    <span className="text-sm">{release.distributionStatus.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Pre-save:</span>
                    <span className="text-sm text-green-500">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Review:</span>
                    <span className="text-sm text-amber-500">Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Track List</h3>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in Catalog
            </Button>
          </div>

          <Card className="glass-effect">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: release.tracks }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>Track {i + 1}</TableCell>
                      <TableCell>3:24</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-500">
                          Ready
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <h3 className="text-lg font-semibold">Distribution Platforms</h3>

          <div className="grid md:grid-cols-2 gap-4">
            {release.distributionStatus.map((platform) => (
              <Card key={platform.id} className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(platform.status)}
                      <div>
                        <h4 className="font-medium">{platform.name}</h4>
                        <p className={cn("text-sm", getStatusColor(platform.status))}>{platform.status}</p>
                      </div>
                    </div>

                    {platform.error && platform.canFix && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFixDistribution(platform.id)}
                        className="gap-1 text-xs"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Fix
                      </Button>
                    )}
                  </div>

                  {platform.error && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
                      {platform.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <h3 className="text-lg font-semibold">Marketing Checklist</h3>

          <div className="space-y-3">
            {release.marketingTasks.map((task) => (
              <Card key={task.id} className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          task.completed ? "border-green-500 bg-green-500" : "border-gray-400",
                        )}
                      >
                        {task.completed && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{task.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.canGenerate && !task.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateContent('content')}
                          className="gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Generate
                        </Button>
                      )}

                      {!task.completed && (
                        <Button size="sm" variant="outline">
                          Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Release Analytics</h3>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics will be available after release</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReleaseMarketingContentModal
        release={release}
        isOpen={showMarketingModal}
        onClose={() => setShowMarketingModal(false)}
        contentType={marketingContentType}
      />
    </div>
  )
}
