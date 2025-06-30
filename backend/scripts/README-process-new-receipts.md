# Process New Receipts Script

This script processes new tax receipts without affecting existing data in the system.

## Prerequisites

1. **Expense Processor Server Running**
   ```bash
   cd backend/scripts
   python expense-processor-server.py
   ```
   The server must be running on port 8000 for receipt processing to work.

2. **AWS Credentials Configured**
   - Ensure your `.env.local` has valid AWS credentials
   - The script uses the same AWS configuration as the main application

3. **Python Dependencies**
   ```bash
   pip install boto3 requests
   ```

## Usage

1. **Set the folder path** in the script:
   ```python
   NEW_RECEIPTS_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified"
   ```

2. **Run the script**:
   ```bash
   python process-new-receipts.py
   ```

## What the Script Does

1. **Scans the specified folder** for all PDF files
2. **Checks existing documents** to avoid duplicates
3. **For each new receipt**:
   - Uploads to S3 bucket
   - Runs AWS Textract for text extraction
   - Processes with the expense processor
   - Saves to DynamoDB with proper categorization

## Features

- **No Data Overwrite**: Only adds new expenses, never deletes existing ones
- **Duplicate Prevention**: Checks document IDs before processing
- **Comprehensive Logging**: Creates `process-new-receipts.log` file
- **Progress Tracking**: Shows real-time progress and summary

## Improved Categorization

The expense processor now recognizes:

- **Trackstack**: Music promotion platform → Platform Expenses
- **FACEBK DUC53E46F2**: Facebook Ads → Advertising  
- **Vocalfy**: Vocal samples → Other Expenses
- **Rebtel**: Telecommunications → Utilities
- **Sweetwater**: Music equipment → Office Expenses
- **Canva**: Design platform → Platform Expenses
- **Splice**: Sample library → Platform Expenses
- **Soho House**: 
  - >$1000: Membership → Other Expenses
  - <$1000: Networking meals → Meals

## Date Handling

All receipts are automatically assigned to **2024** tax year, even if processed in 2025.

## Viewing Results

After processing:
1. Go to the Dashboard
2. Navigate to Tax Audit section
3. New expenses will appear in:
   - Expenses tab (with proper categorization)
   - IRS Ready tab (with matching analysis)

## Troubleshooting

**"Expense processor server is not running"**
- Start the server: `python expense-processor-server.py`

**"Failed to upload to S3"**
- Check AWS credentials in `.env.local`
- Verify S3 bucket permissions

**"Textract job failed"**
- Check if PDF is readable/not corrupted
- Verify AWS Textract permissions

## Log Files

- `process-new-receipts.log`: Main processing log
- `expense-processor.log`: Detailed expense extraction log 