"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  Calendar,
  ArrowRight,
} from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ActionCard } from "@/components/agents/action-card"
import { EmailIntegration } from "@/components/integrations/email-integration"
import { CalendarIntegration } from "@/components/integrations/calendar-integration"
import { PATCHLINE_CONFIG } from "@/lib/config"

export function LegalAgentEnhanced() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [briefOpen, setBriefOpen] = useState(false)

  interface Contract {
    id: string
    title: string
    type: string
    expiry: string
    status: "At Risk" | "Needs Review" | "Healthy"
    statusIcon: React.ReactNode
    issues: number
    lastReviewed: string
    details?: {
      summary: string
      risks: string[]
      recommendations: string[]
      parties: string[]
      keyDates: {
        label: string
        date: string
      }[]
    }
  }

  const contracts: Contract[] = [
    {
      id: "contract-1",
      title: "Distribution Agreement - Luna Ray",
      type: "Distribution",
      expiry: "June 15, 2025",
      status: "At Risk",
      statusIcon: <AlertCircle className="h-4 w-4 text-red-500" />,
      issues: 3,
      lastReviewed: "2 months ago",
      details: {
        summary:
          "Distribution deal with Luna Ray expires in 24 days with a 3-month auto-renew clause. Rights revert to artist if not renewed, potentially leading to streaming takedown.",
        risks: [
          "Rights revert → streaming takedown",
          "Loss of 12% of monthly revenue",
          "Artist may sign with competitor",
        ],
        recommendations: [
          "Draft renewal with improved terms",
          "Prepare takedown contingency plan",
          "Schedule call with artist management",
        ],
        parties: ["Luna Ray (Artist)", "Patchline Records (Label)", "Global Streams Inc. (Distributor)"],
        keyDates: [
          {
            label: "Expiration",
            date: "June 15, 2025",
          },
          {
            label: "Auto-renew notice deadline",
            date: "May 15, 2025",
          },
          {
            label: "Original signing date",
            date: "June 15, 2023",
          },
        ],
      },
    },
    {
      id: "contract-2",
      title: "Publishing Deal - The Echoes",
      type: "Publishing",
      expiry: "August 22, 2025",
      status: "Needs Review",
      statusIcon: <Clock className="h-4 w-4 text-amber-500" />,
      issues: 1,
      lastReviewed: "1 month ago",
      details: {
        summary:
          "Publishing agreement with The Echoes needs review for potential sync opportunities. Current terms may limit placement in certain media types.",
        risks: ["Limited sync placement options", "Potential missed revenue opportunities"],
        recommendations: ["Amend agreement to expand sync rights", "Negotiate improved rate for emerging platforms"],
        parties: ["The Echoes (Artist)", "Patchline Publishing (Publisher)"],
        keyDates: [
          {
            label: "Review deadline",
            date: "July 1, 2025",
          },
          {
            label: "Original signing date",
            date: "August 22, 2022",
          },
        ],
      },
    },
    {
      id: "contract-3",
      title: "Licensing Agreement - Metro Beats",
      type: "Licensing",
      expiry: "December 10, 2025",
      status: "Healthy",
      statusIcon: <CheckCircle className="h-4 w-4 text-green-500" />,
      issues: 0,
      lastReviewed: "2 weeks ago",
    },
    {
      id: "contract-4",
      title: "Recording Contract - Cosmic Waves",
      type: "Recording",
      expiry: "March 5, 2026",
      status: "Healthy",
      statusIcon: <CheckCircle className="h-4 w-4 text-green-500" />,
      issues: 0,
      lastReviewed: "1 week ago",
    },
    {
      id: "contract-5",
      title: "Sync License - Skyline Collective",
      type: "Sync",
      expiry: "July 30, 2025",
      status: "Needs Review",
      statusIcon: <Clock className="h-4 w-4 text-amber-500" />,
      issues: 1,
      lastReviewed: "3 weeks ago",
    },
  ]

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract)
    setBriefOpen(true)
  }

  const handleDraftRenewal = async (contractId: string) => {
    return new Promise<void>((resolve) => {
      // Simulate API call
      setTimeout(() => {
        console.log(`Drafted renewal for contract ${contractId}`)
        resolve()
      }, 1500)
    })
  }

  const handleScheduleReview = async (contractId: string) => {
    return new Promise<void>((resolve) => {
      // Simulate API call
      setTimeout(() => {
        console.log(`Scheduled review for contract ${contractId}`)
        resolve()
      }, 1500)
    })
  }

  const handleSendReminder = async (contractId: string) => {
    return new Promise<void>((resolve) => {
      // Simulate API call
      setTimeout(() => {
        console.log(`Sent reminder for contract ${contractId}`)
        resolve()
      }, 1500)
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Legal Agent</h1>
        <p className="text-muted-foreground">
          Automatically monitor contracts and flag potential risks across your entire catalog.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contracts, artists, or terms..."
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
            <Plus className="h-4 w-4" /> New Contract
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Contract Dashboard</CardTitle>
              <CardDescription>
                Monitor your contracts and identify potential risks before they become problems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {PATCHLINE_CONFIG.features.enableAgentSuperLoop ? (
                <div className="space-y-4">
                  {contracts
                    .filter((contract) => contract.status !== "Healthy")
                    .map((contract) => (
                      <ActionCard
                        key={contract.id}
                        title={contract.title}
                        description={`${contract.type} • Expires: ${contract.expiry} • ${contract.issues} ${contract.issues === 1 ? "issue" : "issues"}`}
                        icon={<FileText className="h-5 w-5 text-cosmic-teal" />}
                        actions={[
                          {
                            label: "View Brief",
                            onClick: () => handleViewContract(contract),
                            variant: "outline",
                            icon: <FileText className="h-3.5 w-3.5" />,
                          },
                          ...(contract.status === "At Risk"
                            ? [
                                {
                                  label: "Draft Renewal",
                                  onClick: () => handleDraftRenewal(contract.id),
                                  autoAction: true,
                                  icon: <ArrowRight className="h-3.5 w-3.5" />,
                                },
                              ]
                            : []),
                          ...(contract.status === "Needs Review"
                            ? [
                                {
                                  label: "Schedule Review",
                                  onClick: () => handleScheduleReview(contract.id),
                                  autoAction: true,
                                  icon: <Calendar className="h-3.5 w-3.5" />,
                                },
                              ]
                            : []),
                        ]}
                        className={contract.status === "At Risk" ? "border-red-500/30" : ""}
                      />
                    ))}

                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-3">Healthy Contracts</h3>
                    <div className="rounded-md border">
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead>
                            <tr className="border-b transition-colors hover:bg-muted/50">
                              <th className="h-12 px-4 text-left align-middle font-medium">Contract</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Expiry</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Last Reviewed</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contracts
                              .filter((contract) => contract.status === "Healthy")
                              .map((contract) => (
                                <tr key={contract.id} className="border-b transition-colors hover:bg-muted/50">
                                  <td className="p-4 align-middle">
                                    <div className="font-medium">{contract.title}</div>
                                  </td>
                                  <td className="p-4 align-middle">{contract.type}</td>
                                  <td className="p-4 align-middle">{contract.expiry}</td>
                                  <td className="p-4 align-middle">
                                    <div className="flex items-center gap-1">
                                      {contract.statusIcon}
                                      <span className="text-green-500">{contract.status}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle whitespace-nowrap">{contract.lastReviewed}</td>
                                  <td className="p-4 align-middle">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => handleViewContract(contract)}
                                    >
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Contract</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Expiry</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Issues</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Last Reviewed</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.map((contract) => (
                          <tr key={contract.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <div className="font-medium">{contract.title}</div>
                            </td>
                            <td className="p-4 align-middle">{contract.type}</td>
                            <td className="p-4 align-middle">{contract.expiry}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-1">
                                {contract.statusIcon}
                                <span
                                  className={
                                    contract.status === "At Risk"
                                      ? "text-red-500"
                                      : contract.status === "Needs Review"
                                        ? "text-amber-500"
                                        : "text-green-500"
                                  }
                                >
                                  {contract.status}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">
                              {contract.issues > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                                  {contract.issues} {contract.issues === 1 ? "issue" : "issues"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                                  No issues
                                </span>
                              )}
                            </td>
                            <td className="p-4 align-middle whitespace-nowrap">{contract.lastReviewed}</td>
                            <td className="p-4 align-middle">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => handleViewContract(contract)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates tab content remains the same */}
        <TabsContent value="templates">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Contract Templates</CardTitle>
              <CardDescription>Standard contract templates for various music business needs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Distribution Agreement",
                  "Recording Contract",
                  "Publishing Deal",
                  "Sync License",
                  "Management Agreement",
                  "Producer Agreement",
                ].map((template, index) => (
                  <Card
                    key={index}
                    className="bg-cosmic-midnight/50 hover:border-cosmic-teal/30 transition-all duration-300"
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <FileText className="h-8 w-8 text-cosmic-teal" />
                      <div>
                        <p className="font-medium">{template}</p>
                        <p className="text-xs text-muted-foreground">Standard template</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="bg-cosmic-midnight/50 border-dashed border-cosmic-teal/50 hover:border-cosmic-teal/70 transition-all duration-300">
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <Button
                      variant="ghost"
                      className="gap-2 text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Template</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar tab content remains the same */}
        <TabsContent value="calendar">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Contract Calendar</CardTitle>
              <CardDescription>Timeline view of contract deadlines and important dates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                  <p className="text-muted-foreground mb-4">
                    The calendar view is being developed and will be available soon.
                  </p>
                  <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">View Dashboard</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contract Brief Sheet */}
      <Sheet open={briefOpen} onOpenChange={setBriefOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedContract?.title}</SheetTitle>
            <SheetDescription>
              {selectedContract?.type} • Expires: {selectedContract?.expiry}
            </SheetDescription>
          </SheetHeader>

          {selectedContract?.details ? (
            <div className="py-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">SUMMARY</h3>
                <p className="text-sm">{selectedContract.details.summary}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">PARTIES</h3>
                <ul className="space-y-1">
                  {selectedContract.details.parties.map((party, index) => (
                    <li key={index} className="text-sm">
                      {party}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">KEY DATES</h3>
                <div className="space-y-2">
                  {selectedContract.details.keyDates.map((date, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{date.label}</span>
                      <span className="font-medium">{date.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedContract.details.risks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-500 mb-2">RISKS</h3>
                  <ul className="space-y-1">
                    {selectedContract.details.risks.map((risk, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-cosmic-teal mb-2">RECOMMENDATIONS</h3>
                <ul className="space-y-1">
                  {selectedContract.details.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-cosmic-teal mt-0.5 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                {selectedContract.status === "At Risk" && (
                  <>
                    <EmailIntegration
                      recipient="management@lunaray.com"
                      subject={`Renewal: ${selectedContract.title}`}
                      body={`Dear Luna Ray Team,\n\nI hope this email finds you well. I'm writing regarding the distribution agreement between Luna Ray and Patchline Records, which is set to expire on ${selectedContract.expiry}.\n\nWe'd like to discuss renewing this agreement under favorable terms for both parties. I've attached a draft of the proposed renewal terms for your review.\n\nPlease let me know if you'd like to schedule a call to discuss further.\n\nBest regards,\n[Your Name]\nPatchline Records`}
                      trigger={
                        <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                          <ArrowRight className="h-4 w-4 mr-2" /> Draft Renewal Email
                        </Button>
                      }
                    />

                    <CalendarIntegration
                      title={`Review: ${selectedContract.title}`}
                      description={`Review contract expiration and renewal options for ${selectedContract.title}`}
                      attendees={["management@lunaray.com", "legal@patchline.com"]}
                      trigger={
                        <Button className="w-full" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" /> Schedule Review Meeting
                        </Button>
                      }
                    />
                  </>
                )}

                {selectedContract.status === "Needs Review" && (
                  <CalendarIntegration
                    title={`Review: ${selectedContract.title}`}
                    description={`Review contract terms and potential amendments for ${selectedContract.title}`}
                    attendees={["legal@patchline.com"]}
                    trigger={
                      <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                        <Calendar className="h-4 w-4 mr-2" /> Schedule Review
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Contract Details</h3>
                <p className="text-muted-foreground mb-4">Detailed information for this contract is not available.</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
