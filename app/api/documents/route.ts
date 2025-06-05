import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(client)

// Table name - following the existing pattern
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || "Documents-staging"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const documentId = searchParams.get("documentId")
    const category = searchParams.get("category")
    const businessType = searchParams.get("businessType")

    if (documentId) {
      // Get specific document
      const command = new GetCommand({
        TableName: DOCUMENTS_TABLE,
        Key: {
          documentId: documentId,
        },
      })

      const result = await docClient.send(command)
      
      if (!result.Item) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 })
      }

      return NextResponse.json({ document: result.Item })
    }

    // Get all documents for user with optional filters
    let command
    
    if (userId) {
      command = new QueryCommand({
        TableName: DOCUMENTS_TABLE,
        IndexName: "UserIdIndex", // Assuming we have a GSI on userId
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    } else {
      command = new ScanCommand({
        TableName: DOCUMENTS_TABLE,
      })
    }

    const result = await docClient.send(command)
    let documents = result.Items || []

    // Apply client-side filters
    if (category && category !== "all") {
      documents = documents.filter(doc => {
        if (category === "business") return doc.extractedData?.businessExpense === true
        if (category === "personal") return doc.extractedData?.businessExpense === false
        return doc.type === category
      })
    }

    if (businessType) {
      documents = documents.filter(doc => 
        doc.tags?.includes(businessType) || 
        doc.extractedData?.businessType === businessType
      )
    }

    // Calculate summary statistics
    const businessExpenses = documents.filter(doc => doc.extractedData?.businessExpense === true)
    const totalBusinessExpenses = businessExpenses.reduce((sum, doc) => sum + (doc.extractedData?.amount || 0), 0)
    const patchlineExpenses = businessExpenses.filter(doc => doc.tags?.includes('patchline-ai'))
    const artLabExpenses = businessExpenses.filter(doc => doc.tags?.includes('art-tech-lab'))

    const summary = {
      totalDocuments: documents.length,
      businessExpenses: businessExpenses.length,
      totalBusinessAmount: totalBusinessExpenses,
      patchlineAmount: patchlineExpenses.reduce((sum, doc) => sum + (doc.extractedData?.amount || 0), 0),
      artLabAmount: artLabExpenses.reduce((sum, doc) => sum + (doc.extractedData?.amount || 0), 0),
    }

    return NextResponse.json({ 
      documents: documents.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()),
      summary 
    })

  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      filename, 
      userId = "default-user", 
      type, 
      s3Key,
      documentId,
      fileHash,
      status = "processing"
    } = body

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      )
    }

    const uploadDate = new Date().toISOString()

    // Auto-detect document type if not provided
    const detectedType = type || detectDocumentType(filename)
    
    // Auto-generate tags based on filename and type
    const autoTags = generateAutoTags(filename, detectedType)

    // Create document record
    const document = {
      documentId: documentId || uuidv4(),
      filename,
      userId,
      type: detectedType,
      status,
      uploadDate,
      s3Key: s3Key || null,
      fileHash: fileHash || null,
      extractedData: {
        // Initialize with basic info, will be updated by processing
        processingStatus: 'pending',
        filename: filename
      },
      tags: autoTags,
      createdAt: uploadDate,
      updatedAt: uploadDate,
    }

    const command = new PutCommand({
      TableName: DOCUMENTS_TABLE,
      Item: document,
    })

    await docClient.send(command)

    return NextResponse.json({ 
      success: true, 
      document,
      message: "Document created successfully" 
    })

  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, ...updates } = body

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      )
    }

    // Get existing document
    const getCommand = new GetCommand({
      TableName: DOCUMENTS_TABLE,
      Key: { documentId },
    })

    const existing = await docClient.send(getCommand)
    
    if (!existing.Item) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Update document
    const updatedDocument = {
      ...existing.Item,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const putCommand = new PutCommand({
      TableName: DOCUMENTS_TABLE,
      Item: updatedDocument,
    })

    await docClient.send(putCommand)

    return NextResponse.json({ 
      success: true, 
      document: updatedDocument,
      message: "Document updated successfully" 
    })

  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    )
  }
}

// Helper functions
function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('invoice')) return 'invoice'
  if (lower.includes('receipt')) return 'receipt'
  if (lower.includes('bank') || lower.includes('statement')) return 'bank_statement'
  if (lower.includes('tax')) return 'tax_document'
  if (lower.includes('bill') || lower.includes('utility')) return 'utility_bill'
  return 'general'
}

function generateAutoTags(filename: string, type: string): string[] {
  const tags: string[] = []
  const lower = filename.toLowerCase()

  // Document type tags
  tags.push(type)

  // Size-based tags
  if (lower.includes('large') || lower.includes('big')) {
    tags.push('large-expense')
  }

  // Business-specific tags
  if (lower.includes('aws') || lower.includes('amazon')) {
    tags.push('patchline-ai', 'infrastructure', 'business')
  }

  if (lower.includes('adobe') || lower.includes('creative')) {
    tags.push('art-tech-lab', 'software', 'business')
  }

  // Document source tags
  if (lower.includes('statement')) {
    tags.push('bank_statement')
  }

  if (lower.includes('receipt')) {
    tags.push('receipt')
  }

  if (lower.includes('invoice')) {
    tags.push('invoice', 'business')
  }

  return tags
}

function determineBusinessExpense(filename: string): boolean {
  const businessKeywords = [
    'aws', 'amazon', 'adobe', 'github', 'office', 'software',
    'subscription', 'license', 'hosting', 'domain', 'api'
  ]

  const lower = filename.toLowerCase()
  return businessKeywords.some(keyword => lower.includes(keyword))
}

function determineBusinessType(filename: string): string | null {
  const lower = filename.toLowerCase()

  if (lower.includes('aws') || lower.includes('hosting') || lower.includes('api')) {
    return 'patchline-ai'
  }

  if (lower.includes('adobe') || lower.includes('creative') || lower.includes('art')) {
    return 'art-tech-lab'
  }

  return null
} 