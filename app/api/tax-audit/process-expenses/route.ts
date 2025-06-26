import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { TextractClient, GetDocumentAnalysisCommand } from "@aws-sdk/client-textract"
import { findMatchingCategory, getScheduleCLine, detectBusinessType } from "@/lib/tax-categories"
import crypto from "crypto"

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

// Initialize Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
})

const EXPENSES_TABLE = process.env.TAX_EXPENSES_TABLE || "TaxExpenses-dev"
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || "Documents-staging"

// Helper functions to extract data from Textract blocks
function extractTextFromBlocks(blocks: any[]): string {
  let text = ''
  for (const block of blocks) {
    if (block.BlockType === 'LINE' && block.Text) {
      text += block.Text + '\n'
    }
  }
  return text
}

function extractTablesFromBlocks(blocks: any[]): any[] {
  const tables: any[] = []
  const tableBlocks = blocks.filter(b => b.BlockType === 'TABLE')
  
  for (const tableBlock of tableBlocks) {
    const table = { rows: [] as any[] }
    
    // Get all cells for this table
    const cells: any[] = []
    if (tableBlock.Relationships) {
      for (const relationship of tableBlock.Relationships) {
        if (relationship.Type === 'CHILD') {
          for (const cellId of relationship.Ids) {
            const cellBlock = blocks.find(b => b.Id === cellId)
            if (cellBlock && cellBlock.BlockType === 'CELL') {
              cells.push(cellBlock)
            }
          }
        }
      }
    }
    
    // Group cells by row
    const rowMap = new Map<number, any[]>()
    for (const cell of cells) {
      const rowIndex = cell.RowIndex || 0
      if (!rowMap.has(rowIndex)) {
        rowMap.set(rowIndex, [])
      }
      rowMap.get(rowIndex)!.push(cell)
    }
    
    // Convert to rows array
    for (const [rowIndex, rowCells] of rowMap) {
      const sortedCells = rowCells.sort((a, b) => (a.ColumnIndex || 0) - (b.ColumnIndex || 0))
      const row = {
        cells: sortedCells.map(cell => ({
          text: getCellText(cell, blocks)
        }))
      }
      table.rows.push(row)
    }
    
    tables.push(table)
  }
  
  return tables
}

function getCellText(cell: any, blocks: any[]): string {
  let text = ''
  if (cell.Relationships) {
    for (const relationship of cell.Relationships) {
      if (relationship.Type === 'CHILD') {
        for (const childId of relationship.Ids) {
          const childBlock = blocks.find(b => b.Id === childId)
          if (childBlock && (childBlock.BlockType === 'WORD' || childBlock.BlockType === 'LINE')) {
            text += childBlock.Text + ' '
          }
        }
      }
    }
  }
  return text.trim()
}

interface ExtractedExpense {
  lineNumber: number
  date: string
  description: string
  amount: number
  vendor?: string
  transactionType: 'debit' | 'credit'
}

// BofA-specific expense extraction
function extractBofAExpenses(extractedData: any): ExtractedExpense[] {
  const expenses: ExtractedExpense[] = []
  
  console.log('BofA extraction - tables found:', extractedData.tables?.length)
  console.log('BofA extraction - text length:', extractedData.text?.length)
  
  // BofA statements often have a specific table structure
  if (extractedData.tables && extractedData.tables.length > 0) {
    for (let tableIndex = 0; tableIndex < extractedData.tables.length; tableIndex++) {
      const table = extractedData.tables[tableIndex]
      console.log(`BofA table ${tableIndex + 1} - rows:`, table.rows?.length)
      
      if (!table.rows || table.rows.length < 2) continue
      
      // BofA specific: Look for tables with date patterns in first column
      let looksLikeTransactions = false
      let dateColumnIndex = -1
      let amountColumnIndex = -1
      
      // Check first few rows to identify column structure
      for (let i = 0; i < Math.min(3, table.rows.length); i++) {
        const row = table.rows[i]
        if (!row.cells) continue
        
        row.cells.forEach((cell: any, cellIndex: number) => {
          const cellText = cell.text || ''
          
          // Check for date pattern (MM/DD)
          if (/^\d{2}\/\d{2}$/.test(cellText.trim())) {
            dateColumnIndex = cellIndex
            looksLikeTransactions = true
          }
          
          // Check for amount pattern
          if (/^\$?[\d,]+\.\d{2}$/.test(cellText.trim())) {
            amountColumnIndex = cellIndex
          }
        })
      }
      
      if (!looksLikeTransactions) {
        console.log(`Table ${tableIndex + 1} doesn't look like transactions`)
        continue
      }
      
      // Process rows as transactions
      for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
        const row = table.rows[rowIndex]
        if (!row.cells || row.cells.length < 3) continue
        
        const cells = row.cells.map((c: any) => c.text || '')
        
        // BofA format typically: Date | Date | Description | Amount | Balance
        // Or: Date | Description | Amount | Balance
        
        let date = null
        let description = ''
        let amount = 0
        
        // Try to extract date from first column
        if (dateColumnIndex >= 0 && cells[dateColumnIndex]) {
          date = parseDate(cells[dateColumnIndex])
        }
        
        // If no valid date, skip
        if (!date) continue
        
        // Description is usually after date column(s)
        // BofA often has two date columns (transaction and posting date)
        const descIndex = cells[1] && /^\d{2}\/\d{2}$/.test(cells[1]) ? 2 : 1
        if (cells[descIndex]) {
          description = cells[descIndex]
        }
        
        // Amount is usually in last or second-to-last column
        for (let i = cells.length - 1; i >= Math.max(2, cells.length - 2); i--) {
          const cellText = cells[i]
          
          // Handle negative amounts (these are the expenses we want!)
          let cellAmount = 0
          if (cellText.includes('-') || cellText.startsWith('-')) {
            // Remove the negative sign and parse - negative amounts are expenses
            const cleanedText = cellText.replace(/^-/, '').replace(/-/g, '')
            cellAmount = parseAmount(cleanedText)
            
            // Only capture negative amounts (expenses) for tax purposes
            if (cellAmount > 0 && cellAmount < 50000) {
              amount = cellAmount
              console.log(`Found BofA expense (negative amount) in cell ${i}: ${cellText} -> $${amount}`)
              break
            }
          }
        }
        
        if (date && description && amount > 0) {
          expenses.push({
            lineNumber: expenses.length + 1,
            date,
            description: cleanDescription(description),
            amount,
            vendor: extractVendorFromDescription(description),
            transactionType: 'debit'
          })
          console.log(`BofA transaction: ${date} - ${description} - $${amount}`)
        }
      }
    }
  }
  
  // If no table transactions, try text parsing with BofA patterns
  if (expenses.length === 0 && extractedData.text) {
    console.log('No BofA table transactions, trying text extraction')
    
    const lines = extractedData.text.split('\n')
    let inTransactionSection = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // BofA transaction section markers
      if (line.includes('Withdrawals and other debits') || 
          line.includes('Deposits and other credits') ||
          line.includes('ATM & debit card withdrawals')) {
        inTransactionSection = true
        console.log('Found BofA transaction section:', line)
        continue
      }
      
      if (line.includes('Daily ledger balance') || 
          line.includes('Service fees') ||
          line.includes('Total withdrawals')) {
        inTransactionSection = false
        continue
      }
      
      if (!inTransactionSection) continue
      
      // BofA pattern: MM/DD MM/DD Description Amount
      const bofaPattern = /^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})?\s*(.+?)\s+(\$?[\d,]+\.\d{2})$/
      const match = line.match(bofaPattern)
      
      if (match) {
        const [_, transDate, postDate, desc, amountStr] = match
        const date = parseDate(transDate)
        const amount = parseAmount(amountStr)
        
        if (date && amount > 0) {
          expenses.push({
            lineNumber: expenses.length + 1,
            date,
            description: cleanDescription(desc),
            amount,
            vendor: extractVendorFromDescription(desc),
            transactionType: 'debit'
          })
          console.log(`BofA text transaction: ${date} - ${desc} - $${amount}`)
        }
      }
    }
  }
  
  console.log(`BofA extraction complete - found ${expenses.length} expenses`)
  return expenses
}

// Chase-specific expense extraction
function extractChaseExpenses(extractedData: any): ExtractedExpense[] {
  const expenses: ExtractedExpense[] = []
  
  console.log('Chase extraction - tables found:', extractedData.tables?.length)
  console.log('Chase extraction - text length:', extractedData.text?.length)
  
  // Chase statements have specific table structures
  if (extractedData.tables && extractedData.tables.length > 0) {
    for (let tableIndex = 0; tableIndex < extractedData.tables.length; tableIndex++) {
      const table = extractedData.tables[tableIndex]
      console.log(`Chase table ${tableIndex + 1} - rows:`, table.rows?.length)
      
      if (!table.rows || table.rows.length < 2) continue
      
      // Chase checking specific: Look for transaction tables
      let looksLikeTransactions = false
      let dateColumnIndex = -1
      let amountColumnIndex = -1
      
      // Check first few rows to identify column structure
      for (let i = 0; i < Math.min(5, table.rows.length); i++) {
        const row = table.rows[i]
        if (!row.cells) continue
        
        row.cells.forEach((cell: any, cellIndex: number) => {
          const cellText = cell.text || ''
          
          // Check for date pattern (MM/DD)
          if (/^\d{1,2}\/\d{1,2}$/.test(cellText.trim())) {
            dateColumnIndex = cellIndex
            looksLikeTransactions = true
          }
          
          // Check for amount pattern with dollar sign
          if (/^\$[\d,]+\.\d{2}$/.test(cellText.trim())) {
            amountColumnIndex = cellIndex
            console.log(`Found amount column ${cellIndex} with value: ${cellText}`)
          }
        })
      }
      
      if (!looksLikeTransactions) {
        console.log(`Table ${tableIndex + 1} doesn't look like transactions`)
        continue
      }
      
      // Process rows as transactions
      for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
        const row = table.rows[rowIndex]
        if (!row.cells || row.cells.length < 3) continue
        
                 const cells = row.cells.map((c: any) => c.text || '')
         console.log(`Chase row ${rowIndex}: ${JSON.stringify(cells)}`)
         
         // Skip header rows
         if (cells.some(cell => cell.toLowerCase().includes('date') || 
                                cell.toLowerCase().includes('description') ||
                                cell.toLowerCase().includes('amount'))) {
           console.log('Skipping header row')
           continue
         }
        
        // Chase format typically: Date | Description | Location | Amount
        // For ATM withdrawals: Date | Description | Location | Amount
        
        let date = null
        let description = ''
        let amount = 0
        
        // Extract date from first column
        if (cells[0] && /^\d{1,2}\/\d{1,2}$/.test(cells[0].trim())) {
          date = parseDate(cells[0])
        }
        
        // If no valid date, skip this row
        if (!date) continue
        
        // Description is usually in second column
        if (cells[1]) {
          description = cells[1]
        }
        
                 // For Chase checking, amount is typically in the last non-empty column
         // Look for the rightmost column with a dollar amount
         for (let i = cells.length - 1; i >= 2; i--) {
           const cellText = cells[i]
           
           if (!cellText || cellText.trim() === '') continue
           
           // Chase checking shows amounts like "$5.00", "$45.00", "1,000.00", etc.
           if (cellText.includes('$') || 
               /^\d+\.\d{2}$/.test(cellText.trim()) ||
               /^[\d,]+\.\d{2}$/.test(cellText.trim())) {
             const cellAmount = parseAmount(cellText)
             
             if (cellAmount > 0 && cellAmount < 50000) {
               amount = cellAmount
               console.log(`Found Chase amount in cell ${i}: ${cellText} -> $${amount}`)
               break
             }
           }
         }
         
         // If still no amount found, check if there's a number without dollar sign in any cell
         if (amount === 0) {
           for (let i = cells.length - 1; i >= 2; i--) {
             const cellText = cells[i]
             
             if (!cellText || cellText.trim() === '') continue
             
             // Check for pure numbers that could be amounts
             if (/^[\d,]+\.\d{2}$/.test(cellText.trim()) || /^\d+$/.test(cellText.trim())) {
               const cellAmount = parseAmount(cellText)
               
               if (cellAmount > 0 && cellAmount < 50000) {
                 amount = cellAmount
                 console.log(`Found Chase amount (no $) in cell ${i}: ${cellText} -> $${amount}`)
                 break
               }
             }
           }
         }
        
                 // Debug logging for troubleshooting
         console.log(`Row analysis: date=${date}, description="${description}", amount=${amount}`)
         
         // If we have all required fields, create the expense
         if (date && description && amount > 0) {
           // For Chase checking, include all outgoing transactions (expenses)
           // Skip obvious deposits/credits like "ACH Credit", "Deposit", etc.
           const descLower = description.toLowerCase()
           const isDeposit = descLower.includes('deposit') || 
                            descLower.includes('credit') || 
                            descLower.includes('morgan stanley') || // Investment deposits
                            descLower.includes('total') ||
                            descLower.includes('balance')
           
           if (!isDeposit) {
             expenses.push({
               lineNumber: expenses.length + 1,
               date,
               description: cleanDescription(description),
               amount,
               vendor: extractVendorFromDescription(description),
               transactionType: 'debit'
             })
             console.log(`✅ Chase transaction: ${date} - ${description} - $${amount}`)
           } else {
             console.log(`⏭️ Skipping deposit/credit: ${description}`)
           }
         } else {
           console.log(`❌ Skipping row - missing data: date=${!!date}, desc=${!!description}, amount=${amount}`)
         }
      }
    }
  }
  
  // If no table transactions found, try text parsing with Chase patterns
  if (expenses.length === 0 && extractedData.text) {
    console.log('No Chase table transactions, trying text extraction')
    
    const lines = extractedData.text.split('\n')
    let inTransactionSection = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Chase transaction section markers
      if (line.includes('ATM & DEBIT CARD WITHDRAWALS') || 
          line.includes('ELECTRONIC WITHDRAWALS') ||
          line.includes('CHECKS PAID')) {
        inTransactionSection = true
        console.log('Found Chase transaction section:', line)
        continue
      }
      
      if (line.includes('DEPOSITS AND OTHER CREDITS') || 
          line.includes('SERVICE FEES') ||
          line.includes('DAILY ENDING BALANCE')) {
        inTransactionSection = false
        continue
      }
      
      if (!inTransactionSection) continue
      
      // Chase pattern: MM/DD Description Location Amount
      const chasePattern = /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(\$[\d,]+\.\d{2})$/
      const match = line.match(chasePattern)
      
      if (match) {
        const [_, dateStr, desc, amountStr] = match
        const date = parseDate(dateStr)
        const amount = parseAmount(amountStr)
        
        if (date && amount > 0) {
          expenses.push({
            lineNumber: expenses.length + 1,
            date,
            description: cleanDescription(desc),
            amount,
            vendor: extractVendorFromDescription(desc),
            transactionType: 'debit'
          })
          console.log(`Chase text transaction: ${date} - ${desc} - $${amount}`)
        }
      }
    }
  }
  
  console.log(`Chase extraction complete - found ${expenses.length} expenses`)
  return expenses
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, documentId, jobId, bankType = 'unknown' } = body

    console.log('Processing expenses for document:', documentId)
    console.log('Bank type:', bankType)
    console.log('Textract job ID:', jobId)
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'No Textract job ID provided' },
        { status: 400 }
      )
    }

    // Get Textract results
    const textractCommand = new GetDocumentAnalysisCommand({ JobId: jobId })
    const textractResult = await textractClient.send(textractCommand)

    if (textractResult.JobStatus !== 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Textract job not completed' },
        { status: 400 }
      )
    }

    console.log('Textract job completed successfully')
    console.log('Blocks found:', textractResult.Blocks?.length || 0)

    // Call Python processor for bank-specific parsing
    const processorUrl = process.env.EXPENSE_PROCESSOR_URL || 'http://localhost:8000/process'
    
    try {
      const processorResponse = await fetch(processorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          documentId,
          bankType,
          jobId,
          textractData: textractResult
        })
      })

      if (processorResponse.ok) {
        const result = await processorResponse.json()
        console.log('Python processor result:', result)
        
        return NextResponse.json({
          success: true,
          expensesExtracted: result.expensesExtracted,
          expensesSaved: result.expensesSaved
        })
      } else {
        console.error('Python processor failed:', await processorResponse.text())
      }
    } catch (error) {
      console.error('Error calling Python processor:', error)
    }

    // Fallback to TypeScript processing if Python processor fails
    console.log('Falling back to TypeScript processing')
    
    // Convert Textract blocks to our expected format
    const extractedData = {
      text: extractTextFromBlocks(textractResult.Blocks || []),
      tables: extractTablesFromBlocks(textractResult.Blocks || [])
    }
    
    console.log('Extracted data - text length:', extractedData.text?.length)
    console.log('Extracted data - tables count:', extractedData.tables?.length)
    if (extractedData.tables?.length > 0) {
      console.log('First table rows:', extractedData.tables[0].rows?.length)
    }
    
    // Use bank-specific extraction first, then fall back to generic
    let expenses: ExtractedExpense[] = []

    // Try bank-specific extraction first
    if (bankType === 'bofa') {
      console.log('Attempting BofA-specific extraction')
      expenses = extractBofAExpenses(extractedData)
    } else if (bankType === 'chase-checking' || bankType === 'chase-freedom' || bankType === 'chase-sapphire') {
      console.log('Attempting Chase-specific extraction')
      expenses = extractChaseExpenses(extractedData)
    }

    // If bank-specific extraction didn't find anything, try generic extraction
    if (expenses.length === 0) {
      console.log('Bank-specific extraction found no expenses, trying generic extraction')
      expenses = extractExpensesFromStatement(extractedData)
    }

    console.log(`Final extraction found ${expenses.length} expenses`)

    // Process and save each expense
    const savedExpenses = []
    for (const expense of expenses) {
      // Skip credits/deposits (we want debits/expenses for tax purposes)
      if (expense.transactionType === 'credit') continue
      
      // Classify the expense
      const classification = findMatchingCategory(expense.description)
      
      // Deterministic expenseId to prevent duplicates (hash of docId+date+amount+desc)
      const expenseId = crypto.createHash('sha256')
        .update(`${documentId}|${expense.date}|${expense.amount}|${expense.description}`)
        .digest('hex')
        .substring(0, 16)

      // Create expense record
      const expenseRecord = {
        expenseId,
        documentId,
        userId,
        transactionDate: expense.date,
        amount: expense.amount, // store as number for easier aggregation
        description: expense.description.substring(0, 500),
        vendor: (expense.vendor || extractVendorFromDescription(expense.description)).substring(0, 200),
        category: classification?.category || 'other-expenses',
        businessType: classification?.businessType || 'unknown',
        // @ts-ignore
        scheduleCLine: (classification as any)?.scheduleCLine || getScheduleCLine((classification?.businessType as any) || 'unknown', (classification?.category as any) || 'other-expenses'),
        bankAccount: bankType,
        classificationStatus: 'pending',
        confidenceScore: classification?.confidence || 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('Creating expense record:', expenseRecord)

      // Save to DynamoDB
      const putCommand = new PutCommand({
        TableName: EXPENSES_TABLE,
        Item: expenseRecord,
        ConditionExpression: 'attribute_not_exists(expenseId)'
      })

      await docClient.send(putCommand)
      savedExpenses.push(expenseRecord)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${savedExpenses.length} expenses from document`,
      expensesExtracted: savedExpenses.length,
      expensesSaved: savedExpenses.length,
      expenses: savedExpenses,
      bankType: bankType,
      totalAmount: savedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    })

  } catch (error) {
    console.error("Error processing expenses:", error)
    return NextResponse.json(
      { error: "Failed to process expenses" },
      { status: 500 }
    )
  }
}

// Extract expenses from bank/credit card statements
function extractExpensesFromStatement(extractedData: any): ExtractedExpense[] {
  const expenses: ExtractedExpense[] = []
  
  console.log('Extracting expenses from statement, tables count:', extractedData.tables?.length)
  
  // Check if we have tables extracted by Textract
  if (extractedData.tables && extractedData.tables.length > 0) {
    for (let tableIndex = 0; tableIndex < extractedData.tables.length; tableIndex++) {
      const table = extractedData.tables[tableIndex]
      console.log(`Processing table ${tableIndex + 1}, rows:`, table.rows?.length)
      
      // Skip tables that are too small or don't look like transaction tables
      if (!table.rows || table.rows.length < 3) continue
      
      // Look for transaction tables by checking content patterns
      let isTransactionTable = false
      let hasAmountColumn = false
      
      // Check first few rows for transaction patterns
      for (let i = 0; i < Math.min(5, table.rows.length); i++) {
        const row = table.rows[i]
        if (!row.cells) continue
        
        const rowText = row.cells.map((c: any) => c.text || '').join(' ').toLowerCase()
        
        // Check for transaction indicators
        if (rowText.includes('purchase') || rowText.includes('payment') || 
            rowText.includes('transaction') || rowText.includes('merchant')) {
          isTransactionTable = true
        }
        
        // Check for amount patterns
        row.cells.forEach((cell: any) => {
          if (cell.text && /\$?\d+\.\d{2}/.test(cell.text)) {
            hasAmountColumn = true
          }
        })
      }
      
      // Skip if this doesn't look like a transaction table
      if (!hasAmountColumn && tableIndex > 0) {
        console.log(`Skipping table ${tableIndex + 1} - no amounts found`)
        continue
      }
      
      // Process each row as a potential transaction
      let headerRowIndex = -1
      
      table.rows.forEach((row: any, index: number) => {
        const rowText = row.cells?.map((c: any) => c.text || '').join(' ').toLowerCase() || ''
        
        // Identify header row
        if (rowText.includes('date') || rowText.includes('description') || 
            rowText.includes('merchant') || rowText.includes('amount')) {
          headerRowIndex = index
          return
        }
        
        // Skip rows before header or that are headers/totals
        if (index <= headerRowIndex || 
            rowText.includes('total') || rowText.includes('balance') || 
            rowText.includes('previous') || rowText.includes('payment') ||
            rowText.includes('fees') || rowText.includes('interest')) {
          return
        }
        
        // For Chase statements, also check for section headers
        if (rowText.includes('purchases') || rowText.includes('credits') ||
            rowText.includes('cash advances') || rowText.includes('summary')) {
          return
        }
        
        // Try to parse transaction from row
        const transaction = parseTransactionRow(row, expenses.length + 1)
        if (transaction) {
          // Additional validation for Chase statements
          // Skip if amount is too large (likely a balance)
          if (transaction.amount > 10000) {
            console.log(`Skipping potential balance: $${transaction.amount}`)
            return
          }
          
          // Skip if description looks like a header or total
          const descLower = transaction.description.toLowerCase()
          if (descLower.includes('total') || descLower.includes('balance') ||
              descLower.includes('credit line') || descLower.includes('available')) {
            return
          }
          
          console.log(`Found transaction: ${transaction.date} - ${transaction.description} - $${transaction.amount}`)
          expenses.push(transaction)
        }
      })
    }
  }
  
  // If we found expenses from tables, don't try text parsing
  // This avoids duplicates and ensures we use the more accurate table data
  if (expenses.length > 0) {
    console.log(`Found ${expenses.length} expenses from tables, skipping text parsing`)
    return expenses
  }
  
  // Fallback: Parse from raw text if no transactions found from tables
  if (extractedData.text) {
    console.log('No transactions found in tables, attempting text parsing')
    expenses.push(...parseTransactionsFromText(extractedData.text))
  }
  
  console.log(`Total expenses extracted: ${expenses.length}`)
  
  return expenses
}

// Parse a table row into a transaction
function parseTransactionRow(row: any, lineNumber: number): ExtractedExpense | null {
  // Common patterns for bank statement columns:
  // [Date, Description, Debit, Credit, Balance]
  // [Date, Description, Amount, Balance]
  
  if (!row || !row.cells || row.cells.length < 3) return null
  
  try {
    // Extract text from cells
    const cells = row.cells.map((cell: any) => cell.text || '')
    console.log('Parsing row cells:', cells)
    
    // Extract date (usually first column)
    const dateStr = cells[0]
    const date = parseDate(dateStr)
    if (!date) {
      console.log('No valid date found in first cell:', dateStr)
      return null
    }
    
    // Extract description (usually second column)
    const description = cells[1]
    if (!description || description.length < 3) {
      console.log('Invalid description:', description)
      return null
    }
    
    // Extract amount (look for numeric values in remaining columns)
    let amount = 0
    let transactionType: 'debit' | 'credit' = 'debit'
    
    // Check each cell for amounts - prioritize negative amounts (expenses)
    for (let i = 2; i < cells.length; i++) {
      const cellText = cells[i]
      
      // Skip empty cells
      if (!cellText || cellText.trim() === '') continue
      
      // Skip obvious balance columns
      if (cellText.includes('Balance') || cellText.includes('BALANCE')) continue
      
      // Prioritize negative amounts (expenses) for tax purposes
      if (cellText.includes('-') || cellText.startsWith('-')) {
        const cleanedText = cellText.replace(/^-/, '').replace(/-/g, '')
        const numericValue = parseAmount(cleanedText)
        
        if (numericValue > 0) {
          amount = numericValue
          transactionType = 'debit' // Negative amounts are expenses
          console.log(`Found expense (negative amount) in cell ${i}: ${cellText} -> $${amount}`)
          break
        }
      }
    }
    
    // If no negative amount found, check for positive amounts (but these are likely deposits)
    if (amount === 0) {
      for (let i = 2; i < cells.length; i++) {
        const cellText = cells[i]
        
        if (!cellText || cellText.trim() === '') continue
        if (cellText.includes('Balance') || cellText.includes('BALANCE')) continue
        
        const numericValue = parseAmount(cellText)
        
        if (numericValue > 0) {
          amount = numericValue
          transactionType = 'credit' // Positive amounts are likely deposits
          console.log(`Found positive amount in cell ${i}: $${amount}`)
          break
        }
      }
    }
    
    // If no amount found in separate columns, check if amount is in description
    if (amount === 0) {
      const descAmount = parseAmount(description)
      if (descAmount > 0) {
        amount = descAmount
        console.log(`Found amount in description: $${amount}`)
      }
    }
    
    if (amount === 0) {
      console.log('No valid amount found in row')
      return null
    }
    
    const result = {
      lineNumber,
      date,
      description: cleanDescription(description),
      amount,
      transactionType,
      vendor: extractVendorFromDescription(description)
    }
    
    console.log('Successfully parsed transaction:', result)
    return result
  } catch (error) {
    console.error('Error parsing transaction row:', error)
    return null
  }
}

// Parse transactions from raw text
function parseTransactionsFromText(text: string): ExtractedExpense[] {
  const expenses: ExtractedExpense[] = []
  const lines = text.split('\n')
  
  console.log('Parsing transactions from text, total lines:', lines.length)
  
  // Look for transaction sections
  let inTransactionSection = false
  let lineNumber = 1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if we're entering a transaction section
    if (line.includes('PURCHASE') || line.includes('PAYMENTS AND OTHER CREDITS')) {
      inTransactionSection = true
      console.log('Found transaction section:', line)
      continue
    }
    
    // Check if we're leaving transaction section
    if (line.includes('FEES') || line.includes('INTEREST') || line.includes('SUMMARY')) {
      inTransactionSection = false
      continue
    }
    
    if (!inTransactionSection) continue
    
    // Common transaction patterns for bank statements
    // Pattern 1: Date at start of line (MM/DD)
    const datePattern = /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\$?[\d,]+\.?\d*)$/
    const match = line.match(datePattern)
    
    if (match) {
      const [_, dateStr, description, amountStr] = match
      const date = parseDate(dateStr)
      const amount = parseAmount(amountStr)
      
      if (date && amount > 0 && description.length > 2) {
        expenses.push({
          lineNumber: lineNumber++,
          date,
          description: cleanDescription(description),
          amount,
          vendor: extractVendorFromDescription(description),
          transactionType: amountStr.startsWith('-') ? 'credit' : 'debit'
        })
        console.log(`Found transaction: ${date} - ${description} - $${amount}`)
      }
    } else {
      // Pattern 2: Check if this line is a date and next line is description/amount
      const simpleDatePattern = /^\d{1,2}\/\d{1,2}$/
      if (simpleDatePattern.test(line) && i + 1 < lines.length) {
        const date = parseDate(line)
        const nextLine = lines[i + 1].trim()
        
        // Match description and amount on next line
        const descAmountPattern = /^(.+?)\s+(-?\$?[\d,]+\.?\d*)$/
        const descMatch = nextLine.match(descAmountPattern)
        
        if (date && descMatch) {
          const [_, description, amountStr] = descMatch
          const amount = parseAmount(amountStr)
          
          if (amount > 0 && description.length > 2) {
            expenses.push({
              lineNumber: lineNumber++,
              date,
              description: cleanDescription(description),
              amount,
              vendor: extractVendorFromDescription(description),
              transactionType: amountStr.startsWith('-') ? 'credit' : 'debit'
            })
            console.log(`Found transaction (multiline): ${date} - ${description} - $${amount}`)
            i++ // Skip next line since we processed it
          }
        }
      }
    }
  }
  
  console.log(`Parsed ${expenses.length} transactions from text`)
  
  return expenses
}

// Extract expenses from receipts/invoices
function extractExpensesFromReceipt(extractedData: any): ExtractedExpense[] {
  const amount = extractedData.amount || extractAmount(extractedData.text || '')
  const date = extractedData.date || extractDate(extractedData.text || '')
  const vendor = extractedData.vendor || extractVendor(extractedData.text || '')
  
  if (!amount || !date) return []
  
  return [{
    lineNumber: 1,
    date,
    description: `${vendor} - Receipt`,
    amount,
    vendor,
    transactionType: 'debit'
  }]
}

// Generic expense extraction
function extractGenericExpenses(extractedData: any): ExtractedExpense[] {
  if (!extractedData.text) return []
  
  console.log('Attempting generic expense extraction')
  
  const expenses: ExtractedExpense[] = []
  const amount = extractAmount(extractedData.text)
  const date = extractDate(extractedData.text)
  
  console.log('Generic extraction - amount:', amount, 'date:', date)
  
  // Validate the extracted amount
  if (amount && amount > 0 && amount < 1000000 && date) {
    const expense = {
      lineNumber: 1,
      date,
      description: extractedData.text.substring(0, 100).replace(/\n/g, ' ').trim(),
      amount,
      transactionType: 'debit' as const
    }
    console.log('Generic expense created:', expense)
    expenses.push(expense)
  }
  
  return expenses
}

// Helper functions
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  try {
    // Clean the date string
    const cleaned = dateStr.trim()
    
    // Common date formats
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YYYY or MM/DD/YY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{2,4})/, // MM-DD-YYYY
      /(\d{1,2})\/(\d{1,2})$/ // MM/DD (no year - common in statements)
    ]
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) {
        // Handle MM/DD format without year (use current year or year from context)
        if (pattern === patterns[3]) {
          const currentYear = new Date().getFullYear()
          const month = match[1].padStart(2, '0')
          const day = match[2].padStart(2, '0')
          
          // If month is greater than current month, assume previous year
          const currentMonth = new Date().getMonth() + 1
          const year = parseInt(month) > currentMonth ? currentYear - 1 : currentYear
          
          return `${year}-${month}-${day}`
        }
        
        // Handle other formats
        let year = match[3] || match[1]
        let month = match[1] || match[2]
        let day = match[2] || match[3]
        
        // Convert 2-digit year to 4-digit
        if (year && year.length === 2) {
          year = '20' + year
        }
        
        // Ensure proper formatting
        if (match[0].includes('-') && match[1].length === 4) {
          // YYYY-MM-DD format
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        } else {
          // MM/DD/YYYY or MM-DD-YYYY format
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
      }
    }
    
    // Try parsing month names (Jan 1, 2024 etc)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthPattern = new RegExp(`(${monthNames.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i')
    const monthMatch = cleaned.match(monthPattern)
    
    if (monthMatch) {
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthMatch[1].toLowerCase()) + 1
      return `${monthMatch[3]}-${monthIndex.toString().padStart(2, '0')}-${monthMatch[2].padStart(2, '0')}`
    }
    
  } catch (error) {
    console.error('Date parsing error:', error)
  }
  return null
}

function parseAmount(amountStr: string): number {
  try {
    // Remove currency symbols, commas, and extra spaces
    const cleaned = amountStr.replace(/[$,]/g, '').trim()
    
    // Check if it's a valid number string
    if (!cleaned || cleaned === '-' || cleaned === '') return 0
    
    const amount = parseFloat(cleaned)
    
    // Validate the amount
    if (isNaN(amount)) return 0
    if (!isFinite(amount)) return 0
    if (amount > 1000000) return 0 // Skip amounts over $1M (likely parsing errors)
    if (amount < 0) return 0 // We handle credits separately
    
    return Math.abs(amount)
  } catch {
    return 0
  }
}

function cleanDescription(description: string): string {
  // Remove extra whitespace and common noise
  return description
    .replace(/\s+/g, ' ')
    .replace(/[#*]/g, '')
    .trim()
}

function extractVendorFromDescription(description: string): string {
  // Extract vendor from common patterns
  const patterns = [
    /^([A-Z][A-Z\s&]+)(?:\s+\d|$)/, // All caps vendor name
    /^(.+?)\s+(?:LLC|INC|CORP|CO\.|COMPANY)/i, // Company suffixes
    /^(.+?)(?:\s+\#|\s+REF|\s+AUTH)/, // Before reference numbers
  ]
  
  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  // Default: first few words
  return description.split(' ').slice(0, 3).join(' ')
}

function extractAmount(text: string): number | null {
  const amountPattern = /\$?([\d,]+\.?\d*)/g
  const matches = text.match(amountPattern)
  
  if (matches && matches.length > 0) {
    // Parse all matches and filter valid amounts
    const amounts = matches
      .map(m => parseAmount(m))
      .filter(amt => amt > 0 && amt < 100000) // Filter reasonable amounts
    
    if (amounts.length > 0) {
      // Return the first reasonable amount found
      // (In bank statements, the first amounts are usually transactions, not balances)
      return amounts[0]
    }
  }
  return null
}

function extractDate(text: string): string | null {
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i
  ]
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      return parseDate(match[0]) || match[0]
    }
  }
  return null
}

function extractVendor(text: string): string {
  // Look for common vendor patterns
  const lines = text.split('\n')
  // Often vendor is in first few lines
  return lines[0]?.trim() || 'Unknown Vendor'
}

function determineProofType(documentType: string): string {
  const proofTypeMap: Record<string, string> = {
    'bank_statement': 'Bank Statement',
    'credit_card_statement': 'Credit Card Statement',
    'invoice': 'Invoice',
    'receipt': 'Receipt',
    'check': 'Cancelled Check',
    'contract': 'Contract/Agreement'
  }
  
  return proofTypeMap[documentType] || 'Other Document'
} 