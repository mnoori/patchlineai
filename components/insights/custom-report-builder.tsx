"use client"

import type React from "react"
import { Card as BrandCard } from '@/components/brand'
import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Info,
  Plus,
  FileText,
  Download,
  Share2,
  BarChart,
  PieChart,
  LineChart,
  Settings,
  Trash2,
  GripVertical,
} from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReportModule {
  id: string
  type: "kpi" | "bar-chart" | "line-chart" | "pie-chart" | "table"
  title: string
  description: string
  icon: React.ReactNode
}

interface CustomReportBuilderProps {
  availableModules: ReportModule[]
  defaultActiveTab?: string
}

export function CustomReportBuilder({ availableModules, defaultActiveTab = "library" }: CustomReportBuilderProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab)
  const [selectedModules, setSelectedModules] = useState<ReportModule[]>([])

  const addModule = (module: ReportModule) => {
    setSelectedModules([...selectedModules, { ...module, id: `${module.id}-${Date.now()}` }])
  }

  const removeModule = (id: string) => {
    setSelectedModules(selectedModules.filter((module) => module.id !== id))
  }

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "bar-chart":
        return <BarChart className="h-5 w-5 text-brand-cyan" />
      case "line-chart":
        return <LineChart className="h-5 w-5 text-brand-cyan" />
      case "pie-chart":
        return <PieChart className="h-5 w-5 text-brand-cyan" />
      case "kpi":
        return <FileText className="h-5 w-5 text-brand-cyan" />
      case "table":
        return <FileText className="h-5 w-5 text-brand-cyan" />
      default:
        return <Info className="h-5 w-5 text-brand-cyan" />
    }
  }

  return (
    <BrandCard className="glass-effect hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">Custom Report Builder</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[250px] text-xs">
                  Build custom reports by adding modules from the library. Drag and drop to rearrange.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultActiveTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="library">Module Library</TabsTrigger>
            <TabsTrigger value="builder">Report Builder</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableModules.map((module) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border rounded-md p-3 hover:border-brand-cyan/30 hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(module.type)}
                        <h4 className="font-medium text-sm">{module.title}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {module.type.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{module.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full hover:bg-brand-cyan/10 hover:text-brand-cyan transition-colors"
                      onClick={() => addModule(module)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add to Report
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="builder" className="mt-0">
            <div className="border rounded-md p-4 min-h-[300px]">
              {selectedModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Your report is empty</h3>
                  <p className="text-sm text-muted-foreground max-w-[400px] mb-4">
                    Add modules from the library to build your custom report. You can add KPIs, charts, and tables.
                  </p>
                  <Button onClick={() => setActiveTab("library")} className="hover:scale-105 transition-transform">
                    <Plus className="h-4 w-4 mr-1" /> Add Modules
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedModules.map((module) => (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="border rounded-md p-3 cursor-move hover:border-brand-cyan/30 hover:scale-[1.02] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            {getModuleIcon(module.type)}
                            <h4 className="font-medium text-sm">{module.title}</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-brand-cyan/10 hover:text-brand-cyan"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:bg-red-500/10"
                              onClick={() => removeModule(module.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("library")}
                      className="hover:scale-105 transition-transform"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </BrandCard>
  )
}
