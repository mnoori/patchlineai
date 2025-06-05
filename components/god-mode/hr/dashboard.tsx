"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Bookmark, 
  BarChart2, 
  ArrowUpRight, 
  Download, 
  Users,
  Trophy,
  Target,
  Sparkles,
  Brain,
  TrendingUp,
  Clock,
  CheckCircle2
} from "lucide-react"
import { UploadModal } from "./upload-modal"
import { cn } from "@/lib/utils"

// Mock data for demonstration
const mockCandidates = [
  {
    id: "1",
    name: "Alex Morgan",
    title: "Senior Software Engineer",
    location: "San Francisco, CA",
    experience: "8 years",
    matchScore: 94,
    relevanceScore: 89,
    connections: "500+",
    skills: ["React", "AWS", "Python", "Machine Learning"],
    education: "MS Computer Science - Stanford",
    linkedinUrl: "https://www.linkedin.com/in/example1/",
    analyzed: true
  },
  {
    id: "2",
    name: "Jamie Lee",
    title: "AI/ML Engineer",
    location: "New York, NY",
    experience: "10 years",
    matchScore: 92,
    relevanceScore: 86,
    connections: "500+",
    skills: ["TensorFlow", "AWS SageMaker", "Python", "Deep Learning"],
    education: "PhD Machine Learning - MIT",
    linkedinUrl: "https://www.linkedin.com/in/example2/",
    analyzed: true
  },
  {
    id: "3",
    name: "Jordan Rivers",
    title: "Full Stack Developer",
    location: "Austin, TX",
    experience: "5 years",
    matchScore: 88,
    relevanceScore: 82,
    connections: "432",
    skills: ["Next.js", "TypeScript", "AWS", "PostgreSQL"],
    education: "BS Computer Science - UT Austin",
    linkedinUrl: "https://www.linkedin.com/in/example3/",
    analyzed: true
  },
]

export function HRRecruiterDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("candidates")
  const [savedCandidates, setSavedCandidates] = useState<string[]>([])

  const toggleSaveCandidate = (candidateId: string) => {
    setSavedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-effect bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Profiles Analyzed</p>
                <p className="text-lg font-bold text-emerald-400">12,394</p>
              </div>
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Match Rate</p>
                <p className="text-lg font-bold text-purple-400">87%</p>
              </div>
              <Trophy className="h-5 w-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Relevance</p>
                <p className="text-lg font-bold text-blue-400">91%</p>
              </div>
              <Target className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Time Saved</p>
                <p className="text-lg font-bold text-amber-400">427h</p>
              </div>
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search roles, skills, or locations..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <UploadModal />
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="shortlist">Shortlist ({savedCandidates.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI-Analyzed Candidates</CardTitle>
                  <CardDescription>
                    LinkedIn profiles analyzed and scored based on your requirements
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-6 rounded-lg border bg-gradient-to-r from-background/50 to-background/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {candidate.name}
                              {candidate.analyzed && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                            </h3>
                            <p className="text-muted-foreground">{candidate.title}</p>
                            <p className="text-sm text-muted-foreground">{candidate.location} • {candidate.experience}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSaveCandidate(candidate.id)}
                              className={cn(
                                savedCandidates.includes(candidate.id) && "text-amber-400"
                              )}
                            >
                              <Bookmark className={cn(
                                "h-4 w-4",
                                savedCandidates.includes(candidate.id) && "fill-current"
                              )} />
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Education</p>
                          <p className="text-sm">{candidate.education}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Scores on the right side */}
                      <div className="flex flex-col items-end gap-3 min-w-[120px]">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-400">{candidate.matchScore}%</div>
                          <div className="text-xs text-muted-foreground">Match Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{candidate.relevanceScore}%</div>
                          <div className="text-xs text-muted-foreground">Relevance</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortlist">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Your Shortlist</CardTitle>
              <CardDescription>Candidates you're considering for positions</CardDescription>
            </CardHeader>
            <CardContent>
              {savedCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-amber-500/10 p-4 mb-4">
                    <Bookmark className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Your shortlist is empty</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Save candidates you're interested in to track and compare them here
                  </p>
                  <Button 
                    onClick={() => setSelectedTab("candidates")}
                    className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black"
                  >
                    Browse Candidates
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockCandidates
                    .filter(c => savedCandidates.includes(c.id))
                    .map((candidate) => (
                      <div key={candidate.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{candidate.name}</h4>
                            <p className="text-sm text-muted-foreground">{candidate.title}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary">Match: {candidate.matchScore}%</Badge>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Talent Analytics</CardTitle>
              <CardDescription>Insights on talent pool, skills distribution, and market trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
                  <CardHeader>
                    <CardTitle className="text-base">Top Skills in Demand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["React/Next.js", "AWS/Cloud", "Python/ML", "TypeScript"].map((skill, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{skill}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={85 - idx * 10} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground">{85 - idx * 10}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-base">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg. Experience</span>
                      <span className="text-sm font-medium">7.2 years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Remote Preference</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg. Response Rate</span>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">AI Insight</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on your search patterns, candidates with cloud architecture experience and startup backgrounds 
                  have 34% higher engagement rates. Consider prioritizing these profiles.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 