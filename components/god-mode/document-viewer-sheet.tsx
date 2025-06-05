"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  FileText,
  DollarSign,
  Calendar,
  Building,
  Tag,
  Download,
  Edit,
  Trash2,
  Eye,
  Brain,
  Table,
  FileCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DocumentViewerSheetProps {
  document: {
    id: string
    filename: string
    type: string
    documentType?: string
    status: string
    uploadDate: string
    s3Key?: string
    textractJobId?: string
    extractedData: {
      amount?: number
      vendor?: string
      date?: string
      category?: string
      businessExpense?: boolean
      description?: string
      rawText?: string
      tables?: any[]
      forms?: any[]
    }
    tags: string[]
  }
  trigger?: React.ReactNode
  onDelete?: (id: string) => void
}

export function DocumentViewerSheet({ document, trigger, onDelete }: DocumentViewerSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [textractData, setTextractData] = useState<any>(null)
  const [isLoadingTextract, setIsLoadingTextract] = useState(false)
  const [textractResults, setTextractResults] = useState<any>(null)
  const [textractError, setTextractError] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-3 w-3 mr-1" />
      View
    </Button>
  )

  // Fetch Textract results when document is opened
  useEffect(() => {
    console.log('DocumentViewer - useEffect check:', {
      isOpen,
      textractJobId: document.textractJobId,
      s3Key: document.s3Key,
      hasTextractData: !!textractData,
      isLoading: isLoadingTextract,
      documentStatus: document.status
    })
    
    if (isOpen && document.textractJobId && document.s3Key && !textractData && !isLoadingTextract) {
      fetchTextractResults()
    } else if (isOpen && document.s3Key && !textractData && !isLoadingTextract) {
      // If no textractJobId but we have s3Key, still try to fetch using documentId
      console.log('No textractJobId but attempting to fetch using document ID')
      fetchTextractResults()
    }
  }, [isOpen, document.textractJobId, document.s3Key, document.id])

  // Fetch AI insights when Textract data is available
  useEffect(() => {
    if (textractData && textractData.text && !aiInsights && !isLoadingInsights) {
      fetchAIInsights()
    }
  }, [textractData])

  const fetchTextractResults = async () => {
    console.log('Fetching Textract results for:', {
      jobId: document.textractJobId || 'using-document-id-as-fallback',
      s3Key: document.s3Key,
      filename: document.filename
    })
    
    if (!document.s3Key) {
      console.warn('Missing S3 key for Textract fetch')
      setTextractError('Missing S3 key')
      return
    }
    
    setIsLoadingTextract(true)
    setTextractError(null)
    
    try {
      // Use either textractJobId or documentId as fallback
      const jobIdParam = document.textractJobId || document.id
      const url = `/api/documents/textract-results?jobId=${jobIdParam}&s3Key=${encodeURIComponent(document.s3Key)}`
      console.log('Fetching from URL:', url)
      
      const response = await fetch(url)
      console.log('Textract API response:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Textract data received:', {
          hasText: !!data.text,
          textLength: data.text?.length || 0,
          tablesCount: data.tables?.length || 0,
          formsCount: data.forms?.length || 0,
          hasProcessingStats: !!data.processingStats,
          source: data.metadata?.source || 'unknown'
        })
        
        if (!data.text || data.text.length === 0) {
          // Document may still be processing
          if (document.status === 'processing') {
            setTextractError('Document is still being processed. Please check back in a few moments.')
            
            // Set a timer to retry in 5 seconds
            setTimeout(() => {
              if (isOpen) {
                console.log('Retrying Textract fetch after delay')
                fetchTextractResults()
              }
            }, 5000)
          } else {
            setTextractError('No text extracted from document')
          }
        } else {
          setTextractData(data)
          setTextractResults(data)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Textract API error:', response.status, errorData)
        setTextractError(`Failed to load Textract data: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching Textract results:', error)
      setTextractError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingTextract(false)
    }
  }

  const fetchAIInsights = async () => {
    if (!textractData || !textractData.text) return
    
    setIsLoadingInsights(true)
    console.log('Fetching AI insights for document')
    
    try {
      const response = await fetch('/api/documents/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: textractData.text,
          documentType: document.documentType || document.type,
          extractedData: document.extractedData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('AI insights received:', data.insights?.length || 0, 'characters')
        setAiInsights(data.insights)
      } else {
        console.error('Failed to fetch AI insights:', response.status)
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent 
        className="sm:max-w-3xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border/50"
      >
        {/* Glassmorphism background overlay */}
        <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
        
        <SheetHeader className="border-b border-cosmic-teal/20 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cosmic-teal" />
            {document.filename}
          </SheetTitle>
          <SheetDescription>
            {document.documentType || document.type} • {format(new Date(document.uploadDate), 'PPP')}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Document & AI Analysis</TabsTrigger>
              <TabsTrigger value="textract">Textract Data</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Document Info */}
              <Card className="glass-effect bg-cosmic-midnight/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Document Information
                    {getStatusIcon(document.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="capitalize">{document.documentType || document.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge variant={document.status === 'completed' ? 'default' : 'secondary'}>
                        {document.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                      <p>{format(new Date(document.uploadDate), 'PPP')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Extracted Data */}
              {document.extractedData && (document.extractedData.amount || document.extractedData.vendor) && (
                <Card className="glass-effect bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {document.extractedData.amount && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                        <span className="font-medium">Amount</span>
                        <span className="text-xl font-bold text-green-400">
                          ${document.extractedData.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {document.extractedData.vendor && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                          <p className="font-medium">{document.extractedData.vendor}</p>
                        </div>
                      </div>
                    )}
                    
                    {document.extractedData.date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-muted-foreground">Date</label>
                          <p>{format(new Date(document.extractedData.date), 'PPP')}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Analysis Section */}
              {isLoadingTextract ? (
                <Card className="glass-effect bg-cosmic-midnight/50">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-cosmic-teal animate-spin mb-4" />
                      <p className="text-muted-foreground">Loading AI analysis...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : textractData ? (
                <>
                  {/* AI Insights */}
                  {(aiInsights || isLoadingInsights) && (
                    <Card className="glass-effect bg-gradient-to-br from-cosmic-teal/10 to-cosmic-purple/10 border-cosmic-teal/20">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-5 w-5 text-cosmic-teal" />
                          AI Document Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingInsights ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-cosmic-teal" />
                            <span className="text-sm text-muted-foreground">Analyzing document with AI...</span>
                          </div>
                        ) : aiInsights ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div 
                              className="text-sm space-y-3"
                              dangerouslySetInnerHTML={{ 
                                __html: aiInsights
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cosmic-teal">$1</strong>')
                                  .replace(/##\s+(.*?)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-cosmic-teal">$1</h3>')
                                  .replace(/\n/g, '<br />')
                                  .replace(/\d+\.\s+/g, '<br />• ')
                              }}
                            />
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}

                  {/* Extracted Text Preview */}
                  {textractData.text && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-5 w-5 text-cosmic-teal" />
                          AI Extracted Text Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-background/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap line-clamp-6">{textractData.text.substring(0, 500)}...</pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-cosmic-teal" />
                          <div>
                            <p className="text-sm font-medium">Confidence</p>
                            <p className="text-lg font-bold">{textractData.confidence?.toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Table className="h-5 w-5 text-cosmic-teal" />
                          <div>
                            <p className="text-sm font-medium">Tables Found</p>
                            <p className="text-lg font-bold">{textractData.tables?.length || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-cosmic-teal" />
                          <div>
                            <p className="text-sm font-medium">Key-Value Pairs</p>
                            <p className="text-lg font-bold">{textractData.forms?.length || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card className="glass-effect bg-cosmic-midnight/50">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center">
                      <Brain className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No AI analysis available yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {document.status === 'processing' ? 'Processing in progress...' : 'Upload complete documents for analysis'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {document.tags.length > 0 && (
                <Card className="glass-effect bg-cosmic-midnight/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag, index) => (
                        <Badge key={`${document.id}-viewer-tag-${index}-${tag}`} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="extracted" className="space-y-6 mt-6">
              {isLoadingTextract ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-cosmic-teal animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading AI analysis...</p>
                </div>
              ) : textractData ? (
                <>
                  {/* Extracted Text */}
                  {textractData.text && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-5 w-5 text-cosmic-teal" />
                          Extracted Text
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {textractResults ? (
                            <>
                              {/* Processing Statistics */}
                              {textractResults.processingStats && (
                                <Card className="glass-effect bg-cosmic-midnight/50">
                                  <CardHeader>
                                    <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                                      <Activity className="h-4 w-4" />
                                      Processing Statistics
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Blocks:</span>
                                        <span className="font-mono">{textractResults.processingStats.totalBlocks}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Text Lines:</span>
                                        <span className="font-mono">{textractResults.processingStats.lineBlocks}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tables:</span>
                                        <span className="font-mono">{textractResults.processingStats.tableBlocks}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Key-Value Pairs:</span>
                                        <span className="font-mono">{textractResults.processingStats.keyValueBlocks}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Confidence Score */}
                                    <div className="pt-2 border-t border-border/20">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Average Confidence:</span>
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 bg-muted/30 rounded-full h-1">
                                            <div 
                                              className="h-1 bg-cosmic-teal rounded-full" 
                                              style={{ width: `${Math.min(textractResults.confidence, 100)}%` }}
                                            />
                                          </div>
                                          <span className="text-xs font-mono">
                                            {textractResults.confidence.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Extracted Text */}
                              {textractResults.text && (
                                <Card className="glass-effect bg-cosmic-midnight/50">
                                  <CardHeader>
                                    <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Extracted Text ({textractResults.text.length} characters)
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                                        {textractResults.text}
                                      </pre>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Tables */}
                              {textractResults.tables && textractResults.tables.length > 0 && (
                                <Card className="glass-effect bg-cosmic-midnight/50">
                                  <CardHeader>
                                    <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                                      <Table className="h-4 w-4" />
                                      Tables ({textractResults.tables.length})
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {textractResults.tables.map((table: any, tableIndex: number) => (
                                      <div key={`table-${tableIndex}`} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-medium">Table {tableIndex + 1}</h4>
                                          <span className="text-xs text-muted-foreground">
                                            Confidence: {table.confidence?.toFixed(1) || 'N/A'}%
                                          </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-xs border border-border/20">
                                            <tbody>
                                              {table.rows.map((row: any, rowIndex: number) => (
                                                <tr key={`row-${rowIndex}`} className="border-b border-border/10">
                                                  {row.cells.map((cell: any, cellIndex: number) => (
                                                    <td 
                                                      key={`cell-${cellIndex}`}
                                                      className="p-2 border-r border-border/10 last:border-r-0"
                                                    >
                                                      <div className="space-y-1">
                                                        <div className="text-muted-foreground">
                                                          {cell.text || '-'}
                                                        </div>
                                                        {cell.confidence && (
                                                          <div className="text-[10px] text-muted-foreground/60">
                                                            {cell.confidence.toFixed(1)}%
                                                          </div>
                                                        )}
                                                      </div>
                                                    </td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Key-Value Pairs (Forms) */}
                              {textractResults.forms && textractResults.forms.length > 0 && (
                                <Card className="glass-effect bg-cosmic-midnight/50">
                                  <CardHeader>
                                    <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Key-Value Pairs ({textractResults.forms.length})
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {textractResults.forms.map((form: any, formIndex: number) => (
                                        <div 
                                          key={`form-${formIndex}`}
                                          className="flex items-start justify-between p-3 rounded-lg bg-black/20 border border-border/10"
                                        >
                                          <div className="flex-1 space-y-1">
                                            <div className="text-xs font-medium text-cosmic-teal">
                                              {form.key}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {form.value || '-'}
                                            </div>
                                          </div>
                                          {form.confidence && (
                                            <div className="text-[10px] text-muted-foreground/60 ml-2">
                                              {form.confidence.toFixed(1)}%
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Metadata */}
                              {textractResults.metadata && (
                                <Card className="glass-effect bg-cosmic-midnight/50">
                                  <CardHeader>
                                    <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                                      <Settings className="h-4 w-4" />
                                      Processing Metadata
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">S3 Path:</span>
                                        <span className="font-mono text-[10px] break-all ml-2">
                                          {textractResults.metadata.s3Path}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bucket:</span>
                                        <span className="font-mono">{textractResults.metadata.bucket}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Processed:</span>
                                        <span className="font-mono">
                                          {new Date(textractResults.metadata.processingDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </>
                          ) : (
                            <Card className="glass-effect bg-cosmic-midnight/50">
                              <CardContent className="p-8">
                                <div className="flex flex-col items-center justify-center">
                                  <Brain className="h-8 w-8 text-muted-foreground mb-4" />
                                  <p className="text-muted-foreground">No AI analysis available yet</p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {document.status === 'processing' ? 'Processing in progress...' : 'Upload complete documents for analysis'}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No AI analysis available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {document.status === 'processing' ? 'Processing in progress...' : 'Upload complete documents for analysis'}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Raw Data Tab */}
            <TabsContent value="raw" className="space-y-6 mt-6">
              <Card className="glass-effect bg-cosmic-midnight/50">
                <CardHeader>
                  <CardTitle className="text-base">Raw Document Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-background/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(document, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Textract Data Tab */}
            <TabsContent value="textract" className="space-y-6 mt-6">
              {isLoadingTextract ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-cosmic-teal" />
                  <p className="text-sm text-muted-foreground">Loading Textract data...</p>
                </div>
              ) : textractResults ? (
                <div className="space-y-6">
                  {/* Processing Statistics */}
                  {textractResults.processingStats && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Processing Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Blocks:</span>
                            <span className="font-mono">{textractResults.processingStats.totalBlocks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Text Lines:</span>
                            <span className="font-mono">{textractResults.processingStats.lineBlocks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tables:</span>
                            <span className="font-mono">{textractResults.processingStats.tableBlocks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Key-Value Pairs:</span>
                            <span className="font-mono">{textractResults.processingStats.keyValueBlocks}</span>
                          </div>
                        </div>
                        
                        {/* Confidence Score */}
                        <div className="pt-2 border-t border-border/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Average Confidence:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted/30 rounded-full h-1">
                                <div 
                                  className="h-1 bg-cosmic-teal rounded-full" 
                                  style={{ width: `${Math.min(textractResults.confidence, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono">
                                {textractResults.confidence.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Extracted Text */}
                  {textractResults.text && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Extracted Text ({textractResults.text.length} characters)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                            {textractResults.text}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tables */}
                  {textractResults.tables && textractResults.tables.length > 0 && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          Tables ({textractResults.tables.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {textractResults.tables.map((table: any, tableIndex: number) => (
                          <div key={`table-${tableIndex}`} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium">Table {tableIndex + 1}</h4>
                              <span className="text-xs text-muted-foreground">
                                Confidence: {table.confidence?.toFixed(1) || 'N/A'}%
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border border-border/20">
                                <tbody>
                                  {table.rows.map((row: any, rowIndex: number) => (
                                    <tr key={`row-${rowIndex}`} className="border-b border-border/10">
                                      {row.cells.map((cell: any, cellIndex: number) => (
                                        <td 
                                          key={`cell-${cellIndex}`}
                                          className="p-2 border-r border-border/10 last:border-r-0"
                                        >
                                          <div className="space-y-1">
                                            <div className="text-muted-foreground">
                                              {cell.text || '-'}
                                            </div>
                                            {cell.confidence && (
                                              <div className="text-[10px] text-muted-foreground/60">
                                                {cell.confidence.toFixed(1)}%
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Key-Value Pairs (Forms) */}
                  {textractResults.forms && textractResults.forms.length > 0 && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Key-Value Pairs ({textractResults.forms.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {textractResults.forms.map((form: any, formIndex: number) => (
                            <div 
                              key={`form-${formIndex}`}
                              className="flex items-start justify-between p-3 rounded-lg bg-black/20 border border-border/10"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="text-xs font-medium text-cosmic-teal">
                                  {form.key}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {form.value || '-'}
                                </div>
                              </div>
                              {form.confidence && (
                                <div className="text-[10px] text-muted-foreground/60 ml-2">
                                  {form.confidence.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata */}
                  {textractResults.metadata && (
                    <Card className="glass-effect bg-cosmic-midnight/50">
                      <CardHeader>
                        <CardTitle className="text-cosmic-teal text-sm flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Processing Metadata
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">S3 Path:</span>
                            <span className="font-mono text-[10px] break-all ml-2">
                              {textractResults.metadata.s3Path}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bucket:</span>
                            <span className="font-mono">{textractResults.metadata.bucket}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Processed:</span>
                            <span className="font-mono">
                              {new Date(textractResults.metadata.processingDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : textractError ? (
                <Card className="glass-effect bg-red-900/20 border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Error loading Textract data</span>
                    </div>
                    <p className="text-xs text-red-300/80 mt-2">{textractError}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No Textract data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Document processing may still be in progress
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 mt-6 pt-6 border-t">
            <Button variant="outline" className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {onDelete && (
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete(document.id)
                  setIsOpen(false)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 