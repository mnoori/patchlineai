import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from "@aws-sdk/client-textract"
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { logger } from "@/lib/logger"

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const BUCKET_NAME = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"
const TABLE_NAME = process.env.DOCUMENTS_TABLE || "Documents-staging"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { s3Key, documentId, filename, userId = 'default-user', documentType } = body

    logger.info(`Starting document processing for: ${documentId}`)

    if (!s3Key || !documentId) {
      logger.warn('Missing required fields: s3Key or documentId')
      return NextResponse.json(
        { error: "s3Key and documentId are required" },
        { status: 400 }
      )
    }

    // Start enhanced processing for bank statements
    let jobId: string | null = null
    let useEnhancedProcessing = false
    let pageJobs: any[] = []
    
    if (documentType && ['bilt', 'bofa', 'chase-checking', 'chase-freedom', 'chase-sapphire'].includes(documentType)) {
      logger.info(`Bank statement detected (${documentType}), using enhanced page-by-page processing`)
      
      try {
        const { POST: processPages } = await import('@/app/api/documents/process-pages/route')
        
        const pagesRequest = {
          json: async () => ({ s3Key, documentId, bankType: documentType }),
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          url: `${process.env.NEXT_PUBLIC_API_URL}/api/documents/process-pages`,
        } as NextRequest
        
        const pagesResponse = await processPages(pagesRequest)
        const enhancedData = await pagesResponse.json()
        
        if (enhancedData.success && enhancedData.pageJobs && enhancedData.pageJobs.length > 0) {
          useEnhancedProcessing = true
          pageJobs = enhancedData.pageJobs
          logger.info(`Page-by-page processing started with ${pageJobs.length} jobs`)
          
          // Don't set a single jobId - we'll process all jobs
          // jobId will remain null, indicating we need to aggregate results
        }
      } catch (error) {
        logger.error('Enhanced processing failed, falling back to standard', error)
      }
    }

    // Start standard Textract processing if not using enhanced
    if (!useEnhancedProcessing) {
      logger.info(`Starting standard Textract processing for document: ${documentId}`)
      
      const textractCommand = new StartDocumentAnalysisCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: BUCKET_NAME,
            Name: s3Key,
          },
        },
        FeatureTypes: ["TABLES", "FORMS"],
        JobTag: documentId,
      })
      
      const textractResponse = await textractClient.send(textractCommand)
      jobId = textractResponse.JobId!
      
      logger.info(`Textract job started with ID: ${jobId}`)
    }

    // Store bank type in metadata for later processing
    const metadata = {
      jobId,
      documentId,
      userId,
      bankType: documentType || 'unknown',
      s3Key,
      status: 'PROCESSING',
      createdAt: new Date().toISOString()
    }
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `metadata/${documentId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json'
    }))

    // Wait for Textract job(s) to complete
    let textractResult: any
    
    if (useEnhancedProcessing && pageJobs.length > 0) {
      // Wait for all page jobs to complete
      logger.info(`Waiting for ${pageJobs.length} page jobs to complete`)
      
      const completedJobs = []
      for (const pageJob of pageJobs) {
        logger.info(`Polling page ${pageJob.pageNumber} job: ${pageJob.jobId}`)
        
        let pageComplete = false
        let attempts = 0
        const maxAttempts = 60
        
        while (!pageComplete && attempts < maxAttempts) {
          const getCommand = new GetDocumentAnalysisCommand({ JobId: pageJob.jobId })
          const result = await textractClient.send(getCommand)
          
          if (result.JobStatus === 'SUCCEEDED') {
            pageComplete = true
            completedJobs.push({
              ...pageJob,
              result
            })
            logger.info(`Page ${pageJob.pageNumber} job completed`)
          } else if (result.JobStatus === 'FAILED') {
            throw new Error(`Textract job failed for page ${pageJob.pageNumber}`)
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000))
            attempts++
          }
        }
        
        if (!pageComplete) {
          throw new Error(`Timeout waiting for page ${pageJob.pageNumber} job`)
        }
      }
      
      // Aggregate results from all pages
      textractResult = await aggregatePageResults(completedJobs.map(j => ({ 
        jobId: j.jobId, 
        pageNumber: j.pageNumber 
      })))
      
      logger.info(`All ${pageJobs.length} page jobs completed and aggregated`)
    } else if (jobId) {
      // Single job polling (standard processing)
      logger.info(`Starting job status polling for jobId: ${jobId}`)
      
      let jobComplete = false
      let attempts = 0
      const maxAttempts = 60
      
      while (!jobComplete && attempts < maxAttempts) {
        const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId })
        const result = await textractClient.send(getCommand)
        
        if (result.JobStatus === 'SUCCEEDED') {
          jobComplete = true
          textractResult = result
          logger.info('Textract processing completed successfully')
        } else if (result.JobStatus === 'FAILED') {
          throw new Error('Textract job failed')
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000))
          attempts++
        }
      }
      
      if (!jobComplete) {
        throw new Error('Timeout waiting for Textract job')
      }
    } else {
      throw new Error('No Textract job ID available')
    }

    // Extract and process results
    let extractedData: any
    let fullTextractResults: any
    
    if (useEnhancedProcessing && pageJobs.length > 0) {
      // Aggregate results from all page jobs
      logger.info(`Aggregating results from ${pageJobs.length} page jobs`)
      const processedData = await extractTextractData(textractResult)
      extractedData = processedData.extractedData
      fullTextractResults = processedData.fullTextractResults
    } else {
      // Single job processing
      const processedData = await extractTextractData(textractResult)
      extractedData = processedData.extractedData
      fullTextractResults = processedData.fullTextractResults
    }
    
    // Update DynamoDB with extracted data
    await updateDocumentInDynamoDB(documentId, {
      status: 'completed',
      extractedData,
      textractJobId: jobId,
      processingCompletedAt: new Date().toISOString()
    })

    // Save full Textract results to S3
    const fullTextractResultsKey = `textract-output/${documentId}/full-results.json`
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fullTextractResultsKey,
      Body: JSON.stringify(fullTextractResults)
    })
    await s3Client.send(putCommand)

    logger.info(`Document processing completed successfully for: ${documentId}`)

    // If bank statement or similar, trigger expense processing
    if (documentType && ['bilt', 'bofa', 'chase-checking', 'chase-freedom', 'chase-sapphire', 'amazon-receipts', 'gmail-receipts'].includes(documentType)) {
      logger.info(`Document with expenses detected (${documentType}), triggering expense processing`)
      
      try {
        // Use dynamic import to call the expense processing directly
        const { POST: processExpenses } = await import('@/app/api/tax-audit/process-expenses/route')
        
        // Pass the aggregated Textract data for multi-page documents
        const expenseRequest = {
          json: async () => ({
            userId,
            documentId,
            jobId: useEnhancedProcessing && pageJobs.length > 0 ? pageJobs[0].jobId : jobId,
            bankType: documentType,
            textractData: fullTextractResults, // Pass the aggregated results
            isMultiPage: useEnhancedProcessing && pageJobs.length > 1
          }),
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          url: 'http://localhost/api/tax-audit/process-expenses'
        } as NextRequest
        
        const expenseResponse = await processExpenses(expenseRequest)
        
        if (expenseResponse.ok) {
          const expenseData = await expenseResponse.json()
          logger.info(`Successfully processed ${expenseData.expensesExtracted} expenses`)
        } else {
          logger.warn('Failed to process expenses:', await expenseResponse.text())
        }
      } catch (error) {
        logger.error('Error triggering expense processing:', error)
      }
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: 'completed',
      extractedData,
      message: `Document processing completed successfully`
    })

  } catch (error) {
    logger.error('Document processing failed', error)
    
    return NextResponse.json(
      { 
        error: "Failed to process document", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

async function extractTextractData(result: any): Promise<any> {
  logger.info('Starting data extraction from Textract results')

  const blocks = result.Blocks || []
  
  // Extract text from LINE blocks
  const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE')
  const text = textBlocks.map((block: any) => block.Text || '').join('\n')
  
  // Extract tables
  const tables: any[] = []
  const tableBlocks = blocks.filter((block: any) => block.BlockType === 'TABLE')
  
  for (const tableBlock of tableBlocks) {
    const tableData = extractTableFromBlock(tableBlock, blocks)
    if (tableData) {
      tables.push(tableData)
    }
  }
  
  // Extract key-value pairs (forms)
  const forms: any[] = []
  const keyValueBlocks = blocks.filter((block: any) => 
    block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')
  )
  
  for (const keyBlock of keyValueBlocks) {
    const keyValuePair = extractKeyValuePair(keyBlock, blocks)
    if (keyValuePair) {
      forms.push(keyValuePair)
    }
  }

  // Calculate average confidence
  const confidences = blocks
    .filter((block: any) => block.Confidence)
    .map((block: any) => block.Confidence)
  
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a: number, b: number) => a + b) / confidences.length
    : 0

  // Create full Textract results for S3 storage
  const fullTextractResults = {
    text,
    tables,
    forms,
    confidence: avgConfidence,
    processingStats: {
      totalBlocks: blocks.length,
      wordBlocks: blocks.filter((b: any) => b.BlockType === 'WORD').length,
      lineBlocks: textBlocks.length,
      tableBlocks: tableBlocks.length,
      keyValueBlocks: keyValueBlocks.length,
      averageConfidence: avgConfidence
    },
    rawBlocks: blocks, // Store complete Textract response
    metadata: {
      pages: result.DocumentMetadata?.Pages || 1,
      processingDate: new Date().toISOString(),
      textractVersion: result.DocumentMetadata?.Version || 'unknown'
    }
  }

  // Extract financial data for DynamoDB summary
  const extractedData: any = {
    text, // Store text in both for backward compatibility
    tables,
    forms,
    confidence: avgConfidence,
    fullText: text,
    rawBlocks: blocks.length,
    pages: result.DocumentMetadata?.Pages || 1
  }

  // Look for amounts (money patterns)
  const amountMatches = text.match(/\$[\d,]+\.?\d*/g)
  if (amountMatches && amountMatches.length > 0) {
    const amounts = amountMatches.map((amount: string) => 
      parseFloat(amount.replace(/[$,]/g, ''))
    ).filter((amount: number) => !isNaN(amount))
    
    if (amounts.length > 0) {
      extractedData.amount = Math.max(...amounts) // Use largest amount found
    }
  }

  // Look for dates
  const dateMatches = text.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g)
  if (dateMatches && dateMatches.length > 0) {
    extractedData.date = dateMatches[0]
  }

  // Look for common vendor patterns
  const vendorPatterns = [
    /(?:from|to|vendor|payee|merchant)[\s:]+([a-zA-Z\s&.,]+?)(?:\n|$|amount|total)/i,
    /^([A-Z][a-zA-Z\s&.,]{5,30})(?:\s|$)/m
  ]

  for (const pattern of vendorPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      extractedData.vendor = match[1].trim()
      break
    }
  }

  logger.info(`Data extraction completed - Text length: ${text.length}, Tables: ${tables.length}, Forms: ${forms.length}`)

  return { extractedData, fullTextractResults }
}

function extractTableFromBlock(tableBlock: any, allBlocks: any[]): any {
  const blockMap = new Map(allBlocks.map(block => [block.Id, block]))
  const cells: any[] = []
  
  // Get all cells in the table
  if (tableBlock.Relationships) {
    for (const relationship of tableBlock.Relationships) {
      if (relationship.Type === 'CHILD') {
        for (const childId of relationship.Ids) {
          const childBlock = blockMap.get(childId)
          if (childBlock && childBlock.BlockType === 'CELL') {
            cells.push(childBlock)
          }
        }
      }
    }
  }
  
  // Group cells by row
  const rowMap = new Map<number, any[]>()
  for (const cell of cells) {
    const rowIndex = cell.RowIndex - 1
    if (!rowMap.has(rowIndex)) {
      rowMap.set(rowIndex, [])
    }
    rowMap.get(rowIndex)!.push(cell)
  }
  
  // Build table structure
  const rows = Array.from(rowMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, rowCells]) => ({
      cells: rowCells
        .sort((a, b) => a.ColumnIndex - b.ColumnIndex)
        .map(cell => ({
          text: getCellText(cell, blockMap),
          confidence: cell.Confidence || 0
        }))
    }))
  
  return {
    rows,
    confidence: tableBlock.Confidence || 0
  }
}

function getCellText(cell: any, blockMap: Map<string, any>): string {
  let text = ''
  
  if (cell.Relationships) {
    for (const relationship of cell.Relationships) {
      if (relationship.Type === 'CHILD') {
        for (const childId of relationship.Ids) {
          const childBlock = blockMap.get(childId)
          if (childBlock && childBlock.Text) {
            text += childBlock.Text + ' '
          }
        }
      }
    }
  }
  
  return text.trim()
}

function extractKeyValuePair(keyBlock: any, allBlocks: any[]): any {
  const blockMap = new Map(allBlocks.map(block => [block.Id, block]))
  
  // Get key text
  const keyText = getTextFromBlock(keyBlock, blockMap)
  let valueText = ''
  
  // Find associated value block
  if (keyBlock.Relationships) {
    for (const relationship of keyBlock.Relationships) {
      if (relationship.Type === 'VALUE') {
        for (const valueId of relationship.Ids) {
          const valueBlock = blockMap.get(valueId)
          if (valueBlock) {
            valueText = getTextFromBlock(valueBlock, blockMap)
          }
        }
      }
    }
  }
  
  return {
    key: keyText,
    value: valueText,
    confidence: keyBlock.Confidence || 0
  }
}

function getTextFromBlock(block: any, blockMap: Map<string, any>): string {
  let text = ''
  
  if (block.Text) {
    text = block.Text
  } else if (block.Relationships) {
    for (const relationship of block.Relationships) {
      if (relationship.Type === 'CHILD') {
        for (const childId of relationship.Ids) {
          const childBlock = blockMap.get(childId)
          if (childBlock && childBlock.Text) {
            text += childBlock.Text + ' '
          }
        }
      }
    }
  }
  
  return text.trim()
}

// Helper function to extract text blocks within selection marks
function getSelectionText(selectionBlock: any, allBlocks: any[]): string {
  const blockMap = new Map(allBlocks.map(block => [block.Id, block]))
  let text = ''
  
  if (selectionBlock.Relationships) {
    for (const relationship of selectionBlock.Relationships) {
      if (relationship.Type === 'CHILD') {
        for (const childId of relationship.Ids) {
          const childBlock = blockMap.get(childId)
          if (childBlock && childBlock.Text) {
            text += childBlock.Text + ' '
          }
        }
      }
    }
  }
  
  return text.trim()
}

// Helper to extract confidence from block
function getBlockConfidence(block: any): number {
  return block.Confidence || 0
}

// Helper to get related blocks
function getRelatedBlocks(block: any, relationshipType: string, blockMap: Map<string, any>): any[] {
  const relatedBlocks: any[] = []
  
  if (block.Relationships) {
    for (const relationship of block.Relationships) {
      if (relationship.Type === relationshipType) {
        for (const relatedId of relationship.Ids) {
          const relatedBlock = blockMap.get(relatedId)
          if (relatedBlock) {
            relatedBlocks.push(relatedBlock)
          }
        }
      }
    }
  }
  
  return relatedBlocks
}

async function updateDocumentInDynamoDB(documentId: string, data: any): Promise<void> {
  try {
    const updateCommand = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ documentId }),
      UpdateExpression: "SET extractedData = :data, #status = :status, updatedAt = :updatedAt, textractJobId = :jobId",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: marshall({
        ":data": data.extractedData || {},
        ":status": data.status,
        ":updatedAt": data.processingCompletedAt || new Date().toISOString(),
        ":jobId": data.textractJobId || null
      })
    })

    logger.info(`Updating document in DynamoDB: ${documentId}`)

    await dynamodbClient.send(updateCommand)
    
    logger.info(`Document updated successfully in DynamoDB: ${documentId}`)
  } catch (error) {
    logger.error('Failed to update document in DynamoDB', error)
    throw error
  }
}

async function aggregatePageResults(pageJobs: any[]): Promise<any> {
  logger.info(`Aggregating results from ${pageJobs.length} page jobs`)

  const allBlocks: any[] = []
  let totalPages = 0
  let totalConfidence = 0
  let confidenceCount = 0

  for (const pageJob of pageJobs) {
    try {
      const getCmd = new GetDocumentAnalysisCommand({ JobId: pageJob.jobId })
      const res = await textractClient.send(getCmd)

      if (res.JobStatus === 'SUCCEEDED' && res.Blocks) {
        const pageOffset = totalPages
        res.Blocks.forEach((b: any) => {
          const newBlock = { ...b }
          // shift page number so pages are sequential 1..N
          if (newBlock.Page && newBlock.Page > 0) {
            newBlock.Page = newBlock.Page + pageOffset
          }
          allBlocks.push(newBlock)
          if (b.Confidence) {
            totalConfidence += b.Confidence
            confidenceCount++
          }
        })
        totalPages += res.DocumentMetadata?.Pages || 1
      }
    } catch (e) {
      logger.error(`aggregatePageResults error for job ${pageJob.jobId}`, e)
    }
  }

  const aggregated = {
    JobStatus: 'SUCCEEDED',
    Blocks: allBlocks,
    DocumentMetadata: { Pages: totalPages, Version: '1.0' },
    AverageConfidence: confidenceCount ? totalConfidence / confidenceCount : 0
  }

  logger.info(`Aggregated ${allBlocks.length} blocks across ${totalPages} pages`)
  return aggregated
} 