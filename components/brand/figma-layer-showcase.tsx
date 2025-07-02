'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronDown, Layers, Download, Eye, Code, RefreshCw, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FigmaFrameRenderer } from '../figma/figma-layer-renderer'
import { cn } from '@/lib/utils'

interface FigmaLayer {
  id: string
  name: string
  type: string
  visible: boolean
  opacity?: number
  blendMode?: string
  fills?: any[]
  effects?: any[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  children?: FigmaLayer[]
  exportUrl?: string
  cssStyles?: {
    background?: string
    boxShadow?: string
    borderRadius?: string
  }
}

interface FigmaLayerShowcaseProps {
  fileId: string
  pageName?: string
}

export function FigmaLayerShowcase({ fileId, pageName = "Brand Guide" }: FigmaLayerShowcaseProps) {
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [pageData, setPageData] = useState<FigmaLayer | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [selectedLayer, setSelectedLayer] = useState<FigmaLayer | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagesLoading, setPagesLoading] = useState(true)

  // Fetch available pages
  useEffect(() => {
    console.log('Fetching Figma pages...')
    setError(null)
    setPagesLoading(true)
    fetch(`/api/figma/pages?fileId=${fileId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('Received pages:', data)
        if (data.error) {
          throw new Error(data.error)
        }
        setPages(data.pages || [])
        // Auto-select the first page or the specified page
        const targetPage = data.pages?.find((p: any) => p.name === pageName) || data.pages?.[0]
        if (targetPage) {
          setSelectedPage(targetPage.id)
        }
      })
      .catch(err => {
        console.error('Error fetching pages:', err)
        setError(err.message || 'Failed to fetch pages')
      })
      .finally(() => setPagesLoading(false))
  }, [fileId, pageName])

  // Fetch page layers when selected
  useEffect(() => {
    if (!selectedPage) return
    
    setLoading(true)
    setError(null)
    console.log('Fetching layers for page:', selectedPage)
    fetch(`/api/figma/layers/${selectedPage}?fileId=${fileId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('Received layer data:', data)
        if (data.error) {
          throw new Error(data.error)
        }
        setPageData(data.layer)
      })
      .catch(err => {
        console.error('Error fetching layers:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [selectedPage, fileId])

  const toggleExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers)
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId)
    } else {
      newExpanded.add(layerId)
    }
    setExpandedLayers(newExpanded)
  }

  const renderLayerTree = (layer: FigmaLayer, depth = 0) => {
    const hasChildren = layer.children && layer.children.length > 0
    const isExpanded = expandedLayers.has(layer.id)
    const indent = depth * 20

    return (
      <div key={layer.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer",
            selectedLayer?.id === layer.id && "bg-muted"
          )}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => setSelectedLayer(layer)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(layer.id)
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <Badge variant="outline" className="text-xs">
            {layer.type}
          </Badge>
          
          <span className="text-sm flex-1 truncate">{layer.name}</span>
          
          {layer.fills?.some(f => f.type === 'IMAGE') && (
            <Eye className="w-3 h-3 text-muted-foreground" />
          )}
          {layer.cssStyles?.background?.includes('gradient') && (
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {layer.children!.map(child => renderLayerTree(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const generateLayerCode = (layer: FigmaLayer): string => {
    const styles: string[] = []
    
    if (layer.absoluteBoundingBox) {
      styles.push(`width: ${layer.absoluteBoundingBox.width}px;`)
      styles.push(`height: ${layer.absoluteBoundingBox.height}px;`)
    }
    
    if (layer.cssStyles?.background) {
      styles.push(`background: ${layer.cssStyles.background};`)
    }
    
    if (layer.cssStyles?.boxShadow) {
      styles.push(`box-shadow: ${layer.cssStyles.boxShadow};`)
    }
    
    if (layer.cssStyles?.borderRadius) {
      styles.push(`border-radius: ${layer.cssStyles.borderRadius};`)
    }
    
    if (layer.opacity !== undefined && layer.opacity < 1) {
      styles.push(`opacity: ${layer.opacity};`)
    }

    return `/* Layer: ${layer.name} */
.${layer.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} {
  ${styles.join('\n  ')}
}

${layer.exportUrl ? `/* Export URL: ${layer.exportUrl} */` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Figma Pages & Layers
          </CardTitle>
          <CardDescription>
            Explore individual layers and their properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes('access token') && (
                  <p className="mt-2 text-xs">
                    Make sure FIGMA_ACCESS_TOKEN is set in your .env.local file
                  </p>
                )}
              </AlertDescription>
            </Alert>
          ) : pagesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading pages...
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {pages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pages found</p>
              ) : (
                pages.map(page => (
                  <Button
                    key={page.id}
                    variant={selectedPage === page.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPage(page.id)}
                  >
                    {page.name}
                  </Button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layer Explorer */}
      {pageData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Layer Tree */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layer Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {renderLayerTree(pageData)}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Layer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedLayer ? selectedLayer.name : 'Select a Layer'}
              </CardTitle>
              {selectedLayer && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={!selectedLayer.exportUrl && !selectedLayer.children}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCode(true)}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    CSS
                  </Button>
                  {selectedLayer.exportUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={selectedLayer.exportUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedLayer ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{selectedLayer.type}</p>
                  </div>
                  
                  {selectedLayer.absoluteBoundingBox && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dimensions</p>
                      <p className="font-medium">
                        {Math.round(selectedLayer.absoluteBoundingBox.width)} × {Math.round(selectedLayer.absoluteBoundingBox.height)}
                      </p>
                    </div>
                  )}
                  
                  {selectedLayer.fills && selectedLayer.fills.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Fills</p>
                      {selectedLayer.fills.map((fill, i) => (
                        <div key={i} className="text-sm">
                          {fill.type === 'SOLID' && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border"
                                style={{
                                  backgroundColor: `rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a || 1})`
                                }}
                              />
                              <span>Solid Color</span>
                            </div>
                          )}
                          {fill.type === 'IMAGE' && (
                            <span>Image Fill</span>
                          )}
                          {fill.type?.includes('GRADIENT') && (
                            <span>{fill.type}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedLayer.cssStyles && Object.keys(selectedLayer.cssStyles).length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">CSS Styles</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(selectedLayer.cssStyles, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Select a layer to view its properties
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Layer Preview: {selectedLayer?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedLayer && (
              <div className="border rounded-lg overflow-hidden bg-checkered">
                <FigmaFrameRenderer
                  frameData={selectedLayer}
                  width={800}
                  className="mx-auto"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Code Dialog */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSS Code: {selectedLayer?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedLayer && (
              <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
                {generateLayerCode(selectedLayer)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 