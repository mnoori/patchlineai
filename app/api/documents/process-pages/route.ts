import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { TextractClient, StartDocumentAnalysisCommand, FeatureType } from "@aws-sdk/client-textract"
import { logger } from "@/lib/logger"
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

const BUCKET_NAME = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function POST(request: NextRequest) {
  try {
    const { s3Key, documentId, bankType } = await request.json()
    
    logger.info(`Starting page-by-page processing for document: ${documentId}`)
    logger.info(`Bank type: ${bankType}`)
    
    const textractClient = new TextractClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
    
    // First, split the PDF into individual pages using Python script
    logger.info(`Splitting PDF into individual pages: ${s3Key}`)
    
    const scriptPath = path.join(process.cwd(), 'backend', 'scripts', 'pdf_splitter.py')
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${s3Key}"`)
    
    if (stderr) {
      logger.error(`PDF splitter stderr: ${stderr}`)
    }
    
    const splitResult = JSON.parse(stdout)
    if (!splitResult.success) {
      throw new Error(`Failed to split PDF: ${splitResult.error}`)
    }
    
    logger.info(`PDF split into ${splitResult.totalPages} pages`)
    
    // Start Textract jobs for each page
    const pageJobs = []
    
    for (const page of splitResult.pages) {
      logger.info(`Starting Textract job for page ${page.pageNumber}`)
      
      const analysisParams = {
        DocumentLocation: {
          S3Object: {
            Bucket: page.bucket,
            Name: page.s3Key
          }
        },
        FeatureTypes: ['TABLES' as FeatureType, 'FORMS' as FeatureType]
      }
      
      const command = new StartDocumentAnalysisCommand(analysisParams)
      const response = await textractClient.send(command)
      
      if (response.JobId) {
        pageJobs.push({
          jobId: response.JobId,
          pageNumber: page.pageNumber,
          s3Key: page.s3Key
        })
        logger.info(`Started Textract job ${response.JobId} for page ${page.pageNumber}`)
      }
    }
    
    logger.info(`Started ${pageJobs.length} Textract jobs for ${splitResult.totalPages} pages`)
    
    return NextResponse.json({
      success: true,
      pageJobs,
      totalPages: splitResult.totalPages,
      message: `Processing ${splitResult.totalPages} pages with enhanced detection`
    })
    
  } catch (error) {
    logger.error('Error in page-by-page processing:', error)
    return NextResponse.json(
      { error: 'Failed to process pages', details: error instanceof Error ? error.message : 'Unknown error' },
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