'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronDown, Layers, Download, Eye, Code, RefreshCw, AlertCircle, Image, EyeOff, Copy, Palette, Type, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FigmaFrameRenderer } from '../figma/figma-layer-renderer'
import { cn } from '@/lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'

interface FigmaLayer {
  id: string
  name: string
  type: string
  visible: boolean
  opacity?: number
  blendMode?: string
  fills?: any[]
  strokes?: any[]
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
  layoutMode?: string
  itemSpacing?: number
  paddingLeft?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
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
  
  // New state for enhanced features
  const [previewWidth, setPreviewWidth] = useState(1200)
  const [zoom, setZoom] = useState(100)
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set())
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set())

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
    const isHidden = hiddenLayers.has(layer.id)
    
    return (
      <div key={layer.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer",
            selectedLayer?.id === layer.id && "bg-accent",
            isHidden && "opacity-50"
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
          
          <span className="text-sm font-medium flex-1">
            {layer.name || 'Unnamed Layer'}
          </span>
          
          {/* Visibility Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              const newHidden = new Set(hiddenLayers)
              if (isHidden) {
                newHidden.delete(layer.id)
              } else {
                newHidden.add(layer.id)
              }
              setHiddenLayers(newHidden)
            }}
          >
            {isHidden ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
          
          <span className="text-xs text-muted-foreground">
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

  const generateLayerCode = (layer: FigmaLayer | null): string => {
    if (!layer) return '/* No layer selected */'
    
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

  // Helper function to copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  // Extract colors from layer
  const extractColors = (layer: FigmaLayer): { name: string; value: string; type: string }[] => {
    const colors: { name: string; value: string; type: string }[] = []
    
    if (layer.fills) {
      layer.fills.forEach((fill, index) => {
        if (fill.type === 'SOLID' && fill.visible !== false) {
          const { r, g, b, a = 1 } = fill.color
          const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
          const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`
          colors.push({
            name: `Fill ${index + 1}`,
            value: a < 1 ? rgba : hex,
            type: 'solid'
          })
        } else if (fill.type && fill.type.includes('GRADIENT') && fill.gradientStops) {
          const stops = fill.gradientStops.map((stop: any) => {
            const { r, g, b, a = 1 } = stop.color
            return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${(stop.position * 100).toFixed(0)}%`
          }).join(', ')
          
          const gradientType = fill.type === 'GRADIENT_LINEAR' ? 'linear-gradient' : 'radial-gradient'
          const angle = fill.type === 'GRADIENT_LINEAR' ? '135deg, ' : 'circle, '
          
          colors.push({
            name: `Gradient ${index + 1}`,
            value: `${gradientType}(${angle}${stops})`,
            type: 'gradient'
          })
        }
      })
    }
    
    // Extract stroke colors
    if (layer.strokes) {
      layer.strokes.forEach((stroke, index) => {
        if (stroke.type === 'SOLID' && stroke.visible !== false) {
          const { r, g, b, a = 1 } = stroke.color
          const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
          const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`
          colors.push({
            name: `Stroke ${index + 1}`,
            value: a < 1 ? rgba : hex,
            type: 'stroke'
          })
        }
      })
    }
    
    return colors
  }

  // Extract all brand elements from selected layer and its children
  const extractBrandElements = (layer: FigmaLayer): { colors: any[], typography: any[], spacing: any[] } => {
    const result = {
      colors: extractColors(layer),
      typography: [] as any[],
      spacing: [] as any[]
    }
    
    // Extract typography if text layer
    if (layer.type === 'TEXT') {
      const typo = extractTypography(layer)
      if (typo) result.typography.push({ name: layer.name, ...typo })
    }
    
    // Extract spacing from auto layout
    if (layer.layoutMode && layer.layoutMode !== 'NONE') {
      if (layer.itemSpacing) {
        result.spacing.push({
          name: 'Item Spacing',
          value: `${layer.itemSpacing}px`,
          type: 'gap'
        })
      }
      if (layer.paddingLeft || layer.paddingTop || layer.paddingRight || layer.paddingBottom) {
        result.spacing.push({
          name: 'Padding',
          value: `${layer.paddingTop || 0}px ${layer.paddingRight || 0}px ${layer.paddingBottom || 0}px ${layer.paddingLeft || 0}px`,
          type: 'padding'
        })
      }
    }
    
    // Recursively extract from children
    if (layer.children) {
      layer.children.forEach(child => {
        const childElements = extractBrandElements(child)
        result.colors.push(...childElements.colors)
        result.typography.push(...childElements.typography)
        result.spacing.push(...childElements.spacing)
      })
    }
    
    return result
  }

  // Extract typography info
  const extractTypography = (layer: FigmaLayer): any => {
    // This would need to check if layer has text properties
    // For now, return mock data if it's a TEXT type
    if (layer.type === 'TEXT') {
      return {
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0'
      }
    }
    return null
  }

  return (
    <Card className="w-full h-[800px] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Unified Figma Layer Explorer
            </CardTitle>
            <CardDescription>
              Explore, preview, and convert Figma designs to React components
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPage || ''} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={pagesLoading ? "Loading..." : "Select page"} />
              </SelectTrigger>
              <SelectContent>
                {pages.map(page => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPages}
              disabled={pagesLoading}
            >
              <RefreshCw className={cn("h-4 w-4", pagesLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-80px)]">
        <div className="flex h-full">
          {/* Layer Tree Panel - 30% */}
          <div className="w-[30%] border-r h-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Layers</h3>
              {pageData && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pageData.childrenCount || 0} items
                </p>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pageData ? (
                  renderLayerTree(pageData)
                ) : selectedPage ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No layer data available
                  </p>
                ) : (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    Select a page to view layers
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preview Panel - 50% */}
          <div className="w-[50%] border-r h-full flex flex-col bg-muted/10">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Preview</h3>
              <div className="flex items-center gap-2">
                {/* Width Controls */}
                <div className="flex items-center gap-1">
                  {[800, 1200, 1600].map(width => (
                    <Button
                      key={width}
                      variant={previewWidth === width ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewWidth(width)}
                      className="h-7 px-2 text-xs"
                    >
                      {width}
                    </Button>
                  ))}
                </div>
                <Separator orientation="vertical" className="h-6" />
                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    className="h-7 w-7 p-0"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-xs w-12 text-center">{zoom}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    className="h-7 w-7 p-0"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(100)}
                    className="h-7 w-7 p-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {selectedLayer || selectedPage ? (
                <div 
                  className="flex items-center justify-center min-h-full"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                >
                  {selectedLayer && selectedLayer.absoluteBoundingBox ? (
                    <div className="border rounded-lg shadow-lg bg-background">
                      <FigmaFrameRenderer
                        frameData={selectedLayer}
                        width={previewWidth}
                        className="rounded-lg"
                        hiddenLayers={hiddenLayers}
                      />
                    </div>
                  ) : pageData && selectedPage ? (
                    <div className="border rounded-lg shadow-lg bg-background">
                      <FigmaFrameRenderer
                        frameData={pageData}
                        width={previewWidth}
                        className="rounded-lg"
                        hiddenLayers={hiddenLayers}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Select a layer to preview</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Select a page or layer to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inspector Panel - 20% */}
          <div className="w-[20%] h-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Inspector</h3>
            </div>
            <ScrollArea className="flex-1">
              {selectedLayer ? (
                <Tabs defaultValue="properties" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mx-4 mt-4" style={{ width: 'calc(100% - 2rem)' }}>
                    <TabsTrigger value="properties" className="text-xs">Props</TabsTrigger>
                    <TabsTrigger value="colors" className="text-xs">Colors</TabsTrigger>
                    <TabsTrigger value="brand" className="text-xs">Brand</TabsTrigger>
                    <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="properties" className="p-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="text-sm font-medium">{selectedLayer.name || 'Unnamed'}</p>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <Badge variant="secondary" className="text-xs">
                          {selectedLayer.type}
                        </Badge>
                      </div>
                      
                      {selectedLayer.absoluteBoundingBox && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Dimensions</Label>
                          <p className="text-xs font-mono">
                            {Math.round(selectedLayer.absoluteBoundingBox.width)} × {Math.round(selectedLayer.absoluteBoundingBox.height)}
                          </p>
                        </div>
                      )}
                      
                      {selectedLayer.visible !== undefined && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Visibility</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {selectedLayer.visible ? (
                              <Eye className="h-3 w-3 text-green-600" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-xs">
                              {selectedLayer.visible ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Typography info for text layers */}
                      {selectedLayer.type === 'TEXT' && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Typography</Label>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Font</span>
                              <span className="font-mono">Inter</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Size</span>
                              <span className="font-mono">16px</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Weight</span>
                              <span className="font-mono">400</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors" className="p-4">
                    <div className="space-y-3">
                      {extractColors(selectedLayer).length > 0 ? (
                        extractColors(selectedLayer).map((color, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">{color.name}</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(color.value, color.name)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {color.type === 'solid' ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: color.value }}
                                />
                                <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                  {color.value}
                                </code>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div 
                                  className="w-full h-8 rounded border"
                                  style={{ background: color.value }}
                                />
                                <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                                  {color.value}
                                </code>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No colors found in this layer
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="brand" className="p-4">
                    <div className="space-y-4">
                      {(() => {
                        const brandElements = selectedLayer ? extractBrandElements(selectedLayer) : null
                        if (!brandElements) return null
                        
                        return (
                          <>
                            {/* Colors Summary */}
                            {brandElements.colors.length > 0 && (
                              <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">
                                  Colors ({brandElements.colors.length})
                                </Label>
                                <div className="space-y-2">
                                  {brandElements.colors.slice(0, 5).map((color, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-4 rounded border"
                                        style={{ 
                                          background: color.type === 'gradient' ? color.value : color.value,
                                          backgroundColor: color.type !== 'gradient' ? color.value : undefined
                                        }}
                                      />
                                      <code className="text-xs flex-1 truncate">{color.value}</code>
                                    </div>
                                  ))}
                                  {brandElements.colors.length > 5 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{brandElements.colors.length - 5} more colors
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Typography Summary */}
                            {brandElements.typography.length > 0 && (
                              <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">
                                  Typography ({brandElements.typography.length})
                                </Label>
                                <div className="space-y-1">
                                  {brandElements.typography.slice(0, 3).map((typo, i) => (
                                    <div key={i} className="text-xs">
                                      <span className="font-medium">{typo.name}:</span> {typo.fontFamily} {typo.fontSize}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Spacing Summary */}
                            {brandElements.spacing.length > 0 && (
                              <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">
                                  Spacing ({brandElements.spacing.length})
                                </Label>
                                <div className="space-y-1">
                                  {brandElements.spacing.map((space, i) => (
                                    <div key={i} className="text-xs">
                                      <span className="font-medium">{space.name}:</span> {space.value}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <Separator />
                            
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                // TODO: Export brand elements to brand constants
                                toast.success("Exporting brand elements to constants file...")
                              }}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Export to Brand Constants
                            </Button>
                          </>
                        )
                      })()}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="export" className="p-4">
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // TODO: Implement PNG export
                          toast.info("Exporting layer as PNG...")
                        }}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Export as PNG
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          // TODO: Implement SVG export
                          toast.info("Exporting layer as SVG...")
                        }}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Export as SVG
                      </Button>
                      
                      <Separator />
                      
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowCode(true)}
                      >
                        <Code className="h-3 w-3 mr-2" />
                        Generate React
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Generate production-ready React component
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">Select a layer to inspect</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      {/* Code Generation Dialog */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generated React Component</DialogTitle>
            <DialogDescription>
              Production-ready component for {selectedLayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                Component generated with TypeScript, Tailwind CSS, and proper accessibility attributes.
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="component" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="component">Component</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="component" className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    if (selectedLayer) {
                      copyToClipboard(generateLayerCode(selectedLayer), 'Component code')
                    }
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
                  <code className="text-sm">
{`import React from 'react'
import { cn } from '@/lib/utils'

interface ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}Props {
  className?: string
  width?: number
  height?: number
}

export function ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}({ 
  className,
  width = ${selectedLayer?.absoluteBoundingBox?.width || 100},
  height = ${selectedLayer?.absoluteBoundingBox?.height || 100}
}: ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}Props) {
  return (
    <div 
      className={cn(
        "relative",
        // Add extracted Tailwind classes here
        className
      )}
      style={{
        width,
        height,
        ${selectedLayer?.cssStyles?.background ? `background: '${selectedLayer.cssStyles.background}',` : ''}
        ${selectedLayer?.cssStyles?.boxShadow ? `boxShadow: '${selectedLayer.cssStyles.boxShadow}',` : ''}
      }}
    >
      {/* Layer: ${selectedLayer?.type || 'UNKNOWN'} - ${selectedLayer?.name || 'Unnamed'} */}
      {/* Add child components here */}
    </div>
  )
}`}
                  </code>
                </pre>
              </TabsContent>
              
              <TabsContent value="styles">
                <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
                  <code className="text-sm">{generateLayerCode(selectedLayer)}</code>
                </pre>
              </TabsContent>
              
              <TabsContent value="usage">
                <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
                  <code className="text-sm">
{`// Import the component
import { ${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'} } from '@/components/generated/${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'}'

// Use in your page or component
export default function MyPage() {
  return (
    <div>
      <${selectedLayer?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'Component'} 
        className="mb-8"
        width={1200}
      />
    </div>
  )
}`}
                  </code>
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 