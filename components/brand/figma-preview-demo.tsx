'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Eye, Download, ExternalLink } from 'lucide-react'
import { BrandGuidePage } from '@/components/generated-from-figma/BrandGuidePage'
import { FIGMA_BRAND } from '@/lib/brand/figma-brand-system'

export function FigmaPreviewDemo() {
  const [selectedWidth, setSelectedWidth] = useState(1200)
  const [showCode, setShowCode] = useState(false)

  const componentCode = `import { BrandGuidePage } from '@/components/generated-from-figma/BrandGuidePage'
import { FIGMA_BRAND } from '@/lib/brand/figma-brand-system'

export default function MyPage() {
  return (
    <div style={{ background: FIGMA_BRAND.colors.gradients.gradient7 }}>
      <BrandGuidePage width={1200} />
    </div>
  )
}`

  const figmaUrl = "https://www.figma.com/file/PbzhWQIGJF68IPYo8Bheck/PatchlineAI-Branding?node-id=113%3A11"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Figma Page Preview
              </CardTitle>
              <CardDescription>
                Live preview of "PatchlineAI_Brand Guide_Simple" converted to React
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Generated</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(figmaUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View in Figma
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="brand">Brand System</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium">Width:</span>
                {[800, 1200, 1600].map(width => (
                  <Button
                    key={width}
                    variant={selectedWidth === width ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWidth(width)}
                  >
                    {width}px
                  </Button>
                ))}
              </div>

              <div className="border rounded-lg p-4 bg-muted/50 overflow-auto">
                <div className="flex justify-center">
                  <div 
                    style={{ 
                      background: FIGMA_BRAND.colors.gradients.gradient7,
                      padding: '20px',
                      borderRadius: '8px'
                    }}
                  >
                    <BrandGuidePage width={selectedWidth} />
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>✅ Generated from Figma layer: <code>PatchlineAI_Brand Guide_Simple</code></p>
                <p>✅ Responsive width: {selectedWidth}px</p>
                <p>✅ Using extracted brand gradients</p>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{componentCode}</code>
                </pre>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download Component
                </Button>
                <Button variant="outline" size="sm">
                  <Code className="w-4 h-4 mr-1" />
                  View Full Code
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="brand" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Gradients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(FIGMA_BRAND.colors.gradients).slice(0, 5).map(([name, gradient]) => (
                        <div key={name} className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ background: gradient }}
                          />
                          <div>
                            <p className="text-sm font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {gradient}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Typography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {FIGMA_BRAND.typography.fontFamilies.map(font => (
                        <div key={font} className="flex items-center gap-2">
                          <Badge variant="outline">{font}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 