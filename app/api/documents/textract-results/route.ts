import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { Readable } from "stream"

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const BUCKET_NAME = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"
const TABLE_NAME = process.env.DOCUMENTS_TABLE || "Documents-staging"

export async function GET(request: NextRequest) {
  try {
    console.log("[TEXTRACT API] Starting Textract results fetch...")
    
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    const s3Key = searchParams.get("s3Key")

    console.log("[TEXTRACT API] Request params:", { jobId, s3Key })

    if (!jobId || !s3Key) {
      console.log("[TEXTRACT API] Missing required parameters")
      return NextResponse.json(
        { error: "jobId and s3Key are required" },
        { status: 400 }
      )
    }

    // Extract document ID from S3 key
    const documentId = s3Key.split('/').pop()?.split('-').slice(0, 2).join('-')
    
    if (!documentId) {
      console.log("[TEXTRACT API] Could not extract document ID from S3 key:", s3Key)
      return NextResponse.json(
        { error: "Could not extract document ID from S3 key" },
        { status: 400 }
      )
    }

    console.log("[TEXTRACT API] Extracted document ID:", documentId)

    // Try multiple paths based on the discovered S3 structure
    const s3Paths = [
      // Our custom full results JSON path
      `textract-output/${documentId}/full-results.json`,
      
      // AWS Textract native output paths - we found these in the debug output
      `textract-output/${documentId}//${jobId}/1`,
      `textract-output/${documentId}//${jobId}/.s3_access_check`,
      
      // Alternate patterns
      `textract-output/${documentId}/${jobId}/1`,
      `textract-output/${jobId}/1`,
      `textract-output/${jobId}`
    ]
    
    // Try each path until we find a result
    let textractData = null
    
    for (const path of s3Paths) {
      console.log(`[TEXTRACT API] Trying S3 path: ${path}`)
      
      try {
        const s3Command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: path,
        })
        
        const s3Response = await s3Client.send(s3Command)
        
        if (s3Response.Body) {
          // Convert stream to string
          const stream = s3Response.Body as Readable
          const chunks: Uint8Array[] = []
          for await (const chunk of stream) {
            chunks.push(chunk)
          }
          const buffer = Buffer.concat(chunks)
          
          // If it's the full results JSON, parse it directly
          if (path.endsWith('full-results.json')) {
            textractData = JSON.parse(buffer.toString('utf-8'))
            console.log(`[TEXTRACT API] Successfully loaded full-results.json from ${path}`)
          } else {
            // This is raw Textract output, we need to parse it
            const rawData = JSON.parse(buffer.toString('utf-8'))
            console.log(`[TEXTRACT API] Loaded raw Textract data from ${path}:`, {
              hasBlocks: !!rawData.Blocks,
              blocksCount: rawData.Blocks?.length || 0
            })
            
            // Convert raw Textract data to our format
            textractData = processRawTextractData(rawData)
          }
          
          // Break out of the loop once we've found data
          break
        }
      } catch (error) {
        console.log(`[TEXTRACT API] Failed to fetch from ${path}:`, error)
      }
    }
    
    // If we found Textract data in S3, return it
    if (textractData) {
      // Add metadata for the response
      const responseData = {
        ...textractData,
        metadata: {
          ...(textractData.metadata || {}),
          source: 'S3',
          documentId,
          s3Key,
          textractJobId: jobId
        }
      }
      
      console.log("[TEXTRACT API] Returning data from S3:", {
        textLength: responseData.text?.length || 0,
        tablesCount: responseData.tables?.length || 0,
        formsCount: responseData.forms?.length || 0
      })
      
      return NextResponse.json(responseData)
    }

    // If we didn't find anything in S3, fall back to DynamoDB
    console.log("[TEXTRACT API] No data found in S3, falling back to DynamoDB...")
    
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ documentId })
    })

    const dynamoResponse = await dynamodbClient.send(getCommand)

    if (!dynamoResponse.Item) {
      console.log("[TEXTRACT API] Document not found in DynamoDB")
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    const document = unmarshall(dynamoResponse.Item)
    console.log("[TEXTRACT API] Document found in DynamoDB:", {
      documentId: document.documentId,
      status: document.status,
      hasExtractedData: !!document.extractedData,
      textractJobId: document.textractJobId
    })

    if (!document.extractedData) {
      console.log("[TEXTRACT API] No extracted data found in document")
      return NextResponse.json(
        { 
          error: "No extracted data available", 
          status: document.status,
          message: "Document processing may still be in progress"
        },
        { status: 404 }
      )
    }

    // Format the response from DynamoDB data
    const extractedData = document.extractedData
    console.log("[TEXTRACT API] Extracted data structure from DynamoDB:", {
      hasText: !!extractedData.text,
      textLength: extractedData.text?.length || 0,
      tablesCount: extractedData.tables?.length || 0,
      formsCount: extractedData.forms?.length || 0,
      confidence: extractedData.confidence
    })

    const formattedResponse = {
      text: extractedData.text || extractedData.fullText || "",
      tables: extractedData.tables || [],
      forms: extractedData.forms || [],
      confidence: extractedData.confidence || 0,
      processingStats: {
        totalBlocks: extractedData.rawBlocks || 0,
        wordBlocks: 0,
        lineBlocks: 0,
        tableBlocks: extractedData.tables?.length || 0,
        keyValueBlocks: extractedData.forms?.length || 0,
        averageConfidence: extractedData.confidence || 0
      },
      metadata: {
        source: 'DynamoDB',
        documentId: document.documentId,
        s3Key: document.s3Key,
        textractJobId: document.textractJobId,
        status: document.status,
        processingDate: document.updatedAt || document.createdAt,
        pages: extractedData.pages || 1
      }
    }

    console.log("[TEXTRACT API] Returning formatted response from DynamoDB:", {
      textLength: formattedResponse.text.length,
      tablesCount: formattedResponse.tables.length,
      formsCount: formattedResponse.forms.length,
      confidence: formattedResponse.confidence
    })

    return NextResponse.json(formattedResponse)

  } catch (error) {
    console.error("[TEXTRACT API] Error fetching Textract results:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch Textract results",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Process raw Textract data into our standard format
 */
function processRawTextractData(rawData: any) {
  // Check if the data has the expected structure
  if (!rawData.Blocks || !Array.isArray(rawData.Blocks)) {
    console.log("[TEXTRACT API] Raw data doesn't have expected Blocks array")
    return {
      text: "",
      tables: [],
      forms: [],
      confidence: 0,
      processingStats: {
        totalBlocks: 0,
        wordBlocks: 0,
        lineBlocks: 0,
        tableBlocks: 0,
        keyValueBlocks: 0,
        averageConfidence: 0
      }
    }
  }
  
  const blocks = rawData.Blocks
  
  // Extract text from LINE blocks
  const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE')
  const text = textBlocks.map((block: any) => block.Text || '').join('\n')
  
  // Get tables (limited parsing for now)
  const tableBlocks = blocks.filter((block: any) => block.BlockType === 'TABLE')
  const tables = tableBlocks.map((table: any) => ({
    confidence: table.Confidence,
    rows: [] // Simple placeholder - full table parsing is complex
  }))
  
  // Get forms/key-value pairs
  const formBlocks = blocks.filter((block: any) => 
    block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')
  )
  
  const forms = formBlocks.map((form: any) => ({
    key: form.Text || "Unknown Key",
    value: "Value not parsed", // Simple placeholder
    confidence: form.Confidence
  }))
  
  // Calculate average confidence
  const confidences = blocks
    .filter((block: any) => block.Confidence)
    .map((block: any) => block.Confidence)
  
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
    : 0
  
  return {
    text,
    tables,
    forms,
    confidence: avgConfidence,
    processingStats: {
      totalBlocks: blocks.length,
      wordBlocks: blocks.filter((b: any) => b.BlockType === 'WORD').length,
      lineBlocks: textBlocks.length,
      tableBlocks: tableBlocks.length,
      keyValueBlocks: formBlocks.length,
      averageConfidence: avgConfidence
    }
  }
}

export const dynamic = 'force-dynamic'
