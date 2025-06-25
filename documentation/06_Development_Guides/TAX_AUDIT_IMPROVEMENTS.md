# Tax Audit System Improvements

## Overview
The tax audit system has been significantly enhanced to better handle different bank statement formats and improve expense extraction accuracy.

## Major Changes

### 1. Bank Account-Based Document Type System

Previously used generic document types (tax, business-expense, etc.). Now uses specific bank accounts:
- `bilt` - Bilt Credit Card
- `bofa` - Bank of America
- `chase-checking` - Chase Checking Account
- `chase-freedom` - Chase Freedom Credit Card
- `chase-sapphire` - Chase Sapphire Credit Card

### 2. Python-Based PDF Preprocessing

Created `backend/lambda/pdf-preprocessor.py` to:
- Split PDFs into individual pages
- Analyze each page to determine if it contains transactions
- Skip pages with only headers/footers or marketing content
- Process only transaction-containing pages with Textract

### 3. Bank-Specific Expense Parsers

Created `backend/lambda/expense-processor.py` with:
- Base `BankStatementParser` class with common functionality
- Bank-specific parsers (ChaseStatementParser, BiltStatementParser)
- Improved date parsing (handles MM/DD format without year)
- Better amount extraction and validation
- Deterministic expense ID generation to prevent duplicates

### 4. Enhanced UI Components

#### Expense Review Table Updates
- Added bank account tabs to filter expenses
- Shows expense counts per bank account
- Improved category selection for unknown business types
- Fixed edit functionality
- Added export to Excel functionality

#### God Mode Page Updates
- Changed document type dropdown to bank account selector
- Updated file upload to use FormData
- Improved expense processing integration

### 5. API Updates

#### `/api/documents/upload`
- Now accepts FormData instead of JSON
- Takes `bankType` parameter instead of `documentType`
- Creates organized S3 paths by bank type

#### `/api/documents/process`
- Stores bank type in metadata
- Triggers expense processing only for bank statements
- Passes bank type to expense processor

#### `/api/tax-audit/process-expenses`
- Now accepts `jobId` and `bankType` parameters
- Attempts Python processor first, falls back to TypeScript
- Improved Textract data parsing

### 6. Data Flow

1. **Upload**: User selects bank account type → File uploads to S3
2. **Process**: Textract analyzes document → Metadata stored with bank type
3. **Extract**: Python/TypeScript processor extracts transactions based on bank format
4. **Review**: User reviews expenses in bank-specific tabs
5. **Export**: Generate Excel files for tax preparation

## Configuration

### Environment Variables
```env
EXPENSE_PROCESSOR_URL=http://localhost:8000/process  # Python processor endpoint
TAX_EXPENSES_TABLE=TaxExpenses-dev
DOCUMENTS_TABLE=Documents-staging
```

### Running the Python Processor
```bash
cd backend/scripts
python expense-processor-server.py
```

## Testing

### Test Bilt Statement
1. Upload a Bilt credit card statement PDF
2. Should extract transactions from "Transaction Summary" section
3. Each transaction should have date, description, amount, and reference number

### Test Chase Statement  
1. Upload a Chase bank statement PDF
2. Should extract transactions from tables
3. Should handle both checking and credit card formats

## Future Improvements

1. **More Bank Parsers**: Add parsers for other banks (Wells Fargo, Citi, etc.)
2. **ML-Based Extraction**: Use ML models for better transaction detection
3. **Receipt Processing**: Extend to handle receipt images
4. **Batch Processing**: Process multiple documents simultaneously
5. **Auto-Categorization**: Improve ML-based expense categorization

## Troubleshooting

### No Expenses Extracted
- Check if document type (bank account) is correctly selected
- Verify Textract job completed successfully
- Check logs for parsing errors
- Ensure Python processor is running if configured

### Duplicate Expenses
- System uses deterministic IDs based on document+date+amount+description
- DynamoDB condition prevents duplicate inserts
- Check for variations in description text

### Wrong Categories
- Unknown business type allows selection from all categories
- Users can edit category and business type after extraction
- System learns from user corrections (future enhancement)

## Current Status

### What's Working
1. **Bank Account Organization** - Documents are categorized by specific bank accounts
2. **Basic Expense Extraction** - Textract processes documents and extracts transactions
3. **Expense Review UI** - Table with bank account tabs, filtering, and editing
4. **Error Handling** - Invalid dates and undefined statuses are handled gracefully
5. **Export Functionality** - Export filtered expenses to Excel

### What's Planned (Not Yet Implemented)
1. **Page-by-Page Processing** - Infrastructure created but not integrated:
   - `pdf-preprocessor.py` - Splits PDFs and identifies transaction pages
   - `expense-processor.py` - Bank-specific parsing logic
   - `process-pages` API - Enhanced processing endpoint
   
2. **Python Integration** - Python processors are ready but require:
   - Lambda deployment or local server setup
   - Integration with main processing flow
   
3. **Enhanced Bank Parsing** - Currently using generic extraction, bank-specific parsing would improve:
   - Transaction detection accuracy
   - Field extraction (dates, amounts, vendors)
   - Handling of multi-page statements

### How to Enable Enhanced Processing
1. Set environment variable: `USE_ENHANCED_BANK_PROCESSING=true`
2. Run Python processor server: `python backend/scripts/expense-processor-server.py`
3. Enhanced processing will log what it would do (currently just logging)

### Known Issues
1. **Date Parsing** - Some bank statements use MM/DD format without year
2. **Transaction Detection** - May miss transactions in non-standard formats
3. **Page Processing** - Currently processes entire document, not individual pages

### Quick Fixes Applied
1. **Status Error** - Added null check in `getStatusBadge` function
2. **Date Error** - Added validation in date formatting with fallback to raw string
3. **Category Error** - Used `getScheduleCLine` helper function instead of direct access 