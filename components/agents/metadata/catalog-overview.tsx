"use client"

// First, let's make sure we have state for the drawer and selected item
import { useState } from "react"
import { Card as BrandCard } from '@/components/brand'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Settings, Music2, BarChart2, Play, XCircle, Lock } from "lucide-react"

export function CatalogOverview() {
  const [openDrawer, setOpenDrawer] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Sample data for the catalog overview
  const catalogItems = [
    {
      id: "item1",
      title: "Summer EP",
      artist: "Luna Echo",
      type: "EP",
      tracks: 4,
      status: "healthy",
      statusDetail: "All metadata complete and verified",
      completeness: 100,
      platforms: ["Spotify", "Apple Music", "YouTube Music", "Amazon Music"],
    },
    {
      id: "item2",
      title: "Midnight Dreams",
      artist: "Luna Echo",
      type: "Single",
      tracks: 1,
      status: "metadata",
      statusDetail: "Missing genre tags and BPM information",
      completeness: 75,
      platforms: ["Spotify", "Apple Music", "Amazon Music"],
    },
    {
      id: "item3",
      title: "Digital Horizon",
      artist: "Pulse Wave",
      type: "Album",
      tracks: 12,
      status: "rights",
      statusDetail: "Publishing split dispute with co-writer",
      completeness: 60,
      platforms: ["Spotify", "Apple Music", "YouTube Music"],
    },
    {
      id: "item4",
      title: "Cosmic Journey",
      artist: "Astral Drift",
      type: "Album",
      tracks: 10,
      status: "contract",
      statusDetail: "Distribution agreement expires in 14 days",
      completeness: 90,
      platforms: ["Spotify", "Apple Music", "Amazon Music"],
    },
  ]

  // Function to render status chip based on status
  const renderStatusChip = (status: string, detail: string) => {
    switch (status) {
      case "healthy":
        return (
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
            >
              <CheckCircle className="h-3 w-3 mr-1" /> Healthy
            </Badge>
          </div>
        )
      case "metadata":
        return (
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
            >
              <AlertTriangle className="h-3 w-3 mr-1" /> Metadata
            </Badge>
          </div>
        )
      case "rights":
        return (
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 cursor-pointer"
            >
              <XCircle className="h-3 w-3 mr-1" /> Rights
            </Badge>
          </div>
        )
      case "contract":
        return (
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20 cursor-pointer"
            >
              <Lock className="h-3 w-3 mr-1" /> Contract
            </Badge>
          </div>
        )
      default:
        return null
    }
  }

  // Handle item click to open drawer
  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setOpenDrawer(item.id)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BrandCard className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
            <Music2 className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">Across all platforms</p>
          </CardContent>
        </BrandCard>
        <BrandCard className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Metadata Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Overall completeness</p>
          </CardContent>
        </BrandCard>
        <BrandCard className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Across 18 releases</p>
          </CardContent>
        </BrandCard>
        <BrandCard className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sync Ready</CardTitle>
            <Music2 className="h-4 w-4 text-brand-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Of catalog is sync-ready</p>
          </CardContent>
        </BrandCard>
      </div>

      <BrandCard className="glass-effect">
        <CardHeader>
          <CardTitle>Catalog Overview</CardTitle>
          <CardDescription>Metadata health across your releases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium">Release</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Completeness</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Platforms</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-brand-cyan/10 p-2">
                            <Music2 className="h-4 w-4 text-brand-cyan" />
                          </div>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{item.tracks} tracks</span>
                      </td>
                      <td className="p-4 align-middle">{renderStatusChip(item.status, item.statusDetail)}</td>
                      <td className="p-4 align-middle">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium">{item.completeness}%</span>
                          </div>
                          <Progress value={item.completeness} className="h-2" />
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {item.platforms.map((platform, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </BrandCard>

      {/* Item Detail Drawer */}
      <Sheet open={!!openDrawer} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Music2 className="h-5 w-5 text-brand-cyan" />
                  {selectedItem.title}
                </SheetTitle>
                <SheetDescription>
                  {selectedItem.artist} • {selectedItem.type} • {selectedItem.tracks} tracks
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status summary */}
                <div className="p-4 rounded-lg border bg-background/50">
                  <h3 className="text-sm font-medium mb-2">Health Status</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {renderStatusChip(selectedItem.status, selectedItem.statusDetail)}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedItem.statusDetail}</p>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                      onClick={() => {
                        setOpenDrawer(null)
                        // This would navigate to metadata health in a real implementation
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Fix Metadata Issues
                    </Button>
                  </div>
                </div>

                {/* Completeness */}
                <div className="p-4 rounded-lg border bg-background/50">
                  <h3 className="text-sm font-medium mb-3">Metadata Completeness</h3>
                  <div className="w-full">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{selectedItem.completeness}%</span>
                    </div>
                    <Progress value={selectedItem.completeness} className="h-3" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center p-2 rounded-lg border">
                      <div className="text-sm font-medium">Required Fields</div>
                      <div className="text-lg font-bold text-brand-cyan">100%</div>
                    </div>
                    <div className="text-center p-2 rounded-lg border">
                      <div className="text-sm font-medium">Optional Fields</div>
                      <div className="text-lg font-bold text-amber-500">
                        {selectedItem.completeness < 100 ? Math.max(selectedItem.completeness - 20, 50) + "%" : "100%"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribution */}
                <div className="p-4 rounded-lg border bg-background/50">
                  <h3 className="text-sm font-medium mb-3">Distribution</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.platforms.map((platform: string, index: number) => (
                      <div key={index} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted">
                        <span className="text-xs">{platform}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Play className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Analytics
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
