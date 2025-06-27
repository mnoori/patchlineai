"use client"

import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AlertCircle, Clock, CheckCircle, FileText, Calendar, Users, DollarSign, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { handoff } from "@/lib/agent-bridge"

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
  },
]

export function ContractKanban() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])

  const lanes = [
    { id: "At Risk", title: "At Risk", color: "border-red-500", bgColor: "bg-red-500/5" },
    { id: "Needs Review", title: "Needs Review", color: "border-amber-500", bgColor: "bg-amber-500/5" },
    { id: "Healthy", title: "Healthy", color: "border-green-500", bgColor: "bg-green-500/5" },
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

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract)
    setDrawerOpen(true)
  }

  const handleDraftRenewal = (contractId: string) => {
          handoff("Legal", "Aria", { action: "draft_renewal", contractId })
  }

  const handleSyncClearance = (contractId: string) => {
    handoff("Legal", "Metadata", { action: "sync_clearance", contractId })
  }

  const toggleContractSelection = (contractId: string) => {
    setSelectedContracts((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId],
    )
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedContracts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <BrandCard className="bg-brand-black border-brand-cyan shadow-lg">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-sm font-medium">{selectedContracts.length} contracts selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Generate Redlines
                  </Button>
                  <Button size="sm" variant="outline">
                    Request Signatures
                  </Button>
                  <Button size="sm" variant="outline">
                    Archive
                  </Button>
                </div>
              </CardContent>
            </BrandCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {lanes.map((lane) => {
          const laneContracts = mockContracts.filter((contract) => contract.status === lane.id)

          return (
            <div key={lane.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{lane.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {laneContracts.length}
                </Badge>
              </div>

              <div
                className={`min-h-[400px] rounded-lg border-2 border-dashed p-4 space-y-3 ${lane.color} ${lane.bgColor}`}
              >
                <AnimatePresence>
                  {laneContracts.map((contract) => (
                    <motion.div
                      key={contract.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.02 }}
                      className="cursor-pointer"
                    >
                      <BrandCard
                        className={`hover:shadow-md transition-all duration-200 ${
                          selectedContracts.includes(contract.id) ? "ring-2 ring-brand-cyan" : ""
                        }`}
                        onClick={() => handleContractClick(contract)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">{contract.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {getStatusIcon(contract.status)}
                                <span>{contract.type}</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedContracts.includes(contract.id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleContractSelection(contract.id)
                              }}
                              className="rounded border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Expires in</span>
                              <Badge
                                variant={contract.daysUntilExpiry < 30 ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {contract.daysUntilExpiry} days
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Value</span>
                              <span className="font-medium">{contract.value}</span>
                            </div>

                            {contract.issues > 0 && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Issues</span>
                                <Badge variant="destructive" className="text-xs">
                                  {contract.issues}
                                </Badge>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{contract.parties.length} parties</span>
                            </div>
                          </div>
                        </CardContent>
                      </BrandCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* Contract Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="border-b border-magenta-500/20 pb-4">
            <SheetTitle className="text-magenta-400">{selectedContract?.title}</SheetTitle>
            <SheetDescription>
              {selectedContract?.type} • Expires: {selectedContract?.expiry}
            </SheetDescription>
          </SheetHeader>

          {selectedContract?.details && (
            <div className="py-6 space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <BrandCard className="bg-brand-black/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Risk Score</p>
                        <p className="text-2xl font-bold text-red-500">{selectedContract.riskScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                </BrandCard>

                <BrandCard className="bg-brand-black/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Contract Value</p>
                        <p className="text-2xl font-bold">{selectedContract.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </BrandCard>
              </div>

              {/* AI-Highlighted Clauses */}
              <div>
                <h3 className="text-sm font-medium text-magenta-400 mb-3">AI-HIGHLIGHTED CLAUSES</h3>
                <div className="space-y-3">
                  {selectedContract.details.clauses.map((clause, index) => (
                    <BrandCard
                      key={index}
                      className={`${
                        clause.highlight
                          ? clause.risk === "high"
                            ? "border-red-500/50 bg-red-500/5"
                            : "border-amber-500/50 bg-amber-500/5"
                          : "bg-brand-black/30"
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
                    </BrandCard>
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

              {/* Quick Actions */}
              <div className="pt-4 space-y-3 border-t border-magenta-500/20">
                <h3 className="text-sm font-medium text-magenta-400">QUICK ACTIONS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    className="bg-magenta-600 hover:bg-magenta-700 text-white"
                    onClick={() = variant="outline"> handleDraftRenewal(selectedContract.id)}
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
