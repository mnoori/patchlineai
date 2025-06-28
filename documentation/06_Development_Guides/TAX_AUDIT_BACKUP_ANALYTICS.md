# Tax Audit Backup & Analytics System

## Overview

The tax audit system now includes comprehensive backup and analytics capabilities to ensure data safety and provide insights for tax optimization.

## Features

### 1. Automatic Backups
- **Before Deletion**: Every delete operation automatically creates a backup
- **Multi-location Storage**:
  - DynamoDB backup table
  - S3 for long-term storage
  - Local file system for quick access
  - CSV format for Python analytics

### 2. Improved Receipt Processing
- Fixed Amazon receipt extraction to focus on actual products
- Duplicate detection to avoid double-counting
- Automatic categorization based on product descriptions
- Separate tabs for Expenses vs Receipts in the UI

### 3. Python Analytics Tool
Located at `scripts/tax-analytics.py`, provides:
- Category analysis with Schedule C mapping
- Monthly spending trends
- Vendor analysis
- Tax optimization insights
- Audit risk flags detection
- Visual charts generation
- Optional LLM-powered tax advice

## Usage

### Backup API

Create a backup:
```bash
POST /api/tax-audit/backup?userId=default-user&type=receipts
```

Retrieve backups:
```bash
GET /api/tax-audit/backup?userId=default-user
```

### Delete Operations
All delete operations now create automatic backups:
```bash
# Delete all (with backup)
DELETE /api/tax-audit/delete-all?userId=default-user

# Delete only receipts (with backup)
DELETE /api/tax-audit/delete-all?userId=default-user&type=receipts

# Delete only expenses (with backup)
DELETE /api/tax-audit/delete-all?userId=default-user&type=expenses
```

### Python Analytics

1. Install dependencies:
```bash
pip install -r scripts/requirements-analytics.txt
```

2. Run analytics:
```bash
python scripts/tax-analytics.py
```

3. With LLM insights (requires OpenAI API key):
```bash
export OPENAI_API_KEY=your-api-key
python scripts/tax-analytics.py
```

## Data Structure

### Backup Format
```json
{
  "backupId": "backup_default-user_receipts_1704123456789",
  "timestamp": "2024-01-01T12:00:00Z",
  "userId": "default-user",
  "backupType": "receipts",
  "itemCount": 25,
  "totalAmount": 1234.56,
  "expenses": [...]
}
```

### Local Storage
- JSON: `data/backups/{userId}/{backupId}.json`
- CSV: `data/backups/{userId}/{backupId}.csv`

## Analytics Output

### Category Analysis
- Total spending by category
- Transaction count per category
- Average transaction size
- Schedule C line mapping

### Tax Optimization
- Total deductible expenses
- Meal deductions (50% rule)
- Home office potential
- Vehicle expense recommendations

### Audit Risk Flags
- High meal expense ratio (>30%)
- Too many round number expenses
- Low receipt coverage (<30%)

### Visualizations
Generated in `tax_analysis/` directory:
- `category_distribution.png` - Pie chart of expense categories
- `monthly_trend.png` - Bar chart of monthly spending

## Best Practices

1. **Regular Backups**: System automatically backs up before deletions
2. **Receipt Matching**: Upload receipts promptly to match with bank transactions
3. **Category Review**: Regularly review auto-categorized expenses
4. **Documentation**: Keep receipts for all expenses over $75
5. **Analytics Review**: Run monthly analytics to spot trends and optimization opportunities

## Troubleshooting

### Delete Receipts Error
Fixed: The system now uses the correct DynamoDB key schema (only expenseId).

### Duplicate Amazon Items
Fixed: Implemented deduplication logic based on description and amount.

### Missing Backups
Check:
- DynamoDB table exists: `TaxExpenses-backup-dev`
- S3 bucket permissions
- Local directory permissions: `data/backups/`

## Future Enhancements

1. **Automated Receipt-to-Transaction Matching**
   - ML-based matching algorithm
   - Confidence scoring
   - Manual review interface

2. **Enhanced LLM Integration**
   - Real-time categorization suggestions
   - Audit risk assessment
   - Tax strategy recommendations

3. **Multi-Year Analysis**
   - Year-over-year comparisons
   - Trend analysis
   - Tax bracket optimization 