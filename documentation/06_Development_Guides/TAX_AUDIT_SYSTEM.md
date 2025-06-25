# Tax Audit System Documentation

## Overview

The Tax Audit System is a comprehensive solution built within the God Mode feature to help process and organize business expenses for tax audits. It automatically extracts expenses from uploaded documents (bank statements, credit card statements, receipts, invoices) and categorizes them according to Schedule C tax lines.

## Features

### 1. Document Processing
- **Automatic Expense Extraction**: Processes bank statements and credit card statements to extract individual expense line items
- **OCR Integration**: Uses AWS Textract to extract text, tables, and forms from documents
- **Smart Classification**: AI-powered categorization of expenses into appropriate Schedule C lines
- **Multi-Business Support**: Handles both Media Business and Consulting Business expenses

### 2. Expense Management
- **Review Interface**: Comprehensive table view with sorting, filtering, and search capabilities
- **Inline Editing**: Edit vendor names, categories, and add notes directly in the table
- **Bulk Operations**: Approve, reject, or delete multiple expenses at once
- **Confidence Scoring**: Shows AI confidence level for each classification

### 3. Tax Categories

#### Media Business Categories:
- **Advertising** (Line 8): Marketing, ads, social media promotions
- **Contract Labor** (Line 11): Freelancers, 1099 contractors
- **Depreciation** (Line 13): Equipment, cameras, computers
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
- **Tax Package**: (Coming soon) Organized PDF packages ready for submission

## Technical Architecture

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
- proofOfPayment (String): Document type
- createdAt (String): Creation timestamp
- updatedAt (String): Last update timestamp
```

**Indexes**:
- UserIdIndex: Query by user and date
- DocumentIdIndex: Find all expenses from a document
- CategoryIndex: Filter by category
- BusinessTypeIndex: Filter by business type

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
   - Generate Excel exports
   - Create tax packages

### File Structure
```
app/api/tax-audit/
├── expenses/route.ts          # CRUD operations
├── process-expenses/route.ts  # Document processing
└── export/route.ts           # Export functionality

components/tax-audit/
└── expense-review-table.tsx  # Main review interface

lib/
└── tax-categories.ts         # Tax category configuration

backend/scripts/
└── create-tax-expenses-table.py  # DynamoDB setup
```

## Usage Guide

### 1. Upload Documents
1. Go to God Mode → Document Processing
2. Upload bank statements, credit card statements, receipts, or invoices
3. Documents are automatically processed with OCR

### 2. Process Expenses
1. Switch to the "Tax Preparation" tab
2. Click "Process All Documents" to extract expenses
3. System will:
   - Extract individual transactions from statements
   - Parse receipts and invoices
   - Auto-classify into tax categories
   - Calculate confidence scores

### 3. Review & Classify
1. Review expenses in the table
2. Edit classifications as needed:
   - Click edit icon to modify
   - Change business type or category
   - Add manual notes
3. Use bulk actions to approve/reject multiple items
4. Filter by status, business type, or search

### 4. Export for Tax Filing
1. Click "Export to Excel" for detailed spreadsheet
2. Excel includes:
   - Summary totals by Schedule C line
   - Separate sheets per business
   - All supporting details
3. Use exported data to fill out Schedule C

## Best Practices

1. **Document Organization**:
   - Upload complete monthly statements
   - Keep receipts for amounts over $75
   - Maintain digital copies of all documents

2. **Classification Review**:
   - Review low-confidence classifications
   - Add notes for unusual expenses
   - Approve/reject to track review status

3. **Export Timing**:
   - Export after all documents processed
   - Review totals against targets
   - Keep exports for records

## Environment Variables

Add to your `.env.local`:
```
DOCUMENTS_TABLE=Documents-staging
TAX_EXPENSES_TABLE=TaxExpenses-dev
DOCUMENTS_BUCKET=patchline-documents-staging
```

## Future Enhancements

1. **Receipt Matching**: Automatically match receipts to bank transactions
2. **Mileage Tracking**: Integrate travel logs
3. **Quarterly Reports**: Generate quarterly estimates
4. **Multi-Year Support**: Compare year-over-year
5. **Direct Schedule C Export**: Generate IRS-ready forms

## Troubleshooting

### Common Issues:

1. **Expenses not extracting**: 
   - Ensure document type is set correctly
   - Check if Textract processing completed

2. **Wrong categorization**:
   - Review keywords in tax-categories.ts
   - Add manual notes for context
   - Update category manually

3. **Export fails**:
   - Check S3 permissions
   - Verify bucket exists
   - Check xlsx package installation 