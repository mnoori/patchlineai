import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import * as XLSX from 'xlsx'
import { TAX_CATEGORIES } from "@/lib/tax-categories"
import { format } from "date-fns"

// Initialize clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
})

const TAX_EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || "patchline-documents-staging"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = "default-user", 
      format: exportFormat = "excel",
      includeRejected = false 
    } = body

    // Fetch all expenses for the user
    const queryCommand = new QueryCommand({
      TableName: TAX_EXPENSES_TABLE,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    })

    const result = await docClient.send(queryCommand)
    let expenses = result.Items || []

    // Fetch document information to get filenames
    const documentsTable = process.env.DOCUMENTS_TABLE || "Documents-staging"
    const documentIds = [...new Set(expenses.map(exp => exp.documentId))]
    const documentMap: Record<string, any> = {}

    // Fetch document details for filenames
    for (const docId of documentIds) {
      try {
        const docQuery = new QueryCommand({
          TableName: documentsTable,
          KeyConditionExpression: "documentId = :docId",
          ExpressionAttributeValues: {
            ":docId": docId
          }
        })
        const docResult = await docClient.send(docQuery)
        if (docResult.Items && docResult.Items.length > 0) {
          documentMap[docId] = docResult.Items[0]
        }
      } catch (error) {
        console.log(`Could not fetch document ${docId}:`, error)
        documentMap[docId] = { filename: "Unknown" }
      }
    }

    // Add filename to expenses
    expenses = expenses.map(exp => ({
      ...exp,
      filename: documentMap[exp.documentId]?.filename || documentMap[exp.documentId]?.originalName || "Unknown"
    }))

    // Filter out rejected if requested
    if (!includeRejected) {
      expenses = expenses.filter(exp => exp.classificationStatus !== 'rejected')
    }

    // Sort by business type and category
    expenses.sort((a, b) => {
      if (a.businessType !== b.businessType) {
        return a.businessType.localeCompare(b.businessType)
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    })

    if (exportFormat === 'excel') {
      return generateExcelExport(expenses, userId)
    } else if (exportFormat === 'tax-package') {
      return generateTaxPackage(expenses, userId)
    } else {
      return NextResponse.json(
        { error: "Invalid export format" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error exporting expenses:", error)
    return NextResponse.json(
      { error: "Failed to export expenses" },
      { status: 500 }
    )
  }
}

async function generateExcelExport(expenses: any[], userId: string) {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = generateSummaryData(expenses)
  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

  // Group expenses by business-category combination
  const businessCategoryGroups: Record<string, any[]> = {}
  
  expenses.forEach(exp => {
    const businessType = exp.businessType || 'unknown'
    const category = exp.category || 'other-expenses'
    const key = `${businessType}-${category}`
    
    if (!businessCategoryGroups[key]) {
      businessCategoryGroups[key] = []
    }
    businessCategoryGroups[key].push(exp)
  })

  // Create a sheet for each business-category combination
  Object.entries(businessCategoryGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([businessCategory, categoryExpenses]) => {
      const [businessType, category] = businessCategory.split('-')
      
      // Create sheet with proper formatting
      const categoryWs = createBusinessCategorySheet(categoryExpenses, businessType, category)
      
      // Format sheet name (Excel tab names max 31 chars)
      const businessName = businessType.charAt(0).toUpperCase() + businessType.slice(1)
      const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const sheetName = `${businessName}-${categoryName}`.substring(0, 31)
      
      XLSX.utils.book_append_sheet(wb, categoryWs, sheetName)
    })

  // All Expenses sheet
  const allExpensesWs = createAllExpensesSheet(expenses)
  XLSX.utils.book_append_sheet(wb, allExpensesWs, "All Expenses")

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
  const filename = `tax-expenses-${timestamp}.xlsx`

  // Return the Excel file directly as download
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length.toString()
    }
  })
}

function generateSummaryData(expenses: any[]) {
  const summary: any[] = []
  
  // Business type totals
  const businessTotals: Record<string, number> = {}
  const categoryTotals: Record<string, Record<string, number>> = {}
  const scheduleCTotals: Record<string, number> = {}

  expenses.forEach(exp => {
    // Business totals
    if (!businessTotals[exp.businessType]) {
      businessTotals[exp.businessType] = 0
    }
    businessTotals[exp.businessType] += exp.amount

    // Category totals by business
    if (!categoryTotals[exp.businessType]) {
      categoryTotals[exp.businessType] = {}
    }
    if (!categoryTotals[exp.businessType][exp.category]) {
      categoryTotals[exp.businessType][exp.category] = 0
    }
    categoryTotals[exp.businessType][exp.category] += exp.amount

    // Schedule C line totals
    if (!scheduleCTotals[exp.scheduleCLine]) {
      scheduleCTotals[exp.scheduleCLine] = 0
    }
    scheduleCTotals[exp.scheduleCLine] += exp.amount
  })

  // Add business summary
  summary.push({ Category: "BUSINESS TOTALS", Amount: "", Line: "" })
  Object.entries(businessTotals).forEach(([business, total]) => {
    summary.push({ 
      Category: `${business.charAt(0).toUpperCase() + business.slice(1)} Business`, 
      Amount: total,
      Line: ""
    })
  })

  summary.push({ Category: "", Amount: "", Line: "" })

  // Add Schedule C line summary
  summary.push({ Category: "SCHEDULE C LINE TOTALS", Amount: "", Line: "" })
  Object.entries(scheduleCTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([line, total]) => {
      summary.push({ 
        Category: line, 
        Amount: total,
        Line: line
      })
    })

  summary.push({ Category: "", Amount: "", Line: "" })

  // Add category breakdown by business
  Object.entries(categoryTotals).forEach(([business, categories]) => {
    summary.push({ 
      Category: `${business.toUpperCase()} BUSINESS CATEGORIES`, 
      Amount: "", 
      Line: "" 
    })
    
    Object.entries(categories)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, total]) => {
        const taxCategory = TAX_CATEGORIES[business]?.categories[category]
        summary.push({ 
          Category: category.replace(/_/g, ' ').charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
          Amount: total,
          Line: taxCategory?.line || ""
        })
      })
    
    summary.push({ Category: "", Amount: "", Line: "" })
  })

  // Add grand total
  const grandTotal = Object.values(businessTotals).reduce((sum, total) => sum + total, 0)
  summary.push({ 
    Category: "GRAND TOTAL", 
    Amount: grandTotal,
    Line: ""
  })

  return summary
}

function createBusinessCategorySheet(expenses: any[], businessType: string, category: string) {
  const taxCategory = TAX_CATEGORIES[businessType]?.categories[category]
  
  // Create header with category information
  const sheetData: any[] = []
  
  // Add category header
  const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const businessName = businessType.charAt(0).toUpperCase() + businessType.slice(1)
  
  sheetData.push({
    Date: `${businessName} Business - ${categoryName}`,
    Description: taxCategory?.line || "Schedule C Line 27",
    Vendor: "",
    Amount: "",
    Category: "",
    Filename: "",
    Status: "",
    Notes: ""
  })
  
  sheetData.push({
    Date: taxCategory?.description || categoryName,
    Description: "",
    Vendor: "",
    Amount: "",
    Category: "",
    Filename: "",
    Status: "",
    Notes: ""
  })
  
  // Add blank row
  sheetData.push({
    Date: "",
    Description: "",
    Vendor: "",
    Amount: "",
    Category: "",
    Filename: "",
    Status: "",
    Notes: ""
  })

  // Add expenses with filename
  const expenseRows = expenses.map(exp => ({
    Date: format(new Date(exp.transactionDate), 'MM/dd/yyyy'),
    Description: exp.description,
    Vendor: exp.vendor,
    Amount: exp.amount,
    Category: categoryName,
    Filename: exp.filename || exp.documentId || "Unknown",
    Status: exp.classificationStatus,
    Notes: exp.manualNotes || ""
  }))
  
  sheetData.push(...expenseRows)

  // Add category total
  const categoryTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  sheetData.push({
    Date: "",
    Description: "SUBTOTAL",
    Vendor: "",
    Amount: categoryTotal,
    Category: "",
    Filename: "",
    Status: "",
    Notes: ""
  })

  return XLSX.utils.json_to_sheet(sheetData)
}

function createBusinessSheet(expenses: any[], businessType: string) {
  // Group by category
  const categorizedExpenses: Record<string, any[]> = {}
  
  expenses.forEach(exp => {
    if (!categorizedExpenses[exp.category]) {
      categorizedExpenses[exp.category] = []
    }
    categorizedExpenses[exp.category].push({
      Date: format(new Date(exp.transactionDate), 'MM/dd/yyyy'),
      Description: exp.description,
      Vendor: exp.vendor,
      Amount: exp.amount,
      "Proof Type": exp.proofOfPayment,
      Status: exp.classificationStatus,
      Notes: exp.manualNotes || ""
    })
  })

  // Create sheet data
  const sheetData: any[] = []

  Object.entries(categorizedExpenses)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([category, categoryExpenses]) => {
      const taxCategory = TAX_CATEGORIES[businessType]?.categories[category]
      
      // Add category header
      sheetData.push({
        Date: `${taxCategory?.description || category.replace(/_/g, ' ').toUpperCase()}`,
        Description: taxCategory?.line || "",
        Vendor: "",
        Amount: "",
        "Proof Type": "",
        Status: "",
        Notes: ""
      })

      // Add expenses
      sheetData.push(...categoryExpenses)

      // Add category total
      const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.Amount, 0)
      sheetData.push({
        Date: "",
        Description: "SUBTOTAL",
        Vendor: "",
        Amount: categoryTotal,
        "Proof Type": "",
        Status: "",
        Notes: ""
      })

      // Add blank row
      sheetData.push({
        Date: "",
        Description: "",
        Vendor: "",
        Amount: "",
        "Proof Type": "",
        Status: "",
        Notes: ""
      })
    })

  return XLSX.utils.json_to_sheet(sheetData)
}

function createAllExpensesSheet(expenses: any[]) {
  const sheetData = expenses.map(exp => ({
    Date: format(new Date(exp.transactionDate), 'MM/dd/yyyy'),
    Description: exp.description,
    Vendor: exp.vendor,
    Amount: exp.amount,
    Category: exp.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    "Business Type": exp.businessType.charAt(0).toUpperCase() + exp.businessType.slice(1),
    "Schedule C Line": exp.scheduleCLine || "Schedule C Line 27",
    Filename: exp.filename || exp.documentId || "Unknown",
    Status: exp.classificationStatus,
    "Bank Account": exp.bankAccount || "Unknown",
    Notes: exp.manualNotes || "",
    "Document ID": exp.documentId,
    "Created At": format(new Date(exp.createdAt), 'MM/dd/yyyy HH:mm:ss')
  }))

  return XLSX.utils.json_to_sheet(sheetData)
}

async function generateTaxPackage(expenses: any[], userId: string) {
  // This would generate a comprehensive tax package with:
  // 1. Cover sheet with instructions
  // 2. Summary by Schedule C lines
  // 3. Detailed expense lists by category
  // 4. Supporting documentation references
  
  // For now, return a simple response
  return NextResponse.json({
    success: true,
    message: "Tax package generation is under development",
    summary: {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      businessTypes: [...new Set(expenses.map(exp => exp.businessType))]
    }
  })
} 