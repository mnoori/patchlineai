"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AlertCircle, Clock, CheckCircle, FileText, Calendar, Users, DollarSign, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { handoff } from "@/lib/agent-bridge"
import { Progress } from "@/components/ui/progress"

interface Contract {
  id: string
  title: string
  type: string
  parties: string[]
  expiry: string
  daysUntilExpiry: number
  status: "At Risk" | "Needs Review" | "Healthy"
  issues: number
  value: string
  lastReviewed: string
  riskScore: number
  details?: {
    summary: string
    risks: string[]
    recommendations: string[]
    keyDates: { label: string; date: string }[]
    clauses: { text: string; risk: "high" | "medium" | "low"; highlight: boolean }[]
  }
}

export function ContractDashboard() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"all" | "at-risk" | "review" | "healthy">("all")

  const mockContracts: Contract[] = [
    {
      id: "1",
      title: "Distribution Agreement - Luna Ray",
      type: "Distribution",
      parties: ["Luna Ray", "Patchline Records", "Global Streams Inc."],
      expiry: "June 15, 2025",
      daysUntilExpiry: 24,
      status: "At Risk",
      issues: 3,
      value: "$125,000",
      lastReviewed: "2 months ago",
      riskScore: 85,
      details: {
        summary: "Distribution deal expires in 24 days with auto-renew clause. Rights revert if not renewed.",
        risks: ["Rights revert → streaming takedown", "Loss of 12% monthly revenue", "Artist may sign with competitor"],
        recommendations: ["Draft renewal with improved terms", "Schedule call with artist management"],
        keyDates: [
          { label: "Expiration", date: "June 15, 2025" },
          { label: "Auto-renew notice", date: "May 15, 2025" },
        ],
        clauses: [
          { text: "Rights shall revert to Artist upon expiration...", risk: "high", highlight: true },
          { text: "Automatic renewal requires 30-day notice...", risk: "medium", highlight: true },
          { text: "Territory includes worldwide digital distribution...", risk: "low", highlight: false },
        ],
      },
    },
    {
      id: "2",
      title: "Publishing Deal - The Echoes",
      type: "Publishing",
      parties: ["The Echoes", "Patchline Publishing"],
      expiry: "August 22, 2025",
      daysUntilExpiry: 89,
      status: "Needs Review",
      issues: 1,
      value: "$75,000",
      lastReviewed: "1 month ago",
      riskScore: 45,
      details: {
        summary:
          "Publishing agreement needs review for potential sync opportunities. Current terms may limit placement in certain media types.",
        risks: ["Limited sync placement options", "Potential missed revenue opportunities"],
        recommendations: ["Amend agreement to expand sync rights", "Negotiate improved rate for emerging platforms"],
        keyDates: [
          { label: "Review deadline", date: "July 1, 2025" },
          { label: "Original signing date", date: "August 22, 2022" },
        ],
        clauses: [
          { text: "Sync rights limited to traditional broadcast media...", risk: "high", highlight: true },
          { text: "Publisher retains 50% of all sync fees...", risk: "medium", highlight: true },
          { text: "Territory includes worldwide publishing rights...", risk: "low", highlight: false },
        ],
      },
    },
    {
      id: "3",
      title: "Licensing Agreement - Metro Beats",
      type: "Licensing",
      parties: ["Metro Beats", "Patchline Records"],
      expiry: "December 10, 2025",
      daysUntilExpiry: 198,
      status: "Healthy",
      issues: 0,
      value: "$50,000",
      lastReviewed: "2 weeks ago",
      riskScore: 15,
      details: {
        summary: "Licensing agreement is in good standing with no immediate concerns.",
        risks: [],
        recommendations: ["Schedule routine review in 6 months"],
        keyDates: [
          { label: "Expiration", date: "December 10, 2025" },
          { label: "Annual review", date: "December 10, 2024" },
        ],
        clauses: [
          { text: "License covers all territories worldwide...", risk: "low", highlight: false },
          { text: "Royalty rate of 15% on all sales...", risk: "low", highlight: false },
        ],
      },
    },
    {
      id: "4",
      title: "Recording Contract - Cosmic Waves",
      type: "Recording",
      parties: ["Cosmic Waves", "Patchline Records"],
      expiry: "March 5, 2026",
      daysUntilExpiry: 283,
      status: "Healthy",
      issues: 0,
      value: "$200,000",
      lastReviewed: "1 week ago",
      riskScore: 10,
      details: {
        summary: "Recording contract is in good standing with no immediate concerns.",
        risks: [],
        recommendations: ["Schedule routine review in 6 months"],
        keyDates: [
          { label: "Expiration", date: "March 5, 2026" },
          { label: "Delivery deadline", date: "September 5, 2025" },
        ],
        clauses: [
          { text: "Artist to deliver 10 master recordings...", risk: "low", highlight: false },
          { text: "Label to provide $50,000 recording budget...", risk: "low", highlight: false },
        ],
      },
    },
    {
      id: "5",
      title: "Sync License - Skyline Collective",
      type: "Sync",
      parties: ["Skyline Collective", "Patchline Records", "FilmScore Productions"],
      expiry: "July 30, 2025",
      daysUntilExpiry: 65,
      status: "Needs Review",
      issues: 1,
      value: "$35,000",
      lastReviewed: "3 weeks ago",
      riskScore: 40,
      details: {
        summary: "Sync license needs review for potential rate adjustment based on usage.",
        risks: ["Current rate below market average", "Limited to specific media types"],
        recommendations: ["Renegotiate rate for extended usage", "Expand media types covered"],
        keyDates: [
          { label: "Expiration", date: "July 30, 2025" },
          { label: "Usage report due", date: "June 30, 2025" },
        ],
        clauses: [
          { text: "License fee of $5,000 per use...", risk: "medium", highlight: true },
          { text: "Limited to theatrical release only...", risk: "medium", highlight: true },
        ],
      },
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "At Risk":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "Needs Review":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "Healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "At Risk":
        return "text-red-500"
      case "Needs Review":
        return "text-amber-500"
      case "Healthy":
        return "text-green-500"
      default:
        return ""
    }
  }

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract)
    setDrawerOpen(true)
  }

  const handleDraftRenewal = (contractId: string) => {
    handoff("Legal", "Patchy", { action: "draft_renewal", contractId })
  }

  const handleSyncClearance = (contractId: string) => {
    handoff("Legal", "Metadata", { action: "sync_clearance", contractId })
  }

  const filteredContracts = mockContracts.filter((contract) => {
    if (viewMode === "all") return true
    if (viewMode === "at-risk") return contract.status === "At Risk"
    if (viewMode === "review") return contract.status === "Needs Review"
    if (viewMode === "healthy") return contract.status === "Healthy"
    return true
  })

  const stats = {
    total: mockContracts.length,
    atRisk: mockContracts.filter((c) => c.status === "At Risk").length,
    needsReview: mockContracts.filter((c) => c.status === "Needs Review").length,
    healthy: mockContracts.filter((c) => c.status === "Healthy").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`glass-effect cursor-pointer transition-all duration-200 ${viewMode === "all" ? "border-cosmic-teal" : ""}`}
          onClick={() => setViewMode("all")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">All Contracts</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className={`glass-effect cursor-pointer transition-all duration-200 ${viewMode === "at-risk" ? "border-red-500" : ""}`}
          onClick={() => setViewMode("at-risk")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">At Risk</p>
              <p className="text-2xl font-bold text-red-500">{stats.atRisk}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>

        <Card
          className={`glass-effect cursor-pointer transition-all duration-200 ${viewMode === "review" ? "border-amber-500" : ""}`}
          onClick={() => setViewMode("review")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-2xl font-bold text-amber-500">{stats.needsReview}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>

        <Card
          className={`glass-effect cursor-pointer transition-all duration-200 ${viewMode === "healthy" ? "border-green-500" : ""}`}
          onClick={() => setViewMode("healthy")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Healthy</p>
              <p className="text-2xl font-bold text-green-500">{stats.healthy}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Contract Dashboard</CardTitle>
          <CardDescription>
            Monitor your contracts and identify potential risks before they become problems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <motion.div
                key={contract.id}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
                className={`rounded-lg border p-4 cursor-pointer ${
                  contract.status === "At Risk"
                    ? "border-red-500/30"
                    : contract.status === "Needs Review"
                      ? "border-amber-500/30"
                      : "border-green-500/30"
                }`}
                onClick={() => handleContractClick(contract)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(contract.status)}
                      <h3 className="font-medium text-lg">{contract.title}</h3>
                    </div>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span> {contract.type}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span> {contract.expiry}
                        {contract.daysUntilExpiry < 30 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {contract.daysUntilExpiry} days
                          </Badge>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span> {contract.value}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Reviewed:</span> {contract.lastReviewed}
                      </div>
                    </div>

                    {contract.details && (
                      <div className="mt-3 text-sm text-muted-foreground line-clamp-2">{contract.details.summary}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${getStatusColor(contract.status)}`}>{contract.status}</span>
                      {contract.issues > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {contract.issues} {contract.issues === 1 ? "issue" : "issues"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Progress
                        value={contract.riskScore}
                        className="w-24 h-2"
                        indicatorClassName={
                          contract.riskScore > 70
                            ? "bg-red-500"
                            : contract.riskScore > 40
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }
                      />
                      <span
                        className={
                          contract.riskScore > 70
                            ? "text-red-500 text-xs"
                            : contract.riskScore > 40
                              ? "text-amber-500 text-xs"
                              : "text-green-500 text-xs"
                        }
                      >
                        {contract.riskScore}% risk
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contract Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border/50">
          <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
          <SheetHeader className="border-b border-cosmic-teal/20 pb-4">
            <SheetTitle className="text-cosmic-teal">{selectedContract?.title}</SheetTitle>
            <SheetDescription>
              {selectedContract?.type} • Expires: {selectedContract?.expiry}
            </SheetDescription>
          </SheetHeader>

          {selectedContract?.details && (
            <div className="py-6 space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-cosmic-midnight/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Risk Score</p>
                        <p className="text-2xl font-bold text-red-500">{selectedContract.riskScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-midnight/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Contract Value</p>
                        <p className="text-2xl font-bold">{selectedContract.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI-Highlighted Clauses */}
              <div>
                <h3 className="text-sm font-medium text-cosmic-teal mb-3">AI-HIGHLIGHTED CLAUSES</h3>
                <div className="space-y-3">
                  {selectedContract.details.clauses.map((clause, index) => (
                    <Card
                      key={index}
                      className={`${
                        clause.highlight
                          ? clause.risk === "high"
                            ? "border-red-500/50 bg-red-500/5"
                            : "border-amber-500/50 bg-amber-500/5"
                          : "bg-cosmic-midnight/30"
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant={
                              clause.risk === "high"
                                ? "destructive"
                                : clause.risk === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {clause.risk} risk
                          </Badge>
                          <p className="text-sm flex-1">{clause.text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Risks & Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-red-400 mb-3">IDENTIFIED RISKS</h3>
                  <div className="space-y-2">
                    {selectedContract.details.risks.map((risk, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-green-400 mb-3">RECOMMENDATIONS</h3>
                  <div className="space-y-2">
                    {selectedContract.details.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Dates */}
              <div>
                <h3 className="text-sm font-medium text-cosmic-teal mb-3">KEY DATES</h3>
                <div className="space-y-2">
                  {selectedContract.details.keyDates.map((date, index) => (
                    <div key={index} className="flex justify-between text-sm border-b border-border/50 pb-2">
                      <span>{date.label}</span>
                      <span className="font-medium">{date.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 space-y-3 border-t border-cosmic-teal/20">
                <h3 className="text-sm font-medium text-cosmic-teal">QUICK ACTIONS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                    onClick={() => handleDraftRenewal(selectedContract.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Draft Renewal
                  </Button>

                  <Button variant="outline" onClick={() => handleSyncClearance(selectedContract.id)}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Generate Sync Clearance
                  </Button>

                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Compare to Template
                  </Button>

                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Send to Legal Counsel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
