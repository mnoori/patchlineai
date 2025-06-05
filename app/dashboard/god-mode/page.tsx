"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Upload,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  BarChart3,
  PieChart,
  Receipt,
  CreditCard,
  Building,
  Tag,
  FolderOpen,
  X,
  Plus,
  ArrowUpRight,
  FileCheck,
  Brain,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { DocumentViewerSheet } from "../../../components/god-mode/document-viewer-sheet"
import { GodModeFeatureSelector, type GodModeFeature } from "../../../components/god-mode/feature-selector"
import { HRRecruiterDashboard } from "../../../components/god-mode/hr/dashboard"
import { NewsletterGeneratorDashboard } from "../../../components/god-mode/newsletter/dashboard"

// Types
interface DocumentFile {
  id: string
  file: File
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  type?: string
  documentType?: string
  extractedData?: any
  error?: string
  fileHash: string
}

interface ProcessedDocument {
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

// Document type configuration
const DOCUMENT_TYPES = {
  'tax': {
    label: 'Tax Documents',
    folder: 'tax-documents',
    subtypes: ['W2', '1099', 'K1', 'Schedule C', 'Tax Return']
  },
  'business-expense': {
    label: 'Business Expenses',
    folder: 'business-expenses',
    subtypes: ['Receipt', 'Invoice', 'Bill', 'Statement']
  },
  'banking': {
    label: 'Banking & Financial',
    folder: 'banking',
    subtypes: ['Bank Statement', 'Credit Card Statement', 'Loan Document']
  },
  'legal': {
    label: 'Legal Documents',
    folder: 'legal',
    subtypes: ['Contract', 'Agreement', 'License', 'Permit']
  },
  'personal': {
    label: 'Personal Documents',
    folder: 'personal',
    subtypes: ['ID', 'Insurance', 'Medical', 'Other']
  }
}

// Mock data for demonstration
const mockDocuments: ProcessedDocument[] = [
  {
    id: "doc-1",
    filename: "aws_invoice_dec_2024.pdf",
    type: "invoice",
    status: "completed",
    uploadDate: "2024-12-15",
    extractedData: {
      amount: 2847.32,
      vendor: "Amazon Web Services",
      date: "2024-12-01",
      category: "Cloud Infrastructure",
      businessExpense: true,
      description: "AWS hosting and compute services"
    },
    tags: ["business", "patchline-ai", "infrastructure"]
  },
  {
    id: "doc-2",
    filename: "bank_statement_nov_2024.pdf",
    type: "bank_statement",
    status: "completed",
    uploadDate: "2024-11-30",
    extractedData: {
      amount: 15420.50,
      vendor: "Chase Bank",
      date: "2024-11-30",
      category: "Banking",
      businessExpense: false,
      description: "Monthly bank statement"
    },
    tags: ["banking", "personal"]
  },
  {
    id: "doc-3",
    filename: "office_supplies_receipt.jpg",
    type: "receipt",
    status: "completed",
    uploadDate: "2024-12-10",
    extractedData: {
      amount: 127.89,
      vendor: "Staples",
      date: "2024-12-10",
      category: "Office Supplies",
      businessExpense: true,
      description: "Printer paper, pens, notebooks"
    },
    tags: ["business", "art-tech-lab", "supplies"]
  }
]

export default function GodModePage() {
  const [selectedFeature, setSelectedFeature] = useState<GodModeFeature | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadedFiles, setUploadedFiles] = useState<DocumentFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("")
  const [showUploadConfig, setShowUploadConfig] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateFile, setDuplicateFile] = useState<{ file: File; hash: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents from API on component mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/documents?userId=default-user')
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded documents from API:', data.documents?.length || 0)
        
        // Debug: Log first document structure
        if (data.documents && data.documents.length > 0) {
          console.log('First document structure:', {
            id: data.documents[0].id,
            filename: data.documents[0].filename,
            status: data.documents[0].status,
            hasTextractJobId: !!data.documents[0].textractJobId,
            hasS3Key: !!data.documents[0].s3Key,
            textractJobId: data.documents[0].textractJobId,
            s3Key: data.documents[0].s3Key
          })
        }
        
        // Ensure each document has a unique key
        const processedDocs = data.documents?.map((doc: any) => ({
          ...doc,
          // Generate a unique ID if none exists
          id: doc.id || doc.documentId || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        })) || []
        setDocuments(processedDocs)
      } else {
        console.error('Failed to load documents')
        // Keep using mock data if API fails
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      // Keep using mock data if API fails
    } finally {
      setIsLoading(false)
    }
  }

  // Drag and drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    // Store files temporarily and show configuration dialog
    setPendingFiles(files)
    setShowUploadConfig(true)
  }, [])

  const handleFileUpload = async (files: File[]) => {
    // If no document type selected, show config dialog
    if (!selectedDocumentType) {
      setPendingFiles(files)
      setShowUploadConfig(true)
      return
    }

    const newFiles: DocumentFile[] = []
    
    // Check for duplicates before processing
    for (const file of files) {
      const fileHash = await calculateFileHash(file)
      const isDuplicate = await checkForDuplicate(fileHash, file.name)
      
      if (isDuplicate) {
        setDuplicateFile({ file, hash: fileHash })
        setDuplicateDialogOpen(true)
        return
      }
      
      newFiles.push({
        id: `file-${Date.now()}-${Math.random()}`,
        file,
        status: 'uploading',
        progress: 0,
        type: detectDocumentType(file.name),
        documentType: selectedDocumentType,
        fileHash
      })
    }

    if (newFiles.length === 0) {
      return // No new files to upload
    }

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (const fileObj of newFiles) {
      try {
        // Generate organized S3 path based on document type
        const documentTypeConfig = DOCUMENT_TYPES[selectedDocumentType as keyof typeof DOCUMENT_TYPES]
        const folderPath = `${documentTypeConfig.folder}/${new Date().getFullYear()}`
        
        // Step 1: Get S3 upload URL with organized path
        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: fileObj.file.name,
            userId: 'default-user',
            contentType: fileObj.file.type,
            folderPath: folderPath,
            documentType: selectedDocumentType,
          })
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL')
        }

        const uploadData = await uploadResponse.json()
        
        // Update progress to 25% after getting upload URL
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress: 25 } : f
        ))

        // Step 2: Upload file directly to S3
        await uploadFileToS3(fileObj, uploadData)

        // Step 3: Trigger document processing
        await processDocument(fileObj, uploadData)

        // Step 4: Create document record with metadata
        const documentResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: fileObj.file.name,
            userId: 'default-user',
            type: fileObj.type,
            documentType: selectedDocumentType,
            s3Key: uploadData.s3Key,
            documentId: uploadData.documentId,
            fileHash: fileObj.fileHash,
            textractJobId: uploadData.textractJobId,
            status: 'processing',
            tags: generateTags(selectedDocumentType, fileObj.file.name)
          })
        })

        if (documentResponse.ok) {
          // Update file status to completed
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'completed', progress: 100 } : f
          ))

          // Reload documents to show the new one
          await loadDocuments()
        } else {
          throw new Error('Failed to create document record')
        }

      } catch (error) {
        console.error('Error processing file:', error)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : f
        ))
      }
    }

    // Reset selections after successful upload
    setSelectedDocumentType("")
  }

  const uploadFileToS3 = async (fileObj: DocumentFile, uploadData: any) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = 25 + (event.loaded / event.total) * 50 // 25% to 75%
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress } : f
          ))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Upload completed, move to processing
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'processing', progress: 80 } : f
          ))
          resolve()
        } else {
          reject(new Error(`S3 upload failed: Status ${xhr.status} - ${xhr.statusText || 'Unknown error'}`))
        }
      }

      xhr.onerror = () => {
        console.error('S3 upload network error')
        reject(new Error('S3 upload failed: Network error'))
      }

      xhr.ontimeout = () => {
        console.error('S3 upload timed out')
        reject(new Error('S3 upload failed: Request timed out'))
      }

      // Upload to S3 using presigned URL
      xhr.open('PUT', uploadData.uploadUrl)
      xhr.setRequestHeader('Content-Type', fileObj.file.type)
      xhr.send(fileObj.file)
    })
  }

  const processDocument = async (fileObj: DocumentFile, uploadData: any) => {
    // Trigger document processing (Textract)
    try {
      const processingResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: uploadData.documentId,
          s3Key: uploadData.s3Key,
          bucket: uploadData.bucket,
          filename: fileObj.file.name
        })
      })

      if (!processingResponse.ok) {
        console.warn('Document processing failed, will proceed without extraction')
      }

      // Update progress to 90%
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, progress: 90 } : f
      ))

    } catch (error) {
      console.warn('Document processing error:', error)
      // Continue without processing - document will be stored but not processed
    }
  }

  const detectDocumentType = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.includes('invoice')) return 'invoice'
    if (lower.includes('receipt')) return 'receipt'
    if (lower.includes('bank') || lower.includes('statement')) return 'bank_statement'
    if (lower.includes('tax')) return 'tax_document'
    if (lower.includes('bill')) return 'utility_bill'
    return 'general'
  }

  const generateTags = (documentType: string, filename: string): string[] => {
    const tags = new Set<string>() // Use Set to ensure uniqueness
    
    // Add document type tag
    tags.add(documentType)
    
    // Add year tag
    tags.add(new Date().getFullYear().toString())
    
    // Add additional tags based on filename and content
    const lower = filename.toLowerCase()
    
    // Add file type based on extension
    const extension = filename.split('.').pop()?.toLowerCase()
    if (extension) {
      tags.add(extension)
    }
    
    // Add context-based tags
    if (lower.includes('large') || parseFloat(lower.match(/\d+\.?\d*/)?.[0] || '0') > 1000) {
      tags.add('large-expense')
    }
    
    if (lower.includes('business') || lower.includes('company')) {
      tags.add('business')
    }
    
    if (lower.includes('personal') || lower.includes('individual')) {
      tags.add('personal')
    }
    
    return Array.from(tags) // Convert Set back to array
  }

  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const checkForDuplicate = async (fileHash: string, filename: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/documents/check-duplicate?fileHash=${fileHash}&filename=${encodeURIComponent(filename)}`)
      if (response.ok) {
        const data = await response.json()
        return data.isDuplicate
      }
      return false
    } catch (error) {
      console.error('Error checking for duplicate:', error)
      return false
    }
  }

  // Function to delete a document
  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        // Remove document from state and refresh the list
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        // Show success message
        alert('Document deleted successfully')
      } else {
        throw new Error('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  // Function to handle duplicate reprocessing
  const handleDuplicateReprocess = async (shouldReprocess: boolean) => {
    setDuplicateDialogOpen(false)
    
    if (!duplicateFile || !selectedDocumentType) {
      setDuplicateFile(null)
      return
    }

    if (shouldReprocess) {
      // Delete existing document first
      try {
        const existingDoc = documents.find(doc => doc.filename === duplicateFile.file.name)
        if (existingDoc) {
          await deleteDocument(existingDoc.id)
        }
        
        // Process the new file
        await processNewFile(duplicateFile.file, duplicateFile.hash)
      } catch (error) {
        console.error('Error reprocessing duplicate:', error)
      }
    }
    
    setDuplicateFile(null)
  }

  const processNewFile = async (file: File, fileHash: string) => {
    const newFile: DocumentFile = {
      id: `file-${Date.now()}-${Math.random()}`,
      file,
      status: 'uploading',
      progress: 0,
      type: detectDocumentType(file.name),
      documentType: selectedDocumentType,
      fileHash
    }

    setUploadedFiles(prev => [...prev, newFile])

    try {
      // Generate organized S3 path based on document type
      const documentTypeConfig = DOCUMENT_TYPES[selectedDocumentType as keyof typeof DOCUMENT_TYPES]
      const folderPath = `${documentTypeConfig.folder}/${new Date().getFullYear()}`
      
      // Step 1: Get S3 upload URL with organized path
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          userId: 'default-user',
          contentType: file.type,
          folderPath: folderPath,
          documentType: selectedDocumentType
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const uploadData = await uploadResponse.json()
      
      // Update progress to 25% after getting upload URL
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, progress: 25 } : f
      ))

      // Step 2: Upload file directly to S3
      await uploadFileToS3(newFile, uploadData)

      // Step 3: Trigger document processing
      await processDocument(newFile, uploadData)

      // Step 4: Create document record with metadata
      const documentResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          userId: 'default-user',
          type: newFile.type,
          documentType: selectedDocumentType,
          s3Key: uploadData.s3Key,
          documentId: uploadData.documentId,
          fileHash: fileHash,
          textractJobId: uploadData.textractJobId,
          status: 'processing',
          tags: generateTags(selectedDocumentType, file.name)
        })
      })

      if (documentResponse.ok) {
        // Update file status to completed
        setUploadedFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'completed', progress: 100 } : f
        ))

        // Reload documents to show the new one
        await loadDocuments()
      } else {
        throw new Error('Failed to create document record')
      }

    } catch (error) {
      console.error('Error processing file:', error)
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : f
      ))
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.extractedData.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.extractedData.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "business" && doc.extractedData.businessExpense) ||
                           (selectedCategory === "personal" && !doc.extractedData.businessExpense) ||
                           doc.type === selectedCategory

    return matchesSearch && matchesCategory
  })

  const businessExpenses = documents.filter(doc => doc.extractedData.businessExpense)
  const totalBusinessExpenses = businessExpenses.reduce((sum, doc) => sum + (doc.extractedData.amount || 0), 0)
  const patchlineExpenses = businessExpenses.filter(doc => doc.tags.includes('patchline-ai'))
  const artLabExpenses = businessExpenses.filter(doc => doc.tags.includes('art-tech-lab'))

  const handleFeatureChange = (feature: GodModeFeature) => {
    setSelectedFeature(feature)
    // Reset any feature-specific states when switching
    setActiveTab("upload")
    setUploadedFiles([])
    setPendingFiles([])
  }

  const handleBackToFeatures = () => {
    setSelectedFeature(null)
  }

  return (
    <div className="space-y-8 container mx-auto px-4 min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="flex items-center justify-between pt-4 sticky top-0 z-20 bg-background pb-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {selectedFeature && (
            <Button variant="outline" onClick={handleBackToFeatures} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Features
            </Button>
          )}

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {!selectedFeature ? "God Mode" : 
               selectedFeature === "documents" ? "Document Processing" :
               selectedFeature === "hr-recruiter" ? "AI HR Recruiter" :
               "Newsletter Generator"}
            </h1>
            <p className="text-muted-foreground">
              {!selectedFeature ? "Advanced AI-powered features for power users" :
               selectedFeature === "documents" ? "Process and analyze business documents with AI" :
               selectedFeature === "hr-recruiter" ? "Find the perfect candidates with AI-powered analysis" :
               "Create engaging newsletters with AI content generation"}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Selection */}
      {!selectedFeature && (
        <GodModeFeatureSelector
          selectedFeature={null}
          onFeatureChange={handleFeatureChange}
        />
      )}

      {selectedFeature === "documents" && (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload & Process</TabsTrigger>
              <TabsTrigger value="documents">Document Library</TabsTrigger>
              <TabsTrigger value="insights">Business Insights</TabsTrigger>
              <TabsTrigger value="tax-prep">Tax Preparation</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              {/* Upload Configuration Dialog */}
              <Sheet open={showUploadConfig} onOpenChange={setShowUploadConfig}>
                <SheetContent className="sm:w-[500px] bg-background/95 backdrop-blur-xl">
                  <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
                  
                  <SheetHeader className="border-b border-cosmic-teal/20 pb-4">
                    <SheetTitle className="text-cosmic-teal">Configure Document Upload</SheetTitle>
                    <SheetDescription>
                      {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} ready to upload. Please categorize them for better organization.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Document Type Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                        <SelectTrigger id="document-type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preview of where files will be stored */}
                    {selectedDocumentType && (
                      <Card className="glass-effect bg-cosmic-midnight/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FolderOpen className="h-4 w-4 text-cosmic-teal" />
                            <span className="text-muted-foreground">Files will be organized in:</span>
                          </div>
                          <p className="text-sm font-mono mt-2 text-cosmic-teal">
                            /{DOCUMENT_TYPES[selectedDocumentType as keyof typeof DOCUMENT_TYPES]?.folder}/{new Date().getFullYear()}/
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* File List */}
                    <div className="space-y-2">
                      <Label>Files to Upload</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {pendingFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowUploadConfig(false)
                          setPendingFiles([])
                          setSelectedDocumentType("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                        disabled={!selectedDocumentType}
                        onClick={() => {
                          setShowUploadConfig(false)
                          handleFileUpload(pendingFiles)
                          setPendingFiles([])
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Apple-Style Duplicate Confirmation Dialog */}
              <Sheet open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <SheetContent className="sm:w-[480px] bg-background/95 backdrop-blur-xl">
                  <div className="absolute inset-0 pointer-events-none bg-background/80 backdrop-blur-[2px] brightness-[0.96] -z-10" />
                  
                  <SheetHeader className="border-b border-cosmic-teal/20 pb-4">
                    <SheetTitle className="text-cosmic-teal flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      File Already Exists
                    </SheetTitle>
                    <SheetDescription>
                      This document has already been uploaded and processed.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* File Info */}
                    {duplicateFile && (
                      <Card className="glass-effect bg-cosmic-midnight/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-cosmic-teal" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{duplicateFile.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(duplicateFile.file.size / 1024 / 1024).toFixed(2)} MB • {duplicateFile.file.type}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Options */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-400 text-sm">Replace & Reprocess</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Delete the existing document and upload this one with our latest processing improvements.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-muted/20 bg-muted/5">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm">Keep Existing</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Skip this upload and keep the previously processed version.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDuplicateReprocess(false)}
                      >
                        Keep Existing
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                        onClick={() => handleDuplicateReprocess(true)}
                      >
                        Replace & Reprocess
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Drag & Drop Zone */}
              <Card className={cn(
                "glass-effect transition-all duration-300 border-2 border-dashed",
                isDragOver 
                  ? "border-cosmic-teal bg-cosmic-teal/5 scale-[1.02]" 
                  : "border-muted-foreground/20 hover:border-cosmic-teal/50"
              )}>
                <CardContent 
                  className="p-12 text-center"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      "rounded-full p-4 transition-all duration-300",
                      isDragOver 
                        ? "bg-cosmic-teal/20 scale-110" 
                        : "bg-muted/20"
                    )}>
                      <Upload className={cn(
                        "h-12 w-12 transition-colors duration-300",
                        isDragOver ? "text-cosmic-teal" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {isDragOver ? "Drop your documents here" : "Upload Documents"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Drag & drop multiple files or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports: PDF, JPG, PNG, DOCX • Bank statements, invoices, receipts, tax documents
                      </p>
                    </div>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files)
                          setPendingFiles(files)
                          setShowUploadConfig(true)
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {uploadedFiles.length > 0 && (
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Processing Queue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{file.file.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                file.status === 'completed' ? 'default' :
                                file.status === 'error' ? 'destructive' : 'secondary'
                              }>
                                {file.status === 'uploading' && <Clock className="h-3 w-3 mr-1" />}
                                {file.status === 'processing' && <Zap className="h-3 w-3 mr-1" />}
                                {file.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          {file.status !== 'completed' && (
                            <Progress value={file.progress} className="h-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {/* Search and Filters */}
              <Card className="glass-effect">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search documents, vendors, descriptions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="business">Business Expenses</option>
                        <option value="personal">Personal</option>
                        <option value="invoice">Invoices</option>
                        <option value="receipt">Receipts</option>
                        <option value="bank_statement">Bank Statements</option>
                        <option value="tax_document">Tax Documents</option>
                      </select>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="glass-effect hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-cosmic-teal" />
                          <div>
                            <CardTitle className="text-sm font-medium truncate">{doc.filename}</CardTitle>
                            <p className="text-xs text-muted-foreground">{format(new Date(doc.uploadDate), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <Badge variant={doc.extractedData.businessExpense ? "default" : "secondary"} className="text-xs">
                          {doc.extractedData.businessExpense ? "Business" : "Personal"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {doc.extractedData.amount && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Amount</span>
                            <span className="font-semibold text-green-400">${doc.extractedData.amount.toLocaleString()}</span>
                          </div>
                        )}
                        {doc.extractedData.vendor && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Vendor</span>
                            <span className="text-sm font-medium">{doc.extractedData.vendor}</span>
                          </div>
                        )}
                        {doc.extractedData.category && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Category</span>
                            <span className="text-sm">{doc.extractedData.category}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.map((tag, index) => (
                            <Badge key={`doc-${doc.id}-tag-${index}-${tag}`} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <DocumentViewerSheet document={doc} onDelete={deleteDocument} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Business Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Breakdown */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Expense Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10">
                        <span>Patchline AI</span>
                        <span className="font-semibold">${patchlineExpenses.reduce((sum, doc) => sum + (doc.extractedData.amount || 0), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/10">
                        <span>Art & Tech Lab</span>
                        <span className="font-semibold">${artLabExpenses.reduce((sum, doc) => sum + (doc.extractedData.amount || 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Deductions */}
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Potential Tax Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Schedule C Eligible</span>
                        <span className="font-semibold text-green-400">${totalBusinessExpenses.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Based on {businessExpenses.length} business expense documents
                      </div>
                      <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold">
                        <Download className="h-4 w-4 mr-2" />
                        Export Tax Summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tax Preparation Tab */}
            <TabsContent value="tax-prep" className="space-y-6">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Schedule C Business Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Review and categorize your business expenses for tax preparation.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <h3 className="font-semibold text-green-400 mb-2">Patchline AI Business</h3>
                        <p className="text-2xl font-bold">${patchlineExpenses.reduce((sum, doc) => sum + (doc.extractedData.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{patchlineExpenses.length} expenses</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <h3 className="font-semibold text-purple-400 mb-2">Art & Tech Lab</h3>
                        <p className="text-2xl font-bold">${artLabExpenses.reduce((sum, doc) => sum + (doc.extractedData.amount || 0), 0).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{artLabExpenses.length} expenses</p>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Tax Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {selectedFeature === "hr-recruiter" && (
        <HRRecruiterDashboard />
      )}

      {selectedFeature === "newsletter" && (
        <NewsletterGeneratorDashboard />
      )}
    </div>
  )
} 