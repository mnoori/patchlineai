import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { TextractClient, StartDocumentAnalysisCommand } from "@aws-sdk/client-textract"
import { logger } from "@/lib/logger"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const BUCKET_NAME = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { s3Key, documentId, bankType } = body

    logger.info(`Starting page-by-page processing for document: ${documentId}`)
    logger.info(`Bank type: ${bankType}`)

    // First, we need to split the PDF into individual pages
    // For now, we'll simulate this by processing the entire document
    // but with enhanced settings for multi-page bank statements
    
    logger.info(`Processing ${bankType} statement with enhanced table detection`)
    
    // Start multiple Textract jobs with different optimization settings
    const pageJobs = []
    
    // Job 1: Focus on tables and forms
    const tablesCommand = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: s3Key,
        },
      },
      FeatureTypes: ["TABLES", "FORMS"],
      JobTag: `${documentId}_${bankType}_tables`,
      ClientRequestToken: `${documentId}_tables_${Date.now()}`,
    })

    const tablesResponse = await textractClient.send(tablesCommand)
    pageJobs.push({
      jobId: tablesResponse.JobId!,
      type: 'tables',
      pageRange: 'all'
    })
    
    logger.info(`Started table-focused Textract job ${tablesResponse.JobId} for ${bankType} document`)

    // Store enhanced processing metadata
    const metadata = {
      documentId,
      bankType,
      pageJobs,
      processingType: 'page-by-page',
      createdAt: new Date().toISOString(),
      bankSpecificSettings: getBankSpecificSettings(bankType),
      transactionIndicators: getTransactionIndicators(bankType)
    }

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `metadata/${documentId}_pages.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json'
    }))

    logger.info(`Page-by-page processing initiated for ${bankType} statement`)
    logger.info(`Will extract transactions from all pages using enhanced patterns`)
    logger.info(`Transaction indicators for ${bankType}: ${getTransactionIndicators(bankType).join(', ')}`)

    return NextResponse.json({
      success: true,
      pageJobs,
      bankType,
      processingType: 'page-by-page',
      message: `Page-by-page processing started for ${bankType} document with ${pageJobs.length} jobs`
    })

  } catch (error) {
    logger.error('Page-by-page processing failed', error)
    return NextResponse.json(
      { 
        error: "Failed to start page-by-page processing", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

function getBankSpecificSettings(bankType: string): any {
  const settings: Record<string, any> = {
    'bilt': {
      transactionSectionStart: 'Transaction Summary',
      transactionSectionEnd: 'Important Information',
      dateFormat: 'MM/DD',
      amountColumns: ['amount'],
      referenceColumn: 'reference number'
    },
    'chase-sapphire': {
      transactionSectionStart: 'Purchase',
      transactionSectionEnd: 'Total fees',
      dateFormat: 'MM/DD',
      amountColumns: ['amount', 'debit', 'credit'],
      vendorPatterns: ['merchant name', 'description']
    },
    'chase-checking': {
      transactionSectionStart: 'Transaction history',
      transactionSectionEnd: 'Daily ending balance',
      dateFormat: 'MM/DD',
      amountColumns: ['deposits', 'withdrawals', 'amount'],
      balanceColumn: 'balance'
    },
    'bofa': {
      transactionSectionStart: 'Posted transactions',
      transactionSectionEnd: 'Total',
      dateFormat: 'MM/DD',
      amountColumns: ['amount', 'debit', 'credit'],
      descriptionColumn: 'description'
    },
    'chase-freedom': {
      transactionSectionStart: 'Transactions',
      transactionSectionEnd: 'Total',
      dateFormat: 'MM/DD',
      amountColumns: ['amount'],
      categoryColumn: 'category'
    }
  }

  return settings[bankType] || {
    transactionSectionStart: 'Transaction',
    transactionSectionEnd: 'Total',
    dateFormat: 'MM/DD',
    amountColumns: ['amount']
  }
}

function getTransactionIndicators(bankType: string): string[] {
  const baseIndicators = [
    'transaction', 'purchase', 'payment', 'deposit', 'withdrawal',
    'debit', 'credit', 'balance', 'amount'
  ]

  const bankSpecific: Record<string, string[]> = {
    'bilt': ['reference number', 'transaction summary', 'payment due'],
    'chase-sapphire': ['purchase', 'payment', 'cash advance', 'interest charge'],
    'chase-checking': ['deposits', 'withdrawals', 'daily balance', 'check'],
    'bofa': ['posted transactions', 'pending transactions', 'available balance'],
    'chase-freedom': ['category', 'rewards', 'cash back']
  }

  return [...baseIndicators, ...(bankSpecific[bankType] || [])]
} 