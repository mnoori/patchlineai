import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from "@aws-sdk/client-textract"
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { logger, logTextractProcessing } from "@/lib/logger"

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
  const requestLog = logger.apiRequest('POST', '/documents/process')
  
  try {
    const body = await request.json()
    const { s3Key, documentId, filename, userId = 'default-user' } = body

    logger.info('DOCUMENT_PROCESS', 'START', `Starting document processing`, {
      requestId: requestLog.requestId,
      userId,
      data: { s3Key, documentId, filename }
    })

    if (!s3Key || !documentId) {
      logger.warn('DOCUMENT_PROCESS', 'VALIDATION', 'Missing required fields', {
        requestId: requestLog.requestId,
        data: { s3Key: !!s3Key, documentId: !!documentId }
      })
      
      requestLog.error('Missing required fields', 400)
      return NextResponse.json(
        { error: "s3Key and documentId are required" },
        { status: 400 }
      )
    }

    // Start Textract processing
    const textractLog = logTextractProcessing(documentId, s3Key, { 
      userId, 
      documentId 
    })

    logger.info('DOCUMENT_PROCESS', 'TEXTRACT_START', `Initiating Textract analysis`, {
      requestId: requestLog.requestId,
      data: { bucket: BUCKET_NAME, s3Key }
    })

    const startCommand = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: s3Key,
        },
      },
      FeatureTypes: ["TABLES", "FORMS"],
      OutputConfig: {
        S3Bucket: BUCKET_NAME,
        S3Prefix: `textract-output/${documentId}/`,
      },
    })

    const startResult = await textractClient.send(startCommand)
    const jobId = startResult.JobId

    if (!jobId) {
      const error = new Error('Failed to start Textract job - no JobId returned')
      textractLog.error(error)
      requestLog.error(error, 500)
      
      return NextResponse.json(
        { error: "Failed to start Textract analysis" },
        { status: 500 }
      )
    }

    logger.info('DOCUMENT_PROCESS', 'TEXTRACT_STARTED', `Textract job initiated successfully`, {
      requestId: requestLog.requestId,
      data: { jobId, s3Key, documentId }
    })

    textractLog.progress('job_started', { jobId })

    // Poll for completion
    let jobStatus = 'IN_PROGRESS'
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    
    logger.info('DOCUMENT_PROCESS', 'POLLING_START', `Starting job status polling`, {
      requestId: requestLog.requestId,
      data: { jobId, maxAttempts }
    })

    while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++
      
      try {
        const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId })
        const result = await textractClient.send(getCommand)
        jobStatus = result.JobStatus || 'IN_PROGRESS'
        
        if (attempts % 6 === 0) { // Log every 30 seconds
          logger.info('DOCUMENT_PROCESS', 'POLLING_UPDATE', `Job status check`, {
            requestId: requestLog.requestId,
            data: { 
              jobId, 
              status: jobStatus, 
              attempt: attempts, 
              maxAttempts,
              elapsed: `${attempts * 5}s`
            }
          })
          
          textractLog.progress('polling', { 
            status: jobStatus, 
            attempt: attempts,
            elapsed: `${attempts * 5}s` 
          })
        }

        if (jobStatus === 'SUCCEEDED') {
          logger.info('DOCUMENT_PROCESS', 'TEXTRACT_SUCCESS', `Textract processing completed successfully`, {
            requestId: requestLog.requestId,
            data: { 
              jobId, 
              totalAttempts: attempts, 
              duration: `${attempts * 5}s`,
              pagesProcessed: result.DocumentMetadata?.Pages || 'unknown'
            }
          })

          // Extract and process results
          const { extractedData, fullTextractResults } = await extractTextractData(result, requestLog.requestId)
          
          textractLog.success({
            text: extractedData.text,
            tables: extractedData.tables,
            forms: extractedData.forms,
            confidence: extractedData.confidence
          })

          // Update DynamoDB with extracted data
          await updateDocumentInDynamoDB(documentId, {
            status: 'completed',
            extractedData,
            textractJobId: jobId,
            processingCompletedAt: new Date().toISOString()
          }, requestLog.requestId)

          // Save full Textract results to S3
          const fullTextractResultsKey = `textract-output/${documentId}/full-results.json`
          const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fullTextractResultsKey,
            Body: JSON.stringify(fullTextractResults)
          })
          await s3Client.send(putCommand)

          logger.info('DOCUMENT_PROCESS', 'COMPLETE', `Document processing completed successfully`, {
            requestId: requestLog.requestId,
            data: { 
              documentId, 
              jobId,
              textLength: extractedData.text?.length || 0,
              tablesFound: extractedData.tables?.length || 0,
              formsFound: extractedData.forms?.length || 0
            }
          })

          requestLog.success({
            documentId,
            jobId,
            status: 'completed',
            extractedData: {
              textLength: extractedData.text?.length || 0,
              tablesCount: extractedData.tables?.length || 0,
              formsCount: extractedData.forms?.length || 0,
              confidence: extractedData.confidence
            }
          })

          return NextResponse.json({
            success: true,
            jobId,
            status: 'completed',
            extractedData,
            message: `Document processing completed successfully`
          })

        } else if (jobStatus === 'FAILED') {
          const error = new Error(`Textract job failed: ${result.StatusMessage || 'Unknown error'}`)
          
          logger.error('DOCUMENT_PROCESS', 'TEXTRACT_FAILED', `Textract job failed`, {
            requestId: requestLog.requestId,
            error,
            data: { 
              jobId, 
              statusMessage: result.StatusMessage,
              attempts 
            }
          })

          textractLog.error(error)

          await updateDocumentInDynamoDB(documentId, {
            status: 'error',
            error: result.StatusMessage || 'Textract processing failed',
            textractJobId: jobId
          }, requestLog.requestId)

          requestLog.error(error, 500)
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
        logger.warn('DOCUMENT_PROCESS', 'POLLING_ERROR', `Error during polling attempt ${attempts}`, {
          requestId: requestLog.requestId,
          error: pollError,
          data: { jobId, attempt: attempts }
        })
        
        // Continue polling unless it's a persistent error
        if (attempts >= maxAttempts - 5) {
          throw pollError // Re-throw on final attempts
        }
      }
    }

    // Timeout case
    if (jobStatus === 'IN_PROGRESS') {
      const timeoutError = new Error(`Textract job timeout after ${maxAttempts * 5} seconds`)
      
      logger.warn('DOCUMENT_PROCESS', 'TIMEOUT', `Textract job timed out`, {
        requestId: requestLog.requestId,
        error: timeoutError,
        data: { 
          jobId, 
          attempts,
          timeoutSeconds: maxAttempts * 5 
        }
      })

      textractLog.error(timeoutError)

      await updateDocumentInDynamoDB(documentId, {
        status: 'processing',
        textractJobId: jobId,
        note: 'Processing is taking longer than expected. Check back later.'
      }, requestLog.requestId)

      // Return partial success - processing continues in background
      requestLog.success({
        documentId,
        jobId,
        status: 'processing',
        message: 'Processing continues in background'
      })

      return NextResponse.json({
        success: true,
        jobId,
        status: 'processing',
        message: `Document processing is taking longer than expected. Job ID: ${jobId}`
      })
    }

  } catch (error) {
    logger.error('DOCUMENT_PROCESS', 'ERROR', `Document processing failed`, {
      requestId: requestLog.requestId,
      error,
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    })

    requestLog.error(error, 500)
    
    return NextResponse.json(
      { 
        error: "Failed to process document", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

async function extractTextractData(result: any, requestId: string): Promise<any> {
  logger.info('DOCUMENT_PROCESS', 'EXTRACT_DATA', `Starting data extraction`, {
    requestId,
    data: {
      hasBlocks: !!result.Blocks,
      blockCount: result.Blocks?.length || 0,
      pages: result.DocumentMetadata?.Pages || 0
    }
  })

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

  logger.info('DOCUMENT_PROCESS', 'EXTRACT_COMPLETE', `Data extraction completed`, {
    requestId,
    data: {
      textLength: text.length,
      tablesFound: tables.length,
      formsFound: forms.length,
      confidence: avgConfidence.toFixed(2),
      hasAmount: !!extractedData.amount,
      hasVendor: !!extractedData.vendor,
      pages: extractedData.pages
    }
  })

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
  let keyText = ''
  if (keyBlock.Relationships) {
    for (const relationship of keyBlock.Relationships) {
      if (relationship.Type === 'CHILD') {
        for (const childId of relationship.Ids) {
          const childBlock = blockMap.get(childId)
          if (childBlock && childBlock.Text) {
            keyText += childBlock.Text + ' '
          }
        }
      }
    }
  }
  
  // Get value text
  let valueText = ''
  let valueBlock = null
  
  if (keyBlock.Relationships) {
    for (const relationship of keyBlock.Relationships) {
      if (relationship.Type === 'VALUE') {
        for (const valueId of relationship.Ids) {
          valueBlock = blockMap.get(valueId)
          if (valueBlock && valueBlock.Relationships) {
            for (const valueRel of valueBlock.Relationships) {
              if (valueRel.Type === 'CHILD') {
                for (const childId of valueRel.Ids) {
                  const childBlock = blockMap.get(childId)
                  if (childBlock && childBlock.Text) {
                    valueText += childBlock.Text + ' '
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  if (keyText.trim() && valueText.trim()) {
    return {
      key: keyText.trim(),
      value: valueText.trim(),
      confidence: keyBlock.Confidence || 0
    }
  }
  
  return null
}

async function updateDocumentInDynamoDB(documentId: string, data: any, requestId: string): Promise<void> {
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

    logger.info('DOCUMENT_PROCESS', 'DYNAMODB_UPDATE', `Updating document in DynamoDB`, {
      requestId,
      data: { 
        documentId, 
        status: data.status,
        hasExtractedData: !!data.extractedData,
        jobId: data.textractJobId
      }
    })

    await dynamodbClient.send(updateCommand)
    
    logger.info('DOCUMENT_PROCESS', 'DYNAMODB_SUCCESS', `Document updated successfully in DynamoDB`, {
      requestId,
      data: { documentId }
    })
  } catch (error) {
    logger.error('DOCUMENT_PROCESS', 'DYNAMODB_ERROR', `Failed to update document in DynamoDB`, {
      requestId,
      error,
      data: { documentId, status: data.status }
    })
    throw error
  }
} 