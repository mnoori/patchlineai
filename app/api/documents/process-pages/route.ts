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

    logger.info(`Starting enhanced processing for document: ${documentId}`)
    logger.info(`Bank type: ${bankType}`)

    // For now, we'll start a specialized Textract job with optimized settings
    // In the future, this could be expanded to actually split PDFs
    
    // Start Textract with enhanced settings for bank statements
    const textractCommand = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: BUCKET_NAME,
          Name: s3Key,
        },
      },
      FeatureTypes: ["TABLES", "FORMS"],
      JobTag: `${documentId}_${bankType}`,
      ClientRequestToken: `${documentId}_enhanced`,
    })

    const textractResponse = await textractClient.send(textractCommand)
    const jobId = textractResponse.JobId!

    logger.info(`Started enhanced Textract job ${jobId} for ${bankType} document`)

    // Store enhanced processing metadata
    const metadata = {
      documentId,
      bankType,
      jobId,
      processingType: 'enhanced',
      createdAt: new Date().toISOString(),
      bankSpecificSettings: getBankSpecificSettings(bankType)
    }

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `metadata/${documentId}_enhanced.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json'
    }))

    // Log what would happen with page processing
    logger.info(`Enhanced processing initiated for ${bankType} statement`)
    logger.info(`Would analyze each page for transaction patterns specific to ${bankType}`)
    logger.info(`Transaction indicators for ${bankType}: ${getTransactionIndicators(bankType).join(', ')}`)

    return NextResponse.json({
      success: true,
      jobId,
      bankType,
      processingType: 'enhanced',
      message: `Enhanced processing started for ${bankType} document`
    })

  } catch (error) {
    logger.error('Enhanced processing failed', error)
    return NextResponse.json(
      { 
        error: "Failed to start enhanced processing", 
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