# Unified Tax Document Processor

## Overview

This is the **single, consolidated script** for processing all tax documents (receipts and bank statements). It replaces all the previous scripts that were causing confusion:
- ✅ Replaces `batch-process-tax-docs.py` 
- ✅ Replaces `process-new-receipts.py`
- ✅ Replaces `complete-folder-rerun.py`
- ✅ Replaces all other tax processing scripts

## Key Features

1. **Process Any Folder** - Just point it to a folder and it will process all PDFs
2. **Auto-Detection** - Automatically detects document type based on folder structure
3. **Rewrite Capability** - Can overwrite existing entries in DynamoDB
4. **Unified Logic** - Single script for both receipts and bank statements
5. **Smart Processing** - Checks existing documents and asks before reprocessing

## Prerequisites

1. **Start the Next.js server**:
   ```bash
   npm run dev
   ```

2. **Start the expense processor server** (recommended):
   ```bash
   cd backend/scripts
   python expense-processor-server.py
   ```

3. **Install Python dependencies**:
   ```bash
   pip install boto3 requests python-dotenv
   ```

## Usage

### Basic Usage - Process Everything
```bash
python unified-tax-processor.py
```
This will process the default folder: `C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy`

### Process a Specific Folder
```bash
python unified-tax-processor.py --folder "C:\path\to\your\folder"
```

### Force Reprocess (Overwrite Existing)
```bash
python unified-tax-processor.py --folder "C:\path\to\folder" --force
```
This will delete and reprocess ALL files, even if they already exist.

### Dry Run (Preview Only)
```bash
python unified-tax-processor.py --dry-run
```
Shows what would be processed without actually doing it.

## Document Type Detection

The script automatically detects document types based on folder structure:

### Bank Statements
- `Bilt` → `bilt`
- `BofA` or `Bank of America` → `bofa`
- `Chase Sapphire` → `chase-sapphire`
- `Chase Freedom` → `chase-freedom`
- `Chase` (other) → `chase-checking`

### Receipts
- `Amazon` folder → `amazon-receipts`
- All other receipts → `gmail-receipts`

## How It Works

1. **Scans the folder** for all PDF files (recursively)
2. **Checks existing documents** in DynamoDB
3. **Asks for confirmation** if files already exist (unless --force)
4. **Deletes existing** entries if reprocessing
5. **Uploads each file** to S3
6. **Processes with Textract** and expense extraction
7. **Saves to DynamoDB** with proper categorization

## Examples

### Process Your Main Tax Folder
```bash
python unified-tax-processor.py
```

### Process Only New Receipts
```bash
python unified-tax-processor.py --folder "C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified"
```

### Reprocess Everything (Start Fresh)
```bash
python unified-tax-processor.py --force
```

### Check What Would Be Processed
```bash
python unified-tax-processor.py --folder "C:\some\folder" --dry-run
```

## Output

The script provides clear, color-coded output:
- ✓ Green = Success
- ✗ Red = Error
- ⚠ Yellow = Warning
- ℹ Cyan = Information

Example output:
```
============================================================
                 Unified Tax Document Processor              
============================================================

✓ Next.js server is running
✓ Expense processor server is running
ℹ Found 416 PDF files
⚠ 300 files already exist in database

Reprocess existing files? (y/N): y

============================================================
                    Processing gmail-receipts                
============================================================

[1/116] invoice (8).pdf
ℹ Deleting existing document: doc_1751155907885_bwswl
✓ Processed successfully: 1 expenses extracted

[2/116] Splice_Invoice_240501.pdf
ℹ Deleting existing document: doc_1751155923456_abcde
✓ Processed successfully: 1 expenses extracted
```

## Viewing Results

After processing:
1. Go to http://localhost:3000/dashboard/god-mode
2. Navigate to "Tax Preparation" tab
3. View expenses in the appropriate tabs
4. Export to Excel when ready

## Troubleshooting

### "Next.js server is not running"
Start the server: `npm run dev`

### "Expense processor server is not running"
Start it for better results: `python expense-processor-server.py`

### "No PDF files found"
Check that the folder path is correct and contains PDF files

### Files Failed to Process
- Check `failed-files.json` for the list
- Common issues:
  - Corrupted PDFs
  - Network timeouts
  - AWS credential issues

## Important Notes

1. **Backup First** - Always backup your data before doing a force reprocess
2. **Rate Limiting** - The script waits 2 seconds between files to avoid overwhelming the system
3. **Processing Time** - Each file takes 5-10 seconds to fully process
4. **Memory Usage** - For very large folders (1000+ files), consider processing in batches

## Comparison with Old Scripts

| Feature | Old Scripts | Unified Script |
|---------|------------|----------------|
| Number of scripts | 5+ confusing scripts | 1 single script |
| Folder flexibility | Hardcoded paths | Any folder via --folder |
| Rewrite capability | Some scripts only | Always available with --force |
| Document detection | Manual specification | Automatic based on folder |
| Error handling | Inconsistent | Comprehensive |
| User experience | Confusing | Clear and simple |

## Migration from Old Scripts

If you were using:
- `batch-process-tax-docs.py` → Use `unified-tax-processor.py`
- `process-new-receipts.py` → Use `unified-tax-processor.py --folder "path/to/new/receipts"`
- `complete-folder-rerun.py` → Use `unified-tax-processor.py --force`

## Support

For issues or questions about the tax audit system:
1. Check the expense processor logs: `backend/scripts/expense-processor.log`
2. Check failed files: `failed-files.json`
3. Review the main documentation: `/documentation/06_Development_Guides/TAX_AUDIT_IMPROVEMENTS.md` 