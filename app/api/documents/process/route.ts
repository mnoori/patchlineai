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

    // Declare variables that will be used
    let jobId: string
    let useEnhancedProcessing = false

    // For bank statements, optionally use enhanced processing
    if (documentType && ['bilt', 'bofa', 'chase-checking', 'chase-freedom', 'chase-sapphire'].includes(documentType)) {
      logger.info(`Bank statement detected (${documentType}), considering enhanced processing`)
      
      // Check if we should use enhanced processing (can be controlled by env var)
      useEnhancedProcessing = process.env.USE_ENHANCED_BANK_PROCESSING === 'true'
      
      if (useEnhancedProcessing) {
        logger.info(`Using enhanced processing for ${documentType} statement`)
        
        try {
          const enhancedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/documents/process-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              s3Key,
              documentId,
              bankType: documentType
            })
          })
          
          if (enhancedResponse.ok) {
            const enhancedData = await enhancedResponse.json()
            logger.info(`Enhanced processing initiated: ${enhancedData.message}`)
            jobId = enhancedData.jobId
          }
        } catch (error) {
          logger.warn('Enhanced processing failed, falling back to standard', error)
        }
      }
    }

    // Start standard Textract processing if not using enhanced
    if (!jobId) {
      logger.info(`Starting Textract processing for document: ${documentId}`)
      
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

    // Poll for completion
    let jobStatus = 'IN_PROGRESS'
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    
    logger.info(`Starting job status polling for jobId: ${jobId}`)

    while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++
      
      try {
        const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId })
        const result = await textractClient.send(getCommand)
        jobStatus = result.JobStatus || 'IN_PROGRESS'
        
        if (attempts % 6 === 0) { // Log every 30 seconds
          logger.info(`Job status check - JobId: ${jobId}, Status: ${jobStatus}, Attempt: ${attempts}`)
        }

        if (jobStatus === 'SUCCEEDED') {
          logger.info(`Textract processing completed successfully for jobId: ${jobId}`)

          // Extract and process results
          const { extractedData, fullTextractResults } = await extractTextractData(result)
          
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
          if (documentType && ['bilt', 'bofa', 'chase-checking', 'chase-freedom', 'chase-sapphire'].includes(documentType)) {
            logger.info(`Bank statement detected (${documentType}), triggering expense processing`)
            
            try {
              // Use dynamic import to call the expense processing directly
              const { POST: processExpenses } = await import('@/app/api/tax-audit/process-expenses/route')
              
              // Create a mock request for the expense processing
              const expenseRequest = new Request('http://localhost/api/tax-audit/process-expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  documentId,
                  jobId,
                  bankType: documentType
                })
              })
              
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

        } else if (jobStatus === 'FAILED') {
          const error = new Error(`Textract job failed: ${result.StatusMessage || 'Unknown error'}`)
          logger.error('Textract job failed', error)

          await updateDocumentInDynamoDB(documentId, {
            status: 'error',
            error: result.StatusMessage || 'Textract processing failed',
            textractJobId: jobId
          })

          return NextResponse.json(
            { 
              error: "Document processing failed", 
              details: result.StatusMessage,
              jobId 
            },
            { status: 500 }
          )
        }
      } catch (pollError) {
        logger.warn(`Error during polling attempt ${attempts}`, pollError)
        
        // Continue polling unless it's a persistent error
        if (attempts >= maxAttempts - 5) {
          throw pollError // Re-throw on final attempts
        }
      }
    }

    // Timeout case
    if (jobStatus === 'IN_PROGRESS') {
      logger.warn(`Textract job timed out after ${maxAttempts * 5} seconds`)

      await updateDocumentInDynamoDB(documentId, {
        status: 'processing',
        textractJobId: jobId,
        note: 'Processing is taking longer than expected. Check back later.'
      })

      return NextResponse.json({
        success: true,
        jobId,
        status: 'processing',
        message: `Document processing is taking longer than expected. Job ID: ${jobId}`
      })
    }

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