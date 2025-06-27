"use client"

import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Edit, Tag, Search, Download, Upload } from "lucide-react"
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

const mockTemplates: Template[] = [
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
]

const mockClauses: Clause[] = [
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

export function TemplateWizard() {
  const [templates, setTemplates] = useState(mockTemplates)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [clauseSearch, setClauseSearch] = useState("")

  const categories = ["All", "Distribution", "Recording", "Publishing", "Sync", "Management"]
  const clauseCategories = ["All", "Geographic", "Rights", "Financial", "Termination", "Delivery"]

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredClauses = mockClauses.filter((clause) => {
    return (
      clause.title.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      clause.content.toLowerCase().includes(clauseSearch.toLowerCase())
    )
  })

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-500 bg-red-500/10"
      case "medium":
        return "text-amber-500 bg-amber-500/10"
      case "low":
        return "text-green-500 bg-green-500/10"
      default:
        return "text-muted-foreground bg-gray-500/10"
    }
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
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Clause Library
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Clause Library</SheetTitle>
                <SheetDescription>Drag clauses into your templates</SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clauses..."
                    className="pl-10"
                    value={clauseSearch}
                    onChange={(e) => setClauseSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  {filteredClauses.map((clause) => (
                    <BrandCard key={clause.id} className="cursor-move hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{clause.title}</h4>
                          <Badge className={`text-xs ${getRiskColor(clause.riskLevel)}`}>{clause.riskLevel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{clause.content}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{clause.category}</span>
                          <span>Used {clause.usage} times</span>
                        </div>
                      </CardContent>
                    </BrandCard>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-magenta-600 hover:bg-magenta-700 text-white" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>Choose how to start building your contract template</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="blank" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="blank">Blank</TabsTrigger>
                  <TabsTrigger value="import">Import DOCX</TabsTrigger>
                  <TabsTrigger value="library">From Library</TabsTrigger>
                </TabsList>

                <TabsContent value="blank" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Template Name</label>
                      <Input placeholder="e.g., Artist Management Agreement" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <select className="w-full p-2 border rounded-md">
                        {categories.slice(1).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ai-suggestions" />
                      <label htmlFor="ai-suggestions" className="text-sm">
                        Enable AI clause suggestions
                      </label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="import" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">Drop your DOCX file here or click to browse</p>
                    <Button variant="outline">Choose File</Button>
                  </div>
                </TabsContent>

                <TabsContent value="library" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {mockTemplates.map((template) => (
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-magenta-600 hover:bg-magenta-700 text-white" variant="outline">Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? "bg-magenta-600 hover:bg-magenta-700" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <BrandCard className="hover:shadow-md transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-magenta-500" />
                      {editingTemplate === template.id ? (
                        <Input
                          defaultValue={template.name}
                          className="h-6 text-base font-bold"
                          onBlur={() => setEditingTemplate(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingTemplate(null)}
                          autoFocus
                        />
                      ) : (
                        <span>{template.name}</span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {template.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Used {template.usage} times</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingTemplate(template.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Modified {template.lastModified}</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </BrandCard>
          </motion.div>
        ))}

        {/* Create New Template Card */}
        <Dialog>
          <DialogTrigger asChild>
            <BrandCard className="border-dashed border-magenta-500/50 hover:border-magenta-500/70 transition-all duration-300 cursor-pointer">
              <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-magenta-500" />
                  <p className="font-medium text-magenta-500">Create Template</p>
                  <p className="text-xs text-muted-foreground">Start from scratch or import</p>
                </div>
              </CardContent>
            </BrandCard>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  )
}
