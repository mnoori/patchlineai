# Enhanced Expense Matcher

An intelligent matching system that automatically pairs bank transactions with receipts for tax audit preparation.

## Features

- **Smart Date Matching**: ±1 day tolerance for processing delays
- **Fuzzy Amount Matching**: Handles rounding differences and processing fees
- **Vendor Normalization**: Maps common variations (AMZN → Amazon)
- **Reference Extraction**: Finds order numbers and invoice IDs
- **Confidence Scoring**: Rates matches from 0-100%
- **Comprehensive Reports**: JSON and Excel outputs

## Prerequisites

1. **Install Python dependencies**:
   ```bash
   cd backend/scripts
   pip install -r requirements.txt
   ```

2. **Set AWS credentials** (if not already configured):
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_REGION=us-east-1
   ```

3. **Ensure expense processor is running** (optional, for real-time updates):
   ```bash
   python expense-processor-server.py
   ```

## Usage

### Basic Usage
```bash
cd backend/scripts
python enhanced-expense-matcher.py
```

### With specific user ID
```bash
python enhanced-expense-matcher.py user-123
```

## Output

The script generates:

1. **Console Summary**: Quick overview of matching results
2. **JSON Report**: `matching_report_YYYYMMDD_HHMMSS.json`
3. **Excel Report**: `enhanced_matching_YYYYMMDD_HHMMSS.xlsx`
4. **Log File**: `enhanced-matcher.log`

### Excel Report Sheets

- **Summary**: Overall statistics and match rates
- **Matched Transactions**: All successful matches with details
- **Unmatched Bank**: Bank transactions without receipts
- **Unmatched Receipts**: Receipts without bank transactions

## Matching Algorithm

### Confidence Score Breakdown

| Component | Max Points | Criteria |
|-----------|------------|----------|
| Amount Match | 35 | Exact match |
| | 32 | Within $0.02 |
| | 28 | Within 1% |
| Date Match | 25 | Same date |
| | 20 | ±1 day |
| | 10 | ±3 days |
| Vendor Match | 25 | Exact match |
| | 20 | Partial match |
| | 15 | 80%+ similar |
| Reference Match | 20 | Order/invoice number found |

### Match Thresholds

- **≥80%**: High confidence (auto-approve)
- **60-79%**: Medium confidence (review recommended)
- **40-59%**: Low confidence (manual review)
- **<40%**: No match

## Example Output

```
========================================
ENHANCED MATCHING SUMMARY
========================================
Total Bank Transactions: 245
Total Receipts: 237
Matched Transactions: 218 (89.0%)
  - High Confidence (≥80%): 185
  - Medium Confidence (60-79%): 28
  - Low Confidence (<60%): 5
Unmatched Bank Transactions: 27
Unmatched Receipts: 19
========================================
```

## Troubleshooting

### Common Issues

1. **"No module named 'fuzzywuzzy'"**
   ```bash
   pip install fuzzywuzzy python-Levenshtein
   ```

2. **"Access Denied" errors**
   - Check AWS credentials
   - Verify DynamoDB table permissions

3. **Poor match rates**
   - Check date formats in source data
   - Verify vendor names are extracted correctly
   - Run with increased logging:
   ```bash
   python enhanced-expense-matcher.py --verbose
   ```

## Advanced Options

### Environment Variables

- `TAX_EXPENSES_TABLE`: Override default table name
- `DOCUMENTS_TABLE`: Override documents table
- `AWS_REGION`: Set AWS region

### Database Updates

The script automatically updates DynamoDB with:
- `matchedReceiptId`: Links to matched receipt
- `matchConfidence`: Confidence percentage
- `matchDetails`: Detailed match information

## Integration with UI

After running the matcher:

1. Go to dashboard → God Mode → IRS Ready tab
2. Matched transactions will show confidence badges
3. Use filters to review low-confidence matches
4. Export final report for tax filing 