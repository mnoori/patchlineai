"use client"

import { useState } from "react"
import { AgentHeader } from "@/components/agents/agent-header"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Plus } from "lucide-react"
import { ContractDashboard } from "@/components/agents/legal/contract-dashboard"
import { TemplateLibrary } from "@/components/agents/legal/template-library"
import { ContractCalendar } from "@/components/agents/legal/contract-calendar"

export default function LegalAgentPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="space-y-8">
      <AgentHeader
        agentName="Legal"
        title="Legal Agent"
        description="Your contract guardian angel - always scanning, never sleeping."
      />

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

      {/* Horizontal Tabs */}
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {activeTab === "dashboard" && <ContractDashboard />}
          {activeTab === "templates" && <TemplateLibrary />}
          {activeTab === "calendar" && <ContractCalendar />}
        </div>
      </Tabs>
    </div>
  )
}
