# Tax Audit System - Complete Documentation

## Overview

The Tax Audit System is a comprehensive solution built within the God Mode feature to help process and organize business expenses for tax audits. It automatically extracts expenses from uploaded documents (bank statements, credit card statements, receipts, invoices) and categorizes them according to Schedule C tax lines.

## Complete Workflow

### Phase 1: Email Receipt Collection
1. **Gmail API Integration** - Extract all receipts from 2024
   - Connect to Gmail API
   - Search for receipts with keywords: "receipt", "invoice", "Amazon", "order confirmation"
   - Filter by date range: January 1, 2024 - December 31, 2024
   - Download PDF attachments and save to S3
   - Extract email body content for digital receipts

### Phase 2: Document Consolidation
1. **Bank Statement Processing**
   - Upload all bank statements (Chase Checking, Chase Freedom, Chase Sapphire, Bilt)
   - Process with AWS Textract for transaction extraction
   - Extract individual line items with dates, amounts, vendors, descriptions

2. **Receipt Processing**
   - Process Amazon receipts (individual items, not totals)
   - Extract product descriptions, prices, order numbers
   - Categorize by product type (tech equipment → depreciation, supplies → office expenses)

### Phase 3: Expense Matching & Reconciliation
1. **Cross-Reference System**
   - Match receipts to bank transactions by amount and date
   - Flag unmatched receipts (cash purchases, different payment methods)
   - Flag unmatched bank transactions (missing receipts)

### Phase 4: Comprehensive Reporting
1. **Category-Based Reports**
   - Generate detailed reports for each Schedule C line
   - Include supporting documentation links
   - Calculate totals and subtotals
   - Export to Excel with multiple sheets

## Features

### 1. Document Processing
- **Automatic Expense Extraction**: Processes bank statements and credit card statements to extract individual expense line items
- **OCR Integration**: Uses AWS Textract to extract text, tables, and forms from documents
- **Smart Classification**: AI-powered categorization of expenses into appropriate Schedule C lines
- **Multi-Business Support**: Handles both Media Business and Consulting Business expenses
- **Amazon Receipt Processing**: Specialized parser for Amazon receipts with anti-total extraction

### 2. Expense Management
- **Review Interface**: Comprehensive table view with sorting, filtering, and search capabilities
- **Inline Editing**: Edit vendor names, categories, and add notes directly in the table
- **Bulk Operations**: Approve, reject, or delete multiple expenses at once
- **Confidence Scoring**: Shows AI confidence level for each classification
- **Duplicate Detection**: Prevents duplicate entries across all parsing strategies

### 3. Tax Categories

#### Media Business Categories:
- **Advertising** (Line 8): Marketing, ads, social media promotions
- **Contract Labor** (Line 11): Freelancers, 1099 contractors
- **Depreciation** (Line 13): Equipment, cameras, computers, projectors, tripods
- **Legal & Professional** (Line 17): Legal fees, CPA services
- **Office Expenses** (Line 18): Supplies, small items
- **Rent** (Line 20b): Studio, office space
- **Travel** (Line 24a): Business flights, hotels, transportation
- **Utilities** (Line 25): Internet, phone, electricity
- **Other Expenses** (Line 27): Subscriptions, memberships, misc

#### Consulting Business Categories:
Similar structure with consulting-specific keywords and examples

### 4. Export Capabilities
- **Excel Export**: Multi-sheet workbook with:
  - Summary sheet with totals by Schedule C line
  - Separate sheets for each business type
  - Detailed expense list with all metadata
  - Reconciliation sheet for matching receipts to transactions
- **Backup System**: Automatic backup before deletion operations
- **Analytics Export**: Local CSV for advanced analytics

## Technical Architecture

### Core Files
- **Main Processor**: `backend/lambda/expense-processor.py` (958 lines)
- **API Routes**: `app/api/tax-audit/` directory
- **UI Components**: `components/tax-audit/` directory

### Amazon Receipt Processing (Latest Fixes)

**File**: `backend/lambda/expense-processor.py`

**Key Features**:
- **5-Layer Anti-Total Protection**: Prevents "Grand Total:" extraction
- **Address Filtering**: Blocks shipping addresses from being treated as products
- **Comprehensive Duplicate Detection**: Uses both item and amount tracking
- **Multi-Strategy Parsing**: Text patterns, "Sold by" detection, table parsing

**Protection Layers**:
```python
# Layer 1: Line-level filtering (lines 497-500)
if 'total' in line_lower:
    print(f"SKIPPED LINE {i}: Contains 'total' - '{line}'")
    continue

# Layer 2: Description validation (lines 525-528)
if 'total' in desc_lower:
    print(f"  SKIPPED: Contains 'total' - '{description}'")
    continue

# Layer 3: "Sold by" strategy protection (line 635)
'total' not in prev_line.lower() and  # NEVER use lines with "total"

# Layer 4: Final check before adding expense (lines 645-648)
if 'total' in product_name.lower():
    print(f"    FINAL CHECK: Rejected product with 'total'")
    break

# Layer 5: Table parsing protection (lines 750-753)
if 'total' in desc_lower:
    print(f"    SKIPPED table item: Contains 'total'")
    continue
```

### Database Schema

**TaxExpenses Table (DynamoDB)**:
```
- expenseId (String): Primary key
- documentId (String): Reference to source document
- userId (String): User identifier
- lineNumber (Number): Line in source document
- transactionDate (String): Date of expense
- amount (Number): Dollar amount
- description (String): Transaction description
- vendor (String): Merchant/vendor name
- category (String): Tax category
- scheduleCLine (String): Schedule C line reference
- businessType (String): 'media' or 'consulting'
- classificationStatus (String): 'pending', 'approved', 'rejected'
- confidenceScore (Number): AI confidence (0-100)
- manualNotes (String): User notes
- documentType (String): 'bank-statement', 'receipt', 'invoice'
- bankAccount (String): Source account
- orderNumber (String): For receipts
- createdAt (String): Creation timestamp
- updatedAt (String): Last update timestamp
```

### API Endpoints

1. **Process Expenses** - `POST /api/tax-audit/process-expenses`
   - Extracts expenses from a document
   - Auto-classifies into categories
   - Saves to TaxExpenses table

2. **Manage Expenses** - `/api/tax-audit/expenses`
   - GET: List/filter expenses
   - PUT: Update single expense
   - DELETE: Delete expense
   - PATCH: Bulk update expenses

3. **Export** - `POST /api/tax-audit/export`
   - Generate Excel exports with multiple sheets
   - Include reconciliation data

4. **Backup** - `POST /api/tax-audit/backup`
   - Backup data before deletion
   - Save to DynamoDB, S3, and local storage

5. **Delete All** - `POST /api/tax-audit/delete-all`
   - Type-specific deletion (expenses vs receipts)
   - Automatic backup before deletion

## Next Steps Implementation

### Step 1: Gmail Receipt Collection
```bash
# API endpoint to implement
POST /api/gmail/extract-receipts-2024
{
  "year": 2024,
  "keywords": ["receipt", "invoice", "Amazon", "order confirmation"],
  "downloadAttachments": true,
  "extractEmailBodies": true
}
```

### Step 2: Batch Processing
```bash
# Process all documents
POST /api/tax-audit/process-all-documents
{
  "includeEmails": true,
  "includeBankStatements": true,
  "includeReceipts": true
}
```

### Step 3: Reconciliation Engine
```bash
# Match receipts to transactions
POST /api/tax-audit/reconcile
{
  "toleranceDays": 3,
  "amountTolerance": 0.01,
  "autoMatch": true
}
```

### Step 4: Comprehensive Reporting
```bash
# Generate final report
POST /api/tax-audit/generate-report
{
  "includeReconciliation": true,
  "includeUnmatched": true,
  "groupByCategory": true,
  "exportFormat": "excel"
}
```

## File Structure
```
app/api/tax-audit/
├── expenses/route.ts          # CRUD operations
├── process-expenses/route.ts  # Document processing
├── export/route.ts           # Export functionality
├── backup/route.ts           # Backup operations
├── delete-all/route.ts       # Bulk deletion
└── reconcile/route.ts        # [TO IMPLEMENT] Matching engine

app/api/gmail/
└── extract-receipts/route.ts # [TO IMPLEMENT] Gmail integration

components/tax-audit/
├── expense-review-table.tsx  # Main review interface
├── category-sidebar.tsx      # Category navigation
└── schedule-c-reference.tsx  # Tax reference

backend/lambda/
├── expense-processor.py      # Main processing engine (958 lines)
├── pdf-preprocessor.py       # PDF handling
└── gmail-processor.py        # [TO IMPLEMENT] Gmail processing

scripts/
├── tax-analytics.py          # Local analytics
└── requirements-analytics.txt # Python dependencies
```

## Usage Guide

### 1. Complete 2024 Tax Audit Process

#### Phase 1: Data Collection
1. **Gmail Integration**:
   ```bash
   # Extract all 2024 receipts
   curl -X POST /api/gmail/extract-receipts-2024
   ```

2. **Upload Bank Statements**:
   - Chase Checking (all 2024 statements)
   - Chase Freedom (all 2024 statements) 
   - Chase Sapphire (all 2024 statements)
   - Bilt (all 2024 statements)

#### Phase 2: Processing
1. **Process All Documents**:
   ```bash
   # Batch process everything
   curl -X POST /api/tax-audit/process-all-documents
   ```

2. **Review Extracted Data**:
   - Check Bank Expenses tab (should show all transactions)
   - Check Receipts tab (should show all receipt items)
   - Verify no "Grand Total:" entries in receipts

#### Phase 3: Reconciliation
1. **Run Matching Engine**:
   ```bash
   # Match receipts to bank transactions
   curl -X POST /api/tax-audit/reconcile
   ```

2. **Review Matches**:
   - Check reconciliation sheet in export
   - Identify unmatched items
   - Flag potential duplicates

#### Phase 4: Final Report
1. **Generate Comprehensive Export**:
   ```bash
   # Create final tax package
   curl -X POST /api/tax-audit/generate-report
   ```

2. **Review Categories**:
   - **Depreciation**: Tech equipment, cameras, projectors
   - **Office Expenses**: Supplies, small items
   - **Travel**: Business trips, transportation
   - **Professional Services**: Legal, accounting
   - **Advertising**: Marketing, promotions
   - **Other**: Subscriptions, memberships

### 2. Quality Assurance Checklist

#### Data Integrity:
- [ ] No "Grand Total:" entries in receipts
- [ ] No duplicate transactions
- [ ] No address extractions as products
- [ ] All Amazon receipts show individual items

#### Completeness:
- [ ] All 2024 bank statements processed
- [ ] All Gmail receipts extracted
- [ ] All major vendors represented
- [ ] Reconciliation shows high match rate

#### Categorization:
- [ ] Tech equipment → Depreciation (Line 13)
- [ ] Office supplies → Office Expenses (Line 18)
- [ ] Professional services → Legal & Professional (Line 17)
- [ ] Business travel → Travel (Line 24a)

## Environment Variables

Add to your `.env.local`:
```
DOCUMENTS_TABLE=Documents-staging
TAX_EXPENSES_TABLE=TaxExpenses-dev
DOCUMENTS_BUCKET=patchline-documents-staging
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
```

## Troubleshooting

### Amazon Receipt Issues:
1. **"Grand Total:" appearing**: Check expense-processor.py layers 1-5
2. **Duplicate items**: Verify duplicate detection is working
3. **Address extraction**: Check address keyword filtering

### Bank Statement Issues:
1. **Missing transactions**: Verify Textract job completion
2. **Wrong amounts**: Check decimal parsing
3. **Incorrect dates**: Verify date format parsing

### Export Issues:
1. **Missing data**: Check DynamoDB permissions
2. **Excel corruption**: Verify xlsx package version
3. **S3 upload fails**: Check bucket permissions

## Performance Monitoring

### Key Metrics:
- **Processing Speed**: Documents per minute
- **Accuracy Rate**: Correct categorizations
- **Match Rate**: Receipts matched to transactions
- **Error Rate**: Failed extractions

### Debug Commands:
```bash
# Check processing status
GET /api/tax-audit/status

# View debug logs
GET /api/debug/expense-processor

# Test single document
POST /api/tax-audit/test-document/{documentId}
```

## Security & Compliance

### Data Protection:
- All documents encrypted in S3
- DynamoDB encryption at rest
- API authentication required
- Audit trail for all operations

### Backup Strategy:
- Automatic backup before bulk operations
- Multiple storage locations (DynamoDB, S3, local)
- Version control for processed data
- Recovery procedures documented

## Future Enhancements

### Immediate (Q1 2025):
1. **Gmail Integration**: Automated receipt extraction
2. **Reconciliation Engine**: Smart matching algorithm
3. **Mileage Tracking**: GPS-based business travel
4. **Mobile App**: Receipt capture on-the-go

### Medium-term (Q2-Q3 2025):
1. **Multi-Year Analysis**: Year-over-year comparisons
2. **Quarterly Estimates**: Automated tax projections
3. **IRS Form Generation**: Direct Schedule C export
4. **Audit Trail**: Complete document lineage

### Long-term (Q4 2025+):
1. **AI Categorization**: Advanced ML models
2. **Real-time Processing**: Live bank feeds
3. **Tax Optimization**: Deduction recommendations
4. **Multi-entity Support**: Multiple business structures 