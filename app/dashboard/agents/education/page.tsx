"use client"

import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Filter,
  Download,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  CheckCircle2,
  Edit,
  Plus,
} from "lucide-react"

export default function EducationAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const students = [
    {
      name: "Alex Johnson",
      instrument: "Guitar",
      level: "Intermediate",
      nextLesson: "May 20, 2025",
      progress: 78,
      feedback: 3,
    },
    {
      name: "Maya Rodriguez",
      instrument: "Piano",
      level: "Advanced",
      nextLesson: "May 18, 2025",
      progress: 92,
      feedback: 0,
    },
    {
      name: "Ethan Williams",
      instrument: "Drums",
      level: "Beginner",
      nextLesson: "May 22, 2025",
      progress: 45,
      feedback: 2,
    },
    {
      name: "Sophia Chen",
      instrument: "Violin",
      level: "Intermediate",
      nextLesson: "May 19, 2025",
      progress: 65,
      feedback: 1,
    },
    {
      name: "Noah Garcia",
      instrument: "Bass",
      level: "Beginner",
      nextLesson: "May 21, 2025",
      progress: 32,
      feedback: 2,
    },
  ]

  const upcomingLessons = [
    {
      student: "Maya Rodriguez",
      date: "May 18, 2025",
      time: "3:00 PM - 4:00 PM",
      topic: "Advanced Chord Progressions",
      status: "Confirmed",
    },
    {
      student: "Sophia Chen",
      date: "May 19, 2025",
      time: "5:30 PM - 6:30 PM",
      topic: "Bowing Techniques",
      status: "Confirmed",
    },
    {
      student: "Alex Johnson",
      date: "May 20, 2025",
      time: "4:15 PM - 5:15 PM",
      topic: "Fingerpicking Patterns",
      status: "Pending",
    },
    {
      student: "Noah Garcia",
      date: "May 21, 2025",
      time: "6:00 PM - 7:00 PM",
      topic: "Basic Rhythm Patterns",
      status: "Confirmed",
    },
  ]

  const learningMaterials = [
    {
      title: "Music Theory Fundamentals",
      type: "Course",
      students: 5,
      completion: 68,
      lastUpdated: "April 15, 2025",
    },
    {
      title: "Ear Training Exercises",
      type: "Exercise Set",
      students: 4,
      completion: 45,
      lastUpdated: "April 28, 2025",
    },
    {
      title: "Rhythm Mastery",
      type: "Course",
      students: 3,
      completion: 32,
      lastUpdated: "May 5, 2025",
    },
    {
      title: "Chord Progressions",
      type: "Exercise Set",
      students: 2,
      completion: 75,
      lastUpdated: "May 10, 2025",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">Education Agent</h1>
        <p className="text-muted-foreground">Streamline student data, class scheduling, and lesson feedback</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
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
            <Calendar className="h-4 w-4" /> Schedule
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="agent-settings">Agent Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <BrandCard className="glass-effect" variant="gradient" hover="glow">
            <CardHeader>
              <CardTitle>Student Dashboard</CardTitle>
              <CardDescription>Track student progress and manage feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Student</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Instrument</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Next Lesson</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Progress</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Feedback</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.level}</div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{student.instrument}</td>
                          <td className="p-4 align-middle">{student.nextLesson}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Progress value={student.progress} className="h-2 w-24" />
                              <span>{student.progress}%</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {student.feedback > 0 ? (
                              <div className="flex items-center text-amber-500">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                <span>{student.feedback}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-500">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                <span>Up to date</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MessageSquare className="h-4 w-4" />
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
                    <span className="font-medium">Total Students:</span> {students.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Average Progress:</span> 62%
                  </div>
                </div>
                <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">Add New Student</Button>
              </div>
            </CardContent>
          </BrandCard>
        </TabsContent>

        <TabsContent value="lessons">
          <div className="grid gap-4 md:grid-cols-2">
            <BrandCard className="glass-effect" variant="gradient" hover="glow">
              <CardHeader>
                <CardTitle>Upcoming Lessons</CardTitle>
                <CardDescription>Scheduled lessons for the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingLessons.map((lesson, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{lesson.student}</h3>
                          <p className="text-sm text-muted-foreground">{lesson.topic}</p>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            lesson.status === "Confirmed"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {lesson.status}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{lesson.date}</span>
                        <Clock className="h-4 w-4 ml-3 mr-1" />
                        <span>{lesson.time}</span>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
                    Schedule New Lesson
                  </Button>
                </div>
              </CardContent>
            </BrandCard>

            <BrandCard className="glass-effect" variant="gradient" hover="glow">
              <CardHeader>
                <CardTitle>Lesson Analytics</CardTitle>
                <CardDescription>Insights from past lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Completion Rate</h3>
                      <span className="font-medium">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Percentage of scheduled lessons completed</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Student Satisfaction</h3>
                      <span className="font-medium">4.8/5</span>
                    </div>
                    <Progress value={96} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Average rating from student feedback</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Progress Rate</h3>
                      <span className="font-medium">76%</span>
                    </div>
                    <Progress value={76} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Average student progress toward learning goals</p>
                  </div>

                  <Button variant="outline" className="w-full">
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </BrandCard>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <BrandCard className="glass-effect" variant="gradient" hover="glow">
            <CardHeader>
              <CardTitle>Learning Materials</CardTitle>
              <CardDescription>Courses, exercises, and resources for students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Students</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Completion</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Last Updated</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningMaterials.map((material, index) => (
                        <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle">
                            <div className="font-medium">{material.title}</div>
                          </td>
                          <td className="p-4 align-middle">{material.type}</td>
                          <td className="p-4 align-middle">{material.students}</td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Progress value={material.completion} className="h-2 w-24" />
                              <span>{material.completion}%</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">{material.lastUpdated}</td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Users className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add Material
                </Button>
              </div>
            </CardContent>
          </BrandCard>
        </TabsContent>

        <TabsContent value="agent-settings">
          <BrandCard className="glass-effect" variant="gradient" hover="glow">
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>Configure your Education Agent preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Feedback Generation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Feedback Style</div>
                        <div className="text-sm text-muted-foreground">Tone of generated feedback</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>Encouraging</option>
                        <option>Constructive</option>
                        <option>Detailed</option>
                        <option>Concise</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Feedback Frequency</div>
                        <div className="text-sm text-muted-foreground">How often to generate feedback</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>After Every Lesson</option>
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Scheduling</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Lesson Duration</div>
                        <div className="text-sm text-muted-foreground">Default lesson length</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>30 minutes</option>
                        <option>45 minutes</option>
                        <option>60 minutes</option>
                        <option>90 minutes</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Buffer Time</div>
                        <div className="text-sm text-muted-foreground">Time between lessons</div>
                      </div>
                      <select className="rounded-md border bg-background px-3 py-2 text-sm">
                        <option>None</option>
                        <option>5 minutes</option>
                        <option>10 minutes</option>
                        <option>15 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Integrations</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>Google Calendar</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        <div>Google Drive</div>
                      </div>
                      <div className="text-sm text-green-500">Connected</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <div>Discord</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">Save Settings</Button>
              </div>
            </CardContent>
          </BrandCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
