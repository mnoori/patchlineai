"use client"

import { AgentHeader } from "@/components/agents/agent-header"
import { CatalogOverview } from "@/components/agents/metadata/catalog-overview"
import { IssuesKanban } from "@/components/agents/metadata/issues-kanban"
import { SyncReadiness } from "@/components/agents/metadata/sync-readiness"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function AgentSettings() {
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-cosmic-teal" />
          Agent Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Metadata Standards</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Preferred Standard</div>
                  <div className="text-sm text-muted-foreground">Set your metadata standard</div>
                </div>
                <Select defaultValue="ddex">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ddex">DDEX</SelectItem>
                    <SelectItem value="id3v2">ID3v2</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Required Fields</div>
                  <div className="text-sm text-muted-foreground">Fields that must be present</div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Auto-Fix Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Auto-Fix Level</div>
                  <div className="text-sm text-muted-foreground">How aggressively to fix issues</div>
                </div>
                <Select defaultValue="balanced">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Auto-Fix Schedule</div>
                  <div className="text-sm text-muted-foreground">When to run auto-fix</div>
                </div>
                <Select defaultValue="manual">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Alert Patchy</div>
                  <div className="text-sm text-muted-foreground">Notify in chat on each run</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MetadataAgentPage() {
  return (
    <div className="space-y-8">
      <AgentHeader
        agentName="Metadata"
        title="Metadata Agent"
        description="Audit and auto-fill missing metadata fields to ensure your catalog is properly organized"
      />

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="sync-ready">Sync Ready</TabsTrigger>
          <TabsTrigger value="settings">Agent Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog">
          <CatalogOverview />
        </TabsContent>
        <TabsContent value="issues">
          <IssuesKanban />
        </TabsContent>
        <TabsContent value="sync-ready">
          <SyncReadiness />
        </TabsContent>
        <TabsContent value="settings">
          <AgentSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
