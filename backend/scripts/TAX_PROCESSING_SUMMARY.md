# Tax Processing System Summary

## Overview

We've created a comprehensive tax document processing system that handles receipts and bank statements. After processing 300+ documents, we encountered issues with Creative Cloud invoices and needed to improve the system.

## Key Scripts

### 1. **unified-tax-processor.py** (Main Script)
- **Purpose**: Single script that replaces all previous confusing scripts
- **Features**:
  - Process any folder (receipts or bank statements)
  - Auto-detect document type based on folder structure
  - Can overwrite existing entries with `--force`
  - Handles both new uploads and reprocessing
- **Usage**:
  ```bash
  python unified-tax-processor.py                    # Process default folder
  python unified-tax-processor.py --folder "path"    # Process specific folder
  python unified-tax-processor.py --force            # Reprocess everything
  ```

### 2. **smart-receipt-processor.py** (For Failed Documents)
- **Purpose**: Only process documents that failed or lack AI descriptions
- **Features**:
  - Identifies documents with 0 expenses
  - Finds documents without AI descriptions
  - Special handling for Creative Cloud invoices
  - Interactive menu to choose what to process
- **Usage**:
  ```bash
  python smart-receipt-processor.py
  ```

### 3. **check-ai-descriptions.py** (Status Checker)
- **Purpose**: Check which documents have been properly processed
- **Features**:
  - Shows documents with/without AI descriptions
  - Identifies Creative Cloud invoices
  - Saves detailed status report
- **Usage**:
  ```bash
  python check-ai-descriptions.py
  ```

### 4. **process-creative-cloud.py** (Creative Cloud Specific)
- **Purpose**: Handle Adobe Creative Cloud invoices with special parsing
- **Features**:
  - Only processes Creative Cloud files without AI descriptions
  - Uses special parser for Creative Cloud format
  - Can target specific folder
- **Usage**:
  ```bash
  python process-creative-cloud.py
  ```

## Document Types & Parsing

### Standard Receipt Types
- **gmail-receipts**: General receipts from email
- **amazon-receipts**: Amazon order receipts
- **creative-cloud-receipts**: Adobe Creative Cloud invoices (special handling)

### Bank Statement Types
- **bilt**: Bilt credit card
- **chase-sapphire**: Chase Sapphire card
- **chase-freedom**: Chase Freedom card
- **chase-checking**: Chase checking account
- **bofa**: Bank of America

## AI Description System

The system uses AI (Claude Sonnet) to generate IRS-compliant expense descriptions:
- Descriptions include category, purpose, and specific details
- Stage clothing for performers is categorized as "Office Expenses"
- All expenses are positioned as professional business operations

## Processing Flow

1. **Initial Upload**: `unified-tax-processor.py`
2. **Check Status**: `check-ai-descriptions.py`
3. **Reprocess Failed**: `smart-receipt-processor.py`
4. **Creative Cloud**: `process-creative-cloud.py` if needed

## Common Issues & Solutions

### Creative Cloud Invoices Failing
- **Issue**: Standard parser couldn't find dates/amounts in Creative Cloud format
- **Solution**: Added `CreativeCloudReceiptParser` class with special table parsing
- **Script**: Use `process-creative-cloud.py` or `smart-receipt-processor.py`

### Documents with 0 Expenses
- **Issue**: Parser failed to extract any data
- **Solution**: Use `smart-receipt-processor.py` to reprocess with correct parser

### Missing AI Descriptions
- **Issue**: Expense processor server wasn't running
- **Solution**: 
  1. Start expense processor: `python expense-processor-server.py`
  2. Run `smart-receipt-processor.py` to add descriptions

## Best Practices

1. **Always run servers first**:
   ```bash
   npm run dev                        # Next.js server
   python expense-processor-server.py # Expense processor
   ```

2. **Process in batches**: Don't process 1000+ files at once

3. **Check before reprocessing**: Use `check-ai-descriptions.py` first

4. **Use the right script**:
   - New files → `unified-tax-processor.py`
   - Failed files → `smart-receipt-processor.py`
   - Creative Cloud → `process-creative-cloud.py`

## Folder Structure

```
C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\
├── Bank Statement\
│   ├── Bilt\
│   ├── Chase Saphire\
│   └── ...
└── Reciepts\
    ├── Amazon\
    ├── NEW-UnIdentified\
    │   └── creativecloud\    # Creative Cloud invoices
    └── ...
```

## Quick Commands

```bash
# Process everything fresh
python unified-tax-processor.py --force

# Check what needs processing
python check-ai-descriptions.py

# Process only failed documents
python smart-receipt-processor.py

# Process specific folder
python unified-tax-processor.py --folder "C:\path\to\folder"
```

## Important Notes

1. **Backup your data** before force reprocessing
2. **Creative Cloud invoices** need special handling (use the smart processor)
3. **AI descriptions** require the expense processor server running
4. **Rate limiting** prevents overwhelming the system (2 sec between files) 