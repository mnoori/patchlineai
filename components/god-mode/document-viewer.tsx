"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "lucide-react"
import { format } from "date-fns"

interface DocumentViewerProps {
  document: {
    id: string
    filename: string
    type: string
    status: string
    uploadDate: string
    extractedData: {
      amount?: number
      vendor?: string
      date?: string
      category?: string
      businessExpense?: boolean
      description?: string
    }
    tags: string[]
  }
  trigger?: React.ReactNode
}

export function DocumentViewer({ document, trigger }: DocumentViewerProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-3 w-3 mr-1" />
      View
    </Button>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cosmic-teal" />
            {document.filename}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Document Info */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="capitalize">{document.type.replace('_', ' ')}</p>
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Expense</label>
                  <Badge variant={document.extractedData.businessExpense ? 'default' : 'secondary'}>
                    {document.extractedData.businessExpense ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Data */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Extracted Information
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
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                    <p className="font-medium">{document.extractedData.vendor}</p>
                  </div>
                </div>
              )}
              
              {document.extractedData.date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p>{format(new Date(document.extractedData.date), 'PPP')}</p>
                  </div>
                </div>
              )}
              
              {document.extractedData.category && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p>{document.extractedData.category}</p>
                  </div>
                </div>
              )}
              
              {document.extractedData.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{document.extractedData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {document.tags.length > 0 && (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 