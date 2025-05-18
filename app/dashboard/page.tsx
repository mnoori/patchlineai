"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  AlertCircle,
  BarChart2,
  CheckCircle2Icon,
  ClockIcon,
  Music2,
  Search,
  FileText,
  Users,
  Database,
  PlusCircle,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Zap,
  Info,
  X,
  Bell,
  Store,
} from "lucide-react"

export default function DashboardPage() {
  const [showCollaborateCard, setShowCollaborateCard] = useState(true)
  const [showNotification, setShowNotification] = useState(true)
  const [agentAlerts, setAgentAlerts] = useState([
    {
      id: 1,
      type: "Trending Sound",
      message:
        "Lo-fi elements are gaining traction in your genre. Consider incorporating these elements in upcoming releases.",
      time: "Today",
      icon: <Zap className="h-4 w-4 text-cosmic-teal" />,
    },
    {
      id: 2,
      type: "Playlist Opportunity",
      message:
        'Your track "Midnight Dreams" matches the profile for Spotify\'s "Late Night Vibes" playlist. We\'ve prepared a pitch.',
      time: "Yesterday",
      icon: <Music2 className="h-4 w-4 text-cosmic-teal" />,
    },
    {
      id: 3,
      type: "Contract Alert",
      message: 'Distribution agreement for "Summer Haze EP" expires in 45 days. Review our renewal recommendations.',
      time: "2 days ago",
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    },
    {
      id: 4,
      type: "Rights Management",
      message: 'We detected unclaimed royalties for "Night Drive" on YouTube. Click to review and claim.',
      time: "3 days ago",
      icon: <FileText className="h-4 w-4 text-red-500" />,
    },
  ])

  const upcomingReleases = [
    {
      title: "Summer EP",
      date: "June 15, 2025",
      status: "In Progress",
    },
    {
      title: "Remix Package",
      date: "July 22, 2025",
      status: "Scheduled",
    },
    {
      title: "Acoustic Sessions",
      date: "August 10, 2025",
      status: "Scheduled",
    },
  ]

  const removeAlert = (id) => {
    setAgentAlerts(agentAlerts.filter((alert) => alert.id !== id))
  }

  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])

  const oldAgentAlerts = [
    {
      id: 1,
      agent: "Scout Agent",
      message: "Found 3 new artists matching your criteria",
      time: "2 hours ago",
      priority: "high",
    },
    {
      id: 2,
      agent: "Legal Agent",
      message: "Contract review completed for 'Summer Tour 2025'",
      time: "5 hours ago",
      priority: "medium",
    },
    {
      id: 3,
      agent: "Fan Agent",
      message: "Engagement spike detected on latest release",
      time: "1 day ago",
      priority: "medium",
    },
  ]

  const filteredAlerts = oldAgentAlerts.filter((alert) => !dismissedAlerts.includes(alert.id))

  const dismissAlert = (id: number) => {
    setDismissedAlerts([...dismissedAlerts, id])
  }

  return (
    <div className="space-y-8">
      {showNotification && (
        <Card className="glass-effect bg-gradient-to-r from-cosmic-midnight to-cosmic-purple/30 border-cosmic-teal/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-cosmic-teal" />
                <div>
                  <h3 className="text-lg font-medium">New Feature Available</h3>
                  <p className="text-muted-foreground">Try our new Metadata Agent for improved catalog management</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <Button
                  variant="outline"
                  className="border-cosmic-teal/50 text-cosmic-teal hover:bg-cosmic-teal/10"
                  onClick={() => setShowNotification(false)}
                >
                  Dismiss
                </Button>
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Try Now</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCollaborateCard && (
        <Card className="glass-effect bg-gradient-to-r from-cosmic-midnight to-cosmic-purple/30 border-cosmic-teal/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="text-xl font-bold mb-1 font-heading">Invite your team to collaborate</h3>
                <p className="text-muted-foreground">
                  Add team members to streamline your workflow and boost productivity
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                <Button
                  variant="outline"
                  className="border-cosmic-teal/50 text-cosmic-teal hover:bg-cosmic-teal/10"
                  onClick={() => setShowCollaborateCard(false)}
                >
                  Dismiss
                </Button>
                <Button className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Invite Collaborators</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-cosmic-teal" />
          <h2 className="text-xl font-bold font-heading">Here's what Patchline did since last we jammed</h2>
        </div>
        <ul className="space-y-3 ml-6 list-disc text-muted-foreground marker:text-cosmic-teal">
          <li>Scout Agent surfaced 8 promising demos</li>
          <li>Legal Agent flagged 2 contracts expiring next month</li>
          <li>Fan Agent drafted 5 social media posts for upcoming release</li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Listeners</CardTitle>
            <Activity className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350,412</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+15.3%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Users className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,827</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+18.7%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Rollups */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scout Agent</CardTitle>
            <Search className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 demos</div>
            <p className="text-xs text-muted-foreground">Surfaced based on your criteria</p>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                asChild
              >
                <Link href="/dashboard/agents/scout">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Legal Agent</CardTitle>
            <FileText className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 contracts</div>
            <p className="text-xs text-muted-foreground">Expiring in the next 30 days</p>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                asChild
              >
                <Link href="/dashboard/agents/legal">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Metadata Agent</CardTitle>
            <Database className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 tracks</div>
            <p className="text-xs text-muted-foreground">Missing essential metadata</p>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                asChild
              >
                <Link href="/dashboard/agents/metadata">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fan Agent</CardTitle>
            <Users className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 posts</div>
            <p className="text-xs text-muted-foreground">Generated for your approval</p>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                asChild
              >
                <Link href="/dashboard/agents/fan">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
            <Store className="h-4 w-4 text-cosmic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20+ agents</div>
            <p className="text-xs text-muted-foreground">Available to enhance your workflow</p>
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                asChild
              >
                <Link href="/dashboard/agents/marketplace">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Upcoming Releases */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight font-heading">Upcoming Releases</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
            >
              <Calendar className="h-4 w-4" /> View Calendar
            </Button>
          </div>
          <div className="space-y-4">
            {upcomingReleases.map((release, index) => (
              <Card key={index} className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-md bg-cosmic-teal/10 p-2">
                        <Music2 className="h-5 w-5 text-cosmic-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{release.title}</p>
                        <p className="text-xs text-muted-foreground">{release.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="hidden md:block">
                        <p className="text-sm">{release.date}</p>
                      </div>
                      <div
                        className={`flex items-center ${
                          release.status === "In Progress" ? "text-cosmic-teal" : "text-amber-500"
                        }`}
                      >
                        {release.status === "In Progress" ? (
                          <CheckCircle2Icon className="h-4 w-4 mr-1" />
                        ) : (
                          <ClockIcon className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-xs">{release.status}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-cosmic-teal hover:bg-cosmic-teal/10">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Overview */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold tracking-tight font-heading">Analytics Overview</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
              >
                <BarChart2 className="h-4 w-4" /> Full Insights
              </Button>
            </div>
            <Card className="glass-effect hover:border-cosmic-teal/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-64 flex items-end justify-between gap-1">
                  {[35, 58, 45, 32, 58, 72, 45, 35, 48, 65, 38, 48].map((value, index) => (
                    <div
                      key={index}
                      className="bg-cosmic-teal w-full rounded-t-sm"
                      style={{ height: `${value}%` }}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
                <div className="mt-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                  >
                    View detailed analytics <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Agent Alerts */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight font-heading">Agent Alerts</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
            >
              <Info className="h-4 w-4" /> View All
            </Button>
          </div>
          <div className="space-y-4">
            {agentAlerts.map((alert, index) => (
              <Card
                key={index}
                className={`glass-effect hover:border-cosmic-teal/30 transition-all duration-300 group ${
                  alert.type === "Contract Alert" || alert.type === "Rights Management" ? "border-red-500/30" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-background p-1 mt-0.5">{alert.icon}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{alert.type}</p>
                        <div className="flex items-center">
                          <p className="text-xs text-muted-foreground mr-2">{alert.time}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            onClick={() => removeAlert(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                      >
                        View rationale
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Agent CTA */}
      <Card className="glass-effect border-dashed border-cosmic-teal/50 hover:border-cosmic-teal/70 transition-all duration-300">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="rounded-full bg-cosmic-teal/10 p-3 mb-4">
            <PlusCircle className="h-6 w-6 text-cosmic-teal" />
          </div>
          <h3 className="text-lg font-medium mb-2 font-heading">Add New Agent</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Customize your workflow with additional AI agents
          </p>
          <Button asChild className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
            <Link href="/dashboard/agents/marketplace">Explore Agents</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Dollar sign icon component
function DollarSign(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )
}
