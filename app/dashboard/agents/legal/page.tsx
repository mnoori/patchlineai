import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, AlertCircle, CheckCircle, Clock, Download, FileText, Plus } from "lucide-react"

export default function LegalAgentPage() {
  const contracts = [
    {
      title: "Distribution Agreement - Luna Ray",
      type: "Distribution",
      expiry: "June 15, 2025",
      status: "At Risk",
      statusIcon: <AlertCircle className="h-4 w-4 text-red-500" />,
      issues: 3,
      lastReviewed: "2 months ago",
    },
    {
      title: "Publishing Deal - The Echoes",
      type: "Publishing",
      expiry: "August 22, 2025",
      status: "Needs Review",
      statusIcon: <Clock className="h-4 w-4 text-amber-500" />,
      issues: 1,
      lastReviewed: "1 month ago",
    },
    {
      title: "Licensing Agreement - Metro Beats",
      type: "Licensing",
      expiry: "December 10, 2025",
      status: "Healthy",
      statusIcon: <CheckCircle className="h-4 w-4 text-green-500" />,
      issues: 0,
      lastReviewed: "2 weeks ago",
    },
    {
      title: "Recording Contract - Cosmic Waves",
      type: "Recording",
      expiry: "March 5, 2026",
      status: "Healthy",
      statusIcon: <CheckCircle className="h-4 w-4 text-green-500" />,
      issues: 0,
      lastReviewed: "1 week ago",
    },
    {
      title: "Sync License - Skyline Collective",
      type: "Sync",
      expiry: "July 30, 2025",
      status: "Needs Review",
      statusIcon: <Clock className="h-4 w-4 text-amber-500" />,
      issues: 1,
      lastReviewed: "3 weeks ago",
    },
  ]

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
          <Input type="search" placeholder="Search contracts, artists, or terms..." className="pl-10" />
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

      <Tabs defaultValue="dashboard" className="w-full">
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
                      {contracts.map((contract, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
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
                            <Button variant="ghost" size="sm" className="h-8">
                              View
                            </Button>
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
    </div>
  )
}
