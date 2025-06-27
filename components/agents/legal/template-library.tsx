"use client"

import { Badge } from "@/components/ui/badge"

import { Card as BrandCard } from '@/components/brand'
import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Plus, Edit, Download, Upload, Copy, Trash2 } from "lucide-react"
import { motion } from "framer-motion"

interface Template {
  id: string
  name: string
  category: string
  description: string
  lastModified: string
  usage: number
}

interface Clause {
  id: string
  title: string
  content: string
  category: string
  riskLevel: "low" | "medium" | "high"
  usage: number
}

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Distribution Agreement",
      category: "Distribution",
      description: "Standard distribution contract template",
      lastModified: "2 days ago",
      usage: 12,
    },
    {
      id: "2",
      name: "Recording Contract",
      category: "Recording",
      description: "Artist recording agreement template",
      lastModified: "1 week ago",
      usage: 8,
    },
    {
      id: "3",
      name: "Publishing Deal",
      category: "Publishing",
      description: "Music publishing agreement template",
      lastModified: "3 days ago",
      usage: 15,
    },
    {
      id: "4",
      name: "Sync License",
      category: "Sync",
      description: "Synchronization licensing template",
      lastModified: "5 days ago",
      usage: 6,
    },
    {
      id: "5",
      name: "Management Agreement",
      category: "Management",
      description: "Artist management contract template",
      lastModified: "1 month ago",
      usage: 10,
    },
    {
      id: "6",
      name: "Producer Agreement",
      category: "Production",
      description: "Music producer contract template",
      lastModified: "2 weeks ago",
      usage: 7,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false)

  const categories = ["All", "Distribution", "Recording", "Publishing", "Sync", "Management", "Production"]

  const clauses: Clause[] = [
    {
      id: "1",
      title: "Territory Definition",
      content: "Territory shall mean worldwide including all digital platforms...",
      category: "Geographic",
      riskLevel: "low",
      usage: 45,
    },
    {
      id: "2",
      title: "Rights Reversion",
      content: "All rights granted hereunder shall revert to Artist upon...",
      category: "Rights",
      riskLevel: "high",
      usage: 23,
    },
    {
      id: "3",
      title: "Royalty Split",
      content: "Net receipts shall be divided as follows: Artist 70%, Label 30%...",
      category: "Financial",
      riskLevel: "medium",
      usage: 38,
    },
    {
      id: "4",
      title: "Termination Clause",
      content: "Either party may terminate this agreement with 30 days written notice...",
      category: "Termination",
      riskLevel: "medium",
      usage: 31,
    },
  ]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template)
    setTemplateDrawerOpen(true)
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((template) => template.id !== id))
  }

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      lastModified: "Just now",
    }
    setTemplates([...templates, newTemplate])
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <FileText className="h-4 w-4" /> Clause Library
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-border/50">
              <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
              <SheetHeader>
                <SheetTitle>Clause Library</SheetTitle>
                <SheetDescription>Drag clauses into your templates</SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search clauses..." className="pl-10" />
                </div>

                <div className="space-y-3">
                  {clauses.map((clause) => (
                    <motion.div key={clause.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                      <BrandCard className="cursor-move hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{clause.title}</h4>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                clause.riskLevel === "high"
                                  ? "bg-red-500/10 text-red-500"
                                  : clause.riskLevel === "medium"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-green-500/10 text-green-500"
                              }`}
                            >
                              {clause.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{clause.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{clause.category}</span>
                            <span>Used {clause.usage} times</span>
                          </div>
                        </CardContent>
                      </BrandCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
                <Plus className="h-4 w-4" /> Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>Choose how to start building your contract template</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="blank" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="blank">Blank</TabsTrigger>
                  <TabsTrigger value="import">Import DOCX</TabsTrigger>
                  <TabsTrigger value="library">From Library</TabsTrigger>
                </TabsList>

                <TabsContent value="blank" className="space-y-4 py-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" placeholder="e.g., Artist Management Agreement" />
                    </div>
                    <div>
                      <Label htmlFor="template-category">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map((cat) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-description">Description</Label>
                      <Input id="template-description" placeholder="Brief description of this template" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="import" className="py-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your DOCX file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">Supports DOCX and PDF files</p>
                    <Button variant="outline" size="sm">
                      Browse Files
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="library" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <BrandCard key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </CardContent>
                      </BrandCard>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                  variant="outline"
                  onClick={() => {
                    const newTemplate = {
                      id: `new-${Date.now()}`,
                      name: "New Template",
                      category: "Distribution",
                      description: "Custom template",
                      lastModified: "Just now",
                      usage: 0,
                    }
                    setTemplates([...templates, newTemplate])
                    setShowNewTemplateDialog(false)
                  }}
                >
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-brand-cyan hover:bg-brand-cyan/90 text-black" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <motion.div key={template.id} whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <BrandCard
              className="hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleTemplateClick(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-8 w-8 text-brand-cyan mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs bg-brand-cyan/10 text-brand-cyan">
                        {template.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Used {template.usage} times</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Modified {template.lastModified}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateTemplate(template)
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </BrandCard>
          </motion.div>
        ))}

        {/* Create New Template Card */}
        <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
          <BrandCard
            className="border-dashed border-brand-cyan/50 hover:border-brand-cyan/70 transition-all duration-300 cursor-pointer h-full"
            onClick={() => setShowNewTemplateDialog(true)}
          >
            <CardContent className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center">
                <Plus className="h-10 w-10 mx-auto mb-3 text-brand-cyan" />
                <p className="font-medium text-brand-cyan text-lg">Create Template</p>
                <p className="text-sm text-muted-foreground">Start from scratch or import</p>
              </div>
            </CardContent>
          </BrandCard>
        </motion.div>
      </div>

      {/* Template Detail Drawer */}
      <Sheet open={templateDrawerOpen} onOpenChange={setTemplateDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border/50">
          <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
          {selectedTemplate && (
            <>
              <SheetHeader className="border-b border-brand-cyan/20 pb-4">
                <SheetTitle className="text-brand-cyan">{selectedTemplate.name}</SheetTitle>
                <SheetDescription>
                  {selectedTemplate.category} • Last modified: {selectedTemplate.lastModified}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-brand-cyan/10 text-brand-cyan">
                    {selectedTemplate.category}
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button size="sm" className="gap-1 bg-brand-cyan hover:bg-brand-cyan/90 text-black" variant="outline">
                      <Plus className="h-4 w-4" /> Use Template
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">DESCRIPTION</h3>
                  <p className="text-sm">{selectedTemplate.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">TEMPLATE SECTIONS</h3>
                  <div className="space-y-3">
                    {[
                      "Definitions",
                      "Grant of Rights",
                      "Term and Territory",
                      "Compensation",
                      "Delivery Requirements",
                      "Representations and Warranties",
                      "Termination",
                    ].map((section, index) => (
                      <BrandCard key={index} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{section}</h4>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </BrandCard>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">USAGE STATISTICS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <BrandCard className="bg-brand-black/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Total Uses</p>
                          <p className="text-2xl font-bold">{selectedTemplate.usage}</p>
                        </div>
                      </CardContent>
                    </BrandCard>
                    <BrandCard className="bg-brand-black/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Last Used</p>
                          <p className="text-lg font-medium">3 days ago</p>
                        </div>
                      </CardContent>
                    </BrandCard>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
