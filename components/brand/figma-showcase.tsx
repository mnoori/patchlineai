'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { FileText, Palette, Package, Component, RefreshCw } from 'lucide-react'
import { FigmaAssetPreview } from './figma-asset-preview'

interface FigmaShowcaseData {
  fileInfo: {
    name: string
    lastModified: string
    version: string
    thumbnailUrl?: string
  }
  statistics: {
    totalNodes: number
    totalComponents: number
    totalStyles: number
    nodeTypes: Record<string, number>
  }
  sampleComponents: any[]
  sampleColors: any[]
  sampleAssets: any[]
  fileId?: string
}

export function FigmaShowcase() {
  const [data, setData] = useState<FigmaShowcaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load showcase data via API route
    fetch('/api/figma/showcase')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setData)
      .catch(() => {
        setError('No Figma data available. Run the exploration script first.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{error || 'No Figma data available'}</p>
          <p className="text-sm text-muted-foreground">
            Run <code className="bg-muted px-2 py-1 rounded">pnpm tsx scripts/explore-figma-file.ts</code> to explore your Figma file
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* File Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Figma File Overview
          </CardTitle>
          <CardDescription>
            Connected to: {data.fileInfo.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">{data.fileInfo.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Modified</p>
              <p className="font-medium">{new Date(data.fileInfo.lastModified).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Nodes</p>
              <p className="font-medium">{data.statistics.totalNodes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Styles</p>
              <p className="font-medium">{data.statistics.totalStyles}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Content */}
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Component className="w-5 h-5" />
                Published Components
              </CardTitle>
              <CardDescription>
                {data.statistics.totalComponents} components available for sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.sampleComponents.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {data.sampleComponents.map((comp, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{comp.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {comp.description || 'No description'}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {comp.key}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No published components found. Publish components in Figma to sync them.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Styles
              </CardTitle>
              <CardDescription>
                Design tokens ready for synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.sampleColors.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {data.sampleColors.map((color, i) => (
                      <div key={i} className="p-4 border rounded-lg bg-gray-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">
                            {color.name === 'Linear' ? `Gradient ${i + 1}` : color.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {color.id}
                          </Badge>
                        </div>
                        {color.name === 'Linear' && (
                          <div className="w-full h-8 rounded bg-gradient-to-r from-cyan-500 to-purple-500 opacity-80" />
                        )}
                        {color.description && (
                          <p className="text-xs text-muted-foreground mt-2">{color.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Figma's API returns gradient type names instead of actual color values. 
                    To see the actual gradients, view them in Figma or export the frames that use them.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No color styles found. Define color styles in Figma to sync them.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Potential Assets
              </CardTitle>
              <CardDescription>
                Nodes that might be exportable assets (logos, icons, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.sampleAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.sampleAssets.map((asset, i) => (
                    <FigmaAssetPreview
                      key={i}
                      assetId={asset.id}
                      assetName={asset.name}
                      fileId={data.fileId || "PbzhWQIGJF68IPYo8Bheck"}
                      hasExportSettings={asset.hasExportSettings}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No potential assets found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Node Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of elements in your Figma file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.statistics.nodeTypes)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Sync Design Tokens
            </Button>
            <Button variant="outline" size="sm">
              Generate Components
            </Button>
            <Button variant="outline" size="sm">
              Export Assets
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            These actions will be available once you configure component and asset IDs
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 