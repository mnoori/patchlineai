'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronDown, Download, Eye, Code, RefreshCw, AlertCircle, Image, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FigmaFrameRenderer } from '../figma/figma-layer-renderer'
import { cn } from '@/lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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
  hasChildren?: boolean
  childrenCount?: number
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

  // Function to fetch pages
  const fetchPages = async () => {
    setPagesLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/figma/pages?fileId=${fileId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Pages data:', data)
      
      if (data.pages && Array.isArray(data.pages)) {
        setPages(data.pages)
        
        // Auto-select the target page if found
        const targetPage = data.pages.find(p => p.name === pageName)
        if (targetPage) {
          setSelectedPage(targetPage.id)
        }
      } else {
        console.error('Invalid pages data structure:', data)
        setError('Invalid pages data received')
      }
    } catch (err) {
      console.error('Error fetching pages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pages')
    } finally {
      setPagesLoading(false)
    }
  }

  // Fetch pages on mount
  useEffect(() => {
    fetchPages()
  }, [fileId])

  // Fetch page layers when selected
  useEffect(() => {
    if (!selectedPage) return
    
    setLoading(true)
    setError(null)
    console.log('Fetching layers for page:', selectedPage)
    
    // Use shallow fetch for better performance
    fetch(`/api/figma/layers/${selectedPage}?fileId=${fileId}&shallow=true`)
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
        
        // Enhanced debugging
        if (data.layer) {
          console.log('Root layer:', {
            id: data.layer.id,
            name: data.layer.name,
            type: data.layer.type,
            hasChildren: data.layer.hasChildren,
            childrenCount: data.layer.childrenCount
          })
          setPageData(data.layer)
        } else {
          throw new Error('No layer data received')
        }
      })
      .catch(err => {
        console.error('Error fetching layer:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [selectedPage, fileId])

  // Toggle layer expansion and load children if needed
  const toggleLayer = async (layerId: string) => {
    const newExpanded = new Set(expandedLayers)
    
    if (expandedLayers.has(layerId)) {
      newExpanded.delete(layerId)
    } else {
      newExpanded.add(layerId)
      
      // Load children if not already loaded
      const layer = findLayerById(pageData, layerId)
      if (layer && layer.hasChildren && !layer.children) {
        try {
          const response = await fetch(`/api/figma/layers/${layerId}/children?fileId=${fileId}`)
          if (!response.ok) throw new Error('Failed to fetch children')
          
          const data = await response.json()
          if (data.children) {
            // Update the layer with its children
            updateLayerChildren(pageData, layerId, data.children)
            setPageData({ ...pageData }) // Force re-render
          }
        } catch (err) {
          console.error('Error loading children:', err)
        }
      }
    }
    
    setExpandedLayers(newExpanded)
  }

  // Helper to find a layer by ID
  const findLayerById = (layer: FigmaLayer | null, id: string): FigmaLayer | null => {
    if (!layer) return null
    if (layer.id === id) return layer
    if (layer.children) {
      for (const child of layer.children) {
        const found = findLayerById(child, id)
        if (found) return found
      }
    }
    return null
  }

  // Helper to update layer children
  const updateLayerChildren = (layer: FigmaLayer | null, id: string, children: FigmaLayer[]): void => {
    if (!layer) return
    if (layer.id === id) {
      layer.children = children
      return
    }
    if (layer.children) {
      for (const child of layer.children) {
        updateLayerChildren(child, id, children)
      }
    }
  }

  const renderLayerTree = (layer: FigmaLayer, depth = 0) => {
    const isExpanded = expandedLayers.has(layer.id)
    const hasChildren = layer.hasChildren || (layer.children && layer.children.length > 0)
    const childCount = layer.childrenCount || layer.children?.length || 0
    
    return (
      <div key={layer.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer",
            selectedLayer?.id === layer.id && "bg-accent"
          )}
          onClick={() => {
            setSelectedLayer(layer)
            if (hasChildren) {
              toggleLayer(layer.id)
            }
          }}
        >
          {hasChildren && (
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          )}
          {!hasChildren && <div className="w-4" />}
          
          <span className="text-sm font-medium">
            {layer.name || 'Unnamed Layer'}
          </span>
          
          <span className="text-xs text-muted-foreground ml-auto">
            {layer.type}
          </span>
          
          {hasChildren && (
            <span className="text-xs text-muted-foreground">
              ({childCount})
            </span>
          )}
        </div>
        
        {isExpanded && layer.children && (
          <div className="ml-2">
            {layer.children.map(child => renderLayerTree(child, depth + 1))}
          </div>
        )}
        
        {isExpanded && hasChildren && !layer.children && (
          <div className="ml-6 text-xs text-muted-foreground py-2">
            Loading children...
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Figma Layer Explorer</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPages}
              disabled={pagesLoading}
            >
              <RefreshCw className={cn("h-4 w-4", pagesLoading && "animate-spin")} />
              Refresh
            </Button>
            {showPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Hide Preview
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Explore and inspect layers from your Figma design file
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Page Selection */}
        <div className="space-y-2">
          <Label>Select Page</Label>
          <Select value={selectedPage || ''} onValueChange={setSelectedPage}>
            <SelectTrigger>
              <SelectValue placeholder={pagesLoading ? "Loading pages..." : "Choose a page"} />
            </SelectTrigger>
            <SelectContent>
              {pages.map(page => (
                <SelectItem key={page.id} value={page.id}>
                  {page.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Layer Tree */}
        {!error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Layer Structure</h3>
              {pageData && (
                <Badge variant="secondary">
                  {pageData.childrenCount || 0} items
                </Badge>
              )}
            </div>
            
            <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pageData ? (
                renderLayerTree(pageData)
              ) : selectedPage ? (
                <p className="text-muted-foreground text-center py-8">
                  No layer data available
                </p>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a page to view its layers
                </p>
              )}
            </div>
          </div>
        )}

        {/* Layer Details */}
        {selectedLayer && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Layer Details</h3>
            
            <div className="grid gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{selectedLayer.name || 'Unnamed'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <Badge>{selectedLayer.type}</Badge>
              </div>
              
              {selectedLayer.absoluteBoundingBox && (
                <div>
                  <Label className="text-muted-foreground">Dimensions</Label>
                  <p className="font-mono text-sm">
                    {Math.round(selectedLayer.absoluteBoundingBox.width)} × {Math.round(selectedLayer.absoluteBoundingBox.height)}
                  </p>
                </div>
              )}
              
              {selectedLayer.visible !== undefined && (
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground">Visibility</Label>
                  {selectedLayer.visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {selectedLayer.fills?.some(f => f.type === 'IMAGE') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Image className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCode(!showCode)}
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Layer Preview</DialogTitle>
              <DialogDescription>
                {selectedLayer?.name || 'Layer'} - {selectedLayer?.type}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Preview generation requires exporting assets from Figma.
                  Use the CLI tool to generate React components from this layer.
                </AlertDescription>
              </Alert>
              
              <div className="rounded-lg border bg-muted/20 p-8 text-center">
                <p className="text-muted-foreground">
                  Run: <code className="font-mono bg-muted px-2 py-1 rounded">
                    pnpm figma:convert {selectedLayer?.id} {selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '')}
                  </code>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Code Dialog */}
        <Dialog open={showCode} onOpenChange={setShowCode}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Generated Code Preview</DialogTitle>
              <DialogDescription>
                React component code for {selectedLayer?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Code className="h-4 w-4" />
                <AlertDescription>
                  This is a preview of what the generated component would look like.
                  Use the CLI tool for actual generation.
                </AlertDescription>
              </Alert>
              
              <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
                <code className="text-sm">
{`import React from 'react'
import { cn } from '@/lib/utils'

interface ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}Props {
  className?: string
}

export function ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}({ className }: ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}Props) {
  return (
    <div className={cn("relative", className)}>
      {/* ${selectedLayer?.type}: ${selectedLayer?.name} */}
    </div>
  )
}`}
                </code>
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 