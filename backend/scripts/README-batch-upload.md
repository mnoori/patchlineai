# Tax Document Processing Script

This script automatically processes all tax documents through the appropriate AI pipelines. You'll see the processing happen in real-time, including AI-generated descriptions, and the results will appear in the UI.

## Prerequisites

1. **Start the Next.js server** (in main project directory):
   ```bash
   npm run dev
   ```

2. **Start the expense processor server** (in another terminal):
   ```bash
   cd backend/scripts
   python expense-processor-server.py
   ```

## Usage

### Process all documents:
```bash
cd backend/scripts
python process-tax-documents.py
```

### Dry run (preview what will be processed):
```bash
python process-tax-documents.py --dry-run
```

## What it does

The script processes documents one by one, showing the AI processing:

1. **Bank Statements**:
   - ✅ Process Bilt statements through Bilt pipeline
   - ✅ Process Chase Sapphire through chase-sapphire pipeline
   - ⏭️ Skip BofA, Chase Checking, and Chase Freedom (already processed)

2. **Receipts**:
   - ✅ Process Amazon folder through amazon-receipts pipeline
   - ✅ Process all other folders through gmail-receipts pipeline

## Real-time Output

You'll see the processing happen in real-time:

```
⚙ Processing Bilt-Jan.pdf...
  1️⃣ Uploading to system...
  2️⃣ Processing complete! Found 15 expense(s):
     💰 Expense 1: $45.00 - NETFLIX
        📝 Other Expenses - Streaming Services - Netflix Monthly Subscription
        📅 2024-01-05
     💰 Expense 2: $125.00 - AMAZON
        📝 Office Expenses - Studio Equipment - Audio Interface Cables
        📅 2024-01-12
     ...
✓ Processed: Bilt-Jan.pdf
```

## View Results

After processing:
1. Go to http://localhost:3000/dashboard/god-mode
2. Navigate to the "Tax Preparation" tab to see expenses
3. Go to "IRS Ready" tab to see matched transactions
4. Export the final report

## Files

- Script: `backend/scripts/process-tax-documents.py`
- Source folder: `C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy`
- Log files: `tax-processing-log-YYYYMMDD-HHMMSS.json`

## Processing Speed

- Each file takes 5-10 seconds to process (including AI description generation)
- Rate limiting: 3 seconds between files to avoid overwhelming the AI
- You can watch the expense-processor server logs to see detailed AI processing

## Differences from Simple Upload

Unlike `run-batch-tax-upload.py` which just uploads files, this script:
- Actually processes files through the expense extraction pipeline
- Shows AI-generated descriptions in real-time
- Displays extracted expenses immediately
- Updates the UI with fully processed data

## Troubleshooting

If you see errors:
- Make sure both servers are running (Next.js and expense processor)
- Check that the source folder exists and contains PDF files
- Ensure you have proper network connectivity
- Rate limiting is set to 2 seconds between uploads 